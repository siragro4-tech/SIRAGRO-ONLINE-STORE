"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log client error to console for diagnostics
    console.error("SIRAGRO application error:", error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      {/* Error icon badge */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-700 shadow-sm mb-4">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-[#323C4B] tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
        We encountered an unexpected problem while loading this page. Please try refreshing or return to the storefront.
      </p>

      {error.digest && (
        <p className="mt-2 text-[11px] font-mono text-slate-400">
          Ref code: {error.digest}
        </p>
      )}

      {/* Recovery Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={() => reset()}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#323C4B] hover:bg-[#242c37] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 px-6 py-2.5 text-sm font-bold text-slate-700 transition-colors"
        >
          Return to Storefront
        </Link>
      </div>
    </div>
  );
}

