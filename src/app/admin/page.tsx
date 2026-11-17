import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import {
  calculateRevenueSummary,
  classifyStockStatus,
  type SalesPeriod,
} from "@/lib/admin-rules";
import {
  AdminActivityFeed,
  type ActivityEventItem,
} from "@/components/admin/AdminActivityFeed";

export const metadata: Metadata = {
  title: "Dashboard Overview",
};

interface AdminDashboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

const PERIOD_LABELS: Record<SalesPeriod, string> = {
  today: "Today (UK)",
  "7d": "Last 7 Days",
  month: "This Month",
  all: "All Time",
};

function parsePeriod(raw?: string): SalesPeriod {
  if (raw === "today" || raw === "7d" || raw === "month" || raw === "all") {
    return raw;
  }
  return "month";
}

function getLondonDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(date);
}

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const { period: rawPeriod } = await searchParams;
  const selectedPeriod = parsePeriod(rawPeriod);

  const { supabase } = await requireAdminPage("/admin");

  // Query errors tracked explicitly — never mask failures as zero
  const queryErrors: string[] = [];

  // 1. Fetch Orders for Sales & Operational Metrics
  const { data: allOrders, error: ordersErr } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, fulfilment_type, customer_name, total, payment_status, created_at"
    )
    .order("created_at", { ascending: false });

  if (ordersErr) {
    queryErrors.push(`Orders query failed: ${ordersErr.message}`);
  }

  // Also check if migration 004 refunded_amount exists safely
  let refundMap: Record<string, number> = {};
  if (!ordersErr && allOrders && allOrders.length > 0) {
    const { data: refundRows } = await supabase
      .from("orders")
      .select("id, refunded_amount");
    if (refundRows) {
      refundMap = Object.fromEntries(
        refundRows.map((r) => [r.id, Number(r.refunded_amount || 0)])
      );
    }
  }

  // 2. Fetch Product Stock Snapshot (lightweight columns only for 1,500+ scale)
  const { data: allProducts, error: productsErr } = await supabase
    .from("products")
    .select("id, name, stock_quantity, is_available, is_age_restricted");

  if (productsErr) {
    queryErrors.push(`Products query failed: ${productsErr.message}`);
  }

  // 3. Fetch Categories count
  const { count: categoriesCount, error: catErr } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });

  if (catErr) {
    queryErrors.push(`Categories query failed: ${catErr.message}`);
  }

  // 4. Fetch Delivery Settings (live DB values, never invented)
  const { data: deliverySettings, error: deliverySettingsErr } = await supabase
    .from("delivery_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (deliverySettingsErr) {
    queryErrors.push(`Delivery settings query failed: ${deliverySettingsErr.message}`);
  }

  // 5. Fetch Activity Events & Cart Aggregates (graceful if migration 004 pending)
  let activityEvents: ActivityEventItem[] = [];
  let activityPendingMigration = false;
  const { data: eventsData, error: eventsErr } = await supabase
    .from("admin_activity_events")
    .select(
      "id, event_type, severity, title, summary, order_id, product_id, is_read, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(15);

  if (eventsErr) {
    if (
      eventsErr.message.includes("does not exist") ||
      eventsErr.message.includes("schema cache")
    ) {
      activityPendingMigration = true;
    }
  } else if (eventsData) {
    activityEvents = eventsData as ActivityEventItem[];
  }

  const todayLondon = getLondonDateKey(new Date());
  let topCartToday: Array<{
    id: string;
    product_id: string;
    product_name_snapshot: string;
    add_count: number;
    total_units_added: number;
  }> = [];

  if (!activityPendingMigration) {
    const { data: cartRows } = await supabase
      .from("cart_activity_daily")
      .select("id, product_id, product_name_snapshot, add_count, total_units_added")
      .eq("activity_date", todayLondon)
      .order("total_units_added", { ascending: false })
      .limit(5);
    if (cartRows) topCartToday = cartRows;
  }

  // 6. Fetch Unread Contact Enquiries Count (from contact_messages table)
  let newContactCount = 0;
  const { count: contactCount } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  newContactCount = contactCount ?? 0;

  // Compute Revenue & Operational Metrics
  const enrichedOrders = (allOrders || []).map((o) => ({
    ...o,
    refunded_amount: refundMap[o.id] ?? 0,
  }));

  const revenueSummary = !ordersErr
    ? calculateRevenueSummary(enrichedOrders, selectedPeriod)
    : null;
  const todaySummary = !ordersErr
    ? calculateRevenueSummary(enrichedOrders, "today")
    : null;

  const ordersTodayTotal = !ordersErr
    ? (allOrders || []).filter(
        (o) => getLondonDateKey(new Date(o.created_at)) === todayLondon
      ).length
    : null;

  const awaitingFulfilmentCount = !ordersErr
    ? (allOrders || []).filter((o) =>
        ["pending", "processing", "ready_for_pickup", "out_for_delivery"].includes(
          o.status
        )
      ).length
    : null;

  const lowStockProducts = (allProducts || []).filter(
    (p) => classifyStockStatus(p.stock_quantity) === "low_stock"
  );
  const outOfStockProducts = (allProducts || []).filter(
    (p) => classifyStockStatus(p.stock_quantity) === "out_of_stock"
  );

  const recentOrders = (allOrders || []).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#323C4B] sm:text-3xl">
            Store Overview &amp; Control Centre
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            SIRAGRO Supermarket &amp; Off-Licence • 147 North Hyde Road, Hayes, UB3 4NS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-[#323C4B] hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Orders Queue
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#323C4B] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#242c37] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </Link>
        </div>
      </div>

      {/* Explicit Database Query Error Banner (Never disguise errors as zeros) */}
      {queryErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        >
          <p className="font-bold">Some store metrics could not be loaded:</p>
          <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5 text-red-800">
            {queryErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Migration Notice (if 004 hasn't been applied yet) */}
      {activityPendingMigration && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="font-bold text-sm">Activity &amp; Inventory Migration Pending</p>
          <p className="mt-1">
            To enable the live in-dashboard notification feed, privacy-safe basket metrics, and inventory adjustment history, apply{" "}
            <code className="font-mono font-semibold">
              supabase/migrations/004_admin_activity_and_inventory.sql
            </code>{" "}
            in your Supabase SQL Editor.
          </p>
        </div>
      )}

      {/* Section 1: Verified Paid Sales & Period Filter */}
      <section aria-labelledby="sales-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="sales-heading"
              className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]"
            >
              Verified Sales Performance ({PERIOD_LABELS[selectedPeriod]})
            </h2>
            <p className="text-xs text-slate-500">
              Calculated strictly from Stripe-verified paid orders. Unpaid &amp; failed attempts are excluded.
            </p>
          </div>

          {/* Period Selector Pills */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select sales period">
            {(["today", "7d", "month", "all"] as SalesPeriod[]).map((p) => (
              <Link
                key={p}
                href={`/admin?period=${p}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  selectedPeriod === p
                    ? "bg-[#323C4B] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {PERIOD_LABELS[p]}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Revenue Card */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              {revenueSummary?.hasRecordedRefunds
                ? "Net Paid Revenue"
                : "Gross Paid Sales (Before Refunds)"}
            </span>
            <div className="mt-2 font-mono text-3xl font-black text-slate-900">
              {revenueSummary
                ? `£${(revenueSummary.hasRecordedRefunds
                    ? revenueSummary.netPaidRevenue
                    : revenueSummary.grossPaidRevenue
                  ).toFixed(2)}`
                : "Error"}
            </div>
            <p className="mt-2 text-xs text-emerald-800 font-medium">
              {revenueSummary
                ? revenueSummary.hasRecordedRefunds
                  ? `Gross £${revenueSummary.grossPaidRevenue.toFixed(2)} − Refunds £${revenueSummary.refundedTotal.toFixed(2)}`
                  : `${revenueSummary.paidOrderCount} verified paid order${revenueSummary.paidOrderCount !== 1 ? "s" : ""}`
                : "Unable to compute"}
            </p>
          </div>

          {/* Average Order Value */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Average Order Value
            </span>
            <div className="mt-2 font-mono text-3xl font-black text-slate-900">
              {revenueSummary ? `£${revenueSummary.averageOrderValue.toFixed(2)}` : "Error"}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {revenueSummary
                ? `Across ${revenueSummary.paidOrderCount} paid order(s)`
                : "Unable to compute"}
            </p>
          </div>

          {/* Orders Today */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Orders Today (UK)
            </span>
            <div className="mt-2 font-mono text-3xl font-black text-slate-900">
              {ordersTodayTotal !== null ? ordersTodayTotal : "Error"}
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {todaySummary
                ? `${todaySummary.paidOrderCount} paid (£${todaySummary.grossPaidRevenue.toFixed(2)})`
                : "Query error"}
              {todaySummary && todaySummary.awaitingPaymentCount > 0
                ? ` • ${todaySummary.awaitingPaymentCount} unpaid`
                : ""}
            </p>
          </div>

          {/* Awaiting Fulfilment */}
          <Link
            href="/admin/orders?status=processing"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#323C4B] hover:shadow-sm"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Awaiting Fulfilment
            </span>
            <div className="mt-2 font-mono text-3xl font-black text-[#323C4B]">
              {awaitingFulfilmentCount !== null ? awaitingFulfilmentCount : "Error"}
            </div>
            <p className="mt-2 text-xs font-semibold text-[#323C4B]">
              Open active queue &rarr;
            </p>
          </Link>
        </div>
      </section>

      {/* Section 2: Catalogue & Inventory Health */}
      <section aria-labelledby="inventory-heading" className="space-y-4">
        <h2
          id="inventory-heading"
          className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]"
        >
          Catalogue &amp; Inventory Health
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/products"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#323C4B] transition-all"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <div className="mt-2 font-mono text-3xl font-black text-slate-900">
              {!productsErr ? (allProducts || []).length : "Error"}
            </div>
            <p className="mt-2 text-xs font-semibold text-[#323C4B]">
              Manage catalogue &rarr;
            </p>
          </Link>

          <Link
            href="/admin/products?filter=low_stock"
            className={`rounded-2xl border p-5 shadow-xs transition-all ${
              lowStockProducts.length > 0
                ? "border-amber-200 bg-amber-50/40 hover:border-amber-400"
                : "border-slate-200 bg-white hover:border-[#323C4B]"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Low Stock Alerts
            </span>
            <div className="mt-2 font-mono text-3xl font-black text-slate-900">
              {!productsErr ? lowStockProducts.length : "Error"}
            </div>
            <p className="mt-2 text-xs font-semibold text-amber-800">
              1–10 units remaining &rarr;
            </p>
          </Link>

          <Link
            href="/admin/products?filter=out_of_stock"
            className={`rounded-2xl border p-5 shadow-xs transition-all ${
              outOfStockProducts.length > 0
                ? "border-red-200 bg-red-50/50 hover:border-red-400"
                : "border-slate-200 bg-white hover:border-[#323C4B]"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-red-800">
              Out of Stock
            </span>
            <div className="mt-2 font-mono text-3xl font-black text-slate-900">
              {!productsErr ? outOfStockProducts.length : "Error"}
            </div>
            <p className="mt-2 text-xs font-semibold text-red-700">
              0 units available &rarr;
            </p>
          </Link>

          <Link
            href="/admin/categories"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#323C4B] transition-all"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Categories &amp; Aisles
            </span>
            <div className="mt-2 font-mono text-3xl font-black text-slate-900">
              {!catErr ? categoriesCount ?? 0 : "Error"}
            </div>
            <p className="mt-2 text-xs font-semibold text-[#323C4B]">
              Organise aisles &rarr;
            </p>
          </Link>
        </div>
      </section>

      {/* Section 3: Activity Feed + Aggregate Basket & Stock Alerts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Notifications & Activity Stream */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]">
              Store Notifications &amp; Activity
            </h2>
            <Link
              href="/admin/activity"
              className="text-xs font-bold text-[#323C4B] hover:underline"
            >
              Open full activity log &rarr;
            </Link>
          </div>
          <AdminActivityFeed events={activityEvents} showFilters={true} />
        </div>

        {/* Right Side: Privacy-Safe Basket Demand & Urgent Stock Alerts */}
        <div className="space-y-6">
          {/* Aggregate Cart Activity Today */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#323C4B]">
                  Today&apos;s Cart Demand (Aggregate)
                </h3>
                <p className="text-[11px] text-slate-500">
                  No visitor PII • Does not reserve stock
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                Server-verified
              </span>
            </div>

            {topCartToday.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                No cart additions logged today yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 text-xs">
                {topCartToday.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5 gap-2">
                    <Link
                      href={`/admin/products/${c.product_id}/edit`}
                      className="font-semibold text-slate-800 hover:text-[#323C4B] hover:underline truncate"
                    >
                      {c.product_name_snapshot}
                    </Link>
                    <span className="shrink-0 font-mono text-slate-600">
                      {c.total_units_added} units ({c.add_count}×)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Low / Out of Stock Products List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#323C4B]">
                Stock Attention Needed
              </h3>
              <Link
                href="/admin/products?filter=low_stock"
                className="text-xs font-bold text-[#323C4B] hover:underline"
              >
                View all
              </Link>
            </div>

            {productsErr ? (
              <p className="mt-4 text-xs text-red-700 font-medium">
                Unavailable — could not verify product stock ({productsErr.message}).
              </p>
            ) : outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
              <p className="mt-4 text-xs text-emerald-700 font-medium">
                All products are well stocked (above 10 units).
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 text-xs">
                {[...outOfStockProducts, ...lowStockProducts]
                  .slice(0, 6)
                  .map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between py-2.5 gap-2"
                    >
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="font-medium text-slate-800 hover:underline truncate"
                      >
                        {p.name}
                      </Link>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          p.stock_quantity <= 0
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.stock_quantity} left
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* New Customer Enquiries Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#323C4B]">
                  Customer Enquiries
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {newContactCount} unread message{newContactCount !== 1 ? "s" : ""} from Contact Us
                </p>
              </div>
              <Link
                href="/admin/activity#enquiries"
                className="rounded-lg bg-[#323C4B] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#242c37]"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Recent Orders Snapshot */}
      <section aria-labelledby="recent-orders-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="recent-orders-heading"
            className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]"
          >
            Recent Customer Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-[#323C4B] hover:underline"
          >
            View all orders &rarr;
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order Ref</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfilment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                      No orders have been placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#323C4B]">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-800">
                        {order.customer_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 capitalize">
                        {order.fulfilment_type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            order.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.payment_status === "refunded"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 capitalize">
                        {order.status.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900">
                        £{Number(order.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-bold text-[#323C4B] hover:underline"
                        >
                          Inspect &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Verified Store Configuration & Licensing */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#323C4B]">
                Hayes Physical Hub &amp; Delivery Rules
              </h2>
              <p className="text-xs text-slate-500">
                147 North Hyde Road, Hayes, UB3 4NS • 020 8813 6458
              </p>
            </div>
            <Link
              href="/admin/settings"
              className="text-xs font-bold text-[#323C4B] hover:underline"
            >
              Manage &rarr;
            </Link>
          </div>
          {deliverySettingsErr || !deliverySettings ? (
            <p className="mt-4 text-xs font-medium text-red-700">
              Delivery and collection settings could not be verified. Checkout fails closed until settings are readable.
            </p>
          ) : (
            <dl className="mt-4 divide-y divide-slate-100 text-xs">
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Store Collection</dt>
                <dd
                  className={`font-semibold ${
                    deliverySettings.is_collection_enabled
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {deliverySettings.is_collection_enabled
                    ? "Enabled (Free £0.00)"
                    : "Paused"}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Home Delivery</dt>
                <dd
                  className={`font-semibold ${
                    deliverySettings.is_delivery_enabled &&
                    (deliverySettings as { is_delivery_pricing_confirmed?: boolean })
                      .is_delivery_pricing_confirmed === true
                      ? "text-emerald-700"
                      : "text-amber-800"
                  }`}
                >
                  {(deliverySettings as { is_delivery_pricing_confirmed?: boolean })
                    .is_delivery_pricing_confirmed !== true
                    ? "Blocked — Pricing Not Confirmed"
                    : deliverySettings.is_delivery_enabled
                      ? `Enabled (up to ${deliverySettings.max_delivery_radius_miles} miles)`
                      : "Paused by admin"}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Free Local Delivery</dt>
                <dd className="font-semibold text-slate-900">
                  Within {deliverySettings.free_delivery_radius_miles} mi strictly over £
                  {Number(deliverySettings.free_delivery_min_subtotal).toFixed(2)}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-red-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Off-Licence &amp; Challenge 25
              </h2>
              <p className="text-xs text-slate-500">Licensing Act 2003 Compliance</p>
            </div>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
              Mandatory ID
            </span>
          </div>
          <p className="mt-4 text-xs text-slate-600 leading-relaxed">
            Age-restricted products automatically trigger age declaration at checkout and require photo ID inspection upon delivery or counter collection.
          </p>
          <div className="mt-4 flex justify-end">
            <Link
              href="/admin/products?filter=age_restricted"
              className="text-xs font-bold text-[#323C4B] hover:underline"
            >
              Review age-restricted products &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
