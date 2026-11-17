import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import {
  AdminActivityFeed,
  type ActivityEventItem,
} from "@/components/admin/AdminActivityFeed";
import {
  ContactMessagesList,
  type ContactMessageItem,
} from "@/components/admin/ContactMessagesList";

export const metadata: Metadata = {
  title: "Activity, Alerts & Audit Logs",
};

function formatLondonTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AdminActivityPage() {
  const { supabase } = await requireAdminPage("/admin/activity");

  let migrationPending = false;
  let events: ActivityEventItem[] = [];
  const { data: evData, error: evErr } = await supabase
    .from("admin_activity_events")
    .select(
      "id, event_type, severity, title, summary, order_id, product_id, is_read, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (evErr) {
    if (
      evErr.message.includes("does not exist") ||
      evErr.message.includes("schema cache")
    ) {
      migrationPending = true;
    }
  } else if (evData) {
    events = evData as ActivityEventItem[];
  }

  let cartDaily: Array<{
    id: string;
    activity_date: string;
    product_id: string;
    product_name_snapshot: string;
    add_count: number;
    total_units_added: number;
  }> = [];

  if (!migrationPending) {
    const { data: cartRows } = await supabase
      .from("cart_activity_daily")
      .select("*")
      .order("activity_date", { ascending: false })
      .order("total_units_added", { ascending: false })
      .limit(20);
    if (cartRows) cartDaily = cartRows;
  }

  let stockHistory: Array<{
    id: string;
    product_id: string;
    previous_quantity: number;
    new_quantity: number;
    delta: number;
    reason: string;
    changed_by_email: string | null;
    notes: string | null;
    created_at: string;
    products?: { name: string } | null;
  }> = [];

  if (!migrationPending) {
    const { data: invRows } = await supabase
      .from("inventory_adjustments")
      .select("*, products(name)")
      .order("created_at", { ascending: false })
      .limit(25);
    if (invRows) {
      stockHistory = invRows as unknown as typeof stockHistory;
    }
  }

  const { data: contactRows, error: contactErr } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const contactMessages = (contactRows || []) as ContactMessageItem[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#323C4B] sm:text-3xl">
            Store Activity, Cart Metrics &amp; Audit Logs
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Verified payment notifications, privacy-safe aggregate cart activity, stock audit history, and customer enquiries.
          </p>
        </div>
        <Link
          href="/admin"
          className="self-start rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-[#323C4B] hover:bg-slate-50"
        >
          &larr; Back to Overview
        </Link>
      </div>

      {migrationPending && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="font-bold text-sm">Migration 004 Not Applied Yet</p>
          <p className="mt-1">
            Run{" "}
            <code className="font-mono font-semibold">
              supabase/migrations/004_admin_activity_and_inventory.sql
            </code>{" "}
            in Supabase SQL Editor to activate notifications, aggregate basket metrics, and inventory adjustment history.
          </p>
        </div>
      )}

      {/* 1. Notifications Feed */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]">
          1. Notifications &amp; Activity Stream
        </h2>
        <AdminActivityFeed events={events} />
      </section>

      {/* 2. Aggregate Basket Additions */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]">
            2. Aggregate Cart Activity (Privacy-Safe)
          </h2>
          <p className="text-xs text-slate-500">
            Product-level basket demand recorded on the server. Contains zero personal data, IP addresses, or visitor identifiers, and never reserves stock.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date (UK)</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Basket Additions</th>
                  <th className="px-4 py-3 text-right">Total Units Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cartDaily.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No aggregate cart activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  cartDaily.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {row.activity_date}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <Link
                          href={`/admin/products/${row.product_id}/edit`}
                          className="hover:underline"
                        >
                          {row.product_name_snapshot}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {row.add_count}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#323C4B]">
                        {row.total_units_added}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Inventory Adjustment Audit History */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]">
          3. Inventory Adjustment Audit History
        </h2>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Timestamp (UK)</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Change</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No inventory adjustments logged yet.
                    </td>
                  </tr>
                ) : (
                  stockHistory.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {formatLondonTime(adj.created_at)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {adj.products?.name || adj.product_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-mono whitespace-nowrap">
                        {adj.previous_quantity} &rarr; {adj.new_quantity}{" "}
                        <span
                          className={`ml-1 font-bold ${
                            adj.delta >= 0 ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          ({adj.delta >= 0 ? `+${adj.delta}` : adj.delta})
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">
                        {adj.reason.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {adj.changed_by_email || "Stripe Order / System"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Contact Us Enquiries */}
      <section id="enquiries" className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#323C4B]">
          4. Customer Enquiries (Contact Us)
        </h2>
        {contactErr ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            Could not load contact messages: {contactErr.message}
          </div>
        ) : (
          <ContactMessagesList messages={contactMessages} />
        )}
      </section>
    </div>
  );
}
