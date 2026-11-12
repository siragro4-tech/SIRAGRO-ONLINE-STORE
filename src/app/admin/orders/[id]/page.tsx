import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OrderStatusManager } from "@/components/admin/OrderStatusManager";
import type { OrderStatus } from "@/app/admin/orders/actions";
import type { Database } from "@/types/database.types";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order Details #${id.slice(0, 8)}`,
  };
}

function formatLondonDateTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      dateStyle: "full",
      timeStyle: "medium",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id: orderId } = await params;
  const supabase = await createServerSupabaseClient();

  // 1. Verify admin role on server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/admin/orders/${orderId}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/admin/forbidden");
  }

  // 2. Fetch the order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    notFound();
  }

  // 3. Fetch line items (historical snapshots)
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  // 4. Fetch status history
  let statusHistory: Database["public"]["Tables"]["order_status_history"]["Row"][] = [];
  try {
    const { data: history } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    if (history) statusHistory = history;
  } catch {
    // Migration fallback
  }

  // 5. Fetch notification logs
  let notifications: Database["public"]["Tables"]["order_notifications"]["Row"][] = [];
  try {
    const { data: notifs } = await supabase
      .from("order_notifications")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    if (notifs) notifications = notifs;
  } catch {
    // Migration fallback
  }

  // 6. Fetch Age Verification log if present
  let ageVerification: Database["public"]["Tables"]["age_verification_log"]["Row"] | null = null;
  try {
    const { data: ageLog } = await supabase
      .from("age_verification_log")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();
    ageVerification = ageLog;
  } catch {
    // Non-fatal
  }

  const rawAddress = order.delivery_address as Record<string, string> | null;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Order Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-2"
          >
            &larr; Back to Orders Queue
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Order {order.order_number}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                order.payment_status === "paid"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {order.payment_status.toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Placed on {formatLondonDateTime(order.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold ${
              order.fulfilment_type === "delivery"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-purple-50 text-purple-700 border border-purple-200"
            }`}
          >
            {order.fulfilment_type === "delivery" ? "🚚 Home Delivery" : "🏬 In-Store Collection"}
          </span>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Line Items, Customer & Delivery Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Purchased Items</h2>
                <p className="text-xs text-gray-500">
                  Historical snapshots frozen at checkout (never recalculated from live catalog).
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {items?.length || 0} item{(items?.length || 0) !== 1 ? "s" : ""}
              </span>
            </div>

            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">Item Name</th>
                  <th scope="col" className="px-4 py-3 text-center">Qty</th>
                  <th scope="col" className="px-4 py-3 text-right">Unit Price</th>
                  <th scope="col" className="px-6 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {(!items || items.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-gray-500">
                      No order items recorded.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3.5 font-medium text-gray-900">
                        {item.product_name_snapshot}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-600 font-mono">
                        £{Number(item.unit_price_snapshot).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-gray-900 font-mono">
                        £{Number(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Financial Totals */}
            <div className="border-t border-gray-200 bg-gray-50/60 p-6">
              <div className="max-w-xs ml-auto space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-mono">£{Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Fulfilment Fee ({order.fulfilment_type})</span>
                  <span className="font-mono">
                    {Number(order.delivery_charge) === 0
                      ? "FREE (£0.00)"
                      : `£${Number(order.delivery_charge).toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total Amount</span>
                  <span className="font-mono text-green-700">£{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Fulfillment Information */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Customer Details */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                Customer Information
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-gray-500 uppercase font-semibold">Name</dt>
                  <dd className="font-medium text-gray-900">{order.customer_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase font-semibold">Email</dt>
                  <dd className="font-mono text-xs text-blue-600 hover:underline">
                    <a href={`mailto:${order.customer_email}`}>{order.customer_email}</a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase font-semibold">Telephone</dt>
                  <dd className="font-mono text-xs text-gray-900">
                    <a href={`tel:${order.customer_phone}`} className="hover:underline">
                      {order.customer_phone || "Not provided"}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Fulfilment Destination */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                {order.fulfilment_type === "delivery" ? "Delivery Destination" : "Collection Point"}
              </h3>
              {order.fulfilment_type === "delivery" ? (
                rawAddress ? (
                  <div className="mt-3 text-sm text-gray-800 space-y-1">
                    <p className="font-semibold text-gray-900">{rawAddress.line1 || rawAddress.line_1}</p>
                    {(rawAddress.line2 || rawAddress.line_2) && <p>{rawAddress.line2 || rawAddress.line_2}</p>}
                    <p>{rawAddress.city}</p>
                    <p className="font-mono font-bold text-green-700">{rawAddress.postcode}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">No structured address data recorded.</p>
                )
              ) : (
                <div className="mt-3 text-sm text-gray-800 space-y-1">
                  <p className="font-semibold text-gray-900">SIRAGRO Supermarket Store Counter</p>
                  <p>147 North Hyde Road</p>
                  <p>Hayes, Middlesex</p>
                  <p className="font-mono font-bold text-green-700">UB3 4NS</p>
                  <p className="text-xs text-gray-500 mt-2">Opening: Daily 7am – 10pm</p>
                </div>
              )}
            </div>
          </div>

          {/* Age Verification Details if applicable */}
          {ageVerification && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs">
              <div className="flex items-center gap-2 border-b border-amber-200 pb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  18+
                </span>
                <h3 className="text-sm font-bold text-gray-900">
                  Challenge 25 Age Verification Record
                </h3>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">Check Method:</span>
                  <span className="font-semibold text-gray-800">{ageVerification.method}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status Result:</span>
                  <span className="font-semibold text-amber-800">{ageVerification.result}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Verified At:</span>
                  <span className="text-gray-700">{formatLondonDateTime(ageVerification.verified_at)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Payment Status & Interactive OrderStatusManager */}
        <div className="space-y-6">
          {/* Payment Status Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Payment Verification
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-semibold uppercase">Gateway</span>
                <span className="text-xs font-bold text-gray-900">Stripe Checkout</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-semibold uppercase">Payment Status</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    order.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.payment_status.toUpperCase()}
                </span>
              </div>
              {order.stripe_payment_intent_id && (
                <div className="pt-2 text-xs">
                  <span className="text-gray-500 block font-semibold uppercase">Payment Intent</span>
                  <span className="font-mono text-gray-600 text-[11px] break-all">
                    {order.stripe_payment_intent_id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Fulfillment Workflow Manager */}
          <OrderStatusManager
            orderId={order.id}
            orderNumber={order.order_number}
            currentStatus={order.status as OrderStatus}
            fulfilmentType={order.fulfilment_type as "delivery" | "collection"}
            customerEmail={order.customer_email}
            initialNotes={order.notes}
            statusHistory={statusHistory}
            notifications={notifications}
          />
        </div>
      </div>
    </div>
  );
}
