import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Order Management",
};

type OrderStatusType = Database["public"]["Tables"]["orders"]["Row"]["status"];
type PaymentStatusType = Database["public"]["Tables"]["orders"]["Row"]["payment_status"];
type FulfilmentType = Database["public"]["Tables"]["orders"]["Row"]["fulfilment_type"];

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    fulfilment?: string;
    payment?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

const PAGE_SIZE = 15;

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  processing: { label: "Processing", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  ready_for_pickup: { label: "Ready for Pickup", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  out_for_delivery: { label: "Out for Delivery", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  delivered: { label: "Delivered", bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  collected: { label: "Collected", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const PAYMENT_BADGES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  paid: { label: "Paid", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  unpaid: { label: "Unpaid", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  refunded: { label: "Refunded", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  failed: { label: "Failed", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

function formatLondonDateTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const statusFilter = params.status || "all";
  const fulfilmentFilter = params.fulfilment || "all";
  const paymentFilter = params.payment || "all";
  const searchQuery = (params.search || "").trim();
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";

  const supabase = await createServerSupabaseClient();

  // Build the query with server-side pagination & filtering
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, fulfilment_type, customer_name, customer_email, customer_phone, total, payment_status, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Status Filter
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter as OrderStatusType);
  }

  // Fulfilment Filter
  if (fulfilmentFilter !== "all") {
    query = query.eq("fulfilment_type", fulfilmentFilter as FulfilmentType);
  }

  // Payment Status Filter
  if (paymentFilter !== "all") {
    query = query.eq("payment_status", paymentFilter as PaymentStatusType);
  }

  // Search Filter: matches order_number, customer_name, or customer_email
  if (searchQuery) {
    query = query.or(
      `order_number.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`
    );
  }

  // Date Range Filters
  if (dateFrom) {
    query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo) {
    query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  // Pagination bounds
  const fromIndex = (currentPage - 1) * PAGE_SIZE;
  const toIndex = fromIndex + PAGE_SIZE - 1;
  query = query.range(fromIndex, toIndex);

  const { data: orders, count, error } = await query;
  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Customer Orders
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time grocery &amp; off-licence order queue for SIRAGRO (Hayes Hub: UB3 4NS).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            Total Orders: {totalCount}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs">
        <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
          {/* Search Box */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Search Orders
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={searchQuery}
                placeholder="Ref (e.g. SIR-123456), name, or email..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-hidden focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          {/* Fulfillment Status */}
          <div>
            <label htmlFor="status" className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Fulfillment Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={statusFilter}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-hidden focus:ring-1 focus:ring-green-600"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="collected">Collected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Fulfilment Type */}
          <div>
            <label htmlFor="fulfilment" className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Method
            </label>
            <select
              id="fulfilment"
              name="fulfilment"
              defaultValue={fulfilmentFilter}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-hidden focus:ring-1 focus:ring-green-600"
            >
              <option value="all">All Methods</option>
              <option value="delivery">Home Delivery</option>
              <option value="collection">In-Store Collection</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label htmlFor="payment" className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Payment
            </label>
            <select
              id="payment"
              name="payment"
              defaultValue={paymentFilter}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-hidden focus:ring-1 focus:ring-green-600"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:opacity-90"
              style={{ backgroundColor: "#323C4B" }}
            >
              Filter
            </button>
            <Link
              href="/admin/orders"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              title="Clear all filters"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Database Error Banner if query failed */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Unable to load orders from database:</p>
          <p className="mt-1 font-mono text-xs text-red-700">{error.message}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 font-semibold text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3.5 sm:px-6">Order Ref</th>
                <th scope="col" className="px-4 py-3.5">Date &amp; Time (UK)</th>
                <th scope="col" className="px-4 py-3.5">Customer</th>
                <th scope="col" className="px-4 py-3.5">Fulfilment</th>
                <th scope="col" className="px-4 py-3.5">Payment</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5 text-right">Total</th>
                <th scope="col" className="px-4 py-3.5 text-right sm:px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {(!orders || orders.length === 0) ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <svg
                      className="mx-auto h-10 w-10 text-gray-400 mb-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                      />
                    </svg>
                    <p className="font-semibold text-gray-900">No orders found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {searchQuery || statusFilter !== "all" || fulfilmentFilter !== "all"
                        ? "Try clearing filters to view all orders."
                        : "Orders placed by customers will appear here automatically."}
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusBadge =
                    STATUS_BADGES[order.status] || {
                      label: order.status,
                      bg: "bg-gray-100",
                      text: "text-gray-800",
                      border: "border-gray-200",
                    };
                  const paymentBadge =
                    PAYMENT_BADGES[order.payment_status] || {
                      label: order.payment_status,
                      bg: "bg-gray-100",
                      text: "text-gray-700",
                      dot: "bg-gray-400",
                    };

                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-gray-50/75"
                    >
                      {/* Order Reference */}
                      <td className="whitespace-nowrap px-4 py-4 sm:px-6 font-semibold text-gray-900">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>

                      {/* Date & Time */}
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-600">
                        {formatLondonDateTime(order.created_at)}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]" title={order.customer_email}>
                          {order.customer_email}
                        </div>
                      </td>

                      {/* Fulfilment */}
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                            order.fulfilment_type === "delivery"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {order.fulfilment_type === "delivery" ? "🚚 Delivery" : "🏬 Store Pickup"}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentBadge.bg} ${paymentBadge.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${paymentBadge.dot}`} />
                          {paymentBadge.label}
                        </span>
                      </td>

                      {/* Fulfillment Status */}
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-gray-900">
                        £{Number(order.total).toFixed(2)}
                      </td>

                      {/* Action */}
                      <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs"
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

        {/* Server-Side Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
            <div className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-900">{fromIndex + 1}</span> to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(toIndex + 1, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-gray-900">{totalCount}</span> orders
            </div>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/admin/orders?page=${currentPage - 1}&status=${statusFilter}&fulfilment=${fulfilmentFilter}&payment=${paymentFilter}&search=${encodeURIComponent(searchQuery)}`}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs"
                >
                  &larr; Previous
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed">
                  &larr; Previous
                </span>
              )}

              <span className="text-xs font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={`/admin/orders?page=${currentPage + 1}&status=${statusFilter}&fulfilment=${fulfilmentFilter}&payment=${paymentFilter}&search=${encodeURIComponent(searchQuery)}`}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs"
                >
                  Next &rarr;
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed">
                  Next &rarr;
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
