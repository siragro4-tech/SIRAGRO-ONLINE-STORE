import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { isMissingStripeEventsTableError } from "@/lib/stripe-rules";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createOrderFromStripeSession,
  handleStripeChargeRefunded,
} from "@/lib/orders";
import { releaseDraftReservations } from "@/lib/checkout-drafts";
import { recordAdminActivity } from "@/lib/activity";
import type { Json } from "@/types/database.types";

export async function POST(req: Request) {
  let stripe: ReturnType<typeof getStripeClient>;
  try {
    stripe = getStripeClient();
  } catch (err) {
    console.error("[Stripe Webhook] Stripe client not configured:", err);
    return new NextResponse("Stripe secret key not configured", { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.includes("your-stripe-webhook-secret")) {
    console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET environment variable.");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const rawBody = await req.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");

  if (!signature) {
    console.warn("[Stripe Webhook] Missing stripe-signature header.");
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // 1. CRYPTOGRAPHIC SIGNATURE VERIFICATION
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error(`[Stripe Webhook Signature Verification Failed]: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  // 2. CHECK DURABLE WEBHOOK EVENT DEDUPLICATION (BEFORE HANDLING)
  const adminSupabase = createAdminClient();
  let deduplicationSupported = true;

  const { data: alreadyProcessed, error: dedupLookupErr } = await adminSupabase
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (dedupLookupErr) {
    if (isMissingStripeEventsTableError(dedupLookupErr)) {
      deduplicationSupported = false;
    } else {
      console.error(
        `[Stripe Webhook] Failed to check webhook event deduplication (${event.id}):`,
        dedupLookupErr.message
      );
      return new NextResponse("Webhook deduplication check failed", {
        status: 500,
      });
    }
  } else if (alreadyProcessed) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  // 3. PROCESS VERIFIED STRIPE EVENTS
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only create/mark order as paid if Stripe confirms payment_status === "paid"
      if (session.payment_status === "paid") {
        try {
          const result = await createOrderFromStripeSession(
            session,
            event.id,
            event.type
          );
          if (!result) {
            console.error("[Stripe Webhook] Order creation returned null.");
            return new NextResponse("Failed to persist order", { status: 500 });
          }
        } catch (orderErr) {
          console.error("[Stripe Webhook] Failed to process order:", orderErr);
          // Return 500 so Stripe retries later if database was transiently down
          return new NextResponse("Failed to process order", { status: 500 });
        }
      } else {
        await recordAdminActivity({
          event_type: "order_placed_unpaid",
          severity: "warning",
          title: "Checkout submitted — awaiting payment settlement",
          summary: `Stripe webhook reported checkout session (${session.id.slice(-8)}) with status "${session.payment_status}". Order will not be marked paid until Stripe confirms settlement.`,
          metadata: {
            stripe_session_id: session.id,
            payment_status: session.payment_status,
          } as Json,
        });
      }
      break;
    }

    case "checkout.session.async_payment_failed":
    case "payment_intent.payment_failed": {
      const obj = event.data.object as { id?: string; last_payment_error?: { message?: string } };
      await recordAdminActivity({
        event_type: "order_payment_failed",
        severity: "error",
        title: "Stripe payment failed",
        summary: obj.last_payment_error?.message
          ? `Payment attempt failed: ${obj.last_payment_error.message}`
          : "Customer payment attempt failed before settlement.",
        metadata: {
          stripe_event_id: event.id,
          stripe_object_id: obj.id || null,
        } as Json,
      });
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const draftId = session.metadata?.draft_id?.trim();
      if (draftId) {
        await releaseDraftReservations(draftId, "expired");
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      try {
        await handleStripeChargeRefunded(charge, event.id);
      } catch (refundErr) {
        console.error("[Stripe Webhook] Failed to record refund:", refundErr);
        return new NextResponse("Failed to process refund", { status: 500 });
      }
      break;
    }

    default:
      // Acknowledge receipt of other Stripe event types without error
      break;
  }

  // 4. MARK EVENT PROCESSED ONLY AFTER ALL REQUIRED DATABASE EFFECTS SUCCEED
  if (deduplicationSupported) {
    const { error: dedupInsertErr } = await adminSupabase
      .from("stripe_webhook_events")
      .insert({
        event_id: event.id,
        event_type: event.type,
      });

    if (dedupInsertErr && dedupInsertErr.code !== "23505") {
      if (!isMissingStripeEventsTableError(dedupInsertErr)) {
        console.error(
          `[Stripe Webhook] Failed to record processed event ${event.id}:`,
          dedupInsertErr.message
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

