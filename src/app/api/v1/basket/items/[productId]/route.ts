import { createAdminClient } from "@/lib/supabase/admin";
import {
  MOBILE_GUEST_TOKEN_HEADER,
  getAuthenticatedMobileUser,
  hydrateMobileBasket,
  isSupabaseAdminConfigured,
  jsonNoStore,
  mutateMobileGuestSetQty,
  serializeMobileProduct,
} from "@/lib/mobile-api";

async function handleSetQuantity(
  request: Request,
  productId: string,
  quantity: number
) {
  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore({ error: "Server database configuration is incomplete." }, 503);
  }

  const user = await getAuthenticatedMobileUser(request);

  if (user) {
    const admin = createAdminClient();
    const { data: basket } = await admin
      .from("baskets")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!basket) {
      return jsonNoStore({
        mode: "user",
        basket: await hydrateMobileBasket([]),
      });
    }

    if (quantity <= 0) {
      await admin
        .from("basket_items")
        .delete()
        .eq("basket_id", basket.id)
        .eq("product_id", productId);
    } else {
      const clamped = Math.min(20, quantity);
      await admin
        .from("basket_items")
        .update({ quantity: clamped })
        .eq("basket_id", basket.id)
        .eq("product_id", productId);
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

  const rawToken = request.headers.get(MOBILE_GUEST_TOKEN_HEADER);
  const res = await mutateMobileGuestSetQty(rawToken, productId, quantity);
  if (!res.ok) {
    return jsonNoStore({ error: res.error }, res.status);
  }

  const summary = await hydrateMobileBasket(res.items);
  return jsonNoStore({
    mode: "guest",
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;
  let body: { quantity?: number } = {};
  try {
    body = (await request.json()) as { quantity?: number };
  } catch {
    return jsonNoStore({ error: "Invalid JSON body." }, 400);
  }

  const quantity = Math.floor(Number(body.quantity ?? 0));
  return handleSetQuantity(request, productId, quantity);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;
  return handleSetQuantity(request, productId, 0);
}
