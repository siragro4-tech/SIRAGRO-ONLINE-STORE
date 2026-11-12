import { createServerSupabaseClient } from "@/lib/supabase/server";

export type DeliveryCalculationResult = {
  isEligible: boolean;
  distanceMiles: number | null;
  deliveryFee: number;
  isFreeDelivery: boolean;
  reason?: string;
  shopPostcode: string;
};

// Store Reference: UB3 4NS (Hayes, Middlesex)
export const SHOP_COORDINATES = {
  postcode: "UB3 4NS",
  latitude: 51.5034,
  longitude: -0.4208,
};

// Earth radius in statute miles
const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculates straight-line distance in miles between two latitude/longitude points
 * using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_MILES * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Known approximate coordinates for local postal districts near UB3 (offline fallback).
 */
const LOCAL_POSTCODE_COORDS: Record<string, { lat: number; lon: number }> = {
  "UB3 4NS": { lat: 51.5034, lon: -0.4208 },
  "UB3": { lat: 51.505, lon: -0.422 },
  "UB4": { lat: 51.531, lon: -0.421 },
  "UB7": { lat: 51.498, lon: -0.467 },
  "UB1": { lat: 51.512, lon: -0.378 },
  "UB2": { lat: 51.501, lon: -0.378 },
  "TW5": { lat: 51.488, lon: -0.378 },
  "TW6": { lat: 51.468, lon: -0.455 },
};

/**
 * Looks up geographic coordinates for a UK postcode.
 * Queries the free open postcodes.io service with an offline local fallback.
 */
export async function lookupPostcodeCoordinates(
  postcode: string
): Promise<{ latitude: number; longitude: number } | null> {
  const cleanPostcode = postcode.trim().toUpperCase().replace(/\s+/g, " ");

  // 1. Try public postcodes.io API
  try {
    const encoded = encodeURIComponent(cleanPostcode);
    const response = await fetch(`https://api.postcodes.io/postcodes/${encoded}`, {
      next: { revalidate: 60 * 60 * 24 }, // cache for 24h
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.result?.latitude && data?.result?.longitude) {
        return {
          latitude: data.result.latitude,
          longitude: data.result.longitude,
        };
      }
    }
  } catch {
    // Offline or network error: use local district fallback
  }

  // 2. Check local district fallback
  const district = cleanPostcode.split(" ")[0];
  if (LOCAL_POSTCODE_COORDS[cleanPostcode]) {
    const coords = LOCAL_POSTCODE_COORDS[cleanPostcode];
    return { latitude: coords.lat, longitude: coords.lon };
  }
  if (LOCAL_POSTCODE_COORDS[district]) {
    const coords = LOCAL_POSTCODE_COORDS[district];
    return { latitude: coords.lat, longitude: coords.lon };
  }

  return null;
}

/**
 * Evaluates delivery eligibility and calculates delivery fee on the server.
 * 
 * Rules:
 * 1. Fulfilment type 'collection': Free, always eligible regardless of distance.
 * 2. Delivery distance <= 1.0 mile:
 *    - If subtotal > £25.00: FREE delivery.
 *    - If subtotal <= £25.00: Tier 1 delivery charge (£2.99 / configured).
 * 3. Delivery distance 1.0 - 3.0 miles: Tier 1 delivery charge (£3.99).
 * 4. Delivery distance 3.0 - 5.0 miles: Tier 2 delivery charge (£4.99).
 * 5. Delivery distance > 5.0 miles: Not eligible for delivery; collection only.
 */
export async function calculateDeliveryCharge(options: {
  fulfilmentType: "delivery" | "collection";
  postcode?: string;
  subtotal: number;
}): Promise<DeliveryCalculationResult> {
  const { fulfilmentType, postcode, subtotal } = options;

  // 1. Collection is always free & eligible
  if (fulfilmentType === "collection") {
    return {
      isEligible: true,
      distanceMiles: 0,
      deliveryFee: 0.0,
      isFreeDelivery: true,
      shopPostcode: SHOP_COORDINATES.postcode,
      reason: "In-store collection from our shop near UB3 4NS is free.",
    };
  }

  // 2. Delivery requires a valid postcode
  if (!postcode || !postcode.trim()) {
    return {
      isEligible: false,
      distanceMiles: null,
      deliveryFee: 0.0,
      isFreeDelivery: false,
      shopPostcode: SHOP_COORDINATES.postcode,
      reason: "Please enter your delivery postcode.",
    };
  }

  // 3. Fetch delivery settings from database (or fall back to defaults)
  let settings = {
    free_delivery_radius_miles: 1.0,
    free_delivery_min_subtotal: 25.0,
    max_delivery_radius_miles: 5.0,
    delivery_fee_tier_1: 3.99,
    delivery_fee_tier_2: 4.99,
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("delivery_settings")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      settings = {
        free_delivery_radius_miles: Number(data.free_delivery_radius_miles) || 1.0,
        free_delivery_min_subtotal: Number(data.free_delivery_min_subtotal) || 25.0,
        max_delivery_radius_miles: Number(data.max_delivery_radius_miles) || 5.0,
        delivery_fee_tier_1: Number(data.delivery_fee_tier_1) || 3.99,
        delivery_fee_tier_2: Number(data.delivery_fee_tier_2) || 4.99,
      };
    }
  } catch {
    // Default settings preserved
  }

  // 4. Look up customer coordinates
  const customerCoords = await lookupPostcodeCoordinates(postcode);

  if (!customerCoords) {
    return {
      isEligible: false,
      distanceMiles: null,
      deliveryFee: 0.0,
      isFreeDelivery: false,
      shopPostcode: SHOP_COORDINATES.postcode,
      reason: "Invalid UK postcode. Please check and try again.",
    };
  }

  // 5. Calculate distance
  const distanceMiles = calculateHaversineDistance(
    SHOP_COORDINATES.latitude,
    SHOP_COORDINATES.longitude,
    customerCoords.latitude,
    customerCoords.longitude
  );

  // 6. Check maximum delivery radius
  if (distanceMiles > settings.max_delivery_radius_miles) {
    return {
      isEligible: false,
      distanceMiles,
      deliveryFee: 0.0,
      isFreeDelivery: false,
      shopPostcode: SHOP_COORDINATES.postcode,
      reason: `Your address is ${distanceMiles} miles away, which is beyond our 5-mile delivery boundary. You are very welcome to choose in-store collection!`,
    };
  }

  // 7. Check Free Delivery rule: within 1 mile AND subtotal strictly > £25.00
  if (
    distanceMiles <= settings.free_delivery_radius_miles &&
    subtotal > settings.free_delivery_min_subtotal
  ) {
    return {
      isEligible: true,
      distanceMiles,
      deliveryFee: 0.0,
      isFreeDelivery: true,
      shopPostcode: SHOP_COORDINATES.postcode,
      reason: `Eligible for Free Delivery! (${distanceMiles} mi from shop near UB3 4NS, subtotal exceeds £25.00)`,
    };
  }

  // 8. Distance between 0 - 3.0 miles (including <= 1 mi under £25)
  if (distanceMiles <= 3.0) {
    return {
      isEligible: true,
      distanceMiles,
      deliveryFee: settings.delivery_fee_tier_1,
      isFreeDelivery: false,
      shopPostcode: SHOP_COORDINATES.postcode,
      reason: `Delivery charge: £${settings.delivery_fee_tier_1.toFixed(2)} (${distanceMiles} mi from shop). Free delivery on orders over £25 within 1 mile!`,
    };
  }

  // 9. Distance between 3.0 - 5.0 miles
  return {
    isEligible: true,
    distanceMiles,
    deliveryFee: settings.delivery_fee_tier_2,
    isFreeDelivery: false,
    shopPostcode: SHOP_COORDINATES.postcode,
    reason: `Delivery charge: £${settings.delivery_fee_tier_2.toFixed(2)} (${distanceMiles} mi from shop near UB3 4NS).`,
  };
}

