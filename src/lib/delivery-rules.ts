export type DeliveryCalculationResult = {
  isEligible: boolean;
  distanceMiles: number | null;
  deliveryFee: number;
  isFreeDelivery: boolean;
  reason?: string;
  shopPostcode: string;
};

export type DeliverySettingsRecord = {
  shop_postcode?: string | null;
  free_delivery_radius_miles?: number | string | null;
  free_delivery_min_subtotal?: number | string | null;
  max_delivery_radius_miles?: number | string | null;
  delivery_fee_tier_1?: number | string | null;
  delivery_fee_tier_2?: number | string | null;
  distance_method?: string | null;
  is_delivery_enabled?: boolean | null;
  is_collection_enabled?: boolean | null;
  is_delivery_pricing_confirmed?: boolean | null;
};

export type FulfilmentAvailability = {
  settingsLoaded: boolean;
  deliveryAvailable: boolean;
  collectionAvailable: boolean;
  deliveryUnavailableReason?: string;
  collectionUnavailableReason?: string;
  pricingConfirmed: boolean;
  distanceMethod: "haversine" | "driving";
  freeDeliveryRadiusMiles: number | null;
  freeDeliveryMinSubtotal: number | null;
  maxDeliveryRadiusMiles: number | null;
};

const DEFAULT_SHOP_POSTCODE = "UB3 4NS";

/**
 * Strictly parses a non-empty finite number meeting a minimum bound.
 * Rejects null/undefined/empty strings/NaN so missing DB pricing cannot silently become 0.
 */
function parseStrictNumber(value: unknown, min = 0): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < min) {
    return null;
  }
  return num;
}

/**
 * Checks whether delivery fees, thresholds, and radii are completely configured.
 */
function parseConfirmedDeliveryConfig(settings: DeliverySettingsRecord): {
  freeRadius: number;
  freeMinSubtotal: number;
  maxRadius: number;
  tier1Fee: number;
  tier2Fee: number;
} | null {
  const freeRadius = parseStrictNumber(settings.free_delivery_radius_miles, 0);
  const freeMinSubtotal = parseStrictNumber(settings.free_delivery_min_subtotal, 0);
  const maxRadius = parseStrictNumber(settings.max_delivery_radius_miles, 0.01);
  const tier1Fee = parseStrictNumber(settings.delivery_fee_tier_1, 0);
  const tier2Fee = parseStrictNumber(settings.delivery_fee_tier_2, 0);

  if (
    freeRadius === null ||
    freeMinSubtotal === null ||
    maxRadius === null ||
    tier1Fee === null ||
    tier2Fee === null
  ) {
    return null;
  }

  return {
    freeRadius,
    freeMinSubtotal,
    maxRadius,
    tier1Fee: Math.round(tier1Fee * 100) / 100,
    tier2Fee: Math.round(tier2Fee * 100) / 100,
  };
}

/**
 * Evaluates server-side fulfilment availability without exposing unapproved fees.
 * Fails closed if delivery_settings cannot be read or delivery pricing is not confirmed.
 */
export function evaluateFulfilmentAvailability(
  settings: DeliverySettingsRecord | null | undefined,
  settingsError = false
): FulfilmentAvailability {
  if (settingsError || !settings) {
    return {
      settingsLoaded: false,
      deliveryAvailable: false,
      collectionAvailable: false,
      deliveryUnavailableReason:
        "Delivery settings could not be verified. Home delivery checkout is temporarily unavailable.",
      collectionUnavailableReason:
        "Store collection availability could not be verified. Checkout is temporarily unavailable.",
      pricingConfirmed: false,
      distanceMethod: "haversine",
      freeDeliveryRadiusMiles: null,
      freeDeliveryMinSubtotal: null,
      maxDeliveryRadiusMiles: null,
    };
  }

  const distanceMethod =
    settings.distance_method === "driving" ? "driving" : "haversine";
  const pricingConfirmed = settings.is_delivery_pricing_confirmed === true;
  const parsedConfig = parseConfirmedDeliveryConfig(settings);
  const freeRadius = parseStrictNumber(settings.free_delivery_radius_miles, 0);
  const freeMinSubtotal = parseStrictNumber(settings.free_delivery_min_subtotal, 0);
  const maxRadius = parseStrictNumber(settings.max_delivery_radius_miles, 0.01);

  const collectionVerifiedBoolean =
    typeof settings.is_collection_enabled === "boolean";
  const collectionAvailable =
    collectionVerifiedBoolean && settings.is_collection_enabled === true;
  const collectionUnavailableReason = collectionAvailable
    ? undefined
    : collectionVerifiedBoolean
      ? "In-store collection is currently paused by the store."
      : "In-store collection availability could not be verified.";

  let deliveryAvailable = false;
  let deliveryUnavailableReason: string | undefined;

  if (settings.is_delivery_enabled !== true) {
    deliveryUnavailableReason =
      "Home delivery is currently paused. Please use In-Store Collection if available.";
  } else if (!pricingConfirmed) {
    deliveryUnavailableReason =
      "Home delivery checkout is currently disabled while local delivery fees and boundary rules are being confirmed. Please choose In-Store Collection instead.";
  } else if (!parsedConfig) {
    deliveryUnavailableReason =
      "Home delivery pricing configuration is incomplete. Please choose In-Store Collection instead.";
  } else {
    deliveryAvailable = true;
  }

  return {
    settingsLoaded: true,
    deliveryAvailable,
    collectionAvailable,
    deliveryUnavailableReason,
    collectionUnavailableReason,
    pricingConfirmed,
    distanceMethod,
    freeDeliveryRadiusMiles: freeRadius,
    freeDeliveryMinSubtotal: freeMinSubtotal,
    maxDeliveryRadiusMiles: maxRadius,
  };
}

/**
 * Pure server-side rule evaluator for both home delivery and in-store collection.
 * Always fails closed when settings are missing, disabled, unconfirmed, or incomplete.
 */
export function evaluateDeliveryRules(options: {
  fulfilmentType: "delivery" | "collection";
  postcodeProvided: boolean;
  distanceMiles: number | null;
  subtotal: number;
  settings: DeliverySettingsRecord | null | undefined;
  settingsError?: boolean;
  shopPostcode?: string;
}): DeliveryCalculationResult {
  const {
    fulfilmentType,
    postcodeProvided,
    distanceMiles,
    subtotal,
    settings,
    settingsError = false,
  } = options;

  const shopPostcode =
    (settings?.shop_postcode && String(settings.shop_postcode).trim()) ||
    options.shopPostcode ||
    DEFAULT_SHOP_POSTCODE;

  // Fail closed whenever store settings cannot be safely verified
  if (settingsError || !settings) {
    return {
      isEligible: false,
      distanceMiles: null,
      deliveryFee: 0,
      isFreeDelivery: false,
      shopPostcode,
      reason:
        "Store fulfilment settings could not be verified. Please try again later.",
    };
  }

  // Enforce server-side collection flag (must be strictly verified true)
  if (fulfilmentType === "collection") {
    if (
      typeof settings.is_collection_enabled !== "boolean" ||
      settings.is_collection_enabled !== true
    ) {
      return {
        isEligible: false,
        distanceMiles: null,
        deliveryFee: 0,
        isFreeDelivery: false,
        shopPostcode,
        reason:
          typeof settings.is_collection_enabled === "boolean"
            ? "In-store collection is currently paused by the store."
            : "In-store collection availability could not be verified.",
      };
    }

    return {
      isEligible: true,
      distanceMiles: 0,
      deliveryFee: 0.0,
      isFreeDelivery: true,
      shopPostcode,
      reason: `Free in-store collection from our shop at ${shopPostcode}.`,
    };
  }

  // Enforce server-side delivery toggle
  if (settings.is_delivery_enabled !== true) {
    return {
      isEligible: false,
      distanceMiles: null,
      deliveryFee: 0,
      isFreeDelivery: false,
      shopPostcode,
      reason:
        "Home delivery is currently paused. Please choose In-Store Collection if available.",
    };
  }

  // Enforce explicit owner pricing confirmation before allowing any home delivery checkout
  if (settings.is_delivery_pricing_confirmed !== true) {
    return {
      isEligible: false,
      distanceMiles: null,
      deliveryFee: 0,
      isFreeDelivery: false,
      shopPostcode,
      reason:
        "Home delivery is temporarily unavailable while delivery fees and rules are awaiting store confirmation. Please select In-Store Collection instead.",
    };
  }

  // Validate all configured delivery rules without hardcoded price fallbacks
  const config = parseConfirmedDeliveryConfig(settings);
  if (!config) {
    return {
      isEligible: false,
      distanceMiles: null,
      deliveryFee: 0,
      isFreeDelivery: false,
      shopPostcode,
      reason:
        "Home delivery pricing settings are incomplete. Please select In-Store Collection instead.",
    };
  }

  if (!postcodeProvided) {
    return {
      isEligible: false,
      distanceMiles: null,
      deliveryFee: 0,
      isFreeDelivery: false,
      shopPostcode,
      reason: "Please enter your delivery postcode.",
    };
  }

  if (distanceMiles === null || !Number.isFinite(distanceMiles) || distanceMiles < 0) {
    return {
      isEligible: false,
      distanceMiles: null,
      deliveryFee: 0,
      isFreeDelivery: false,
      shopPostcode,
      reason: "Invalid UK postcode. Please check and try again.",
    };
  }

  if (distanceMiles > config.maxRadius) {
    return {
      isEligible: false,
      distanceMiles,
      deliveryFee: 0,
      isFreeDelivery: false,
      shopPostcode,
      reason: `Your address is ${distanceMiles} miles away (straight-line distance), which exceeds our ${config.maxRadius}-mile delivery boundary. Please choose In-Store Collection if available.`,
    };
  }

  // Strictly > free_delivery_min_subtotal (exact £25.00 does NOT qualify as "over £25")
  if (
    distanceMiles <= config.freeRadius &&
    subtotal > config.freeMinSubtotal
  ) {
    return {
      isEligible: true,
      distanceMiles,
      deliveryFee: 0.0,
      isFreeDelivery: true,
      shopPostcode,
      reason: `Eligible for Free Delivery! (${distanceMiles} mi straight-line distance from ${shopPostcode}, subtotal exceeds £${config.freeMinSubtotal.toFixed(2)}).`,
    };
  }

  const applicableFee =
    distanceMiles <= 3.0 ? config.tier1Fee : config.tier2Fee;

  return {
    isEligible: true,
    distanceMiles,
    deliveryFee: applicableFee,
    isFreeDelivery: false,
    shopPostcode,
    reason: `Delivery charge: £${applicableFee.toFixed(2)} (${distanceMiles} mi straight-line distance from ${shopPostcode}).`,
  };
}
