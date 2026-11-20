import { calculateDeliveryCharge } from "@/lib/delivery";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isStripeSecretConfigured,
  isStripeWebhookConfigured,
} from "@/lib/admin-rules";
import {
  isSupabaseAdminConfigured,
  jsonNoStore,
  resolveMobileBasket,
} from "@/lib/mobile-api";

/**
 * Mobile Checkout Initiation Endpoint (Fail-Closed Safety Gate)
 *
 * Per security requirements:
 * 1. Never trusts client-submitted totals, delivery fees, or paid status.
 * 2. Blocks mobile checkout unless:
 *    - Basket prices and stock are verified on the server.
 *    - Fulfilment option (delivery/collection) is server-verified.
 *    - Stripe secret & webhook secret are configured.
 *    - Atomic order/stock RPC (`006_mobile_and_atomic_orders.sql`) is applied in Supabase.
 */
export async function POST(request: Request) {
  let body: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    fulfilmentType?: string;
    postcode?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    ageRestrictionAcknowledged?: boolean;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonNoStore({ error: "Invalid JSON body." }, 400);
  }

  const basketRes = await resolveMobileBasket(request);
  if ("error" in basketRes) {
    return jsonNoStore({ error: basketRes.error }, basketRes.status);
  }

  if (basketRes.summary.items.length === 0) {
    return jsonNoStore(
      { error: "Your basket is empty. Please add items before checkout." },
      400
    );
  }

  const customerName = body.customerName?.trim();
  const customerEmail = body.customerEmail?.trim();
  const customerPhone = body.customerPhone?.trim();
  const fulfilmentType = body.fulfilmentType;

  if (!customerName || !customerEmail || !customerPhone) {
    return jsonNoStore(
      { error: "Full name, email, and contact phone number are required." },
      400
    );
  }

  if (fulfilmentType !== "delivery" && fulfilmentType !== "collection") {
    return jsonNoStore(
      { error: "Please choose either Home Delivery or In-Store Collection." },
      400
    );
  }

  if (basketRes.summary.hasAgeRestrictedItems && !body.ageRestrictionAcknowledged) {
    return jsonNoStore(
      {
        error:
          "Please acknowledge that age-restricted items require Challenge 25 photo ID verification upon collection or delivery.",
      },
      400
    );
  }

  // Server-authoritative fulfilment & fee check (fails closed if unconfirmed)
  const deliveryCheck = await calculateDeliveryCharge({
    fulfilmentType,
    postcode: fulfilmentType === "delivery" ? body.postcode : undefined,
    subtotal: basketRes.summary.subtotal,
  });

  if (!deliveryCheck.isEligible) {
    return jsonNoStore(
      {
        error:
          deliveryCheck.reason ||
          "Selected fulfilment option is currently unavailable.",
      },
      400
    );
  }

  // Safety gate: verify Stripe + atomic order processing (migration 006)
  if (
    !isStripeSecretConfigured(process.env.STRIPE_SECRET_KEY) ||
    !isStripeWebhookConfigured(process.env.STRIPE_WEBHOOK_SECRET)
  ) {
    return jsonNoStore(
      {
        checkoutBlocked: true,
        error:
          "Mobile payments are disabled until Stripe keys and webhook signing are configured for this environment.",
      },
      503
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore(
      {
        checkoutBlocked: true,
        error: "Mobile checkout is unavailable because database configuration is incomplete.",
      },
      503
    );
  }

  // Verify stock availability across all items by product ID
  const insufficient = basketRes.summary.items.filter(
    (item) => item.product.stock_quantity < item.quantity
  );
  if (insufficient.length > 0) {
    return jsonNoStore(
      {
        error: `Insufficient stock for ${insufficient
          .map((i) => i.product.name)
          .join(", ")}. Please adjust your basket quantities.`,
      },
      409
    );
  }

  // Check whether migration 006 atomic RPC is installed before allowing mobile payment
  const admin = createAdminClient();
  const { error: rpcProbeErr } = await admin.rpc(
    "process_paid_order_atomic" as never,
    {} as never
  );
  const rpcMissing =
    rpcProbeErr &&
    (rpcProbeErr.code === "42883" ||
      rpcProbeErr.code === "PGRST202" ||
      (rpcProbeErr.message || "").toLowerCase().includes("could not find the function"));

  if (rpcMissing) {
    return jsonNoStore(
      {
        checkoutBlocked: true,
        error:
          "Mobile checkout is paused until atomic order & stock migration (006_mobile_and_atomic_orders.sql) is applied and verified in staging.",
      },
      503
    );
  }

  return jsonNoStore(
    {
      checkoutBlocked: true,
      error:
        "Mobile Stripe Checkout return handling requires staging verification before live payments are enabled.",
    },
    503
  );
}
