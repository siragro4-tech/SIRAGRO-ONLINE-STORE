import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/admin-rules";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminSessionGuard } from "@/components/admin/AdminSessionGuard";

export const metadata: Metadata = {
  title: {
    template: "%s | SIRAGRO Admin",
    default: "Admin Portal | SIRAGRO",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const sessionCheck = await verifyAdminSessionToken(sessionToken);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow /admin/login cleanly when unauthenticated or session locked;
  // every protected page enforces requireAdminPage().
  if (!user || !sessionCheck.valid) {
    return <>{children}</>;
  }

  // Check admin role in database
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If user is not an admin, allow /admin/forbidden to render cleanly without admin chrome
  if (!profile || !isAdminRole(profile.role)) {
    return <>{children}</>;
  }

  let unreadAlertsCount = 0;
  try {
    const { count } = await supabase
      .from("admin_activity_events")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);
    unreadAlertsCount = count ?? 0;
  } catch {
    // Gracefully ignore if migration 004 is pending
  }

  const adminName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name || "Administrator";

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 lg:flex-row">
      <AdminSessionGuard />
      <AdminSidebar
        userEmail={profile.email}
        adminName={adminName}
        unreadAlertsCount={unreadAlertsCount}
      />
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
