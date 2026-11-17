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
import { getStripeClient } from "@/lib/stripe";
import { validatePaidGbpStripeSession } from "@/lib/stripe-rules";
import { recordAdminActivity, recordInventoryAdjustment } from "@/lib/activity";
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

/**
 * Creates an order in the database idempotently upon verified Stripe payment.
 */
export async function createOrderFromStripeSession(
  session: Stripe.Checkout.Session
): Promise<OrderRecord | null> {
  const stripe = getStripeClient();
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

  // 1. IDEMPOTENCY CHECK:
  // If an order has already been created for this Stripe checkout session, return it immediately.
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (existingOrder) {
    const { data: existingItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", existingOrder.id);

    return {
      id: existingOrder.id,
      orderNumber: existingOrder.order_number,
      customerName: existingOrder.customer_name,
      customerEmail: existingOrder.customer_email,
      customerPhone: existingOrder.customer_phone,
      fulfilmentType: existingOrder.fulfilment_type as "delivery" | "collection",
      deliveryAddress: formatDeliveryAddress(existingOrder.delivery_address),
      subtotal: Number(existingOrder.subtotal),
      deliveryCharge: Number(existingOrder.delivery_charge),
      total: Number(existingOrder.total),
      status: existingOrder.status,
      paymentStatus: existingOrder.payment_status,
      hasAgeRestrictedItems: false,
      createdAt: existingOrder.created_at,
      items: (existingItems || []).map((i) => ({
        name: i.product_name_snapshot,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price_snapshot),
        lineTotal: Number(i.line_total),
      })),
    };
  }

  // 2. Extract metadata
  const metadata = session.metadata || {};
  const customerName = metadata.customer_name || session.customer_details?.name || "Customer";
  const customerEmail = metadata.customer_email || session.customer_details?.email || "";
  const customerPhone = metadata.customer_phone || session.customer_details?.phone || "";
  const fulfilmentType = (metadata.fulfilment_type as "delivery" | "collection") || "delivery";
  const deliveryFee = parseFloat(metadata.delivery_fee || "0") || 0;
  const hasAgeRestrictedItems = metadata.has_age_restricted_items === "true";
  const profileId = metadata.profile_id || null;
  const rawAddress = metadata.delivery_address ? JSON.parse(metadata.delivery_address) : null;

  // 3. Fetch purchased line items from Stripe
  const lineItemsList = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
  });

  const orderItemsData: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  let subtotal = 0;

  for (const item of lineItemsList.data) {
    // Skip the delivery charge line item from subtotal calculation
    if (item.description === "Home Delivery Charge") continue;

    const unitPrice = (item.price?.unit_amount || 0) / 100;
    const qty = item.quantity || 1;
    const lineTotal = (item.amount_total || 0) / 100;

    subtotal += lineTotal;
    orderItemsData.push({
      name: item.description || "Grocery Item",
      quantity: qty,
      unitPrice,
      lineTotal,
    });
  }

  const grandTotal = (session.amount_total || 0) / 100;
  const orderNumber = `SIR-${Math.floor(100000 + Math.random() * 900000)}`;

  // 4. Insert into orders table
  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      profile_id: profileId,
      status: "processing",
      fulfilment_type: fulfilmentType,
      delivery_address: rawAddress,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      subtotal: Math.round(subtotal * 100) / 100,
      delivery_charge: deliveryFee,
      total: grandTotal,
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      payment_status: "paid",
    })
    .select("id")
    .single();

  if (orderError || !newOrder) {
    // Handle concurrent duplicate Stripe webhook retry safely (Postgres 23505 unique_violation)
    if (orderError?.code === "23505") {
      const { data: racedOrder } = await supabase
        .from("orders")
        .select("*")
        .eq("stripe_checkout_session_id", sessionId)
        .maybeSingle();

      if (racedOrder) {
        const { data: racedItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", racedOrder.id);

        return {
          id: racedOrder.id,
          orderNumber: racedOrder.order_number,
          customerName: racedOrder.customer_name,
          customerEmail: racedOrder.customer_email,
          customerPhone: racedOrder.customer_phone,
          fulfilmentType: racedOrder.fulfilment_type as "delivery" | "collection",
          deliveryAddress: formatDeliveryAddress(racedOrder.delivery_address),
          subtotal: Number(racedOrder.subtotal),
          deliveryCharge: Number(racedOrder.delivery_charge),
          total: Number(racedOrder.total),
          status: racedOrder.status,
          paymentStatus: racedOrder.payment_status,
          hasAgeRestrictedItems: false,
          createdAt: racedOrder.created_at,
          items: (racedItems || []).map((i) => ({
            name: i.product_name_snapshot,
            quantity: i.quantity,
            unitPrice: Number(i.unit_price_snapshot),
            lineTotal: Number(i.line_total),
          })),
        };
      }
    }

    console.error("[Orders] Failed to insert order:", orderError);
    return null;
  }

  // 5. Insert order items & atomically decrement stock
  for (const item of orderItemsData) {
    let matchedProd: {
      id: string;
      stock_quantity: number;
      low_stock_threshold?: number;
    } | null = null;

    try {
      const { data: prod } = await supabase
        .from("products")
        .select("id, stock_quantity")
        .ilike("name", item.name)
        .maybeSingle();
      matchedProd = prod;
    } catch {
      // Non-fatal
    }

    await supabase.from("order_items").insert({
      order_id: newOrder.id,
      product_id: matchedProd?.id || null,
      product_name_snapshot: item.name,
      unit_price_snapshot: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    });

    if (matchedProd) {
      const nextStock = Math.max(0, matchedProd.stock_quantity - item.quantity);
      try {
        await supabase
          .from("products")
          .update({ stock_quantity: nextStock })
          .eq("id", matchedProd.id);

        await recordInventoryAdjustment({
          productId: matchedProd.id,
          productName: item.name,
          previousQuantity: matchedProd.stock_quantity,
          newQuantity: nextStock,
          reason: "order_paid",
          notes: `Deducted via verified Stripe order #${orderNumber}`,
        });
      } catch {
        // Non-fatal
      }
    }
  }

  // 6. Log Age Verification entry if age-restricted
  if (hasAgeRestrictedItems) {
    await supabase.from("age_verification_log").insert({
      order_id: newOrder.id,
      method:
        fulfilmentType === "delivery"
          ? "driver_id_check_on_delivery"
          : "counter_check_on_collection",
      result: "pending_physical_check",
      notes: "Customer confirmed 18+ at checkout. Physical Challenge 25 check required.",
    });
  }

  // 7. Clear the customer's database basket (webhook has no browser cookies)
  if (profileId) {
    try {
      const { data: userBasket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", profileId)
        .maybeSingle();

      if (userBasket) {
        await supabase.from("basket_items").delete().eq("basket_id", userBasket.id);
      }
    } catch {
      // Non-fatal
    }
  }

  // 8. Record Verified Paid Order in Admin Activity Feed
  await recordAdminActivity({
    event_type: "order_paid",
    severity: "success",
    title: `Paid Order #${orderNumber} (£${grandTotal.toFixed(2)})`,
    summary: `Payment confirmed by Stripe webhook • ${fulfilmentType === "delivery" ? "Home Delivery" : "In-Store Collection"
      } • ${orderItemsData.length} line item(s).`,
    order_id: newOrder.id,
    metadata: {
      order_number: orderNumber,
      total: grandTotal,
      fulfilment_type: fulfilmentType,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
    } as Json,
  });

  // 9. Send Customer Order Confirmation & Owner Alert Emails
  const emailPayload = {
    orderNumber,
    customerName,
    customerEmail,
    fulfilmentType,
    deliveryAddress: formatDeliveryAddress(rawAddress) || undefined,
    items: orderItemsData,
    subtotal,
    deliveryCharge: deliveryFee,
    total: grandTotal,
    hasAgeRestrictedItems,
  };

  try {
    const customerEmailResult = await sendOrderConfirmationEmail(emailPayload);
    const resolved = resolveNotificationRecord(customerEmailResult);

    if (customerEmail) {
      const { error: notifErr } = await supabase
        .from("order_notifications")
        .insert({
          order_id: newOrder.id,
          recipient_email: customerEmail,
          notification_type: "confirmation",
          status_target: "processing",
          send_status: resolved.send_status,
          attempt_count: 1,
          last_error: resolved.last_error,
          sent_at: resolved.sent_at,
        });

      if (
        notifErr &&
        resolved.send_status === "not_configured" &&
        isLegacyNotificationConstraintError(notifErr)
      ) {
        await supabase.from("order_notifications").insert({
          order_id: newOrder.id,
          recipient_email: customerEmail,
          notification_type: "confirmation",
          status_target: "processing",
          send_status: "failed",
          attempt_count: 1,
          last_error:
            resolved.last_error ||
            "Email provider not configured — email was not sent.",
          sent_at: null,
        });
      }
    }
  } catch (emailErr) {
    console.error(`[Orders] Customer confirmation email exception for #${orderNumber}:`, emailErr);
  }

  try {
    const ownerEmailResult = await sendOwnerOrderNotificationEmail(emailPayload);
    if (!ownerEmailResult.success) {
      console.warn(
        `[Orders] Owner alert email not sent for #${orderNumber}: ${ownerEmailResult.error || "Unknown error"}`
      );
    }
  } catch (ownerEmailErr) {
    console.error(`[Orders] Owner alert email exception for #${orderNumber}:`, ownerEmailErr);
  }

  return {
    id: newOrder.id,
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    fulfilmentType,
    deliveryAddress: formatDeliveryAddress(rawAddress),
    subtotal,
    deliveryCharge: deliveryFee,
    total: grandTotal,
    status: "processing",
    paymentStatus: "paid",
    hasAgeRestrictedItems,
    createdAt: new Date().toISOString(),
    items: orderItemsData,
  };
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

  // Only verified webhooks may create and mark orders as paid.
  // If the webhook is still in flight, return null so the confirmation page shows a pending state.
  return null;
}

/**
 * Updates an order's refund state when Stripe issues a verified charge.refunded webhook.
 */
export async function handleStripeChargeRefunded(
  charge: Stripe.Charge
): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id || null;
  if (!paymentIntentId) return;

  const supabase = createAdminClient();
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

  // Gracefully update payment_status; set refunded_amount if column exists (migration 004)
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
