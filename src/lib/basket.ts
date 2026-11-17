import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FALLBACK_PRODUCTS, type Product } from "@/lib/products";
import {
  GUEST_TOKEN_UUID_REGEX,
  addVerifiedGuestBasketItem,
  clearVerifiedGuestBasket,
  createSignedGuestToken,
  readVerifiedGuestBasket,
  requireGuestSigningSecret,
  updateVerifiedGuestBasketQuantity,
  verifySignedGuestToken,
  type GuestBasketStore,
} from "@/lib/guest-basket";

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
  error?: string;
};

export type BasketMutationResult = {
  success: boolean;
  error?: string;
};

function emptyBasketSummary(error?: string): BasketSummary {
  return {
    items: [],
    itemCount: 0,
    subtotal: 0,
    hasAgeRestrictedItems: false,
    qualifiesForFreeDeliveryWithin1Mile: false,
    amountNeededForFreeDelivery: 25.0,
    ...(error ? { error } : {}),
  };
}

/**
 * Returns raw items stored in guest cookie for verified guest sessions when DB is offline.
 */
async function getGuestCookieItems(): Promise<{ productId: string; quantity: number }[]> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(GUEST_BASKET_COOKIE)?.value;
  if (!rawCookie) return [];

  try {
    const parsed = JSON.parse(rawCookie);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves items to guest HttpOnly cookie.
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

const UUID_REGEX = GUEST_TOKEN_UUID_REGEX;

function canUseServerSupabaseAdmin(): boolean {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    hasUrl &&
      serviceKey &&
    serviceKey.trim() !== "" &&
    !serviceKey.includes("your-service-role")
  );
}

function createServerGuestBasketStore(): GuestBasketStore {
  const admin = createAdminClient();
  return {
    async findBasketIdByGuestToken(guestTokenId) {
      const { data } = await admin
        .from("baskets")
        .select("id")
        .eq("guest_token", guestTokenId)
        .is("profile_id", null)
        .maybeSingle();
      return data?.id ?? null;
    },
    async createBasketForGuestToken(guestTokenId) {
      const { data } = await admin
        .from("baskets")
        .insert({ guest_token: guestTokenId })
        .select("id")
        .single();
      return data?.id ?? null;
    },
    async listItems(basketId) {
      const { data } = await admin
        .from("basket_items")
        .select("product_id, quantity")
        .eq("basket_id", basketId);
      return (data || []).map((row) => ({
        productId: row.product_id,
        quantity: row.quantity,
      }));
    },
    async addOrIncrementItem(basketId, productId, quantity) {
      const { data: existing } = await admin
        .from("basket_items")
        .select("id, quantity")
        .eq("basket_id", basketId)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        await admin
          .from("basket_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
      } else {
        await admin.from("basket_items").insert({
          basket_id: basketId,
          product_id: productId,
          quantity,
        });
      }
    },
    async setItemQuantity(basketId, productId, quantity) {
      if (quantity <= 0) {
        await admin
          .from("basket_items")
          .delete()
          .eq("basket_id", basketId)
          .eq("product_id", productId);
      } else {
        await admin.from("basket_items").upsert(
          {
            basket_id: basketId,
            product_id: productId,
            quantity,
          },
          { onConflict: "basket_id,product_id" }
        );
      }
    },
    async clearItems(basketId) {
      await admin.from("basket_items").delete().eq("basket_id", basketId);
    },
  };
}

async function setSignedGuestTokenCookie(signedValue: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_TOKEN_COOKIE, signedValue, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

async function getAuthenticatedUserId(): Promise<{
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null;
  userId: string | null;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, userId: user?.id ?? null };
  } catch {
    return { supabase: null, userId: null };
  }
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
 *
 * - Authenticated users use RLS-scoped DB baskets (independent of GUEST_SESSION_SECRET).
 * - Guest shoppers require a valid dedicated GUEST_SESSION_SECRET.
 */
export async function getBasket(): Promise<BasketSummary> {
  const { supabase, userId } = await getAuthenticatedUserId();
  let rawItems: { productId: string; quantity: number }[] = [];

  if (userId && supabase) {
    try {
      const { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", userId)
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
    } catch {
      return emptyBasketSummary(
        "Unable to load your shopping basket right now. Please try again."
      );
    }
  } else {
    // Guest shopper: dedicated GUEST_SESSION_SECRET is mandatory
    const secretCheck = requireGuestSigningSecret();
    if (!secretCheck.ok) {
      console.warn(
        "[Basket] Guest basket read blocked: dedicated GUEST_SESSION_SECRET is missing or weak."
      );
      return emptyBasketSummary(secretCheck.error);
    }

    const cookieStore = await cookies();
    const rawSignedToken = cookieStore.get(GUEST_TOKEN_COOKIE)?.value;
    const verifiedToken = verifySignedGuestToken(rawSignedToken, secretCheck.secret);

    if (rawSignedToken && !verifiedToken) {
      // Reject tampered or unsigned guest session cookies without returning cookie items
      return emptyBasketSummary();
    }

    if (verifiedToken && canUseServerSupabaseAdmin()) {
      try {
        const readRes = await readVerifiedGuestBasket(
          rawSignedToken,
          secretCheck.secret,
          createServerGuestBasketStore()
        );
        if (readRes.ok && readRes.items.length > 0) {
          rawItems = readRes.items;
        }
      } catch {
        // Fall back safely to HttpOnly cookie items below when verified
      }
    }

    if (rawItems.length === 0 && verifiedToken) {
      rawItems = await getGuestCookieItems();
    }
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
export async function addToBasket(
  productId: string,
  quantity: number = 1
): Promise<BasketMutationResult> {
  const { supabase, userId } = await getAuthenticatedUserId();

  // 1. Authenticated user path (RLS-scoped; independent of GUEST_SESSION_SECRET)
  if (userId && supabase) {
    if (!UUID_REGEX.test(productId)) {
      return {
        success: false,
        error: "Invalid product identifier.",
      };
    }

    try {
      let { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (!basket) {
        const { data: newBasket, error: createErr } = await supabase
          .from("baskets")
          .insert({ profile_id: userId })
          .select("id")
          .single();
        if (createErr) {
          return { success: false, error: "Could not initialize user basket." };
        }
        basket = newBasket;
      }

      if (!basket?.id) {
        return { success: false, error: "Could not resolve user basket." };
      }

      const { data: existing } = await supabase
        .from("basket_items")
        .select("id, quantity")
        .eq("basket_id", basket.id)
        .eq("product_id", productId)
        .maybeSingle();

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

      return { success: true };
    } catch {
      return { success: false, error: "Could not add item to your basket." };
    }
  }

  // 2. Guest shopper path (dedicated strong GUEST_SESSION_SECRET required)
  const secretCheck = requireGuestSigningSecret();
  if (!secretCheck.ok) {
    console.warn(
      "[Basket] Guest addToBasket rejected: dedicated GUEST_SESSION_SECRET is missing or weak."
    );
    return { success: false, error: secretCheck.error };
  }

  const cookieStore = await cookies();
  let rawSignedToken = cookieStore.get(GUEST_TOKEN_COOKIE)?.value;
  let verifiedToken = verifySignedGuestToken(rawSignedToken, secretCheck.secret);

  // If the guest had no valid signed token yet (or an invalid one), start a clean signed session
  let currentCookieItems = verifiedToken ? await getGuestCookieItems() : [];

  if (!verifiedToken) {
    const created = createSignedGuestToken(secretCheck.secret);
    rawSignedToken = created.signedCookieValue;
    verifiedToken = created.tokenId;
    await setSignedGuestTokenCookie(created.signedCookieValue);
  }

  const existingIndex = currentCookieItems.findIndex(
    (item) => item.productId === productId
  );
  if (existingIndex > -1) {
    currentCookieItems[existingIndex].quantity += quantity;
  } else {
    currentCookieItems = [...currentCookieItems, { productId, quantity }];
  }
  await setGuestCookieItems(currentCookieItems);

  if (UUID_REGEX.test(productId) && canUseServerSupabaseAdmin()) {
    try {
      const addRes = await addVerifiedGuestBasketItem({
        cookieValue: rawSignedToken,
        secret: secretCheck.secret,
        store: createServerGuestBasketStore(),
        productId,
        quantity,
      });
      if (!addRes.ok) {
        return { success: false, error: addRes.error };
      }
      if (addRes.newSignedCookie) {
        await setSignedGuestTokenCookie(addRes.newSignedCookie);
      }
    } catch {
      // Signed cookie fallback already persisted cleanly
    }
  }

  return { success: true };
}

/**
 * Updates the quantity of a specific product in the basket.
 */
export async function updateBasketQuantity(
  productId: string,
  quantity: number
): Promise<BasketMutationResult> {
  const { supabase, userId } = await getAuthenticatedUserId();

  // 1. Authenticated user path
  if (userId && supabase) {
    if (!UUID_REGEX.test(productId)) {
      return { success: false, error: "Invalid product identifier." };
    }

    try {
      const { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (basket?.id) {
        if (quantity <= 0) {
          await supabase
            .from("basket_items")
            .delete()
            .eq("basket_id", basket.id)
            .eq("product_id", productId);
        } else {
          await supabase
            .from("basket_items")
            .upsert(
              {
                basket_id: basket.id,
                product_id: productId,
                quantity,
              },
              { onConflict: "basket_id,product_id" }
            );
        }
      }
      return { success: true };
    } catch {
      return { success: false, error: "Could not update basket quantity." };
    }
  }

  // 2. Guest shopper path
  const secretCheck = requireGuestSigningSecret();
  if (!secretCheck.ok) {
    console.warn(
      "[Basket] Guest updateBasketQuantity rejected: dedicated GUEST_SESSION_SECRET is missing or weak."
    );
    return { success: false, error: secretCheck.error };
  }

  const cookieStore = await cookies();
  const rawSignedToken = cookieStore.get(GUEST_TOKEN_COOKIE)?.value;
  const verifiedToken = verifySignedGuestToken(rawSignedToken, secretCheck.secret);
  if (!verifiedToken) {
    return {
      success: false,
      error: "Guest session is missing or invalid. Please add an item again.",
    };
  }

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

  if (UUID_REGEX.test(productId) && canUseServerSupabaseAdmin()) {
    try {
      await updateVerifiedGuestBasketQuantity({
        cookieValue: rawSignedToken,
        secret: secretCheck.secret,
        store: createServerGuestBasketStore(),
        productId,
        quantity,
      });
    } catch {
      // Signed cookie state updated cleanly
    }
  }

  return { success: true };
}

/**
 * Removes an item from the basket.
 */
export async function removeFromBasket(
  productId: string
): Promise<BasketMutationResult> {
  return await updateBasketQuantity(productId, 0);
}

/**
 * Clears all items from the basket (e.g. after successful checkout).
 */
export async function clearBasket(): Promise<BasketMutationResult> {
  const { supabase, userId } = await getAuthenticatedUserId();

  // 1. Authenticated user path
  if (userId && supabase) {
    try {
      const { data: basket } = await supabase
        .from("baskets")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (basket?.id) {
        await supabase.from("basket_items").delete().eq("basket_id", basket.id);
      }
      return { success: true };
    } catch {
      return { success: false, error: "Could not clear your basket." };
    }
  }

  // 2. Guest shopper path
  const secretCheck = requireGuestSigningSecret();
  if (!secretCheck.ok) {
    console.warn(
      "[Basket] Guest clearBasket rejected: dedicated GUEST_SESSION_SECRET is missing or weak."
    );
    return { success: false, error: secretCheck.error };
  }

  const cookieStore = await cookies();
  const rawSignedToken = cookieStore.get(GUEST_TOKEN_COOKIE)?.value;
  const verifiedToken = verifySignedGuestToken(rawSignedToken, secretCheck.secret);
  if (!verifiedToken) {
    cookieStore.delete(GUEST_BASKET_COOKIE);
    return { success: false, error: "Guest session is missing or invalid." };
  }

  cookieStore.delete(GUEST_BASKET_COOKIE);

  if (canUseServerSupabaseAdmin()) {
    try {
      await clearVerifiedGuestBasket({
        cookieValue: rawSignedToken,
        secret: secretCheck.secret,
        store: createServerGuestBasketStore(),
      });
    } catch {
      // Cookie cleared cleanly
    }
  }

  return { success: true };
}
