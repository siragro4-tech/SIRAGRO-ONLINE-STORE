import { calculateDeliveryCharge, getFulfilmentAvailability } from "@/lib/delivery";
import { jsonNoStore, resolveMobileBasket } from "@/lib/mobile-api";

export async function GET() {
  const availability = await getFulfilmentAvailability();
  return jsonNoStore({ fulfilment: availability });
}

export async function POST(request: Request) {
  let body: { fulfilmentType?: string; postcode?: string } = {};
  try {
    body = (await request.json()) as { fulfilmentType?: string; postcode?: string };
  } catch {
    return jsonNoStore({ error: "Invalid JSON body." }, 400);
  }

  const fulfilmentType = body.fulfilmentType;
  if (fulfilmentType !== "delivery" && fulfilmentType !== "collection") {
    return jsonNoStore(
      { error: "fulfilmentType must be 'delivery' or 'collection'." },
      400
    );
  }

  // Always compute subtotal on the server from the caller's verified basket
  const basketRes = await resolveMobileBasket(request);
  if ("error" in basketRes) {
    return jsonNoStore({ error: basketRes.error }, basketRes.status);
  }

  const result = await calculateDeliveryCharge({
    fulfilmentType,
    postcode: body.postcode,
    subtotal: basketRes.summary.subtotal,
  });

  return jsonNoStore({
    calculation: result,
    subtotal: basketRes.summary.subtotal,
    total: Math.round((basketRes.summary.subtotal + result.deliveryFee) * 100) / 100,
  });
}
