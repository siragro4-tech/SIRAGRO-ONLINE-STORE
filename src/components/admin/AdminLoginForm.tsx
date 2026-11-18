"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminLoginAction } from "@/app/admin/actions";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { sanitizeAdminRedirect } from "@/lib/admin-rules";

/**
 * Administrator sign-in form for /admin/login.
 * Submits strictly to adminLoginAction which checks profiles.role === 'admin'.
 */
export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = sanitizeAdminRedirect(searchParams.get("redirectTo"));
  const [state, formAction, isPending] = useActionState(adminLoginAction, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state?.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="block text-sm font-semibold text-slate-800"
        >
          Administrator Email
        </label>
        <div className="mt-1.5">
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="owner@siragro.co.uk"
            className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-sm font-semibold text-slate-800"
        >
          Password
        </label>
        <div className="mt-1.5">
          <PasswordInput
            id="admin-password"
            name="password"
            autoComplete="current-password"
            required
            className="block w-full rounded-xl border border-slate-300 py-2.5 pl-3.5 pr-10 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full justify-center rounded-xl bg-[#323C4B] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#242c37] active:scale-[0.99] disabled:opacity-50"
      >
        {isPending ? "Verifying admin access..." : "Sign In to Admin Portal"}
      </button>

      <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        Looking for your customer account?{" "}
        <Link href="/login" className="font-bold text-[#323C4B] hover:underline">
          Customer Sign In
        </Link>
      </div>
    </form>
  );
}
