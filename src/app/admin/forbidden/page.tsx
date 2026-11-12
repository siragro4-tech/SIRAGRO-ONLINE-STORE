import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Denied (403)",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-8 w-8 text-red-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Access Denied (403)
      </h1>

      <p className="mt-3 text-base text-gray-600">
        You do not have administrative permissions to view this section.
        This access attempt has been logged.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Return to Store
        </Link>
        <Link
          href="/account"
          className="inline-flex items-center rounded-lg border-2 px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          My Account
        </Link>
      </div>
    </div>
  );
}

