"use client";

import { useState, useTransition } from "react";
import { updateDeliverySettingsAction } from "@/app/admin/actions";

interface DeliverySettingsFormProps {
  settings: {
    id: string;
    is_delivery_enabled: boolean;
    is_collection_enabled: boolean;
    is_delivery_pricing_confirmed?: boolean;
    notes: string | null;
  };
}

export function DeliverySettingsForm({ settings }: DeliverySettingsFormProps) {
  const isPricingConfirmed = settings.is_delivery_pricing_confirmed === true;
  const [deliveryEnabled, setDeliveryEnabled] = useState(
    settings.is_delivery_enabled
  );
  const [collectionEnabled, setCollectionEnabled] = useState(
    settings.is_collection_enabled
  );
  const [notes, setNotes] = useState(settings.notes || "");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.append("id", settings.id);
    formData.append("is_delivery_enabled", deliveryEnabled ? "true" : "false");
    formData.append("is_collection_enabled", collectionEnabled ? "true" : "false");
    formData.append("notes", notes);

    startTransition(async () => {
      const res = await updateDeliverySettingsAction(formData);
      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || "Settings saved.",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Failed to update settings.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feedback && (
        <div
          className={`rounded-xl border p-3 text-xs font-semibold ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={deliveryEnabled}
            onChange={(e) => setDeliveryEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#323C4B] focus:ring-[#323C4B]"
          />
          <div>
            <span className="text-sm font-bold text-slate-900">
              Enable Local Home Delivery
            </span>
            <p className="text-xs text-slate-500">
              Allows customers within the configured radius of UB3 4NS to order home delivery.
            </p>
            {!isPricingConfirmed && (
              <p className="mt-1 text-[11px] font-semibold text-amber-800">
                Locked on server: home delivery checkout stays blocked until delivery pricing and boundary rules are confirmed.
              </p>
            )}
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={collectionEnabled}
            onChange={(e) => setCollectionEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#323C4B] focus:ring-[#323C4B]"
          />
          <div>
            <span className="text-sm font-bold text-slate-900">
              Enable Free In-Store Collection
            </span>
            <p className="text-xs text-slate-500">
              Allows customers to pick up orders free of charge at 147 North Hyde Road.
            </p>
          </div>
        </label>
      </div>

      <div>
        <label
          htmlFor="delivery-notes"
          className="block text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Owner Operational Notes
        </label>
        <textarea
          id="delivery-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-[#323C4B] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#242c37] disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Fulfilment Controls"}
      </button>
    </form>
  );
}
