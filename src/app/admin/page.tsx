import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/admin/forbidden");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              SIRAGRO Admin Area
            </h1>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
              Verified Administrator
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Logged in as {profile.email} ({profile.first_name || "Admin"})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Customer Site
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Products</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          <p className="mt-1 text-xs text-gray-500">Catalog management in Stage 9</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Orders Today</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          <p className="mt-1 text-xs text-gray-500">Order tracking in Stage 10</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Delivery Rules</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">UB3 4NS</p>
          <p className="mt-1 text-xs text-gray-500">Configured in Stage 6</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500">Security Status</h2>
          <p className="mt-2 text-lg font-semibold text-green-600">Active &amp; Guarded</p>
          <p className="mt-1 text-xs text-gray-500">Server-side RLS enforced</p>
        </div>
      </div>
    </div>
  );
}

