"use server";

import { getBasket } from "@/lib/basket";
import { calculateDeliveryCharge, type DeliveryCalculationResult } from "@/lib/delivery";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CheckoutActionResult = {
  error?: string;
  url?: string;
  devBypass?: boolean;
};

/**
 * Validates a delivery postcode against shop coordinates (UB3 4NS).
 * Strictly computed on the server.
 */
export async function validatePostcodeAction(
  postcode: string
): Promise<DeliveryCalculationResult> {
  const summary = await getBasket();
  return await calculateDeliveryCharge({
    fulfilmentType: "delivery",
    postcode,
    subtotal: summary.subtotal,
  });
}

/**
 * Validates the checkout form and creates a Stripe Checkout session.
 */
export async function createCheckoutSessionAction(
  prevState: CheckoutActionResult | null,
  formData: FormData
): Promise<CheckoutActionResult> {
  const summary = await getBasket();

  if (summary.items.length === 0) {
    return { error: "Your basket is empty. Please add items before checkout." };
  }

  // 1. Extract contact details
  const customerName = formData.get("customerName")?.toString().trim();
  const customerEmail = formData.get("customerEmail")?.toString().trim();
  const customerPhone = formData.get("customerPhone")?.toString().trim();
  const fulfilmentType = formData.get("fulfilmentType")?.toString() as "delivery" | "collection";

  if (!customerName || !customerEmail || !customerPhone) {
    return { error: "Please provide your full name, email, and contact phone number." };
  }

  if (fulfilmentType !== "delivery" && fulfilmentType !== "collection") {
    return { error: "Please select either Home Delivery or In-Store Collection." };
  }

  // 2. Extract & validate delivery address if home delivery selected
  let deliveryFee = 0;
  let deliveryAddress: { line1: string; line2?: string; city: string; postcode: string } | undefined;

  if (fulfilmentType === "delivery") {
    const line1 = formData.get("addressLine1")?.toString().trim();
    const line2 = formData.get("addressLine2")?.toString().trim() || "";
    const city = formData.get("city")?.toString().trim();
    const postcode = formData.get("postcode")?.toString().trim();

    if (!line1 || !city || !postcode) {
      return { error: "Please complete all required delivery address fields (Street address, Town/City, and Postcode)." };
    }

    // SERVER-SIDE CALCULATION: Re-calculate delivery fee from database values
    const deliveryCheck = await calculateDeliveryCharge({
      fulfilmentType: "delivery",
      postcode,
      subtotal: summary.subtotal,
    });

    if (!deliveryCheck.isEligible) {
      return {
        error:
          deliveryCheck.reason ||
          "Delivery is not available to this postcode. Please choose In-Store Collection instead.",
      };
    }

    deliveryFee = deliveryCheck.deliveryFee;
    deliveryAddress = { line1, line2, city, postcode };
  }

  // 3. Challenge 25 Age Restriction Check
  if (summary.hasAgeRestrictedItems) {
    const ageConfirmed = formData.get("ageConfirmed");
    if (!ageConfirmed || ageConfirmed !== "true") {
      return {
        error:
          "Your order contains age-restricted items (18+). You must confirm you are 18 or older and agree to present photographic ID upon delivery/collection.",
      };
    }
  }

  // 4. Check if authenticated user
  let profileId: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    profileId = user?.id || null;
  } catch {
    // Guest checkout
  }

  // 5. Create Stripe Checkout Session
  try {
    const session = await createStripeCheckoutSession({
      items: summary.items,
      fulfilmentType,
      deliveryFee,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      hasAgeRestrictedItems: summary.hasAgeRestrictedItems,
      profileId,
    });

    if (!session.url) {
      return { error: "Could not initialize payment session. Please try again." };
    }

    return { url: session.url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // If Stripe secret key is not configured yet during early development
    if (message.includes("STRIPE_SECRET_KEY")) {
      return {
        error:
          "Stripe secret key is not configured in .env.local yet. Please configure STRIPE_SECRET_KEY in your environment variables.",
        devBypass: true,
      };
    }
    return { error: `Payment error: ${message}` };
  }
}

