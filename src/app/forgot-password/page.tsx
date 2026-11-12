"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/auth/actions";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  return (
    <div className="flex min-h-[70vh] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Reset Your Password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the email address associated with your account, and we will send you a secure link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-10">
          {state?.success ? (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 border border-green-200">
              <p className="font-semibold">Reset email sent!</p>
              <p className="mt-1">{state.message}</p>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="font-semibold text-green-700 hover:underline"
                >
                  &larr; Back to sign in
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
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {isPending ? "Sending link..." : "Send Reset Link"}
              </button>

              <div className="text-center text-sm text-gray-600">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-green-700 hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

