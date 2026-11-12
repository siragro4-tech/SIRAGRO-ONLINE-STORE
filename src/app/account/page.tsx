import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Your Account",
  description: "Manage your SIRAGRO account, view orders, and update your details.",
};

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome, {profile?.first_name || "Customer"}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Account email: {profile?.email || user.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg bg-green-50 border border-green-300 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
            >
              Open Admin Dashboard &rarr;
            </Link>
          )}

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Orders Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Order History</h2>
              <p className="text-xs text-gray-500">Track and review past deliveries</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            You have no orders yet.
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="text-sm font-semibold text-green-700 hover:underline"
            >
              Start shopping &rarr;
            </Link>
          </div>
        </div>

        {/* Addresses Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Saved Addresses</h2>
              <p className="text-xs text-gray-500">Manage delivery locations near UB3</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            No saved delivery addresses.
          </p>
          <div className="mt-6">
            <span className="text-xs text-gray-400">Available in Stage 8</span>
          </div>
        </div>

        {/* Personal Details Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Personal Details</h2>
              <p className="text-xs text-gray-500">Name, email, and phone</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p><strong>Name:</strong> {profile?.first_name || ""} {profile?.last_name || ""}</p>
            <p><strong>Phone:</strong> {profile?.phone || "Not set"}</p>
          </div>
          <div className="mt-6">
            <span className="text-xs text-gray-400">Editable in Stage 8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
