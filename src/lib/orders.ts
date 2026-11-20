import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendOrderConfirmationEmail,
  sendOwnerOrderNotificationEmail,
} from "@/lib/email";
import {
  isLegacyNotificationConstraintError,
  resolveNotificationRecord,
} from "@/lib/email-status";
import { validatePaidGbpStripeSession } from "@/lib/stripe-rules";
import { recordAdminActivity } from "@/lib/activity";
import type { Json } from "@/types/database.types";

function formatDeliveryAddress(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const addr = raw as { line1?: string; line2?: string; city?: string; postcode?: string };
  const parts = [addr.line1, addr.line2, addr.city, addr.postcode]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export type OrderRecord = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfilmentType: "delivery" | "collection";
  deliveryAddress: string | null;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: string;
  paymentStatus: string;
  hasAgeRestrictedItems: boolean;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type PaidOrderProcessResult =
  | { status: "ok"; order: OrderRecord }
  | { status: "reconciliation_required" };

/**
 * Processes a verified paid Stripe Checkout Session strictly via the atomic
 * `process_paid_order_from_draft` RPC. Legacy sessions without a `draft_id`
 * never fall through to name-matching or non-atomic stock updates; instead they
 * are recorded for manual staff reconciliation.
 */
export async function createOrderFromStripeSession(
  session: Stripe.Checkout.Session,
  eventId?: string,
  eventType?: string
): Promise<PaidOrderProcessResult | null> {
  const supabase = createAdminClient();

  const sessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  // Enforce settled GBP payment before persisting or returning a paid order
  const sessionCheck = validatePaidGbpStripeSession({
    payment_status: session.payment_status,
    currency: session.currency,
    amount_total: session.amount_total,
  });

  if (!sessionCheck.valid) {
    console.error(
      `[Orders] Rejected Stripe session ${sessionId.slice(-8)}: ${sessionCheck.reason}`
    );
    await recordAdminActivity({
      event_type: "order_payment_failed",
      severity: "error",
      title: "Rejected Stripe checkout session verification",
      summary: sessionCheck.reason,
      metadata: {
        stripe_session_id: sessionId,
        currency: session.currency || null,
        payment_status: session.payment_status,
      } as Json,
    });
    throw new Error(sessionCheck.reason);
  }

  // 1. ATOMIC DRAFT-BASED PROCESSING (when draft_id & eventId are provided)
  const draftId = session.metadata?.draft_id?.trim();
  if (draftId && eventId) {
    const orderNumber = `SIR-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data: rpcRaw, error: rpcErr } = await supabase.rpc(
      "process_paid_order_from_draft",
      {
        p_event_id: eventId,
        p_event_type: eventType || "checkout.session.completed",
        p_draft_id: draftId,
        p_stripe_session_id: sessionId,
        p_payment_intent_id: paymentIntentId,
        p_order_number: orderNumber,
        p_amount_total_pence: session.amount_total ?? -1,
        p_currency: session.currency || "",
      }
    );

    if (rpcErr) {
      throw new Error(`Atomic order processing failed: ${rpcErr.message}`);
    }

    const rpcRes = (rpcRaw || {}) as {
      status?: string;
      order_id?: string;
      notification_id?: string | null;
    };

    if (rpcRes.status === "deduplicated" || rpcRes.status === "existing_session") {
      const existing = await getVerifiedOrder(sessionId);
      return existing ? { status: "ok", order: existing } : null;
    }

    if (rpcRes.status === "created" && rpcRes.order_id) {
      const createdOrder = await getVerifiedOrder(sessionId);
      if (!createdOrder) {
        return null;
      }

      // Post-commit: clear authenticated user's basket
      const { data: orderRow } = await supabase
        .from("orders")
        .select("profile_id")
        .eq("id", rpcRes.order_id)
        .maybeSingle();

      if (orderRow?.profile_id) {
        try {
          const { data: userBasket } = await supabase
            .from("baskets")
            .select("id")
            .eq("profile_id", orderRow.profile_id)
            .maybeSingle();

          if (userBasket) {
            await supabase
              .from("basket_items")
              .delete()
              .eq("basket_id", userBasket.id);
          }
        } catch {
          // Non-fatal
        }
      }

      // Post-commit: dispatch confirmation & owner emails and update queued notification row
      const emailPayload = {
        orderNumber: createdOrder.orderNumber,
        customerName: createdOrder.customerName,
        customerEmail: createdOrder.customerEmail,
        fulfilmentType: createdOrder.fulfilmentType,
        deliveryAddress: createdOrder.deliveryAddress || undefined,
        items: createdOrder.items,
        subtotal: createdOrder.subtotal,
        deliveryCharge: createdOrder.deliveryCharge,
        total: createdOrder.total,
        hasAgeRestrictedItems: createdOrder.hasAgeRestrictedItems,
      };

      if (rpcRes.notification_id && createdOrder.customerEmail) {
        try {
          const customerEmailResult =
            await sendOrderConfirmationEmail(emailPayload);
          const resolved = resolveNotificationRecord(customerEmailResult);

          const { error: notifUpdateErr } = await supabase
            .from("order_notifications")
            .update({
              send_status: resolved.send_status,
              attempt_count: 1,
              last_error: resolved.last_error,
              sent_at: resolved.sent_at,
              updated_at: new Date().toISOString(),
            })
            .eq("id", rpcRes.notification_id);

          if (
            notifUpdateErr &&
            resolved.send_status === "not_configured" &&
            isLegacyNotificationConstraintError(notifUpdateErr)
          ) {
            await supabase
              .from("order_notifications")
              .update({
                send_status: "failed",
                attempt_count: 1,
                last_error:
                  resolved.last_error ||
                  "Email provider not configured — email was not sent.",
                sent_at: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", rpcRes.notification_id);
          }
        } catch (emailErr) {
          console.error(
            `[Orders] Customer confirmation email exception for #${createdOrder.orderNumber}:`,
            emailErr
          );
        }
      }

      try {
        await sendOwnerOrderNotificationEmail(emailPayload);
      } catch {
        // Non-fatal post-commit alert
      }

      return { status: "ok", order: createdOrder };
    }
  }

  // 2. MISSING DRAFT / LEGACY SESSION: NEVER fall through to name-matching or stock-clamping.
  const existing = await getVerifiedOrder(sessionId);
  if (existing) {
    return { status: "ok", order: existing };
  }

  const paidGbp = ((session.amount_total || 0) / 100).toFixed(2);
  await recordAdminActivity({
    event_type: "order_payment_failed",
    severity: "error",
    title: "Paid Stripe session missing checkout draft — manual reconciliation required",
    summary: `Stripe session (${sessionId.slice(-8)}) settled for £${paidGbp} GBP without a server checkout draft_id. Legacy name-matching order creation is disabled; staff must review and reconcile manually.`,
    metadata: {
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      amount_total_pence: session.amount_total ?? null,
      currency: session.currency || null,
      requires_manual_reconciliation: true,
    } as Json,
  });

  return { status: "reconciliation_required" };
}

/**
 * Retrieves verified order information for the confirmation receipt screen.
 */
export async function getVerifiedOrder(sessionId: string): Promise<OrderRecord | null> {
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (order) {
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      fulfilmentType: order.fulfilment_type as "delivery" | "collection",
      deliveryAddress: formatDeliveryAddress(order.delivery_address),
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.delivery_charge),
      total: Number(order.total),
      status: order.status,
      paymentStatus: order.payment_status,
      hasAgeRestrictedItems: false,
      createdAt: order.created_at,
      items: (items || []).map((i) => ({
        name: i.product_name_snapshot,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price_snapshot),
        lineTotal: Number(i.line_total),
      })),
    };
  }

  return null;
}

/**
 * Updates an order's refund state when Stripe issues a verified charge.refunded webhook.
 */
export async function handleStripeChargeRefunded(
  charge: Stripe.Charge,
  eventId?: string
): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id || null;
  if (!paymentIntentId) return;

  const supabase = createAdminClient();

  if (eventId) {
    const { error: rpcErr } = await supabase.rpc(
      "process_stripe_refund_atomic",
      {
        p_event_id: eventId,
        p_payment_intent_id: paymentIntentId,
        p_amount_refunded_pence: charge.amount_refunded || 0,
      }
    );
    if (rpcErr) {
      throw new Error(`Atomic refund processing failed: ${rpcErr.message}`);
    }
    return;
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total, payment_status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (!order) return;

  const refundedAmount = Math.min(
    Number(order.total || 0),
    Math.round(((charge.amount_refunded || 0) / 100) * 100) / 100
  );

  const { error: withRefundColErr } = await supabase
    .from("orders")
    .update({
      payment_status: "refunded",
      refunded_amount: refundedAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (withRefundColErr) {
    await supabase
      .from("orders")
      .update({
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
  }

  await recordAdminActivity({
    event_type: "order_refunded",
    severity: "warning",
    title: `Order #${order.order_number} Refunded (£${refundedAmount.toFixed(2)})`,
    summary: `Stripe webhook confirmed a refund of £${refundedAmount.toFixed(2)} for order #${order.order_number}.`,
    order_id: order.id,
    metadata: {
      order_number: order.order_number,
      refunded_amount: refundedAmount,
      stripe_payment_intent_id: paymentIntentId,
    } as Json,
  });
}
