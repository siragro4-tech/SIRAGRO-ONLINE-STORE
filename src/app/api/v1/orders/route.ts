import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedMobileUser,
  isSupabaseAdminConfigured,
  jsonNoStore,
} from "@/lib/mobile-api";

export async function GET(request: Request) {
  const user = await getAuthenticatedMobileUser(request);
  if (!user) {
    return jsonNoStore({ error: "Authentication required." }, 401);
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonNoStore({ error: "Server database configuration is incomplete." }, 503);
  }

  const admin = createAdminClient();
  const { data: orders, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, payment_status, fulfilment_type, subtotal, delivery_charge, total, created_at"
    )
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return jsonNoStore({ error: "Unable to load orders right now." }, 500);
  }

  const orderIds = (orders ?? []).map((o) => o.id);
  const itemsByOrder = new Map<
    string,
    Array<{
      id: string;
      productId: string | null;
      name: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }>
  >();

  if (orderIds.length > 0) {
    const { data: itemRows } = await admin
      .from("order_items")
      .select("id, order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total")
      .in("order_id", orderIds);

    for (const row of itemRows ?? []) {
      const list = itemsByOrder.get(row.order_id) ?? [];
      list.push({
        id: row.id,
        productId: row.product_id,
        name: row.product_name_snapshot,
        unitPrice: Number(row.unit_price_snapshot),
        quantity: row.quantity,
        lineTotal: Number(row.line_total),
      });
      itemsByOrder.set(row.order_id, list);
    }
  }

  return jsonNoStore({
    orders: (orders ?? []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      fulfilmentType: o.fulfilment_type,
      subtotal: Number(o.subtotal),
      deliveryCharge: Number(o.delivery_charge),
      total: Number(o.total),
      createdAt: o.created_at,
      items: itemsByOrder.get(o.id) ?? [],
    })),
  });
}
