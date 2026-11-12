"use client";

import { useTransition } from "react";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/account/actions";

interface AddressCardProps {
  address: {
    id: string;
    label: string | null;
    line_1: string;
    line_2: string | null;
    city: string;
    county: string | null;
    postcode: string;
    is_default: boolean;
  };
}

export function AddressCard({ address }: AddressCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm("Are you sure you want to delete this saved address?")) {
      startTransition(async () => {
        await deleteAddressAction(address.id);
      });
    }
  }

  function handleSetDefault() {
    startTransition(async () => {
      await setDefaultAddressAction(address.id);
    });
  }

  return (
    <div className={`rounded-xl border p-4 shadow-sm transition-all ${address.is_default ? "border-green-600 bg-green-50/20" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-gray-900">
          {address.label || "Address"}
        </span>
        {address.is_default && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
            Default
          </span>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-600 leading-relaxed">
        <p>{address.line_1}</p>
        {address.line_2 && <p>{address.line_2}</p>}
        <p>
          {address.city}
          {address.county ? `, ${address.county}` : ""}
        </p>
        <p className="font-semibold text-gray-900 mt-1">{address.postcode}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        {!address.is_default ? (
          <button
            type="button"
            onClick={handleSetDefault}
            disabled={isPending}
            className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-50"
          >
            Set as default
          </button>
        ) : (
          <span className="text-[11px] text-gray-400">Primary delivery address</span>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

