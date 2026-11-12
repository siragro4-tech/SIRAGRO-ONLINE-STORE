"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction } from "@/app/auth/actions";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, null);

  return (
    <div className="flex min-h-[70vh] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Set New Password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-10">
          {state?.success ? (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 border border-green-200 text-center">
              <p className="font-semibold">Password updated!</p>
              <p className="mt-1">{state.message}</p>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Sign in
                </Link>
              </div>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              {state?.error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {state.error}
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New password <span className="text-gray-400 text-xs">(min 8 characters)</span>
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm new password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 sm:text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {isPending ? "Updating password..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

