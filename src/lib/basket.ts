import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FALLBACK_PRODUCTS, type Product } from "@/lib/products";

export const GUEST_BASKET_COOKIE = "siragro_guest_basket";
export const GUEST_TOKEN_COOKIE = "siragro_guest_token";

export type BasketItem = {
  productId: string;
  quantity: number;
  product: Product;
  lineTotal: number;
};

export type BasketSummary = {
  items: BasketItem[];
  itemCount: number;
  subtotal: number;
  hasAgeRestrictedItems: boolean;
  qualifiesForFreeDeliveryWithin1Mile: boolean;
  amountNeededForFreeDelivery: number;
};

/**
 * Returns raw items stored in guest cookie for fallback / guest mode.
 */
async function getGuestCookieItems(): Promise<{ productId: string; quantity: number }[]> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(GUEST_BASKET_COOKIE)?.value;
  if (!rawCookie) return [];

  try {
    return JSON.parse(rawCookie);
  } catch {
    return [];
  }
}

/**
 * Saves items to guest cookie.
 */
async function setGuestCookieItems(items: { productId: string; quantity: number }[]) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_BASKET_COOKIE, JSON.stringify(items), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getExistingGuestToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_TOKEN_COOKIE)?.value;
  return token && UUID_REGEX.test(token) ? token : null;
}

async function getOrCreateGuestToken(): Promise<string> {
  const existing = await getExistingGuestToken();
  if (existing) return existing;

  const token = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(GUEST_TOKEN_COOKIE, token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

/**
 * Resolves product details from Supabase by UUID, falling back to static products.
 */
async function resolveProductsForBasket(
  productIds: string[]
): Promise<Map<string, Product>> {
  const productMap = new Map<string, Product>();
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  if (uniqueIds.length === 0) return productMap;

  const validUuids = uniqueIds.filter((id) => UUID_REGEX.test(id));
  if (validUuids.length > 0) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*), images:product_images(*)")
        .in("id", validUuids);

      if (!error && data) {
        for (const prod of data as unknown as Product[]) {
          productMap.set(prod.id, prod);
        }
      }
    } catch {
      // Database offline or unconfigured: fall back to static products below
    }
  }

  for (const id of uniqueIds) {
    if (!productMap.has(id)) {
      const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id || p.slug === id);
      if (fallback) {
        productMap.set(id, fallback);
      }
    }
  }

  return productMap;
}

/**
 * Retrieves the full current basket with fresh product details,
 * verified server-side prices, and stock limits.
 */
export async function getBasket(): Promise<BasketSummary> {
  let rawItems: { productId: string; quantity: number }[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // 1. Fetch user's database basket
      const { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (basket) {
        const { data: dbItems } = await supabase
          .from("basket_items")
          .select("product_id, quantity")
          .eq("basket_id", basket.id);

        if (dbItems) {
          rawItems = dbItems.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
          }));
        }
      }
    } else {
      // 2. Guest shopper: read from Supabase guest basket first, then cookie fallback
      const guestToken = await getExistingGuestToken();
      if (guestToken) {
        const { data: guestBasket } = await supabase
          .from("baskets")
          .select("id")
          .eq("guest_token", guestToken)
          .maybeSingle();

        if (guestBasket) {
          const { data: dbItems } = await supabase
            .from("basket_items")
            .select("product_id, quantity")
            .eq("basket_id", guestBasket.id);

          if (dbItems && dbItems.length > 0) {
            rawItems = dbItems.map((item) => ({
              productId: item.product_id,
              quantity: item.quantity,
            }));
          }
        }
      }

      if (rawItems.length === 0) {
        rawItems = await getGuestCookieItems();
      }
    }
  } catch {
    // Database offline or unconfigured: read from cookie
    rawItems = await getGuestCookieItems();
  }

  // Populate product details & compute trusted line totals
  const productMap = await resolveProductsForBasket(rawItems.map((r) => r.productId));
  const items: BasketItem[] = [];
  let subtotal = 0;
  let itemCount = 0;
  let hasAgeRestrictedItems = false;

  for (const raw of rawItems) {
    if (raw.quantity <= 0) continue;

    const product = productMap.get(raw.productId);
    if (!product || !product.is_available) continue;

    // Clamp quantity to available stock
    const safeQuantity = Math.min(raw.quantity, Math.max(1, product.stock_quantity));
    const lineTotal = product.price * safeQuantity;

    subtotal += lineTotal;
    itemCount += safeQuantity;
    if (product.is_age_restricted) {
      hasAgeRestrictedItems = true;
    }

    items.push({
      productId: product.id,
      quantity: safeQuantity,
      product,
      lineTotal,
    });
  }

  const FREE_DELIVERY_THRESHOLD = 25.0;
  const qualifiesForFreeDeliveryWithin1Mile = subtotal > FREE_DELIVERY_THRESHOLD;
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  return {
    items,
    itemCount,
    subtotal: Math.round(subtotal * 100) / 100,
    hasAgeRestrictedItems,
    qualifiesForFreeDeliveryWithin1Mile,
    amountNeededForFreeDelivery: Math.round(amountNeededForFreeDelivery * 100) / 100,
  };
}

/**
 * Adds an item to the basket or increments its quantity.
 */
export async function addToBasket(productId: string, quantity: number = 1): Promise<void> {
  const currentItems = await getGuestCookieItems();
  const existingIndex = currentItems.findIndex((item) => item.productId === productId);

  if (existingIndex > -1) {
    currentItems[existingIndex].quantity += quantity;
  } else {
    currentItems.push({ productId, quantity });
  }

  await setGuestCookieItems(currentItems);

  // Sync to Supabase database (for both signed-in users and guest shoppers)
  if (!UUID_REGEX.test(productId)) return;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let basketId: string | null = null;

    if (user) {
      let { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!basket) {
        const { data: newBasket } = await supabase
          .from("baskets")
          .insert({ profile_id: user.id })
          .select("id")
          .single();
        basket = newBasket;
      }
      basketId = basket?.id ?? null;
    } else {
      const guestToken = await getOrCreateGuestToken();
      let { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("guest_token", guestToken)
        .maybeSingle();

      if (!basket) {
        const { data: newBasket } = await supabase
          .from("baskets")
          .insert({ guest_token: guestToken })
          .select("id")
          .single();
        basket = newBasket;
      }
      basketId = basket?.id ?? null;
    }

    if (basketId) {
      const { data: existing } = await supabase
        .from("basket_items")
        .select("id, quantity")
        .eq("basket_id", basketId)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("basket_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
      } else {
        await supabase.from("basket_items").insert({
          basket_id: basketId,
          product_id: productId,
          quantity,
        });
      }
    }
  } catch {
    // Cookie was updated, so offline mode is preserved
  }
}

/**
 * Updates the quantity of a specific product in the basket.
 */
export async function updateBasketQuantity(productId: string, quantity: number): Promise<void> {
  let currentItems = await getGuestCookieItems();

  if (quantity <= 0) {
    currentItems = currentItems.filter((i) => i.productId !== productId);
  } else {
    const item = currentItems.find((i) => i.productId === productId);
    if (item) {
      item.quantity = quantity;
    } else {
      currentItems.push({ productId, quantity });
    }
  }

  await setGuestCookieItems(currentItems);

  if (!UUID_REGEX.test(productId)) return;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let basketId: string | null = null;
    if (user) {
      const { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      basketId = basket?.id ?? null;
    } else {
      const guestToken = await getExistingGuestToken();
      if (guestToken) {
        const { data: basket } = await supabase
          .from("baskets")
          .select("id")
          .eq("guest_token", guestToken)
          .maybeSingle();
        basketId = basket?.id ?? null;
      }
    }

    if (basketId) {
      if (quantity <= 0) {
        await supabase
          .from("basket_items")
          .delete()
          .eq("basket_id", basketId)
          .eq("product_id", productId);
      } else {
        await supabase
          .from("basket_items")
          .upsert(
            {
              basket_id: basketId,
              product_id: productId,
              quantity,
            },
            { onConflict: "basket_id,product_id" }
          );
      }
    }
  } catch {
    // Cookie updated
  }
}

/**
 * Removes an item from the basket.
 */
export async function removeFromBasket(productId: string): Promise<void> {
  await updateBasketQuantity(productId, 0);
}

/**
 * Clears all items from the basket (e.g. after successful checkout).
 */
export async function clearBasket(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_BASKET_COOKIE);

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let basketId: string | null = null;
    if (user) {
      const { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      basketId = basket?.id ?? null;
    } else {
      const guestToken = await getExistingGuestToken();
      if (guestToken) {
        const { data: basket } = await supabase
          .from("baskets")
          .select("id")
          .eq("guest_token", guestToken)
          .maybeSingle();
        basketId = basket?.id ?? null;
      }
    }

    if (basketId) {
      await supabase.from("basket_items").delete().eq("basket_id", basketId);
    }
  } catch {
    // Cookie cleared
  }
}

