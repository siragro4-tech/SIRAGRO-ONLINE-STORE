import { createAdminClient } from "@/lib/supabase/admin";
import {
  MOBILE_GUEST_TOKEN_HEADER,
  getAuthenticatedMobileUser,
  hydrateMobileBasket,
  isSupabaseAdminConfigured,
  jsonNoStore,
  serializeMobileProduct,
} from "@/lib/mobile-api";
import {
  requireGuestSigningSecret,
  verifySignedGuestToken,
} from "@/lib/guest-basket";

/**
 * Safely merges a verified guest basket into the authenticated user's basket on the server.
 * Never trusts an unsigned client-supplied UUID.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedMobileUser(request);
  if (!user) {
    return jsonNoStore({ error: "Authentication required to merge baskets." }, 401);
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore({ error: "Server database configuration is incomplete." }, 503);
  }

  const rawGuestToken = request.headers.get(MOBILE_GUEST_TOKEN_HEADER);
  if (!rawGuestToken) {
    return jsonNoStore({ merged: false, reason: "No guest token provided." });
  }

  const secretResult = requireGuestSigningSecret();
  if (!secretResult.ok) {
    return jsonNoStore({ error: secretResult.error }, 503);
  }

  const guestTokenId = verifySignedGuestToken(rawGuestToken, secretResult.secret);
  if (!guestTokenId) {
    return jsonNoStore({ error: "Invalid guest session token." }, 401);
  }

  const admin = createAdminClient();

  // Merge guest items into user basket on the server
  const { data: guestBasket } = await admin
    .from("baskets")
    .select("id")
    .eq("guest_token", guestTokenId)
    .is("profile_id", null)
    .maybeSingle();

  if (guestBasket) {
    const { data: guestItems } = await admin
      .from("basket_items")
      .select("product_id, quantity")
      .eq("basket_id", guestBasket.id);

    if (guestItems && guestItems.length > 0) {
      let { data: userBasket } = await admin
        .from("baskets")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!userBasket) {
        const { data: created } = await admin
          .from("baskets")
          .insert({ profile_id: user.id })
          .select("id")
          .single();
        userBasket = created;
      }

      if (userBasket) {
        for (const gItem of guestItems) {
          const { data: existing } = await admin
            .from("basket_items")
            .select("id, quantity")
            .eq("basket_id", userBasket.id)
            .eq("product_id", gItem.product_id)
            .maybeSingle();

          if (existing) {
            await admin
              .from("basket_items")
              .update({
                quantity: Math.min(20, existing.quantity + gItem.quantity),
              })
              .eq("id", existing.id);
          } else {
            await admin.from("basket_items").insert({
              basket_id: userBasket.id,
              product_id: gItem.product_id,
              quantity: Math.min(20, Math.max(1, gItem.quantity)),
            });
          }
        }
      }
    }

    await admin.from("baskets").delete().eq("id", guestBasket.id);
  }

  // Return updated authenticated basket
  const { data: finalBasket } = await admin
    .from("baskets")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: rows } = finalBasket
    ? await admin
        .from("basket_items")
        .select("product_id, quantity")
        .eq("basket_id", finalBasket.id)
    : { data: [] };

  const summary = await hydrateMobileBasket(
    (rows || []).map((r) => ({ productId: r.product_id, quantity: r.quantity }))
  );

  return jsonNoStore({
    merged: true,
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
