"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/auth/actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  if (state?.success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center text-green-900 border border-green-200">
        <h2 className="text-lg font-semibold">Account Registered!</h2>
        <p className="mt-2 text-sm text-green-700">{state.message}</p>
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            First name
          </label>
          <div className="mt-1">
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            Last name
          </label>
          <div className="mt-1">
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 sm:text-sm"
            />
          </div>
        </div>
      </div>

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

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Phone number <span className="text-gray-400 text-xs">(for delivery updates)</span>
        </label>
        <div className="mt-1">
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 sm:text-sm"
            placeholder="07123 456789"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password <span className="text-gray-400 text-xs">(min 8 characters)</span>
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
          Confirm password
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
        {isPending ? "Creating account..." : "Create Account"}
      </button>

      <div className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-green-700 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}

