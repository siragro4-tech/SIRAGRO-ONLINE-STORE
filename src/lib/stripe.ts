import Stripe from "stripe";
import type { BasketItem } from "@/lib/basket";

/**
 * Initializes the Stripe client with the secret key from environment variables.
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY in environment variables. Please configure your Stripe test key in .env.local."
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
    appInfo: {
      name: "SIRAGRO Online Store",
      version: "0.1.0",
    },
  });
}

export type CreateCheckoutSessionParams = {
  items: BasketItem[];
  fulfilmentType: "delivery" | "collection";
  deliveryFee: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  hasAgeRestrictedItems: boolean;
  profileId?: string | null;
};

/**
 * Creates a Stripe Checkout Session on the server with verified database prices.
 */
export async function createStripeCheckoutSession(params: CreateCheckoutSessionParams) {
  const stripe = getStripeClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const {
    items,
    fulfilmentType,
    deliveryFee,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    hasAgeRestrictedItems,
    profileId,
  } = params;

  // 1. Build line items from server-verified basket items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: "gbp",
      product_data: {
        name: item.product.name,
        description: item.product.unit ? `${item.product.unit} • ${item.product.brand || "SIRAGRO"}` : undefined,
      },
      unit_amount: Math.round(item.product.price * 100), // convert £ to pence
    },
    quantity: item.quantity,
  }));

  // 2. Add delivery fee line item if applicable
  if (fulfilmentType === "delivery" && deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "gbp",
        product_data: {
          name: "Home Delivery Charge",
          description: "Delivery within 5 miles of shop near UB3 4NS",
        },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  // 3. Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    line_items: lineItems,
    success_url: `${siteUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout?cancelled=true`,
    metadata: {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      fulfilment_type: fulfilmentType,
      delivery_fee: deliveryFee.toString(),
      has_age_restricted_items: hasAgeRestrictedItems ? "true" : "false",
      profile_id: profileId || "",
      delivery_address: deliveryAddress ? JSON.stringify(deliveryAddress) : "",
    },
  });

  return session;
}
