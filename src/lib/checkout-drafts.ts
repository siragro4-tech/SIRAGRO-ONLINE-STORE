import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import {
  applyAcceptedAvailableQuantities,
  buildDraftTotals,
  validateDraftItems,
  type DraftItemInput,
  type DraftTotals,
  type StockShortageItem,
  type ValidatedDraftItem,
} from "@/lib/checkout-draft-rules";

export * from "@/lib/checkout-draft-rules";

export type ServerCheckoutDraftResult =
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
    };

/**
 * Re-reads current product prices, availability, and stock directly from Supabase,
 * enforces explicit customer acceptance on shortages, computes totals in integer pence,
 * and persists an immutable server checkout draft and its relational draft items.
 */
export async function createServerCheckoutDraft(params: {
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
}): Promise<ServerCheckoutDraftResult> {
  if (!Array.isArray(params.items) || params.items.length === 0) {
    return { ok: false, error: "Your basket is empty." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: "Checkout cannot verify store database configuration right now.",
    };
  }

  const productIds = params.items.map((i) => i.productId);
  const { data: dbProducts, error: productsErr } = await admin
    .from("products")
    .select("id, name, price, is_available, stock_quantity, is_age_restricted")
    .in("id", productIds);

  if (productsErr || !dbProducts) {
    return {
      ok: false,
      error: "Unable to verify current product prices and stock on the server.",
    };
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));
  const freshInputs: DraftItemInput[] = [];

  for (const item of params.items) {
    const dbProduct = productMap.get(item.productId);
    if (!dbProduct) {
      return {
        ok: false,
        error: "One or more basket items are no longer available in the store catalogue.",
      };
    }

    freshInputs.push({
      productId: dbProduct.id,
      name: dbProduct.name,
      unitPrice: Number(dbProduct.price),
      quantity: item.quantity,
      isAvailable: Boolean(dbProduct.is_available),
      stockQuantity: Number(dbProduct.stock_quantity),
      isAgeRestricted: Boolean(dbProduct.is_age_restricted),
    });
  }

  const acceptedCheck = applyAcceptedAvailableQuantities(
    freshInputs,
    Boolean(params.acceptAvailableQuantities)
  );
  if (!acceptedCheck.ok) {
    return {
      ok: false,
      error: acceptedCheck.error,
      shortages: acceptedCheck.shortages,
    };
  }

  const itemValidation = validateDraftItems(acceptedCheck.items);
  if (!itemValidation.ok) {
    return itemValidation;
  }

  const hasAgeRestrictedItems = itemValidation.items.some(
    (i) => i.isAgeRestrictedSnapshot
  );

  if (hasAgeRestrictedItems && !params.ageRestrictionAcknowledged) {
    return {
      ok: false,
      error:
        "Your order contains age-restricted items (18+). You must confirm you are 18 or older and agree to present photographic ID upon delivery/collection.",
    };
  }

  const totals = buildDraftTotals(itemValidation.items, params.deliveryFee);

  const { data: draft, error: draftErr } = await admin
    .from("checkout_drafts")
    .insert({
      profile_id: params.profileId || null,
      fulfilment_type: params.fulfilmentType,
      delivery_address: (params.deliveryAddress || null) as Json,
      customer_name: params.customerName.trim(),
      customer_email: params.customerEmail.trim(),
      customer_phone: params.customerPhone.trim(),
      subtotal: totals.subtotal,
      delivery_charge: totals.deliveryCharge,
      total: totals.total,
      expected_total_pence: totals.expectedTotalPence,
      currency: "gbp",
      has_age_restricted_items: hasAgeRestrictedItems,
      age_restriction_acknowledged: Boolean(params.ageRestrictionAcknowledged),
      status: "pending",
    })
    .select("id")
    .single();

  if (draftErr || !draft) {
    return {
      ok: false,
      error:
        "Checkout is temporarily unavailable while database order-draft tables are pending migration.",
    };
  }

  const { error: itemsErr } = await admin.from("checkout_draft_items").insert(
    itemValidation.items.map((i) => ({
      draft_id: draft.id,
      product_id: i.productId,
      product_name_snapshot: i.productNameSnapshot,
      unit_price_snapshot: i.unitPriceSnapshot,
      quantity: i.quantity,
      line_total_snapshot: i.lineTotalSnapshot,
      is_age_restricted_snapshot: i.isAgeRestrictedSnapshot,
    }))
  );

  if (itemsErr) {
    await admin.from("checkout_drafts").delete().eq("id", draft.id);
    return {
      ok: false,
      error: "Unable to save checkout draft items. Please try again.",
    };
  }

  return {
    ok: true,
    draftId: draft.id,
    totals,
    items: itemValidation.items,
    hasAgeRestrictedItems,
  };
}

/**
 * Atomically reserves stock for an active checkout draft (with 15-minute expiry).
 * Fails closed if migration 008's RPC is missing or if concurrent reservations leave insufficient stock.
 */
export async function reserveDraftStock(
  draftId: string,
  ttlMinutes = 15
): Promise<
  | { ok: true }
  | { ok: false; error: string; shortages?: StockShortageItem[] }
> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_checkout_draft_stock", {
    p_draft_id: draftId,
    p_ttl_minutes: ttlMinutes,
  });

  if (error) {
    return {
      ok: false,
      error:
        "Checkout stock reservation is unavailable while migration 008 is pending.",
    };
  }

  const res = (data || {}) as {
    ok?: boolean;
    shortages?: StockShortageItem[];
  };

  if (!res.ok) {
    return {
      ok: false,
      error:
        "Some items in your basket do not have enough unreserved stock right now. Please review the available quantities below.",
      shortages: Array.isArray(res.shortages) ? res.shortages : [],
    };
  }

  return { ok: true };
}

/**
 * Idempotently releases active stock reservations for a cancelled, failed, or expired draft.
 */
export async function releaseDraftReservations(
  draftId: string,
  reason: "released" | "expired" = "released"
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.rpc("release_checkout_draft_reservations", {
      p_draft_id: draftId,
      p_reason: reason,
    });
  } catch {
    // Non-fatal cleanup
  }
}

/**
 * Links a newly created Stripe Checkout Session ID to its server draft and verifies the update.
 */
export async function linkStripeSessionToDraft(
  draftId: string,
  stripeSessionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("checkout_drafts")
    .update({
      stripe_checkout_session_id: stripeSessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .select("id, stripe_checkout_session_id")
    .single();

  if (error || !data || data.stripe_checkout_session_id !== stripeSessionId) {
    return {
      ok: false,
      error: "Unable to verify checkout draft session link.",
    };
  }

  return { ok: true };
}
