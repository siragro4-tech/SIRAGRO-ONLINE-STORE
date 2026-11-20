import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedMobileUser,
  isSupabaseAdminConfigured,
  jsonNoStore,
} from "@/lib/mobile-api";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedMobileUser(request);
  if (!user) {
    return jsonNoStore({ error: "Authentication required." }, 401);
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore({ error: "Server database configuration is incomplete." }, 503);
  }

  const { id } = await context.params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, payment_status, fulfilment_type, delivery_address, subtotal, delivery_charge, total, estimated_delivery_at, created_at"
    )
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    return jsonNoStore({ error: "Unable to load order details right now." }, 500);
  }

  if (!order) {
    return jsonNoStore({ error: "Order not found." }, 404);
  }

  const { data: itemRows } = await admin
    .from("order_items")
    .select("id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total")
    .eq("order_id", order.id);

  return jsonNoStore({
    order: {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      fulfilmentType: order.fulfilment_type,
      deliveryAddress: order.delivery_address,
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.delivery_charge),
      total: Number(order.total),
      estimatedDeliveryAt: order.estimated_delivery_at,
      createdAt: order.created_at,
      items: (itemRows ?? []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name_snapshot,
        unitPrice: Number(item.unit_price_snapshot),
        quantity: item.quantity,
        lineTotal: Number(item.line_total),
      })),
    },
  });
}
