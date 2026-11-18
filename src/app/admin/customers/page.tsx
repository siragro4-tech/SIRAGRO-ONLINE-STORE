import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import {
  calculateRevenueSummary,
  formatLondonShortDateTime,
  isMissingSchemaError,
} from "@/lib/admin-rules";

export const metadata: Metadata = {
  title: "Buyers & Accounts",
};

interface CustomersPageProps {
  searchParams: Promise<{
    tab?: string;
    search?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;
const GUEST_ORDERS_CAP = 500;

type CustomerTab = "registered" | "guests" | "admins";

function parseTab(raw?: string): CustomerTab {
  if (raw === "guests" || raw === "admins") return raw;
  return "registered";
}

export default async function AdminCustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;
  const activeTab = parseTab(params.tab);
  const searchQuery = (params.search || "").trim();
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const { supabase } = await requireAdminPage("/admin/customers");

  const queryErrors: string[] = [];

  // Summary counts for top tabs
  const [registeredCountRes, adminCountRes, guestOrderCountRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .is("profile_id", null),
    ]);

  if (registeredCountRes.error) {
    queryErrors.push(
      `Buyers count failed: ${registeredCountRes.error.message}`
    );
  }
  if (adminCountRes.error) {
    queryErrors.push(`Admin count failed: ${adminCountRes.error.message}`);
  }
  if (guestOrderCountRes.error) {
    queryErrors.push(
      `Guest orders count failed: ${guestOrderCountRes.error.message}`
    );
  }

  function buildTabHref(
    tab: CustomerTab,
    page = 1,
    search = searchQuery
  ): string {
    const qs = new URLSearchParams();
    if (tab !== "registered") qs.set("tab", tab);
    if (search) qs.set("search", search);
    if (page > 1) qs.set("page", String(page));
    const str = qs.toString();
    return str ? `/admin/customers?${str}` : "/admin/customers";
  }

  // Tab 1 & 3: Registered accounts / Admins from profiles
  let profilesList: Array<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: "customer" | "admin";
    created_at: string;
  }> = [];
  let totalMatchingProfiles = 0;

  const ordersByProfile: Record<
    string,
    Array<{
      id: string;
      status: string;
      payment_status: string;
      total: number;
      refunded_amount?: number;
      created_at: string;
    }>
  > = {};
  const addressCountByProfile: Record<string, number> = {};

  if (activeTab === "registered" || activeTab === "admins") {
    const roleFilter = activeTab === "admins" ? "admin" : "customer";
    let profileQuery = supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, role, created_at", {
        count: "exact",
      })
      .eq("role", roleFilter)
      .order("created_at", { ascending: false });

    if (searchQuery) {
      profileQuery = profileQuery.or(
        `email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
      );
    }

    const fromIdx = (currentPage - 1) * PAGE_SIZE;
    const toIdx = fromIdx + PAGE_SIZE - 1;
    profileQuery = profileQuery.range(fromIdx, toIdx);

    const { data: rows, count, error } = await profileQuery;
    if (error) {
      queryErrors.push(`Accounts query failed: ${error.message}`);
    } else {
      profilesList = rows || [];
      totalMatchingProfiles = count ?? 0;
    }

    const pageIds = profilesList.map((p) => p.id);
    if (pageIds.length > 0) {
      const [ordersRes, addrRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, profile_id, status, payment_status, total, created_at")
          .in("profile_id", pageIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("addresses")
          .select("profile_id")
          .in("profile_id", pageIds),
      ]);

      if (ordersRes.error) {
        queryErrors.push(
          `Buyer order totals query failed: ${ordersRes.error.message}`
        );
      } else {
        const orderIds = (ordersRes.data || []).map((o) => o.id);
        const refundMap: Record<string, number> = {};

        if (orderIds.length > 0) {
          const { data: refundRows, error: refundErr } = await supabase
            .from("orders")
            .select("id, refunded_amount")
            .in("id", orderIds);

          if (refundErr && !isMissingSchemaError(refundErr.message)) {
            queryErrors.push(`Refund lookup failed: ${refundErr.message}`);
          } else if (refundRows) {
            for (const row of refundRows) {
              refundMap[row.id] = Number(row.refunded_amount || 0);
            }
          }
        }

        for (const o of ordersRes.data || []) {
          if (!o.profile_id) continue;
          if (!ordersByProfile[o.profile_id]) {
            ordersByProfile[o.profile_id] = [];
          }
          ordersByProfile[o.profile_id].push({
            id: o.id,
            status: o.status,
            payment_status: o.payment_status,
            total: Number(o.total),
            refunded_amount: refundMap[o.id] ?? 0,
            created_at: o.created_at,
          });
        }
      }

      if (addrRes.error) {
        queryErrors.push(
          `Saved addresses count failed: ${addrRes.error.message}`
        );
      } else {
        for (const a of addrRes.data || []) {
          addressCountByProfile[a.profile_id] =
            (addressCountByProfile[a.profile_id] || 0) + 1;
        }
      }
    }
  }

  // Tab 2: Guest Checkouts (orders with profile_id IS NULL)
  interface GuestBuyerGroup {
    email: string;
    name: string;
    phone: string;
    orders: Array<{
      id: string;
      order_number: string;
      status: string;
      payment_status: string;
      total: number;
      refunded_amount?: number;
      created_at: string;
    }>;
  }

  let guestGroups: GuestBuyerGroup[] = [];
  let guestTruncated = false;

  if (activeTab === "guests") {
    let guestQuery = supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_email, customer_phone, status, payment_status, total, created_at"
      )
      .is("profile_id", null)
      .order("created_at", { ascending: false })
      .limit(GUEST_ORDERS_CAP);

    if (searchQuery) {
      guestQuery = guestQuery.or(
        `customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%,order_number.ilike.%${searchQuery}%`
      );
    }

    const { data: guestRows, error: guestErr } = await guestQuery;
    if (guestErr) {
      queryErrors.push(`Guest checkout query failed: ${guestErr.message}`);
    } else if (guestRows) {
      guestTruncated = guestRows.length === GUEST_ORDERS_CAP;
      const byEmail = new Map<string, GuestBuyerGroup>();

      for (const row of guestRows) {
        const key = (row.customer_email || row.id).toLowerCase();
        const existing = byEmail.get(key);
        const entry = {
          id: row.id,
          order_number: row.order_number,
          status: row.status,
          payment_status: row.payment_status,
          total: Number(row.total),
          created_at: row.created_at,
        };
        if (existing) {
          existing.orders.push(entry);
        } else {
          byEmail.set(key, {
            email: row.customer_email,
            name: row.customer_name,
            phone: row.customer_phone,
            orders: [entry],
          });
        }
      }

      guestGroups = Array.from(byEmail.values());
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalMatchingProfiles / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#323C4B] sm:text-3xl">
            Buyers &amp; Customer Accounts
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Inspect registered customer accounts, saved delivery addresses, guest checkouts, order counts, and verified spend.
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="self-start rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-[#323C4B] hover:bg-slate-50 shadow-2xs"
        >
          View All Orders &rarr;
        </Link>
      </div>

      {queryErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        >
          <p className="font-bold">Some buyer account data could not be loaded:</p>
          <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5 text-red-800">
            {queryErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildTabHref("registered", 1)}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
              activeTab === "registered"
                ? "bg-[#323C4B] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Registered Buyers (
            {registeredCountRes.error ? "?" : (registeredCountRes.count ?? 0)})
          </Link>
          <Link
            href={buildTabHref("guests", 1)}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
              activeTab === "guests"
                ? "bg-[#323C4B] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Guest Checkouts (
            {guestOrderCountRes.error ? "?" : (guestOrderCountRes.count ?? 0)}{" "}
            orders)
          </Link>
          <Link
            href={buildTabHref("admins", 1)}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
              activeTab === "admins"
                ? "bg-[#323C4B] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Admin Accounts (
            {adminCountRes.error ? "?" : (adminCountRes.count ?? 0)})
          </Link>
        </div>

        <form method="GET" className="flex flex-col gap-2 sm:flex-row">
          {activeTab !== "registered" && (
            <input type="hidden" name="tab" value={activeTab} />
          )}
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search buyer name, email, or phone number..."
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
              href={buildTabHref(activeTab, 1, "")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Registered Buyers & Admin Audit Table */}
      {(activeTab === "registered" || activeTab === "admins") && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Account Holder</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Joined (UK)</th>
                  <th className="px-4 py-3.5 text-center">Addresses</th>
                  <th className="px-4 py-3.5 text-center">Orders</th>
                  <th className="px-4 py-3.5 text-center">Completed</th>
                  <th className="px-4 py-3.5 text-right">Verified Spend</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profilesList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-xs text-slate-500"
                    >
                      {searchQuery
                        ? "No accounts matched your search."
                        : activeTab === "admins"
                          ? "No admin accounts returned."
                          : "No registered customer accounts yet."}
                    </td>
                  </tr>
                ) : (
                  profilesList.map((acct) => {
                    const acctOrders = ordersByProfile[acct.id] || [];
                    const completedCount = acctOrders.filter(
                      (o) => o.status === "delivered" || o.status === "collected"
                    ).length;
                    const spend = calculateRevenueSummary(acctOrders, "all");
                    const fullName = [acct.first_name, acct.last_name]
                      .filter(Boolean)
                      .join(" ")
                      .trim();
                    const addrCount = addressCountByProfile[acct.id] || 0;

                    return (
                      <tr key={acct.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">
                            {fullName || "Name not provided"}
                          </div>
                          <div className="text-xs text-slate-600">
                            {acct.email}
                          </div>
                          {acct.phone && (
                            <div className="text-[11px] font-mono text-slate-500">
                              {acct.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              acct.role === "admin"
                                ? "bg-[#323C4B] text-white"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {acct.role === "admin" ? "Admin" : "Buyer"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                          {formatLondonShortDateTime(acct.created_at)}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-700">
                          {addrCount}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-slate-800">
                          {acctOrders.length}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-emerald-700">
                          {completedCount}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-slate-900">
                          £{spend.netPaidRevenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/customers/${acct.id}`}
                            className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#323C4B] hover:bg-slate-100"
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
                Page {currentPage} of {totalPages} ({totalMatchingProfiles}{" "}
                accounts)
              </span>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={buildTabHref(activeTab, currentPage - 1)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-[#323C4B] hover:bg-slate-100"
                  >
                    &larr; Previous
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={buildTabHref(activeTab, currentPage + 1)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-[#323C4B] hover:bg-slate-100"
                  >
                    Next &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guest Checkouts Table */}
      {activeTab === "guests" && (
        <div className="space-y-3">
          {guestTruncated && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              Showing grouped guest buyers across the latest {GUEST_ORDERS_CAP}{" "}
              guest orders. Use search to narrow older records.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Guest Buyer</th>
                    <th className="px-4 py-3.5">Latest Order (UK)</th>
                    <th className="px-4 py-3.5 text-center">Orders</th>
                    <th className="px-4 py-3.5 text-center">Completed</th>
                    <th className="px-4 py-3.5 text-right">Verified Spend</th>
                    <th className="px-4 py-3.5 text-right">Latest Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {guestGroups.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-xs text-slate-500"
                      >
                        {searchQuery
                          ? "No guest checkout orders matched your search."
                          : "No guest orders have been placed yet."}
                      </td>
                    </tr>
                  ) : (
                    guestGroups.map((g) => {
                      const completedCount = g.orders.filter(
                        (o) =>
                          o.status === "delivered" || o.status === "collected"
                      ).length;
                      const spend = calculateRevenueSummary(g.orders, "all");
                      const latest = g.orders[0];

                      return (
                        <tr key={g.email} className="hover:bg-slate-50">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">
                              {g.name}
                            </div>
                            <div className="text-xs text-slate-600">
                              {g.email}
                            </div>
                            {g.phone && (
                              <div className="text-[11px] font-mono text-slate-500">
                                {g.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                            {latest
                              ? formatLondonShortDateTime(latest.created_at)
                              : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-slate-800">
                            {g.orders.length}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-emerald-700">
                            {completedCount}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-slate-900">
                            £{spend.netPaidRevenue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {latest && (
                              <Link
                                href={`/admin/orders/${latest.id}`}
                                className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#323C4B] hover:bg-slate-100"
                              >
                                {latest.order_number} &rarr;
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
