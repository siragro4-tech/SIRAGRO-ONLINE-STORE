import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/admin-rules";
import { Logo } from "@/components/layout/Logo";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Portal Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile && isAdminRole(profile.role)) {
      redirect("/admin");
    }
    redirect("/admin/forbidden");
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#323C4B] hover:underline"
          >
            &larr; Return to SIRAGRO Storefront
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3.5 bg-[#323C4B] px-6 py-5 text-white">
            <Logo size={42} dark />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">
                SIRAGRO Store Control Centre
              </h1>
              <p className="text-xs font-medium text-slate-300">
                Administrator Sign In (<span className="font-mono">/admin</span>)
              </p>
            </div>
          </div>

          <div className="px-6 py-7">
            <Suspense
              fallback={
                <div className="py-6 text-center text-sm text-slate-500">
                  Loading admin sign-in form...
                </div>
              }
            >
              <AdminLoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
