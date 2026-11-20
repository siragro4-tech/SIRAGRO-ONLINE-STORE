import { createAdminClient } from "@/lib/supabase/admin";
import {
  MOBILE_GUEST_TOKEN_HEADER,
  getAuthenticatedMobileUser,
  hydrateMobileBasket,
  isSupabaseAdminConfigured,
  jsonNoStore,
  mutateMobileGuestAdd,
  serializeMobileProduct,
} from "@/lib/mobile-api";

export async function POST(request: Request) {
  let body: { productId?: string; quantity?: number } = {};
  try {
    body = (await request.json()) as { productId?: string; quantity?: number };
  } catch {
    return jsonNoStore({ error: "Invalid JSON body." }, 400);
  }

  const productId = body.productId?.trim();
  const quantity = Math.max(1, Math.min(20, Math.floor(Number(body.quantity) || 1)));

  if (!productId) {
    return jsonNoStore({ error: "productId is required." }, 400);
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore({ error: "Server database configuration is incomplete." }, 503);
  }

  // Validate product exists, is available, and has stock on the server
  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, name, is_available, stock_quantity")
    .eq("id", productId)
    .maybeSingle();

  if (!product || !product.is_available || product.stock_quantity <= 0) {
    return jsonNoStore(
      { error: "This item is currently unavailable or out of stock." },
      400
    );
  }

  const user = await getAuthenticatedMobileUser(request);

  if (user) {
    let { data: basket } = await admin
      .from("baskets")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!basket) {
      const { data: created } = await admin
        .from("baskets")
        .insert({ profile_id: user.id })
        .select("id")
        .single();
      basket = created;
    }

    if (!basket) {
      return jsonNoStore({ error: "Unable to create user basket." }, 500);
    }

    const { data: existingItem } = await admin
      .from("basket_items")
      .select("id, quantity")
      .eq("basket_id", basket.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingItem) {
      await admin
        .from("basket_items")
        .update({ quantity: Math.min(20, existingItem.quantity + quantity) })
        .eq("id", existingItem.id);
    } else {
      await admin.from("basket_items").insert({
        basket_id: basket.id,
        product_id: productId,
        quantity,
      });
    }

    const { data: rows } = await admin
      .from("basket_items")
      .select("product_id, quantity")
      .eq("basket_id", basket.id);

    const summary = await hydrateMobileBasket(
      (rows || []).map((r) => ({ productId: r.product_id, quantity: r.quantity }))
    );

    return jsonNoStore({
      mode: "user",
      basket: {
        ...summary,
        items: summary.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          product: serializeMobileProduct(item.product as unknown as Record<string, unknown>),
        })),
      },
    });
  }

  // Guest basket flow
  const rawToken = request.headers.get(MOBILE_GUEST_TOKEN_HEADER);
  const res = await mutateMobileGuestAdd(rawToken, productId, quantity);
  if (!res.ok) {
    return jsonNoStore({ error: res.error }, res.status);
  }

  const summary = await hydrateMobileBasket(res.items);
  return jsonNoStore(
    {
      mode: "guest",
      guestToken: res.issuedToken ?? rawToken,
      basket: {
        ...summary,
        items: summary.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          product: serializeMobileProduct(item.product as unknown as Record<string, unknown>),
        })),
      },
    },
    200,
    res.issuedToken ? { [MOBILE_GUEST_TOKEN_HEADER]: res.issuedToken } : undefined
  );
}
