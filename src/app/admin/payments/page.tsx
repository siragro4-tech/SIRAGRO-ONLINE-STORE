import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import {
  calculateRevenueSummary,
  formatLondonDateTimeWithYear,
  isMissingSchemaError,
  isStripeSecretConfigured,
  isStripeWebhookConfigured,
  type SalesPeriod,
} from "@/lib/admin-rules";
import { isEmailProviderConfigured } from "@/lib/email-status";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Payments & Revenue",
};

type PaymentStatusType = Database["public"]["Tables"]["orders"]["Row"]["payment_status"];

interface PaymentsPageProps {
  searchParams: Promise<{
    period?: string;
    payment?: string;
    search?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;
const ANALYTICS_CAP = 2000;

const PERIOD_LABELS: Record<SalesPeriod, string> = {
  all: "All Time",
  month: "This Month",
  "7d": "Last 7 Days",
  today: "Today (UK)",
};

function parsePeriod(raw?: string): SalesPeriod {
  if (raw === "today" || raw === "7d" || raw === "month" || raw === "all") {
    return raw;
  }
  return "all";
}

function getPeriodQueryStartIso(period: SalesPeriod, now: Date): string | null {
  const copy = new Date(now);
  if (period === "today") {
    copy.setUTCDate(copy.getUTCDate() - 2);
    return copy.toISOString();
  }
  if (period === "7d") {
    copy.setUTCDate(copy.getUTCDate() - 9);
    return copy.toISOString();
  }
  if (period === "month") {
    copy.setUTCDate(copy.getUTCDate() - 33);
    return copy.toISOString();
  }
  return null;
}

const PAYMENT_BADGE_MAP: Record<string, { label: string; badgeClass: string }> = {
  paid: {
    label: "Paid (Verified)",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  unpaid: {
    label: "Unpaid / Pending",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  refunded: {
    label: "Refunded",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  failed: {
    label: "Failed",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
};

export default async function AdminPaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const params = await searchParams;
  const selectedPeriod = parsePeriod(params.period);
  const paymentFilter = params.payment || "all";
  const searchQuery = (params.search || "").trim();
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const { supabase } = await requireAdminPage("/admin/payments");

  const now = new Date();
  const periodStartIso = getPeriodQueryStartIso(selectedPeriod, now);
  const queryErrors: string[] = [];

  // Server-side boolean gateway checks (never exposes keys or secret values)
  const stripeKeyOk = isStripeSecretConfigured(process.env.STRIPE_SECRET_KEY);
  const stripeWebhookOk = isStripeWebhookConfigured(
    process.env.STRIPE_WEBHOOK_SECRET
  );
  const resendEmailOk = isEmailProviderConfigured(process.env.RESEND_API_KEY);

  let analyticsQuery = supabase
    .from("orders")
    .select("id, payment_status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(ANALYTICS_CAP);

  if (periodStartIso) {
    analyticsQuery = analyticsQuery.gte("created_at", periodStartIso);
  }

  let ledgerQuery = supabase
    .from("orders")
    .select(
      "id, order_number, status, fulfilment_type, customer_name, customer_email, subtotal, delivery_charge, total, stripe_checkout_session_id, stripe_payment_intent_id, payment_status, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (
    paymentFilter === "paid" ||
    paymentFilter === "unpaid" ||
    paymentFilter === "refunded" ||
    paymentFilter === "failed"
  ) {
    ledgerQuery = ledgerQuery.eq(
      "payment_status",
      paymentFilter as PaymentStatusType
    );
  }

  if (searchQuery) {
    ledgerQuery = ledgerQuery.or(
      `order_number.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,stripe_payment_intent_id.ilike.%${searchQuery}%,stripe_checkout_session_id.ilike.%${searchQuery}%`
    );
  }

  const fromIndex = (currentPage - 1) * PAGE_SIZE;
  const toIndex = fromIndex + PAGE_SIZE - 1;
  ledgerQuery = ledgerQuery.range(fromIndex, toIndex);

  const [analyticsRes, ledgerRes, deliverySettingsRes] = await Promise.all([
    analyticsQuery,
    ledgerQuery,
    supabase.from("delivery_settings").select("*").limit(1).maybeSingle(),
  ]);

  if (analyticsRes.error) {
    queryErrors.push(`Revenue analytics query failed: ${analyticsRes.error.message}`);
  }
  if (ledgerRes.error) {
    queryErrors.push(`Transactions query failed: ${ledgerRes.error.message}`);
  }
  if (deliverySettingsRes.error) {
    queryErrors.push(
      `Delivery settings query failed: ${deliverySettingsRes.error.message}`
    );
  }

  // Safely look up migration 004 refunded_amount column for displayed + analytics rows
  const refundMap: Record<string, number> = {};
  let refundSchemaSupported = true;
  const allRelevantIds = Array.from(
    new Set([
      ...(analyticsRes.data || [])
        .filter((o) => o.payment_status === "paid" || o.payment_status === "refunded")
        .map((o) => o.id),
      ...(ledgerRes.data || []).map((o) => o.id),
    ])
  );

  if (!analyticsRes.error && !ledgerRes.error && allRelevantIds.length > 0) {
    const { data: refundRows, error: refundErr } = await supabase
      .from("orders")
      .select("id, refunded_amount")
      .in("id", allRelevantIds);

    if (refundErr) {
      refundSchemaSupported = false;
      if (!isMissingSchemaError(refundErr.message)) {
        queryErrors.push(`Refund amount lookup failed: ${refundErr.message}`);
      }
    } else if (refundRows) {
      for (const r of refundRows) {
        refundMap[r.id] = Number(r.refunded_amount || 0);
      }
    }
  }

  const enrichedAnalytics = (analyticsRes.data || []).map((o) => ({
    ...o,
    refunded_amount: refundMap[o.id] ?? 0,
  }));

  const revenueSummary = !analyticsRes.error
    ? calculateRevenueSummary(enrichedAnalytics, selectedPeriod, now)
    : null;
  const analyticsTruncated =
    !analyticsRes.error && (analyticsRes.data || []).length === ANALYTICS_CAP;

  const transactions = ledgerRes.data || [];
  const totalCount = ledgerRes.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const deliverySettings = deliverySettingsRes.data;
  const isDeliveryPricingConfirmed =
    Boolean(deliverySettings) &&
    (deliverySettings as { is_delivery_pricing_confirmed?: boolean })
      .is_delivery_pricing_confirmed === true;

  function buildUrl(overrides: {
    period?: SalesPeriod;
    payment?: string;
    search?: string;
    page?: number;
  }): string {
    const qs = new URLSearchParams();
    const per = overrides.period ?? selectedPeriod;
    const pay = overrides.payment ?? paymentFilter;
    const q = overrides.search !== undefined ? overrides.search : searchQuery;
    const pg = overrides.page ?? currentPage;

    if (per !== "all") qs.set("period", per);
    if (pay && pay !== "all") qs.set("payment", pay);
    if (q) qs.set("search", q);
    if (pg > 1) qs.set("page", String(pg));

    const str = qs.toString();
    return str ? `/admin/payments?${str}` : "/admin/payments";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#323C4B] sm:text-3xl">
            Payments &amp; Revenue Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track Stripe-verified payments, unpaid checkout sessions, refunds, and gateway health.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Payment metrics period">
          {(["all", "month", "7d", "today"] as SalesPeriod[]).map((p) => (
            <Link
              key={p}
              href={buildUrl({ period: p })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedPeriod === p
                  ? "bg-[#323C4B] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {PERIOD_LABELS[p]}
            </Link>
          ))}
        </div>
      </div>

      {queryErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        >
          <p className="font-bold">Some payment metrics could not be loaded:</p>
          <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5 text-red-800">
            {queryErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {analyticsTruncated && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Revenue summary cards reflect the latest {ANALYTICS_CAP} orders for this window.
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            {!refundSchemaSupported
              ? "Gross Paid Sales (Refund column pending)"
              : revenueSummary?.hasRecordedRefunds
                ? `Net Paid Revenue (${PERIOD_LABELS[selectedPeriod]})`
                : `Gross Paid Sales (${PERIOD_LABELS[selectedPeriod]})`}
          </span>
          <div className="mt-2 font-mono text-3xl font-black text-slate-900">
            {revenueSummary
              ? `£${(refundSchemaSupported && revenueSummary.hasRecordedRefunds
                  ? revenueSummary.netPaidRevenue
                  : revenueSummary.grossPaidRevenue
                ).toFixed(2)}`
              : "Error"}
          </div>
          <p className="mt-1.5 text-xs font-medium text-emerald-800">
            {revenueSummary
              ? `${revenueSummary.paidOrderCount} settled order(s)`
              : "Query error"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Refunded Total
          </span>
          <div className="mt-2 font-mono text-3xl font-black text-orange-700">
            {revenueSummary
              ? `£${revenueSummary.refundedTotal.toFixed(2)}`
              : "Error"}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Deducted from net revenue
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Unpaid / Pending Sessions
          </span>
          <div className="mt-2 font-mono text-3xl font-black text-slate-900">
            {revenueSummary ? revenueSummary.awaitingPaymentCount : "Error"}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Excluded from paid revenue
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Failed Attempts
          </span>
          <div className="mt-2 font-mono text-3xl font-black text-red-700">
            {revenueSummary ? revenueSummary.failedPaymentCount : "Error"}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Excluded from paid revenue
          </p>
        </div>
      </div>

      {/* Gateway & Payment Rules Configuration Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]">
              Payment Gateway &amp; Checkout Controls Status
            </h2>
            <p className="text-xs text-slate-500">
              Server-verified readiness flags (Stripe secret keys are never exposed in admin UI).
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="text-xs font-bold text-[#323C4B] hover:underline"
          >
            Fulfilment &amp; Delivery Settings &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block font-semibold text-slate-500">
              Stripe Checkout API
            </span>
            <span
              className={`mt-1 inline-block font-bold ${
                stripeKeyOk ? "text-emerald-700" : "text-amber-800"
              }`}
            >
              {stripeKeyOk ? "Configured" : "Not configured"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block font-semibold text-slate-500">
              Stripe Webhook Signing
            </span>
            <span
              className={`mt-1 inline-block font-bold ${
                stripeWebhookOk ? "text-emerald-700" : "text-amber-800"
              }`}
            >
              {stripeWebhookOk ? "Configured" : "Not configured"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block font-semibold text-slate-500">
              Receipt Email Provider
            </span>
            <span
              className={`mt-1 inline-block font-bold ${
                resendEmailOk ? "text-emerald-700" : "text-amber-800"
              }`}
            >
              {resendEmailOk ? "Resend Configured" : "Not configured"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block font-semibold text-slate-500">
              Delivery Charge Gate
            </span>
            <span
              className={`mt-1 inline-block font-bold ${
                isDeliveryPricingConfirmed ? "text-emerald-700" : "text-amber-800"
              }`}
            >
              {deliverySettingsRes.error
                ? "Unverified (Error)"
                : isDeliveryPricingConfirmed
                  ? "Pricing Confirmed"
                  : "Blocked (Fees Unconfirmed)"}
            </span>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Transactions" },
            { id: "paid", label: "Paid (Verified)" },
            { id: "unpaid", label: "Unpaid / Pending" },
            { id: "refunded", label: "Refunded" },
            { id: "failed", label: "Failed" },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={buildUrl({ payment: tab.id, page: 1 })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                paymentFilter === tab.id
                  ? "bg-[#323C4B] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <form method="GET" className="flex flex-col gap-2 sm:flex-row">
          {selectedPeriod !== "all" && (
            <input type="hidden" name="period" value={selectedPeriod} />
          )}
          {paymentFilter !== "all" && (
            <input type="hidden" name="payment" value={paymentFilter} />
          )}
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search Order Ref, buyer email, or Stripe pi_ / cs_ reference..."
            className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-[#323C4B] px-5 py-2 text-xs font-bold text-white hover:bg-[#242c37]"
            >
              Search
            </button>
            <Link
              href={buildUrl({ payment: "all", search: "", page: 1 })}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Payment Transactions Ledger */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Order Ref</th>
                <th className="px-4 py-3.5">Date &amp; Time (UK)</th>
                <th className="px-4 py-3.5">Buyer</th>
                <th className="px-4 py-3.5">Payment Status</th>
                <th className="px-4 py-3.5">Stripe Reference</th>
                <th className="px-4 py-3.5 text-right">Order Total</th>
                <th className="px-4 py-3.5 text-right">Refunded</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-xs text-slate-500"
                  >
                    No payment records matched your filter.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const badge = PAYMENT_BADGE_MAP[tx.payment_status] || {
                    label: tx.payment_status,
                    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                  };
                  const refunded = refundMap[tx.id] ?? 0;
                  const stripeRef =
                    tx.stripe_payment_intent_id || tx.stripe_checkout_session_id;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#323C4B]">
                        {tx.order_number}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {formatLondonDateTimeWithYear(tx.created_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-semibold text-slate-900">
                          {tx.customer_name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {tx.customer_email}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.badgeClass}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {stripeRef ? (
                          <span title={stripeRef}>
                            {stripeRef.length > 22
                              ? `${stripeRef.slice(0, 12)}…${stripeRef.slice(-6)}`
                              : stripeRef}
                          </span>
                        ) : (
                          <span className="text-slate-400">No session ref</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-slate-900">
                        £{Number(tx.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-orange-700">
                        {refunded > 0 ? `−£${refunded.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${tx.id}`}
                          className="text-xs font-bold text-[#323C4B] hover:underline"
                        >
                          Inspect &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs">
            <span className="text-slate-600">
              Page {currentPage} of {totalPages} ({totalCount} transactions)
            </span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={buildUrl({ page: currentPage - 1 })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-[#323C4B] hover:bg-slate-100"
                >
                  &larr; Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={buildUrl({ page: currentPage + 1 })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-[#323C4B] hover:bg-slate-100"
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
