"use client";

import { useActionState, useState } from "react";
import { addAddressAction } from "@/app/account/actions";

export function AddAddressForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addAddressAction, null);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 p-4 text-xs font-semibold text-gray-700 hover:border-green-600 hover:text-green-700 transition-colors w-full justify-center"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add New Delivery Address
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="text-sm font-bold text-gray-900">New Delivery Address</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      <form action={formAction} className="mt-4 space-y-3">
        {state?.error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="label" className="block text-xs font-semibold text-gray-700">
            Address Label (e.g. Home, Work, Parents)
          </label>
          <input
            id="label"
            name="label"
            type="text"
            defaultValue="Home"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div>
          <label htmlFor="line1" className="block text-xs font-semibold text-gray-700">
            Street Address *
          </label>
          <input
            id="line1"
            name="line1"
            type="text"
            required
            placeholder="e.g. 10 High Street"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div>
          <label htmlFor="line2" className="block text-xs font-semibold text-gray-700">
            Flat / Building (optional)
          </label>
          <input
            id="line2"
            name="line2"
            type="text"
            placeholder="e.g. Flat 3A"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className="block text-xs font-semibold text-gray-700">
              Town / City *
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              defaultValue="Hayes"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label htmlFor="postcode" className="block text-xs font-semibold text-gray-700">
              Postcode *
            </label>
            <input
              id="postcode"
              name="postcode"
              type="text"
              required
              placeholder="e.g. UB3 4NS"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs uppercase text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="isDefault"
            name="isDefault"
            type="checkbox"
            value="true"
            className="h-3.5 w-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="isDefault" className="text-xs text-gray-700">
            Set as my default delivery address
          </label>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {isPending ? "Saving..." : "Save Address"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

