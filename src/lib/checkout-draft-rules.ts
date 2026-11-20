const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DraftItemInput = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  isAvailable: boolean;
  stockQuantity: number;
  isAgeRestricted: boolean;
};

export type ValidatedDraftItem = {
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotalSnapshot: number;
  isAgeRestrictedSnapshot: boolean;
};

export type DraftTotals = {
  subtotal: number;
  deliveryCharge: number;
  total: number;
  expectedTotalPence: number;
};

export type StockShortageItem = {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
  unitPrice: number;
};

/**
 * Checks all requested items against current server availability and stock.
 * Never clamps or adjusts quantities; returns structured shortages for UI confirmation.
 */
export function detectStockShortages(items: DraftItemInput[]): StockShortageItem[] {
  const shortages: StockShortageItem[] = [];
  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    const available = item.isAvailable
      ? Math.max(0, Math.floor(Number(item.stockQuantity) || 0))
      : 0;

    if (available < qty) {
      shortages.push({
        productId: item.productId,
        productName: item.name,
        requestedQuantity: qty,
        availableQuantity: available,
        unitPrice: Math.round(Number(item.unitPrice) * 100) / 100,
      });
    }
  }
  return shortages;
}

/**
 * Applies currently available quantities ONLY when the customer explicitly accepts them.
 * Never silently reduces quantities or substitutes products.
 */
export function applyAcceptedAvailableQuantities(
  items: DraftItemInput[],
  acceptedByCustomer: boolean
):
  | { ok: true; items: DraftItemInput[] }
  | { ok: false; error: string; shortages: StockShortageItem[] } {
  const shortages = detectStockShortages(items);
  if (shortages.length === 0) {
    return { ok: true, items };
  }

  if (!acceptedByCustomer) {
    return {
      ok: false,
      error:
        "Some items in your basket do not have enough stock available. Please review the available quantities below and choose whether to accept them or edit your basket.",
      shortages,
    };
  }

  const adjusted: DraftItemInput[] = [];
  for (const item of items) {
    const available = item.isAvailable
      ? Math.max(0, Math.floor(Number(item.stockQuantity) || 0))
      : 0;
    const targetQty = Math.min(Math.floor(Number(item.quantity) || 0), available);
    if (targetQty > 0) {
      adjusted.push({
        ...item,
        quantity: targetQty,
      });
    }
  }

  if (adjusted.length === 0) {
    return {
      ok: false,
      error:
        "All items in your basket are currently out of stock. Please edit your basket before checking out.",
      shortages,
    };
  }

  return { ok: true, items: adjusted };
}

export function validateDraftItems(
  items: DraftItemInput[]
):
  | { ok: true; items: ValidatedDraftItem[] }
  | { ok: false; error: string; shortages?: StockShortageItem[] } {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Your basket is empty." };
  }

  const shortages = detectStockShortages(items);
  if (shortages.length > 0) {
    return {
      ok: false,
      error:
        "Some items in your basket do not have enough stock available. Please review the available quantities below and choose whether to accept them or edit your basket.",
      shortages,
    };
  }

  const validated: ValidatedDraftItem[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item.productId || !UUID_REGEX.test(item.productId)) {
      return { ok: false, error: "Invalid product identifier in basket." };
    }
    if (seenIds.has(item.productId)) {
      return { ok: false, error: "Duplicate product entries in draft." };
    }
    seenIds.add(item.productId);

    const qty = Math.floor(Number(item.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 20) {
      return {
        ok: false,
        error: `Invalid quantity for "${item.name}". Quantity must be between 1 and 20.`,
      };
    }

    const unitPrice = Math.round(Number(item.unitPrice) * 100) / 100;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return {
        ok: false,
        error: `Invalid server price for "${item.name}".`,
      };
    }

    const lineTotal = Math.round(unitPrice * qty * 100) / 100;

    validated.push({
      productId: item.productId,
      productNameSnapshot: item.name,
      unitPriceSnapshot: unitPrice,
      quantity: qty,
      lineTotalSnapshot: lineTotal,
      isAgeRestrictedSnapshot: Boolean(item.isAgeRestricted),
    });
  }

  return { ok: true, items: validated };
}

export function buildDraftTotals(
  items: ValidatedDraftItem[],
  deliveryCharge: number
): DraftTotals {
  const rawSubtotal = items.reduce(
    (sum, item) => sum + item.lineTotalSnapshot,
    0
  );
  const subtotal = Math.round(rawSubtotal * 100) / 100;
  const safeDelivery =
    Number.isFinite(deliveryCharge) && deliveryCharge >= 0
      ? Math.round(deliveryCharge * 100) / 100
      : 0;
  const total = Math.round((subtotal + safeDelivery) * 100) / 100;
  const expectedTotalPence = Math.round(total * 100);

  return {
    subtotal,
    deliveryCharge: safeDelivery,
    total,
    expectedTotalPence,
  };
}

export function buildStripeSessionIdempotencyKey(draftId: string): string {
  return `siragro-checkout-draft-${draftId}`;
}

export function validateStripeSessionAgainstDraft(params: {
  paymentStatus?: string | null;
  currency?: string | null;
  amountTotalPence?: number | null;
  expectedTotalPence: number;
}): { valid: true } | { valid: false; reason: string } {
  if (params.paymentStatus !== "paid") {
    return {
      valid: false,
      reason: `Stripe session payment_status is "${params.paymentStatus || "unknown"}", expected "paid".`,
    };
  }

  const currency = params.currency?.trim().toLowerCase();
  if (currency !== "gbp") {
    return {
      valid: false,
      reason: `Unsupported currency "${params.currency || "missing"}"; expected "gbp".`,
    };
  }

  if (
    typeof params.amountTotalPence !== "number" ||
    !Number.isFinite(params.amountTotalPence) ||
    params.amountTotalPence !== params.expectedTotalPence
  ) {
    return {
      valid: false,
      reason: `Stripe amount_total (${params.amountTotalPence}) does not match server draft expectedTotalPence (${params.expectedTotalPence}).`,
    };
  }

  return { valid: true };
}
