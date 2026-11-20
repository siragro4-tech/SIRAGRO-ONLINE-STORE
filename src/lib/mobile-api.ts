import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  readVerifiedGuestBasket,
  addVerifiedGuestBasketItem,
  updateVerifiedGuestBasketQuantity,
  requireGuestSigningSecret,
  type GuestBasketLineItem,
  type GuestBasketStore,
} from "@/lib/guest-basket";
import { getProductImageUrl } from "@/lib/product-image";
import type { Product } from "@/lib/products";
import type { BasketItem, BasketSummary } from "@/lib/basket";

export const MOBILE_GUEST_TOKEN_HEADER = "x-siragro-guest-token";

export function jsonNoStore(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...extraHeaders,
    },
  });
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      anon &&
      !url.includes("your-project") &&
      !anon.includes("your-anon-key")
  );
}

export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    url &&
      serviceKey &&
      serviceKey.trim() !== "" &&
      !serviceKey.includes("your-service-role")
  );
}

/**
 * Extracts and verifies a Supabase user from the `Authorization: Bearer <jwt>` header.
 * Returns null if missing or invalid.
 */
export async function getAuthenticatedMobileUser(request: Request): Promise<{
  id: string;
  email: string;
} | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email || "",
  };
}

/**
 * Creates a server-side GuestBasketStore backed by Supabase service_role.
 */
export function createMobileGuestBasketStore(): GuestBasketStore {
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
          .update({ quantity: Math.min(20, existing.quantity + quantity) })
          .eq("id", existing.id);
      } else {
        await admin.from("basket_items").insert({
          basket_id: basketId,
          product_id: productId,
          quantity: Math.min(20, Math.max(1, quantity)),
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
        const clamped = Math.min(20, quantity);
        const { data: existing } = await admin
          .from("basket_items")
          .select("id")
          .eq("basket_id", basketId)
          .eq("product_id", productId)
          .maybeSingle();

        if (existing) {
          await admin
            .from("basket_items")
            .update({ quantity: clamped })
            .eq("id", existing.id);
        } else {
          await admin.from("basket_items").insert({
            basket_id: basketId,
            product_id: productId,
            quantity: clamped,
          });
        }
      }
    },
    async clearItems(basketId) {
      await admin.from("basket_items").delete().eq("basket_id", basketId);
    },
  };
}

/**
 * Hydrates raw productId+quantity pairs into a server-authoritative BasketSummary
 * using current database prices, availability, and image URLs.
 */
export async function hydrateMobileBasket(
  rawItems: GuestBasketLineItem[]
): Promise<BasketSummary> {
  if (rawItems.length === 0) {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      hasAgeRestrictedItems: false,
      qualifiesForFreeDeliveryWithin1Mile: false,
      amountNeededForFreeDelivery: 25.0,
    };
  }

  const admin = createAdminClient();
  const productIds = rawItems.map((i) => i.productId);

  const { data: dbProducts, error } = await admin
    .from("products")
    .select(
      `
      *,
      category:categories(id, name, slug, icon, sort_order, is_active),
      images:product_images(id, storage_path, alt_text, is_primary, sort_order)
    `
    )
    .in("id", productIds);

  if (error || !dbProducts) {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      hasAgeRestrictedItems: false,
      qualifiesForFreeDeliveryWithin1Mile: false,
      amountNeededForFreeDelivery: 25.0,
      error: "Unable to verify current product prices from the server.",
    };
  }

  const productMap = new Map<string, Product>();
  for (const row of dbProducts) {
    productMap.set(row.id, row as unknown as Product);
  }

  const items: BasketItem[] = [];
  let itemCount = 0;
  let subtotal = 0;
  let hasAgeRestrictedItems = false;

  for (const raw of rawItems) {
    const product = productMap.get(raw.productId);
    if (!product || !product.is_available) continue;

    const unitPrice = Number(product.price);
    const qty = Math.min(20, Math.max(1, raw.quantity));
    const lineTotal = Math.round(unitPrice * qty * 100) / 100;

    items.push({
      productId: raw.productId,
      quantity: qty,
      product,
      lineTotal,
    });

    itemCount += qty;
    subtotal += lineTotal;
    if (product.is_age_restricted) {
      hasAgeRestrictedItems = true;
    }
  }

  subtotal = Math.round(subtotal * 100) / 100;
  const freeThreshold = 25.0;
  const qualifiesForFreeDeliveryWithin1Mile = subtotal > freeThreshold;
  const amountNeededForFreeDelivery = qualifiesForFreeDeliveryWithin1Mile
    ? 0
    : Math.round((freeThreshold + 0.01 - subtotal) * 100) / 100;

  return {
    items,
    itemCount,
    subtotal,
    hasAgeRestrictedItems,
    qualifiesForFreeDeliveryWithin1Mile,
    amountNeededForFreeDelivery,
  };
}

/**
 * Serializes a Product row for the mobile JSON API, resolving public image URLs.
 */
export function serializeMobileProduct(product: Record<string, unknown>) {
  const imagesRaw = Array.isArray(product.images)
    ? (product.images as Array<{
        id: string;
        storage_path: string;
        alt_text?: string | null;
        is_primary?: boolean;
        sort_order?: number;
      }>)
    : [];

  const sortedImages = [...imagesRaw].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  const imageUrls = sortedImages
    .map((img) => ({
      id: img.id,
      url: getProductImageUrl(img.storage_path),
      altText: img.alt_text ?? null,
      isPrimary: Boolean(img.is_primary),
    }))
    .filter((img) => Boolean(img.url));

  const primary = imageUrls.find((i) => i.isPrimary) ?? imageUrls[0] ?? null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? null,
    price: Number(product.price),
    compareAtPrice:
      product.compare_at_price != null ? Number(product.compare_at_price) : null,
    unit: product.unit ?? null,
    brand: product.brand ?? null,
    stockQuantity: Number(product.stock_quantity ?? 0),
    isAvailable: Boolean(product.is_available),
    isFeatured: Boolean(product.is_featured),
    isAgeRestricted: Boolean(product.is_age_restricted),
    minimumAge: Number(product.minimum_age ?? 18),
    category: product.category ?? null,
    primaryImageUrl: primary?.url ?? null,
    images: imageUrls,
  };
}

/**
 * Resolves the mobile caller's basket (either authenticated user or verified guest token).
 */
export async function resolveMobileBasket(request: Request) {
  const user = await getAuthenticatedMobileUser(request);

  if (user) {
    if (!isSupabaseAdminConfigured()) {
      return { error: "Server database configuration is incomplete.", status: 503 as const };
    }
    const admin = createAdminClient();
    const { data: basket } = await admin
      .from("baskets")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!basket) {
      return {
        mode: "user" as const,
        userId: user.id,
        basketId: null,
        summary: await hydrateMobileBasket([]),
      };
    }

    const { data: rows } = await admin
      .from("basket_items")
      .select("product_id, quantity")
      .eq("basket_id", basket.id);

    const rawItems: GuestBasketLineItem[] = (rows || []).map((r) => ({
      productId: r.product_id,
      quantity: r.quantity,
    }));

    return {
      mode: "user" as const,
      userId: user.id,
      basketId: basket.id,
      summary: await hydrateMobileBasket(rawItems),
    };
  }

  // Guest basket requires dedicated GUEST_SESSION_SECRET and signed token
  const secretResult = requireGuestSigningSecret();
  if (!secretResult.ok) {
    return { error: secretResult.error, status: 503 as const };
  }

  if (!isSupabaseAdminConfigured()) {
    return { error: "Server database configuration is incomplete.", status: 503 as const };
  }

  const rawToken = request.headers.get(MOBILE_GUEST_TOKEN_HEADER);
  if (!rawToken) {
    return {
      mode: "guest" as const,
      guestTokenId: null,
      rawToken: null,
      secret: secretResult.secret,
      store: createMobileGuestBasketStore(),
      summary: await hydrateMobileBasket([]),
    };
  }

  const store = createMobileGuestBasketStore();

  const readRes = await readVerifiedGuestBasket(
    rawToken,
    secretResult.secret,
    store
  );

  if (!readRes.ok) {
    return {
      error: readRes.error,
      status: (readRes.code === "CONFIG_ERROR" ? 503 : 401) as 503 | 401,
    };
  }

  return {
    mode: "guest" as const,
    guestTokenId: readRes.tokenId,
    rawToken,
    secret: secretResult.secret,
    store,
    summary: await hydrateMobileBasket(readRes.items),
  };
}

export async function mutateMobileGuestAdd(
  rawToken: string | null,
  productId: string,
  quantity: number
) {
  const secretResult = requireGuestSigningSecret();
  if (!secretResult.ok) {
    return { ok: false as const, error: secretResult.error, status: 503 as const };
  }
  const store = createMobileGuestBasketStore();

  const addRes = await addVerifiedGuestBasketItem({
    cookieValue: rawToken,
    secret: secretResult.secret,
    store,
    productId,
    quantity,
  });

  if (!addRes.ok) {
    return { ok: false as const, error: addRes.error, status: 503 as const };
  }

  const basketId = await store.findBasketIdByGuestToken(addRes.tokenId);
  const items = basketId ? await store.listItems(basketId) : [];

  return {
    ok: true as const,
    issuedToken: addRes.newSignedCookie ?? null,
    items,
  };
}

export async function mutateMobileGuestSetQty(
  rawToken: string | null,
  productId: string,
  quantity: number
) {
  const secretResult = requireGuestSigningSecret();
  if (!secretResult.ok) {
    return { ok: false as const, error: secretResult.error, status: 503 as const };
  }
  const store = createMobileGuestBasketStore();

  const updRes = await updateVerifiedGuestBasketQuantity({
    cookieValue: rawToken,
    secret: secretResult.secret,
    store,
    productId,
    quantity,
  });

  if (!updRes.ok) {
    return {
      ok: false as const,
      error: updRes.error,
      status: (updRes.code === "CONFIG_ERROR" ? 503 : 400) as 503 | 400,
    };
  }

  const basketId = await store.findBasketIdByGuestToken(updRes.tokenId);
  const items = basketId ? await store.listItems(basketId) : [];

  return {
    ok: true as const,
    items,
  };
}
