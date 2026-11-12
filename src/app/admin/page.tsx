import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from "@/lib/products";

export const metadata: Metadata = {
  title: "Dashboard Overview",
};

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Product and inventory counts
  let totalProducts = FALLBACK_PRODUCTS.length;
  let lowStockCount = FALLBACK_PRODUCTS.filter((p) => p.stock_quantity <= 10).length;
  let categoriesCount = FALLBACK_CATEGORIES.length;
  let ordersCount = 0;
  let activeFulfillmentCount = 0;

  // Sales metrics state
  let grossPaidRevenue: number | null = null;
  let totalPaidOrders: number | null = null;
  let averageOrderValue: number | null = null;
  let todayPaidRevenue: number | null = null;
  let todayPaidOrders: number | null = null;
  let monthPaidRevenue: number | null = null;
  let monthPaidOrders: number | null = null;
  let salesErrorMessage: string | null = null;

  try {
    // 1. Catalog & Category Counts
    const { count: prodCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    if (prodCount !== null && prodCount !== undefined) {
      totalProducts = prodCount;
    }

    const { count: catCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });
    if (catCount !== null && catCount !== undefined) {
      categoriesCount = catCount;
    }

    const { data: lowStock } = await supabase
      .from("products")
      .select("id")
      .lte("stock_quantity", 10);
    if (lowStock) {
      lowStockCount = lowStock.length;
    }

    // 2. Orders Fulfillment Counts
    const { count: ordCount, data: orders } = await supabase
      .from("orders")
      .select("id, status");
    if (ordCount !== null && ordCount !== undefined) {
      ordersCount = ordCount;
    }
    if (orders) {
      activeFulfillmentCount = orders.filter((o) =>
        ["pending", "processing", "ready_for_pickup", "out_for_delivery"].includes(o.status)
      ).length;
    }

    // 3. Accurate Sales Performance Metrics (Paid Orders Only)
    // First, attempt optimized RPC aggregation function
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_sales_metrics"
    );

    if (!rpcError && rpcData) {
      grossPaidRevenue = Number(rpcData.total_paid_revenue || 0);
      totalPaidOrders = Number(rpcData.total_paid_orders || 0);
      averageOrderValue = Number(rpcData.average_order_value || 0);
      todayPaidRevenue = Number(rpcData.today_paid_revenue || 0);
      todayPaidOrders = Number(rpcData.today_paid_orders || 0);
      monthPaidRevenue = Number(rpcData.month_paid_revenue || 0);
      monthPaidOrders = Number(rpcData.month_paid_orders || 0);
    } else {
      // Direct query fallback: lightweight select of total & created_at for paid orders only
      const { data: paidOrders, error: paidErr } = await supabase
        .from("orders")
        .select("total, created_at")
        .eq("payment_status", "paid");

      if (paidErr) {
        console.error("[Admin Dashboard] Failed to fetch paid orders:", paidErr);
        salesErrorMessage = paidErr.message;
      } else if (paidOrders) {
        const now = new Date();
        const londonToday = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/London",
        }).format(now);
        const londonMonth = londonToday.slice(0, 7);

        let gross = 0;
        let todayRev = 0;
        let todayCount = 0;
        let monthRev = 0;
        let monthCount = 0;

        for (const o of paidOrders) {
          const tot = Number(o.total || 0);
          gross += tot;

          const orderDay = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Europe/London",
          }).format(new Date(o.created_at));

          if (orderDay === londonToday) {
            todayRev += tot;
            todayCount += 1;
          }
          if (orderDay.startsWith(londonMonth)) {
            monthRev += tot;
            monthCount += 1;
          }
        }

        grossPaidRevenue = Math.round(gross * 100) / 100;
        totalPaidOrders = paidOrders.length;
        averageOrderValue =
          paidOrders.length > 0 ? Math.round((gross / paidOrders.length) * 100) / 100 : 0;
        todayPaidRevenue = Math.round(todayRev * 100) / 100;
        todayPaidOrders = todayCount;
        monthPaidRevenue = Math.round(monthRev * 100) / 100;
        monthPaidOrders = monthCount;
      }
    }
  } catch (err: unknown) {
    salesErrorMessage = err instanceof Error ? err.message : "Database connection issue";
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Store Overview &amp; Control Centre
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time management for SIRAGRO Supermarket &amp; Off-Licence (Hayes Hub: UB3 4NS).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <svg
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            Orders Queue
          </Link>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:opacity-90"
            style={{ backgroundColor: "#323C4B" }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </Link>
        </div>
      </div>

      {/* Database Error Banner for Sales Metrics */}
      {salesErrorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="font-bold">Sales Metrics Unavailable</span>
          </div>
          <p className="mt-1 text-xs text-red-700">
            Could not query verified sales data from database: {salesErrorMessage}.
          </p>
        </div>
      )}

      {/* Section 1: Financial & Sales Performance (Paid Orders Only) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Verified Sales Performance
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            Source of Truth: Stripe Webhook • Gross Paid (excl. unverified/unpaid)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Gross Paid Revenue Card */}
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Gross Paid Revenue
              </span>
              <span className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m0 0H3m0 0h18m0 0h.75A.75.75 0 0122.5 6v.75m0 0h-.75m0 0H3m18 0v11.25m0 0h.75a.75.75 0 00.75-.75V6m-1.5 11.25H3m0 0H2.25a.75.75 0 01-.75-.75V6" />
                </svg>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 font-mono">
                {grossPaidRevenue !== null ? `£${grossPaidRevenue.toFixed(2)}` : "—"}
              </span>
              <span className="text-xs text-gray-500 font-medium">all-time</span>
            </div>
            <div className="mt-3 text-xs text-emerald-700 font-medium">
              From {totalPaidOrders ?? 0} paid order{(totalPaidOrders ?? 0) !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Today's Paid Sales Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Today&apos;s Paid Sales
              </span>
              <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 font-mono">
                {todayPaidRevenue !== null ? `£${todayPaidRevenue.toFixed(2)}` : "—"}
              </span>
              <span className="text-xs text-gray-500 font-medium">UK today</span>
            </div>
            <div className="mt-3 text-xs text-blue-700 font-medium">
              {todayPaidOrders ?? 0} paid order{(todayPaidOrders ?? 0) !== 1 ? "s" : ""} today
            </div>
          </div>

          {/* Month-to-Date Paid Sales Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                This Month (MTD)
              </span>
              <span className="rounded-lg bg-purple-50 p-2 text-purple-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 font-mono">
                {monthPaidRevenue !== null ? `£${monthPaidRevenue.toFixed(2)}` : "—"}
              </span>
              <span className="text-xs text-gray-500 font-medium">current month</span>
            </div>
            <div className="mt-3 text-xs text-purple-700 font-medium">
              {monthPaidOrders ?? 0} paid order{(monthPaidOrders ?? 0) !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Average Order Value (AOV) Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Average Order Value
              </span>
              <span className="rounded-lg bg-amber-50 p-2 text-amber-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 font-mono">
                {averageOrderValue !== null ? `£${averageOrderValue.toFixed(2)}` : "—"}
              </span>
              <span className="text-xs text-gray-500 font-medium">AOV</span>
            </div>
            <div className="mt-3 text-xs text-amber-700 font-medium">
              Across verified payments
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Store & Operations Metrics Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            Catalog &amp; Operations Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Orders Queue Card */}
          <Link
            href="/admin/orders"
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-green-600 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Customer Orders
              </span>
              <span className="rounded-lg bg-blue-50 p-2 text-blue-700 group-hover:bg-blue-100 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{ordersCount}</span>
              {activeFulfillmentCount > 0 && (
                <span className="text-xs font-semibold text-blue-700">
                  ({activeFulfillmentCount} active)
                </span>
              )}
            </div>
            <div className="mt-3 text-xs font-medium text-blue-700">View orders queue &rarr;</div>
          </Link>

          {/* Products Card */}
          <Link
            href="/admin/products"
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-green-600 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Products
              </span>
              <span className="rounded-lg bg-green-50 p-2 text-green-700 group-hover:bg-green-100 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{totalProducts}</span>
              <span className="text-xs text-gray-500">in catalog</span>
            </div>
            <div className="mt-3 text-xs font-medium text-green-700">Manage catalog &rarr;</div>
          </Link>

          {/* Low Stock Card */}
          <Link
            href="/admin/products?filter=low_stock"
            className={`group rounded-xl border p-5 shadow-xs transition-all hover:shadow-sm ${
              lowStockCount > 0
                ? "border-amber-200 bg-amber-50/40 hover:border-amber-400"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Low Stock Alerts
              </span>
              <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{lowStockCount}</span>
              <span className="text-xs text-amber-700 font-medium">items ≤ 10 units</span>
            </div>
            <div className="mt-3 text-xs font-medium text-amber-800">Review inventory &rarr;</div>
          </Link>

          {/* Categories Card */}
          <Link
            href="/admin/categories"
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-green-600 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Aisles &amp; Categories
              </span>
              <span className="rounded-lg bg-purple-50 p-2 text-purple-700 group-hover:bg-purple-100 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                </svg>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{categoriesCount}</span>
              <span className="text-xs text-gray-500">active aisles</span>
            </div>
            <div className="mt-3 text-xs font-medium text-purple-700">Manage aisles &rarr;</div>
          </Link>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hub & Delivery Status Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Hayes Physical Hub &amp; Delivery Engine
                </h2>
                <p className="text-xs text-gray-500">Store Postcode: UB3 4NS (Hayes, Middlesex)</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
              Live &amp; Enforcing
            </span>
          </div>

          <dl className="mt-4 divide-y divide-gray-100 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Store Pickup / Collection</dt>
              <dd className="font-semibold text-green-700">Free (£0.00)</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">0 - 1.0 Mile Delivery</dt>
              <dd className="font-semibold text-gray-900">Free over £25 (otherwise £2.49)</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">1.0 - 3.0 Miles Delivery</dt>
              <dd className="font-semibold text-gray-900">£3.99 flat</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">3.0 - 5.0 Miles Delivery</dt>
              <dd className="font-semibold text-gray-900">£4.99 flat</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gray-500">Beyond 5.0 Miles</dt>
              <dd className="font-semibold text-gray-500">Collection Only</dd>
            </div>
          </dl>
        </div>

        {/* Regulatory & Challenge 25 Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Off-Licence &amp; Challenge 25
                </h2>
                <p className="text-xs text-gray-500">Licensing Act 2003 Compliance</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
              Mandatory ID
            </span>
          </div>

          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p>
              Any basket containing age-restricted alcoholic beverages automatically triggers
              customer age verification notices at checkout.
            </p>
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800">
              <strong className="font-bold">Driver Notice:</strong> Delivery drivers and
              collection staff must inspect official photo ID (Passport, UK Driving Licence,
              PASS card) for anyone who appears under 25 years old.
            </div>
            <div className="pt-2 flex justify-end">
              <Link
                href="/admin/products?filter=age_restricted"
                className="text-xs font-semibold text-green-700 hover:underline"
              >
                View all age-restricted products &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
