import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { createOrderFromStripeSession } from "@/lib/orders";

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

  // 2. PROCESS VERIFIED STRIPE EVENTS
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only create/mark order as paid if Stripe confirms payment_status === "paid"
      if (session.payment_status === "paid") {
        try {
          const order = await createOrderFromStripeSession(session);
          if (!order) {
            console.error("[Stripe Webhook] Order creation returned null.");
            return new NextResponse("Failed to persist order", { status: 500 });
          }
        } catch (orderErr) {
          console.error("[Stripe Webhook] Failed to process order:", orderErr);
          // Return 500 so Stripe retries later if database was transiently down
          return new NextResponse("Failed to process order", { status: 500 });
        }
      }
      break;
    }

    default:
      // Acknowledge receipt of other Stripe event types without error
      break;
  }

  return NextResponse.json({ received: true });
}

