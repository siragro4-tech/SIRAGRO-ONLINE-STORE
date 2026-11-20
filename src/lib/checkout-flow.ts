import type { DeliveryCalculationResult } from "./delivery-rules";
import type {
  DraftTotals,
  StockShortageItem,
  ValidatedDraftItem,
} from "./checkout-draft-rules";

export type CheckoutActionResult = {
  error?: string;
  url?: string;
  devBypass?: boolean;
  shortages?: StockShortageItem[];
};

export interface CheckoutBasketItemLike {
  productId: string;
  quantity: number;
}

export interface CheckoutBasketSummary<TItem = CheckoutBasketItemLike> {
  items: TItem[];
  itemCount: number;
  subtotal: number;
  hasAgeRestrictedItems: boolean;
  error?: string;
}

export interface StripeCheckoutLineItemInput {
  productId: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    unit?: string | null;
    brand?: string | null;
  };
}

export interface CheckoutFlowDeps<
  TItem extends CheckoutBasketItemLike = CheckoutBasketItemLike,
> {
  getBasket: () => Promise<CheckoutBasketSummary<TItem>>;
  calculateDeliveryCharge: (options: {
    fulfilmentType: "delivery" | "collection";
    postcode?: string;
    subtotal: number;
  }) => Promise<DeliveryCalculationResult>;
  getProfileId: () => Promise<string | null>;
  createCheckoutDraft: (params: {
    profileId?: string | null;
    fulfilmentType: "delivery" | "collection";
    deliveryAddress?: {
      line1: string;
      line2?: string;
      city: string;
      postcode: string;
    };
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryFee: number;
    ageRestrictionAcknowledged?: boolean;
    acceptAvailableQuantities?: boolean;
    items: Array<{ productId: string; quantity: number }>;
  }) => Promise<
    | {
        ok: true;
        draftId: string;
        totals: DraftTotals;
        items: ValidatedDraftItem[];
        hasAgeRestrictedItems: boolean;
      }
    | {
        ok: false;
        error: string;
        shortages?: StockShortageItem[];
      }
  >;
  reserveDraftStock: (
    draftId: string
  ) => Promise<
    | { ok: true }
    | { ok: false; error: string; shortages?: StockShortageItem[] }
  >;
  releaseDraftReservations: (
    draftId: string,
    reason?: "released" | "expired"
  ) => Promise<void>;
  linkStripeSessionToDraft: (
    draftId: string,
    stripeSessionId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  createStripeCheckoutSession: (params: {
    items: StripeCheckoutLineItemInput[];
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
    draftId: string;
    idempotencyKey: string;
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
 * Validates stock, requires explicit customer acceptance on shortages,
 * reserves stock atomically, and creates the Stripe session strictly from the draft.
 */
export async function processCheckoutSubmission<
  TItem extends CheckoutBasketItemLike,
>(
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

  const customerName = formData.get("customerName")?.toString().trim();
  const customerEmail = formData.get("customerEmail")?.toString().trim();
  const customerPhone = formData.get("customerPhone")?.toString().trim();
  const fulfilmentType = formData.get("fulfilmentType")?.toString() as
    | "delivery"
    | "collection";
  const acceptAvailableQuantities =
    formData.get("acceptAvailableQuantities")?.toString() === "true";

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

  const ageConfirmed = formData.get("ageConfirmed")?.toString() === "true";
  if (summary.hasAgeRestrictedItems && !ageConfirmed) {
    return {
      error:
        "Your order contains age-restricted items (18+). You must confirm you are 18 or older and agree to present photographic ID upon delivery/collection.",
    };
  }

  const profileId = await deps.getProfileId();

  // 1. Create & persist immutable server checkout draft (checks stock + explicit shortage acceptance)
  const draftResult = await deps.createCheckoutDraft({
    profileId,
    fulfilmentType,
    deliveryAddress,
    customerName,
    customerEmail,
    customerPhone,
    deliveryFee,
    ageRestrictionAcknowledged: ageConfirmed,
    acceptAvailableQuantities,
    items: summary.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  });

  if (!draftResult.ok) {
    return {
      error: draftResult.error,
      shortages: draftResult.shortages,
    };
  }

  // 2. Atomically reserve stock with expiry before creating Stripe session
  const reservationRes = await deps.reserveDraftStock(draftResult.draftId);
  if (!reservationRes.ok) {
    return {
      error: reservationRes.error,
      shortages: reservationRes.shortages,
    };
  }

  // 3. Create Stripe Checkout Session strictly from draftResult.items (never stale basket prices)
  try {
    const idempotencyKey = `siragro-checkout-draft-${draftResult.draftId}`;
    const stripeItems: StripeCheckoutLineItemInput[] = draftResult.items.map(
      (item) => ({
        productId: item.productId,
        quantity: item.quantity,
        product: {
          name: item.productNameSnapshot,
          price: item.unitPriceSnapshot,
        },
      })
    );

    const session = await deps.createStripeCheckoutSession({
      items: stripeItems,
      fulfilmentType,
      deliveryFee: draftResult.totals.deliveryCharge,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      hasAgeRestrictedItems: draftResult.hasAgeRestrictedItems,
      profileId,
      draftId: draftResult.draftId,
      idempotencyKey,
    });

    if (!session.url) {
      await deps.releaseDraftReservations(draftResult.draftId, "released");
      return {
        error: "Could not initialize payment session. Please try again.",
      };
    }

    const linkRes = await deps.linkStripeSessionToDraft(
      draftResult.draftId,
      session.id
    );
    if (!linkRes.ok) {
      await deps.releaseDraftReservations(draftResult.draftId, "released");
      return { error: linkRes.error };
    }

    if (deps.recordCheckoutInitiatedActivity) {
      await deps.recordCheckoutInitiatedActivity({
        stripeSessionId: session.id,
        fulfilmentType,
        expectedTotal: draftResult.totals.total,
        itemCount: draftResult.items.reduce((sum, i) => sum + i.quantity, 0),
      });
    }

    return { url: session.url };
  } catch (err: unknown) {
    await deps.releaseDraftReservations(draftResult.draftId, "released");
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
