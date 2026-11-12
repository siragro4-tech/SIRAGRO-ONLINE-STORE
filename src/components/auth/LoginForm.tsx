"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/auth/actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/account";
  const urlError = searchParams.get("error");

  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {(state?.error || urlError) && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {state?.error || urlError}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B] sm:text-sm"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-bold text-[#323C4B] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B] sm:text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full justify-center rounded-xl bg-[#323C4B] hover:bg-[#242c37] px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>

      <div className="text-center text-sm text-gray-600">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/register"
          className="font-bold text-[#323C4B] hover:underline"
        >
          Create an account
        </Link>
      </div>
    </form>
  );
}

