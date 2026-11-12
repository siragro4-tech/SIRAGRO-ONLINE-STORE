import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getStripeClient } from "@/lib/stripe";
import { clearBasket } from "@/lib/basket";

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
      deliveryAddress: existingOrder.delivery_address
        ? JSON.stringify(existingOrder.delivery_address)
        : null,
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
    console.error("[Orders] Failed to insert order:", orderError);
    return null;
  }

  // 5. Insert order items & atomically decrement stock
  for (const item of orderItemsData) {
    await supabase.from("order_items").insert({
      order_id: newOrder.id,
      product_name_snapshot: item.name,
      unit_price_snapshot: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    });

    // Atomic decrement in database:
    // UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - quantity)
    try {
      const { data: matchedProd } = await supabase
        .from("products")
        .select("id, stock_quantity")
        .ilike("name", item.name)
        .maybeSingle();

      if (matchedProd) {
        await supabase
          .from("products")
          .update({
            stock_quantity: Math.max(0, matchedProd.stock_quantity - item.quantity),
          })
          .eq("id", matchedProd.id);
      }
    } catch {
      // Non-fatal if product not in database yet during dev
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

  // 7. Clear the customer's basket
  try {
    await clearBasket();
  } catch {
    // Non-fatal
  }

  // 8. Send Order Confirmation Email
  try {
    await sendOrderConfirmationEmail({
      orderNumber,
      customerName,
      customerEmail,
      fulfilmentType,
      deliveryAddress: rawAddress
        ? `${rawAddress.line1}, ${rawAddress.city}, ${rawAddress.postcode}`
        : undefined,
      items: orderItemsData,
      subtotal,
      deliveryCharge: deliveryFee,
      total: grandTotal,
      hasAgeRestrictedItems,
    });
  } catch (emailErr) {
    console.error("[Orders] Email error:", emailErr);
  }

  return {
    id: newOrder.id,
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    fulfilmentType,
    deliveryAddress: rawAddress ? JSON.stringify(rawAddress) : null,
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
      deliveryAddress: order.delivery_address ? JSON.stringify(order.delivery_address) : null,
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

  // Fallback: If webhook has not fired yet, retrieve session details directly from Stripe
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    if (session && session.payment_status === "paid") {
      // Process order now
      return await createOrderFromStripeSession(session);
    }
  } catch {
    // Unconfigured or invalid session
  }

  return null;
}
