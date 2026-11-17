"use client";

import { useState, useTransition } from "react";
import { updateContactMessageStatusAction } from "@/app/admin/actions";

export interface ContactMessageItem {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
}

export function ContactMessagesList({
  messages,
}: {
  messages: ContactMessageItem[];
}) {
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, "new" | "read" | "replied">
  >({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(
    id: string,
    nextStatus: "new" | "read" | "replied"
  ) {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateContactMessageStatusAction(id, nextStatus);
      if (res.success) {
        setStatusOverrides((prev) => ({ ...prev, [id]: nextStatus }));
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    });
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
        No customer enquiries submitted via Contact Us yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-xs">
        {messages.map((msg) => {
          const currentStatus = statusOverrides[msg.id] || msg.status;
          return (
            <div key={msg.id} className="p-5 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        currentStatus === "new"
                          ? "bg-amber-100 text-amber-800"
                          : currentStatus === "replied"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {currentStatus.toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-[#323C4B]">
                      {msg.subject}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    From <strong>{msg.name}</strong> (
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-[#323C4B] underline"
                    >
                      {msg.email}
                    </a>
                    {msg.phone ? ` • ${msg.phone}` : ""})
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {(["read", "replied"] as const).map((target) => (
                    <button
                      key={target}
                      type="button"
                      disabled={isPending || currentStatus === target}
                      onClick={() => handleStatusChange(msg.id, target)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      Mark {target}
                    </button>
                  ))}
                </div>
              </div>

              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-line">
                {msg.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
