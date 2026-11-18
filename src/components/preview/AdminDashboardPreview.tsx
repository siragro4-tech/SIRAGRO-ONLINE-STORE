"use client";

import { useState } from "react";
import { Logo } from "@/components/layout/Logo";
import {
  calculateRevenueSummary,
  classifyStockStatus,
  type SalesPeriod,
} from "@/lib/admin-rules";

const DEMO_REFERENCE_NOW = new Date("2026-11-18T12:00:00.000Z");

const PERIOD_LABELS: Record<SalesPeriod, string> = {
  today: "Today (UK)",
  "7d": "Last 7 Days",
  month: "This Month",
  all: "All Time",
};

const DEMO_ORDERS = [
  {
    id: "demo-ord-1",
    order_number: "SIR-DEMO-104",
    customer_name: "Demo Shopper One",
    fulfilment_type: "collection",
    payment_status: "paid",
    status: "processing",
    total: 34.5,
    refunded_amount: 0,
    created_at: "2026-11-18T09:15:00.000Z",
  },
  {
    id: "demo-ord-2",
    order_number: "SIR-DEMO-103",
    customer_name: "Demo Shopper Two",
    fulfilment_type: "collection",
    payment_status: "paid",
    status: "ready_for_pickup",
    total: 18.2,
    refunded_amount: 0,
    created_at: "2026-11-18T08:40:00.000Z",
  },
  {
    id: "demo-ord-3",
    order_number: "SIR-DEMO-102",
    customer_name: "Demo Shopper Three",
    fulfilment_type: "collection",
    payment_status: "unpaid",
    status: "pending",
    total: 27.0,
    refunded_amount: 0,
    created_at: "2026-11-18T07:55:00.000Z",
  },
  {
    id: "demo-ord-4",
    order_number: "SIR-DEMO-101",
    customer_name: "Demo Shopper Four",
    fulfilment_type: "collection",
    payment_status: "refunded",
    status: "cancelled",
    total: 22.0,
    refunded_amount: 22.0,
    created_at: "2026-11-15T14:10:00.000Z",
  },
  {
    id: "demo-ord-5",
    order_number: "SIR-DEMO-100",
    customer_name: "Demo Shopper Five",
    fulfilment_type: "collection",
    payment_status: "paid",
    status: "collected",
    total: 46.8,
    refunded_amount: 0,
    created_at: "2026-11-04T16:30:00.000Z",
  },
];

const DEMO_PRODUCTS = [
  {
    id: "demo-prod-1",
    name: "Demo Orchard Apples (6 Pack)",
    category: "Fresh Produce",
    price: 1.95,
    stock_quantity: 28,
    is_age_restricted: false,
  },
  {
    id: "demo-prod-2",
    name: "Demo Whole Milk (2 Litres)",
    category: "Dairy & Eggs",
    price: 1.6,
    stock_quantity: 6,
    is_age_restricted: false,
  },
  {
    id: "demo-prod-3",
    name: "Demo Basmati Rice (5kg)",
    category: "Cupboard & Groceries",
    price: 8.5,
    stock_quantity: 0,
    is_age_restricted: false,
  },
  {
    id: "demo-prod-4",
    name: "Demo Vintage Cider (4 x 440ml)",
    category: "Off-Licence & Beverages",
    price: 5.75,
    stock_quantity: 4,
    is_age_restricted: true,
  },
  {
    id: "demo-prod-5",
    name: "Demo Farmhouse Loaf",
    category: "Bakery",
    price: 1.4,
    stock_quantity: 19,
    is_age_restricted: false,
  },
];

const DEMO_ACTIVITY_EVENTS = [
  {
    id: "demo-ev-1",
    event_type: "order_paid",
    title: "Paid Order #SIR-DEMO-104 (£34.50)",
    summary:
      "Fictional demo webhook confirmation • In-Store Collection • 4 line item(s).",
    is_read: false,
    created_at: "2026-11-18T09:15:00.000Z",
  },
  {
    id: "demo-ev-2",
    event_type: "low_stock_alert",
    title: "Low stock alert: Demo Whole Milk (2 Litres)",
    summary: "Demo stock count reached 6 units (threshold 10).",
    is_read: false,
    created_at: "2026-11-18T09:05:00.000Z",
  },
  {
    id: "demo-ev-3",
    event_type: "cart_activity",
    title: "Cart demand spike: Demo Orchard Apples (6 Pack)",
    summary: "Grouped aggregate demo cart additions: 5 units across 3 sessions.",
    is_read: true,
    created_at: "2026-11-18T08:30:00.000Z",
  },
  {
    id: "demo-ev-4",
    event_type: "out_of_stock_alert",
    title: "Out of stock: Demo Basmati Rice (5kg)",
    summary: "Fictional example item showing 0 units remaining.",
    is_read: false,
    created_at: "2026-11-17T18:20:00.000Z",
  },
];

const DEMO_CART_DEMAND = [
  { id: "c1", name: "Demo Orchard Apples (6 Pack)", units: 5, adds: 3 },
  { id: "c2", name: "Demo Whole Milk (2 Litres)", units: 4, adds: 2 },
  { id: "c3", name: "Demo Farmhouse Loaf", units: 2, adds: 2 },
];

const PREVIEW_NAV_ITEMS = [
  { name: "Dashboard", active: true },
  { name: "Activity & Alerts", badgeCount: 3 },
  { name: "Products" },
  { name: "Categories" },
  { name: "Orders" },
  { name: "CSV Import" },
  { name: "Store & Delivery" },
];

const EVENT_BADGES: Record<string, { label: string; badgeClass: string }> = {
  order_paid: {
    label: "Paid (Stripe)",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  low_stock_alert: {
    label: "Low Stock",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
  },
  out_of_stock_alert: {
    label: "Out of Stock",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
  cart_activity: {
    label: "Cart Activity",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
  },
};

function formatDemoTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/**
 * Pure presentation-only local design preview of the SIRAGRO Admin Dashboard.
 * Uses only fictional demo data and reusable pure helpers; makes zero DB/API calls.
 */
export function AdminDashboardPreview() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<SalesPeriod>("month");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const revenueSummary = calculateRevenueSummary(
    DEMO_ORDERS,
    selectedPeriod,
    DEMO_REFERENCE_NOW
  );
  const todaySummary = calculateRevenueSummary(
    DEMO_ORDERS,
    "today",
    DEMO_REFERENCE_NOW
  );

  const ordersTodayCount = DEMO_ORDERS.filter((o) =>
    o.created_at.startsWith("2026-11-18")
  ).length;
  const awaitingFulfilmentCount = DEMO_ORDERS.filter((o) =>
    ["pending", "processing", "ready_for_pickup", "out_for_delivery"].includes(
      o.status
    )
  ).length;

  const lowStockProducts = DEMO_PRODUCTS.filter(
    (p) => classifyStockStatus(p.stock_quantity) === "low_stock"
  );
  const outOfStockProducts = DEMO_PRODUCTS.filter(
    (p) => classifyStockStatus(p.stock_quantity) === "out_of_stock"
  );

  const unreadCount = DEMO_ACTIVITY_EVENTS.filter((e) => !e.is_read).length;
  const filteredActivity = DEMO_ACTIVITY_EVENTS.filter((ev) => {
    if (activityFilter === "all") return true;
    if (activityFilter === "unread") return !ev.is_read;
    if (activityFilter === "orders") return ev.event_type === "order_paid";
    if (activityFilter === "stock") {
      return (
        ev.event_type === "low_stock_alert" ||
        ev.event_type === "out_of_stock_alert"
      );
    }
    if (activityFilter === "cart") return ev.event_type === "cart_activity";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Prominent Non-Dismissible Preview Banner */}
      <div
        role="status"
        className="sticky top-0 z-50 border-b-2 border-amber-400 bg-amber-100 px-4 py-3 text-center text-xs sm:text-sm font-black tracking-wide text-amber-950 shadow-xs"
      >
        LOCAL DESIGN PREVIEW — DEMO DATA ONLY — NOT CONNECTED TO THE STORE
      </div>

      <div className="flex min-h-[calc(100vh-48px)] flex-col bg-slate-50 lg:flex-row">
        {/* Mobile Preview Top Bar */}
        <div className="flex h-16 items-center justify-between border-b border-[#242c37] bg-[#323C4B] px-4 text-white lg:hidden">
          <div className="flex items-center gap-2.5">
            <Logo size={34} dark />
            <div>
              <span className="block text-sm font-black tracking-wide leading-tight">
                SIRAGRO
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                Admin Portal (Preview)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-200 hover:bg-[#242c37]"
            aria-label="Toggle preview navigation menu"
            aria-expanded={sidebarOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Presentation-Only Sidebar (matches AdminSidebar branding cleanly) */}
        <aside
          className={`${
            sidebarOpen ? "flex" : "hidden lg:flex"
          } w-full lg:w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white`}
        >
          <div>
            <div className="flex items-center gap-3 bg-[#323C4B] px-5 py-5 text-white">
              <Logo size={40} dark />
              <div className="min-w-0">
                <div className="font-black tracking-wide text-white leading-tight">
                  SIRAGRO
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Store Admin (Demo)
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-1" aria-label="Admin Preview Navigation">
              {PREVIEW_NAV_ITEMS.map((item) => (
                <div
                  key={item.name}
                  aria-disabled="true"
                  title="Preview navigation item — disabled in demo mode"
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                    item.active
                      ? "bg-[#323C4B] text-white shadow-xs"
                      : "text-slate-500 bg-slate-50/70 opacity-80 cursor-not-allowed"
                  }`}
                >
                  <span>{item.name}</span>
                  {item.badgeCount ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                      {item.badgeCount}
                    </span>
                  ) : !item.active ? (
                    <span className="text-[10px] font-medium text-slate-400">
                      Preview
                    </span>
                  ) : null}
                </div>
              ))}
            </nav>
          </div>

          <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50/70">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="truncate text-xs font-bold text-slate-900">
                Demo Store Owner
              </p>
              <p className="truncate text-[11px] text-slate-500">
                demo-preview@example.invalid
              </p>
            </div>

            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-slate-200/70 px-3 py-2 text-xs font-bold text-slate-500 opacity-75"
            >
              Sign Out (Preview Only)
            </button>
          </div>
        </aside>

        {/* Main Content Area (mirrors src/app/admin/page.tsx layout) */}
        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#323C4B] sm:text-3xl">
                  Store Overview &amp; Control Centre
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  SIRAGRO Supermarket &amp; Off-Licence • Visual Design Preview (Fictional Demo Data)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-400 opacity-75"
                >
                  Orders Queue (Preview Only)
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl bg-[#323C4B] px-4 py-2 text-sm font-bold text-white opacity-60"
                >
                  Add Product (Preview Only)
                </button>
              </div>
            </div>

            {/* Section 1: Verified Paid Sales & Local Period Filter */}
            <section aria-labelledby="demo-sales-heading" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2
                    id="demo-sales-heading"
                    className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]"
                  >
                    Demo Sales Performance ({PERIOD_LABELS[selectedPeriod]})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Computed from fictional sample orders using the store revenue rules helper.
                  </p>
                </div>

                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Preview sales period selector"
                >
                  {(["today", "7d", "month", "all"] as SalesPeriod[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPeriod(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        selectedPeriod === p
                          ? "bg-[#323C4B] text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    {revenueSummary.hasRecordedRefunds
                      ? "Net Paid Revenue (Demo)"
                      : "Gross Paid Sales (Demo)"}
                  </span>
                  <div className="mt-2 font-mono text-3xl font-black text-slate-900">
                    £
                    {(revenueSummary.hasRecordedRefunds
                      ? revenueSummary.netPaidRevenue
                      : revenueSummary.grossPaidRevenue
                    ).toFixed(2)}
                  </div>
                  <p className="mt-2 text-xs text-emerald-800 font-medium">
                    {revenueSummary.hasRecordedRefunds
                      ? `Gross £${revenueSummary.grossPaidRevenue.toFixed(2)} − Refunds £${revenueSummary.refundedTotal.toFixed(2)}`
                      : `${revenueSummary.paidOrderCount} paid demo order(s)`}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Average Order Value (Demo)
                  </span>
                  <div className="mt-2 font-mono text-3xl font-black text-slate-900">
                    £{revenueSummary.averageOrderValue.toFixed(2)}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Across {revenueSummary.paidOrderCount} demo paid order(s)
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Orders Today (Demo)
                  </span>
                  <div className="mt-2 font-mono text-3xl font-black text-slate-900">
                    {ordersTodayCount}
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    {todaySummary.paidOrderCount} paid (£
                    {todaySummary.grossPaidRevenue.toFixed(2)}) •{" "}
                    {todaySummary.awaitingPaymentCount} unpaid
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Awaiting Fulfilment (Demo)
                  </span>
                  <div className="mt-2 font-mono text-3xl font-black text-[#323C4B]">
                    {awaitingFulfilmentCount}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Queue navigation disabled in preview
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Catalogue & Inventory Health */}
            <section aria-labelledby="demo-inventory-heading" className="space-y-4">
              <h2
                id="demo-inventory-heading"
                className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]"
              >
                Catalogue &amp; Inventory Health (Demo)
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Demo Products
                  </span>
                  <div className="mt-2 font-mono text-3xl font-black text-slate-900">
                    {DEMO_PRODUCTS.length}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Read-only sample catalogue
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Low Stock Alerts
                  </span>
                  <div className="mt-2 font-mono text-3xl font-black text-slate-900">
                    {lowStockProducts.length}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-amber-800">
                    1–10 units remaining
                  </p>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-800">
                    Out of Stock
                  </span>
                  <div className="mt-2 font-mono text-3xl font-black text-slate-900">
                    {outOfStockProducts.length}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    0 units available
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Demo Aisles
                  </span>
                  <div className="mt-2 font-mono text-3xl font-black text-slate-900">
                    5
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Read-only preview
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Notifications & Right-Hand Operational Widgets */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]">
                    Store Notifications &amp; Activity (Demo)
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">
                    Read-only preview
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "all", label: `All (${DEMO_ACTIVITY_EVENTS.length})` },
                        { id: "unread", label: `Unread (${unreadCount})` },
                        { id: "orders", label: "Orders & Payments" },
                        { id: "cart", label: "Cart Activity" },
                        { id: "stock", label: "Stock Alerts" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActivityFilter(tab.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                            activityFilter === tab.id
                              ? "bg-[#323C4B] text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled
                      className="self-start sm:self-auto cursor-not-allowed text-xs font-semibold text-slate-400"
                    >
                      Mark all read (Preview only)
                    </button>
                  </div>

                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    {filteredActivity.map((ev) => {
                      const badge = EVENT_BADGES[ev.event_type] || {
                        label: ev.event_type,
                        badgeClass:
                          "bg-slate-100 text-slate-700 border-slate-200",
                      };

                      return (
                        <li
                          key={ev.id}
                          className={`p-4 ${
                            ev.is_read ? "bg-white" : "bg-slate-50/80"
                          }`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {!ev.is_read && (
                                  <span
                                    className="h-2 w-2 rounded-full bg-[#323C4B]"
                                    aria-hidden="true"
                                  />
                                )}
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${badge.badgeClass}`}
                                >
                                  {badge.label}
                                </span>
                                <span className="text-sm font-semibold text-slate-900">
                                  {ev.title}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">{ev.summary}</p>
                              <p className="pt-1 text-[11px] text-slate-400">
                                {formatDemoTime(ev.created_at)} (UK) • Demo Entry
                              </p>
                            </div>

                            {!ev.is_read && (
                              <button
                                type="button"
                                disabled
                                className="self-start shrink-0 cursor-not-allowed rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-400"
                              >
                                Preview only
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#323C4B]">
                        Today&apos;s Cart Demand (Demo)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        No visitor PII • Aggregate sample
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                      Demo
                    </span>
                  </div>
                  <ul className="mt-3 divide-y divide-slate-100 text-xs">
                    {DEMO_CART_DEMAND.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between py-2.5 gap-2"
                      >
                        <span className="font-semibold text-slate-800 truncate">
                          {c.name}
                        </span>
                        <span className="shrink-0 font-mono text-slate-600">
                          {c.units} units ({c.adds}×)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-[#323C4B]">
                      Stock Attention Needed (Demo)
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Read-only
                    </span>
                  </div>
                  <ul className="mt-3 divide-y divide-slate-100 text-xs">
                    {[...outOfStockProducts, ...lowStockProducts].map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between py-2.5 gap-2"
                      >
                        <span className="font-medium text-slate-800 truncate">
                          {p.name}
                        </span>
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
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#323C4B]">
                        Customer Enquiries (Demo)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        2 sample unread messages (Contact Us preview)
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Recent Demo Orders Snapshot */}
            <section aria-labelledby="demo-orders-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2
                  id="demo-orders-heading"
                  className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]"
                >
                  Recent Customer Orders (Demo)
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  Read-only table
                </span>
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
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DEMO_ORDERS.map((order) => (
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
                            £{order.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-semibold text-slate-400">
                            Preview only
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 4b: Read-Only Product Management Overview Snapshot */}
            <section aria-labelledby="demo-products-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2
                  id="demo-products-heading"
                  className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]"
                >
                  Product Catalogue Overview (Demo Read-Only)
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  Editing controls disabled in preview
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Sample Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Demo Price</th>
                        <th className="px-4 py-3 text-right">Stock</th>
                        <th className="px-4 py-3">Age Rule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DEMO_PRODUCTS.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-xs font-bold text-slate-900">
                            {prod.name}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {prod.category}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900">
                            £{prod.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                prod.stock_quantity <= 0
                                  ? "bg-red-100 text-red-800"
                                  : prod.stock_quantity <= 10
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {prod.stock_quantity} units
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {prod.is_age_restricted ? (
                              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-800">
                                18+ Challenge 25
                              </span>
                            ) : (
                              <span className="text-slate-400">Standard</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 5: Store Hub Rules & Challenge 25 Compliance */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#323C4B]">
                      Physical Hub &amp; Delivery Rules (Demo)
                    </h2>
                    <p className="text-xs text-slate-500">
                      147 North Hyde Road, Hayes, UB3 4NS • Delivery pricing safely unconfirmed
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    Preview only
                  </span>
                </div>
                <dl className="mt-4 divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between py-2">
                    <dt className="text-slate-500">Store Collection</dt>
                    <dd className="font-semibold text-emerald-700">
                      Enabled (Free £0.00)
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-slate-500">Home Delivery</dt>
                    <dd className="font-semibold text-amber-800">
                      Blocked — Pricing Not Confirmed
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-slate-500">Free Local Delivery</dt>
                    <dd className="font-semibold text-slate-900">
                      Within 1 mi strictly over £25.00
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-red-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Off-Licence &amp; Challenge 25
                    </h2>
                    <p className="text-xs text-slate-500">
                      Licensing Act 2003 Compliance
                    </p>
                  </div>
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                    Mandatory ID
                  </span>
                </div>
                <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                  Age-restricted products automatically trigger age declaration at checkout and require photo ID inspection upon delivery or counter collection.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
