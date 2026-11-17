import type { DeliveryCalculationResult } from "./delivery-rules";

export type CheckoutActionResult = {
  error?: string;
  url?: string;
  devBypass?: boolean;
};

export interface CheckoutBasketSummary<TItem = unknown> {
  items: TItem[];
  itemCount: number;
  subtotal: number;
  hasAgeRestrictedItems: boolean;
  error?: string;
}

export interface CheckoutFlowDeps<TItem = unknown> {
  getBasket: () => Promise<CheckoutBasketSummary<TItem>>;
  calculateDeliveryCharge: (options: {
    fulfilmentType: "delivery" | "collection";
    postcode?: string;
    subtotal: number;
  }) => Promise<DeliveryCalculationResult>;
  getProfileId: () => Promise<string | null>;
  createStripeCheckoutSession: (params: {
    items: TItem[];
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
  }) => Promise<{ id: string; url: string | null }>;
  recordCheckoutInitiatedActivity?: (params: {
    stripeSessionId: string;
    fulfilmentType: "delivery" | "collection";
    expectedTotal: number;
    itemCount: number;
  }) => Promise<void>;
}

/**
 * Pure server-side checkout orchestration.
 * Always computes basket subtotal, delivery eligibility, and fulfilment fee
 * from trusted server state, ignoring any browser-submitted fees or totals.
 */
export async function processCheckoutSubmission<TItem>(
  formData: FormData,
  deps: CheckoutFlowDeps<TItem>
): Promise<CheckoutActionResult> {
  const summary = await deps.getBasket();

  if (summary.error) {
    return { error: summary.error };
  }

  if (summary.items.length === 0) {
    return { error: "Your basket is empty. Please add items before checkout." };
  }

  // 1. Extract contact details (never read fee/subtotal/total from formData)
  const customerName = formData.get("customerName")?.toString().trim();
  const customerEmail = formData.get("customerEmail")?.toString().trim();
  const customerPhone = formData.get("customerPhone")?.toString().trim();
  const fulfilmentType = formData.get("fulfilmentType")?.toString() as
    | "delivery"
    | "collection";

  if (!customerName || !customerEmail || !customerPhone) {
    return {
      error: "Please provide your full name, email, and contact phone number.",
    };
  }

  if (fulfilmentType !== "delivery" && fulfilmentType !== "collection") {
    return {
      error: "Please select either Home Delivery or In-Store Collection.",
    };
  }

  // 2. Server-side fulfilment eligibility & charge calculation
  let deliveryFee = 0;
  let deliveryAddress:
    | { line1: string; line2?: string; city: string; postcode: string }
    | undefined;

  if (fulfilmentType === "delivery") {
    const line1 = formData.get("addressLine1")?.toString().trim();
    const line2 = formData.get("addressLine2")?.toString().trim() || "";
    const city = formData.get("city")?.toString().trim();
    const postcode = formData.get("postcode")?.toString().trim();

    if (!line1 || !city || !postcode) {
      return {
        error:
          "Please complete all required delivery address fields (Street address, Town/City, and Postcode).",
      };
    }

    const deliveryCheck = await deps.calculateDeliveryCharge({
      fulfilmentType: "delivery",
      postcode,
      subtotal: summary.subtotal,
    });

    if (
      !deliveryCheck.isEligible ||
      !Number.isFinite(deliveryCheck.deliveryFee) ||
      deliveryCheck.deliveryFee < 0
    ) {
      return {
        error:
          deliveryCheck.reason ||
          "Home delivery is currently unavailable. Please choose In-Store Collection if available.",
      };
    }

    deliveryFee = deliveryCheck.deliveryFee;
    deliveryAddress = { line1, line2, city, postcode };
  } else {
    const collectionCheck = await deps.calculateDeliveryCharge({
      fulfilmentType: "collection",
      subtotal: summary.subtotal,
    });

    if (
      !collectionCheck.isEligible ||
      !Number.isFinite(collectionCheck.deliveryFee) ||
      collectionCheck.deliveryFee < 0
    ) {
      return {
        error:
          collectionCheck.reason ||
          "In-store collection is currently unavailable. Please try again later.",
      };
    }

    deliveryFee = collectionCheck.deliveryFee;
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

  // 4. Resolve optional authenticated user profile ID
  const profileId = await deps.getProfileId();

  // 5. Create Stripe Checkout Session with server-calculated totals
  try {
    const session = await deps.createStripeCheckoutSession({
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
      return {
        error: "Could not initialize payment session. Please try again.",
      };
    }

    const expectedTotal = Math.round((summary.subtotal + deliveryFee) * 100) / 100;
    if (deps.recordCheckoutInitiatedActivity) {
      await deps.recordCheckoutInitiatedActivity({
        stripeSessionId: session.id,
        fulfilmentType,
        expectedTotal,
        itemCount: summary.itemCount,
      });
    }

    return { url: session.url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
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
