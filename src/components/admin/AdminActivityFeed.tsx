"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  markActivityReadAction,
  markAllActivityReadAction,
} from "@/app/admin/actions";

export interface ActivityEventItem {
  id: string;
  event_type: string;
  severity: "info" | "success" | "warning" | "error";
  title: string;
  summary: string;
  order_id: string | null;
  product_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface AdminActivityFeedProps {
  events: ActivityEventItem[];
  showFilters?: boolean;
  emptyMessage?: string;
}

const EVENT_BADGES: Record<
  string,
  { label: string; badgeClass: string }
> = {
  order_paid: {
    label: "Paid (Stripe)",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  order_placed_unpaid: {
    label: "Awaiting Payment",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  order_refunded: {
    label: "Refunded",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  order_payment_failed: {
    label: "Payment Failed",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
  cart_activity: {
    label: "Cart Activity",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
  },
  low_stock_alert: {
    label: "Low Stock",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
  },
  out_of_stock_alert: {
    label: "Out of Stock",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
  inventory_adjusted: {
    label: "Stock Edit",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  order_status_updated: {
    label: "Order Update",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  contact_message: {
    label: "Enquiry",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
  },
};

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminActivityFeed({
  events,
  showFilters = true,
  emptyMessage = "No activity recorded yet. Paid orders, awaiting-payment checkouts, grouped basket additions, and stock alerts will appear here.",
}: AdminActivityFeedProps) {
  const [filter, setFilter] = useState<string>("all");
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemsWithLocalRead = events.map((ev) => ({
    ...ev,
    is_read: ev.is_read || Boolean(readIds[ev.id]),
  }));

  const filtered = itemsWithLocalRead.filter((ev) => {
    if (filter === "all") return true;
    if (filter === "unread") return !ev.is_read;
    if (filter === "orders") {
      return [
        "order_paid",
        "order_placed_unpaid",
        "order_refunded",
        "order_payment_failed",
        "order_status_updated",
      ].includes(ev.event_type);
    }
    if (filter === "stock") {
      return [
        "low_stock_alert",
        "out_of_stock_alert",
        "inventory_adjusted",
      ].includes(ev.event_type);
    }
    if (filter === "cart") return ev.event_type === "cart_activity";
    return true;
  });

  const unreadCount = itemsWithLocalRead.filter((e) => !e.is_read).length;

  function handleMarkRead(id: string) {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await markActivityReadAction(id);
      if (res.success) {
        setReadIds((prev) => ({ ...prev, [id]: true }));
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    });
  }

  function handleMarkAllRead() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await markAllActivityReadAction();
      if (res.success) {
        const next: Record<string, boolean> = {};
        for (const ev of events) next[ev.id] = true;
        setReadIds(next);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: `All (${itemsWithLocalRead.length})` },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "orders", label: "Orders & Payments" },
              { id: "cart", label: "Cart Activity" },
              { id: "stock", label: "Stock Alerts" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  filter === tab.id
                    ? "bg-[#323C4B] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleMarkAllRead}
              className="self-start sm:self-auto text-xs font-semibold text-[#323C4B] hover:underline disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {filtered.map((ev) => {
            const badge = EVENT_BADGES[ev.event_type] || {
              label: ev.event_type,
              badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
            };

            return (
              <li
                key={ev.id}
                className={`p-4 transition-colors ${
                  ev.is_read ? "bg-white" : "bg-slate-50/80"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!ev.is_read && (
                        <span
                          className="h-2 w-2 rounded-full bg-[#323C4B]"
                          title="Unread notification"
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
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>{formatTime(ev.created_at)} (UK)</span>
                      {ev.order_id && (
                        <Link
                          href={`/admin/orders/${ev.order_id}`}
                          className="font-semibold text-[#323C4B] hover:underline"
                        >
                          Inspect Order &rarr;
                        </Link>
                      )}
                      {ev.product_id && (
                        <Link
                          href={`/admin/products/${ev.product_id}/edit`}
                          className="font-semibold text-[#323C4B] hover:underline"
                        >
                          Edit Product &rarr;
                        </Link>
                      )}
                    </div>
                  </div>

                  {!ev.is_read && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleMarkRead(ev.id)}
                      className="self-start rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
