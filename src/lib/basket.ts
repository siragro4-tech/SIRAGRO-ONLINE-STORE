import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FALLBACK_PRODUCTS, type Product } from "@/lib/products";

export const GUEST_BASKET_COOKIE = "siragro_guest_basket";

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
        .single();

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
      // 2. Guest shopper: read from secure cookie
      rawItems = await getGuestCookieItems();
    }
  } catch {
    // Database offline or unconfigured: read from cookie
    rawItems = await getGuestCookieItems();
  }

  // Populate product details & compute trusted line totals
  const items: BasketItem[] = [];
  let subtotal = 0;
  let itemCount = 0;
  let hasAgeRestrictedItems = false;

  for (const raw of rawItems) {
    if (raw.quantity <= 0) continue;

    // Find product from static list or database
    const product = FALLBACK_PRODUCTS.find((p) => p.id === raw.productId || p.slug === raw.productId);
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

  // If user is authenticated, sync to database
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      let { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!basket) {
        const { data: newBasket } = await supabase
          .from("baskets")
          .insert({ profile_id: user.id })
          .select("id")
          .single();
        basket = newBasket;
      }

      if (basket) {
        const { data: existing } = await supabase
          .from("basket_items")
          .select("id, quantity")
          .eq("basket_id", basket.id)
          .eq("product_id", productId)
          .single();

        if (existing) {
          await supabase
            .from("basket_items")
            .update({ quantity: existing.quantity + quantity })
            .eq("id", existing.id);
        } else {
          await supabase.from("basket_items").insert({
            basket_id: basket.id,
            product_id: productId,
            quantity,
          });
        }
      }
    }
  } catch {
    // Cookie was updated, so guest/offline mode is preserved
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

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (basket) {
        if (quantity <= 0) {
          await supabase
            .from("basket_items")
            .delete()
            .eq("basket_id", basket.id)
            .eq("product_id", productId);
        } else {
          await supabase
            .from("basket_items")
            .upsert({
              basket_id: basket.id,
              product_id: productId,
              quantity,
            });
        }
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

    if (user) {
      const { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (basket) {
        await supabase.from("basket_items").delete().eq("basket_id", basket.id);
      }
    }
  } catch {
    // Cookie cleared
  }
}

