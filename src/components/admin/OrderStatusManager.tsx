"use client";

import { useState } from "react";
import {
  updateOrderStatusAction,
  retryOrderNotificationAction,
  updateOrderNotesAction,
  ALLOWED_TRANSITIONS,
  type OrderStatus,
} from "@/app/admin/orders/actions";

interface OrderStatusManagerProps {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  fulfilmentType: "delivery" | "collection";
  customerEmail: string;
  initialNotes?: string | null;
  statusHistory?: Array<{
    id: string;
    previous_status: string | null;
    new_status: string;
    changed_by_email: string;
    notes: string | null;
    created_at: string;
  }>;
  notifications?: Array<{
    id: string;
    recipient_email: string;
    status_target: string;
    send_status: "pending" | "sent" | "failed";
    last_error: string | null;
    sent_at: string | null;
    created_at: string;
    attempt_count: number;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing (Preparing Items)",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered (Completed)",
  collected: "Collected (Completed)",
  cancelled: "Cancelled",
};

export function OrderStatusManager({
  orderId,
  orderNumber,
  currentStatus,
  fulfilmentType,
  customerEmail,
  initialNotes,
  statusHistory = [],
  notifications = [],
}: OrderStatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  // Editable store notes state
  const [storeNotes, setStoreNotes] = useState(initialNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesMessage, setNotesMessage] = useState<string | null>(null);

  // Retrying notifications
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Determine allowed transitions from the current state
  const allowedNext = ALLOWED_TRANSITIONS[fulfilmentType]?.[currentStatus] || [];
  const isTerminal = allowedNext.length === 0;

  async function handleStatusChange(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStatus) return;

    setIsUpdating(true);
    setActionMessage(null);

    try {
      const res = await updateOrderStatusAction(
        orderId,
        selectedStatus as OrderStatus,
        notes,
        sendEmail
      );

      if (!res.success) {
        setActionMessage({
          type: "error",
          text: res.error || "Failed to update status",
        });
      } else if (res.noop) {
        setActionMessage({
          type: "warning",
          text: res.message || "No changes made.",
        });
      } else {
        let msg = res.message || "Status updated successfully.";
        if (res.emailSent) {
          msg += ` Notification email dispatched to ${customerEmail}.`;
        } else if (res.emailError) {
          msg += ` Warning: Status updated, but email sending failed: ${res.emailError}`;
        }
        setActionMessage({
          type: res.emailError ? "warning" : "success",
          text: msg,
        });
        setSelectedStatus("");
        setNotes("");
      }
    } catch (err: unknown) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSaveNotes() {
    setIsSavingNotes(true);
    setNotesMessage(null);
    try {
      const res = await updateOrderNotesAction(orderId, storeNotes);
      if (res.success) {
        setNotesMessage("Store notes saved successfully.");
      } else {
        setNotesMessage(res.error || "Failed to save notes.");
      }
    } catch {
      setNotesMessage("Failed to save notes.");
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function handleRetryNotification(notifId: string) {
    setRetryingId(notifId);
    try {
      const res = await retryOrderNotificationAction(orderId, notifId);
      if (res.success) {
        setActionMessage({ type: "success", text: res.message });
      } else {
        setActionMessage({
          type: "error",
          text: `${res.message}: ${res.error || "Unknown error"}`,
        });
      }
    } catch (err: unknown) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Retry failed",
      });
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Controller Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Fulfillment Workflow Control (#{orderNumber})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Strict state machine for {fulfilmentType === "delivery" ? "Home Delivery" : "In-Store Collection"}.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Current:{" "}
            <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-gray-800">
              {currentStatus}
            </span>
          </span>
        </div>

        {/* Action feedback banner */}
        {actionMessage && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : actionMessage.type === "warning"
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {/* Transition Form */}
        {isTerminal ? (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 border border-gray-200">
            <p className="font-semibold text-gray-900">Order is in a terminal state ({currentStatus})</p>
            <p className="mt-1 text-xs">
              No further operational fulfillment transitions are permitted for completed or cancelled orders.
            </p>
          </div>
        ) : (
          <form onSubmit={handleStatusChange} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="new-status"
                className="block text-xs font-semibold uppercase text-gray-700 mb-1"
              >
                Advance Status To:
              </label>
              <select
                id="new-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-hidden focus:ring-1 focus:ring-green-600"
              >
                <option value="">-- Select Valid Next Step --</option>
                {allowedNext.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st] || st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="transition-notes"
                className="block text-xs font-semibold uppercase text-gray-700 mb-1"
              >
                Transition Notes / Reason (Optional)
              </label>
              <input
                type="text"
                id="transition-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Dispatched with Driver John / Packed on shelf B2..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-hidden focus:ring-1 focus:ring-green-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="send-email"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded-sm border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="send-email" className="text-xs text-gray-700">
                Send automatic customer status email to{" "}
                <span className="font-semibold text-gray-900">{customerEmail}</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!selectedStatus || isUpdating}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#323C4B" }}
              >
                {isUpdating ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Updating Status...
                  </>
                ) : (
                  "Update Fulfillment Status"
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <p>
            🔒 <strong className="text-gray-700">Payment Security:</strong> Payment status is
            managed exclusively by Stripe Webhooks. Fulfillment status cannot alter financial or
            payment balances.
          </p>
        </div>
      </div>

      {/* Internal Store Notes Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Internal Store &amp; Courier Notes</h3>
        <textarea
          value={storeNotes}
          onChange={(e) => setStoreNotes(e.target.value)}
          rows={3}
          placeholder="Store staff notes, delivery instructions, driver observations..."
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-green-600 focus:outline-hidden focus:ring-1 focus:ring-green-600"
        />
        {notesMessage && (
          <p className="mt-2 text-xs font-semibold text-green-700">{notesMessage}</p>
        )}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={isSavingNotes}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            {isSavingNotes ? "Saving..." : "Save Internal Notes"}
          </button>
        </div>
      </div>

      {/* Audit History Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Status Change Audit Trail</h3>
        {statusHistory.length === 0 ? (
          <p className="text-xs text-gray-500">No status changes recorded yet.</p>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {statusHistory.map((item, idx) => (
                <li key={item.id}>
                  <div className="relative pb-8">
                    {idx !== statusHistory.length - 1 && (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-xs text-gray-700">
                            Changed to{" "}
                            <span className="font-semibold text-gray-900">
                              {STATUS_LABELS[item.new_status] || item.new_status}
                            </span>{" "}
                            {item.previous_status && (
                              <span className="text-gray-400">
                                (from {item.previous_status})
                              </span>
                            )}
                          </p>
                          {item.notes && (
                            <p className="mt-1 text-xs text-gray-500 italic">
                              &ldquo;{item.notes}&rdquo;
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            By: {item.changed_by_email}
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleTimeString("en-GB", {
                            timeZone: "Europe/London",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Customer Email Notification Logs & Retry */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Email Notification Logs</h3>
        {notifications.length === 0 ? (
          <p className="text-xs text-gray-500">No email notification events recorded for this order.</p>
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {notifications.map((notif) => (
              <div key={notif.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${
                        notif.send_status === "sent"
                          ? "bg-green-100 text-green-800"
                          : notif.send_status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {notif.send_status.toUpperCase()}
                    </span>
                    <span className="font-medium text-gray-800">
                      Target: {notif.status_target}
                    </span>
                    <span className="text-gray-400">({notif.recipient_email})</span>
                  </div>
                  {notif.last_error && (
                    <p className="text-red-600 mt-1">Error: {notif.last_error}</p>
                  )}
                  <p className="text-gray-400 mt-0.5">
                    {new Date(notif.created_at).toLocaleString("en-GB", {
                      timeZone: "Europe/London",
                    })}
                  </p>
                </div>

                {notif.send_status === "failed" && (
                  <button
                    type="button"
                    onClick={() => handleRetryNotification(notif.id)}
                    disabled={retryingId === notif.id}
                    className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {retryingId === notif.id ? "Retrying..." : "Retry Email"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
