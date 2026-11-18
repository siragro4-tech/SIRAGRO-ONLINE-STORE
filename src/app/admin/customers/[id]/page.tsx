import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-auth";
import {
  calculateRevenueSummary,
  formatLondonDateTimeWithYear,
  isMissingSchemaError,
} from "@/lib/admin-rules";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CustomerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Buyer Account #${id.slice(0, 8)}`,
  };
}

export default async function AdminCustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id: profileId } = await params;
  const { supabase } = await requireAdminPage(`/admin/customers/${profileId}`);

  const { data: customer, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, phone, role, created_at")
    .eq("id", profileId)
    .maybeSingle();

  if (profileErr) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/customers"
          className="inline-flex text-xs font-bold text-[#323C4B] hover:underline"
        >
          &larr; Back to Buyers &amp; Accounts
        </Link>
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        >
          Could not load buyer profile: {profileErr.message}
        </div>
      </div>
    );
  }

  if (!customer) {
    notFound();
  }

  const [addressesRes, ordersRes] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .eq("profile_id", profileId)
      .order("is_default", { ascending: false }),
    supabase
      .from("orders")
      .select(
        "id, order_number, status, fulfilment_type, payment_status, total, created_at"
      )
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false }),
  ]);

  const queryErrors: string[] = [];
  if (addressesRes.error) {
    queryErrors.push(`Addresses query failed: ${addressesRes.error.message}`);
  }
  if (ordersRes.error) {
    queryErrors.push(`Orders query failed: ${ordersRes.error.message}`);
  }

  const rawOrders = ordersRes.data || [];
  const refundMap: Record<string, number> = {};
  if (rawOrders.length > 0) {
    const { data: refundRows, error: refundErr } = await supabase
      .from("orders")
      .select("id, refunded_amount")
      .eq("profile_id", profileId);

    if (refundErr && !isMissingSchemaError(refundErr.message)) {
      queryErrors.push(`Refund lookup failed: ${refundErr.message}`);
    } else if (refundRows) {
      for (const r of refundRows) {
        refundMap[r.id] = Number(r.refunded_amount || 0);
      }
    }
  }

  const orders = rawOrders.map((o) => ({
    ...o,
    refunded_amount: refundMap[o.id] ?? 0,
  }));

  const spend = calculateRevenueSummary(orders, "all");
  const completedCount = orders.filter(
    (o) => o.status === "delivered" || o.status === "collected"
  ).length;
  const fullName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const addresses = addressesRes.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <Link
            href="/admin/customers"
            className="inline-flex text-xs font-semibold text-slate-500 hover:text-[#323C4B] mb-2"
          >
            &larr; Back to Buyers &amp; Accounts
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#323C4B] sm:text-3xl">
              {fullName || customer.email}
            </h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                customer.role === "admin"
                  ? "bg-[#323C4B] text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {customer.role === "admin" ? "Administrator" : "Registered Buyer"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Joined {formatLondonDateTimeWithYear(customer.created_at)}
          </p>
        </div>
      </div>

      {queryErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        >
          <p className="font-bold">Some account details failed to load:</p>
          <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5 text-red-800">
            {queryErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Account Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Verified Net Spend
          </span>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900">
            {ordersRes.error ? "Error" : `£${spend.netPaidRevenue.toFixed(2)}`}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            From {spend.paidOrderCount} paid order(s)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Orders
          </span>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900">
            {ordersRes.error ? "Error" : orders.length}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Completed Orders
          </span>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900">
            {ordersRes.error ? "Error" : completedCount}
          </div>
          <p className="mt-1 text-xs text-emerald-800">Delivered or Collected</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Saved Addresses
          </span>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900">
            {addressesRes.error ? "Error" : addresses.length}
          </div>
        </div>
      </div>

      {/* Contact Info & Saved Addresses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-[#323C4B] border-b border-slate-100 pb-3">
            Contact Details
          </h2>
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-semibold text-slate-900">
                {fullName || "Not set"}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-mono text-xs text-blue-700">
                <a href={`mailto:${customer.email}`} className="hover:underline">
                  {customer.email}
                </a>
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Telephone</dt>
              <dd className="font-mono text-xs text-slate-900">
                {customer.phone || "Not provided"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-[#323C4B] border-b border-slate-100 pb-3">
            Saved Delivery Addresses
          </h2>
          {addressesRes.error ? (
            <p className="text-xs text-red-700 font-medium">
              Could not load addresses: {addressesRes.error.message}
            </p>
          ) : addresses.length === 0 ? (
            <p className="text-xs text-slate-500">
              No saved addresses for this buyer yet.
            </p>
          ) : (
            <ul className="space-y-3 text-xs">
              {addresses.map((addr) => (
                <li
                  key={addr.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">
                      {addr.label || "Saved Address"}
                    </span>
                    {addr.is_default && (
                      <span className="rounded-full bg-[#323C4B] px-2 py-0.5 text-[10px] font-bold text-white">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700">{addr.line_1}</p>
                  {addr.line_2 && <p className="text-slate-700">{addr.line_2}</p>}
                  <p className="text-slate-700">
                    {addr.city}
                    {addr.county ? `, ${addr.county}` : ""}
                  </p>
                  <p className="font-mono font-bold text-[#323C4B] mt-0.5">
                    {addr.postcode}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Buyer Order History */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-[#323C4B]">Order History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order Ref</th>
                <th className="px-4 py-3">Placed (UK)</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-xs text-slate-500"
                  >
                    This account has not placed any orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#323C4B]">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatLondonDateTimeWithYear(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 capitalize">
                      {order.fulfilment_type}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold capitalize">
                      {order.payment_status}
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
    </div>
  );
}
