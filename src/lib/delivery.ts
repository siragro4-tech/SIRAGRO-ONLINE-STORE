import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  evaluateDeliveryRules,
  evaluateFulfilmentAvailability,
  type DeliveryCalculationResult,
  type DeliverySettingsRecord,
  type FulfilmentAvailability,
} from "@/lib/delivery-rules";

export type { DeliveryCalculationResult, FulfilmentAvailability };

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

async function fetchDeliverySettingsRow(): Promise<{
  settings: DeliverySettingsRecord | null;
  settingsError: boolean;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("delivery_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { settings: null, settingsError: true };
    }

    return {
      settings: data as DeliverySettingsRecord,
      settingsError: false,
    };
  } catch {
    return { settings: null, settingsError: true };
  }
}

/**
 * Returns server-verified availability for home delivery and store collection.
 */
export async function getFulfilmentAvailability(): Promise<FulfilmentAvailability> {
  const { settings, settingsError } = await fetchDeliverySettingsRow();
  return evaluateFulfilmentAvailability(settings, settingsError);
}

/**
 * Evaluates delivery or collection eligibility and fee strictly on the server.
 * Fails closed when delivery_settings cannot be safely read, a fulfilment toggle
 * is disabled, or delivery pricing is not explicitly confirmed.
 */
export async function calculateDeliveryCharge(options: {
  fulfilmentType: "delivery" | "collection";
  postcode?: string;
  subtotal: number;
}): Promise<DeliveryCalculationResult> {
  const { fulfilmentType, postcode, subtotal } = options;
  const { settings, settingsError } = await fetchDeliverySettingsRow();

  if (fulfilmentType === "collection") {
    return evaluateDeliveryRules({
      fulfilmentType: "collection",
      postcodeProvided: true,
      distanceMiles: 0,
      subtotal,
      settings,
      settingsError,
      shopPostcode: SHOP_COORDINATES.postcode,
    });
  }

  // Check store toggle / confirmation status before calling external postcode APIs
  const availability = evaluateFulfilmentAvailability(settings, settingsError);
  if (!availability.deliveryAvailable) {
    return evaluateDeliveryRules({
      fulfilmentType: "delivery",
      postcodeProvided: Boolean(postcode && postcode.trim()),
      distanceMiles: null,
      subtotal,
      settings,
      settingsError,
      shopPostcode: SHOP_COORDINATES.postcode,
    });
  }

  const trimmedPostcode = postcode?.trim() || "";
  if (!trimmedPostcode) {
    return evaluateDeliveryRules({
      fulfilmentType: "delivery",
      postcodeProvided: false,
      distanceMiles: null,
      subtotal,
      settings,
      settingsError,
      shopPostcode: SHOP_COORDINATES.postcode,
    });
  }

  const customerCoords = await lookupPostcodeCoordinates(trimmedPostcode);
  const distanceMiles = customerCoords
    ? calculateHaversineDistance(
        SHOP_COORDINATES.latitude,
        SHOP_COORDINATES.longitude,
        customerCoords.latitude,
        customerCoords.longitude
      )
    : null;

  return evaluateDeliveryRules({
    fulfilmentType: "delivery",
    postcodeProvided: true,
    distanceMiles,
    subtotal,
    settings,
    settingsError,
    shopPostcode: SHOP_COORDINATES.postcode,
  });
}

