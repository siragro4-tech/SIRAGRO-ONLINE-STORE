import type { BasketSummary } from "@/lib/basket";
import { jsonNoStore, resolveMobileBasket, serializeMobileProduct } from "@/lib/mobile-api";

function serializeBasketResponse(summary: BasketSummary) {
  return {
    items: summary.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      product: serializeMobileProduct(item.product as unknown as Record<string, unknown>),
    })),
    itemCount: summary.itemCount,
    subtotal: summary.subtotal,
    hasAgeRestrictedItems: summary.hasAgeRestrictedItems,
    qualifiesForFreeDeliveryWithin1Mile: summary.qualifiesForFreeDeliveryWithin1Mile,
    amountNeededForFreeDelivery: summary.amountNeededForFreeDelivery,
    error: summary.error ?? null,
  };
}

export async function GET(request: Request) {
  const res = await resolveMobileBasket(request);
  if ("error" in res) {
    return jsonNoStore({ error: res.error }, res.status);
  }

  return jsonNoStore({
    mode: res.mode,
    basket: serializeBasketResponse(res.summary),
  });
}
