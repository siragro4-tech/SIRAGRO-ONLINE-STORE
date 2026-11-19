"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminLoginAction } from "@/app/admin/actions";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { sanitizeAdminRedirect } from "@/lib/admin-rules";

/**
 * Administrator sign-in form for /admin/login.
 * Strictly prevents credential pre-filling, autofill persistence,
 * and clears inputs immediately on mount, logout, or session termination.
 */
export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = sanitizeAdminRedirect(searchParams.get("redirectTo"));
  const loggedOut = searchParams.get("logged_out");
  const reason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(adminLoginAction, null);

  // Clear inputs and reset form whenever mounted or restored from browser cache (bfcache)
  useEffect(() => {
    setEmail("");
    setPassword("");
    if (formRef.current) {
      formRef.current.reset();
    }

    const handlePageShow = () => {
      setEmail("");
      setPassword("");
      if (formRef.current) {
        formRef.current.reset();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleSubmit = (formData: FormData) => {
    formAction(formData);
    // Erase password from React state immediately upon submit
    setPassword("");
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      autoComplete="off"
      noValidate
      className="space-y-5"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {loggedOut && !state?.error && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 text-center"
        >
          You have been securely signed out.
        </div>
      )}

      {reason === "timeout" && !state?.error && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 text-center"
        >
          Admin session was locked after leaving the page. Please sign in again.
        </div>
      )}

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
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
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
            autoComplete="new-password"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
