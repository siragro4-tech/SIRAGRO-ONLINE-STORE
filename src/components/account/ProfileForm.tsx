"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/account/actions";

interface ProfileFormProps {
  initialProfile: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email: string;
  };
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
          ✓ {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            defaultValue={initialProfile.first_name || ""}
            placeholder="e.g. John"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            defaultValue={initialProfile.last_name || ""}
            placeholder="e.g. Smith"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-gray-700">
          Email address <span className="text-gray-400 font-normal">(managed by Supabase Auth)</span>
        </label>
        <input
          id="email"
          type="email"
          disabled
          value={initialProfile.email}
          className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-xs font-semibold text-gray-700">
          Contact Phone <span className="text-gray-400 font-normal">(for driver delivery updates)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialProfile.phone || ""}
          placeholder="07123 456789"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-[#323C4B] hover:bg-[#242c37] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "Saving changes..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}

