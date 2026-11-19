import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/admin-rules";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

/**
 * Enforces admin authentication & active session verification on Server Component pages.
 * Redirects unauthenticated visitors or expired/left sessions to /admin/login.
 * Redirects non-admin users to /admin/forbidden.
 */
export async function requireAdminPage(redirectPath: string = "/admin") {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const sessionResult = await verifyAdminSessionToken(sessionToken);

  if (!sessionResult.valid) {
    redirect(`/admin/login?redirectTo=${encodeURIComponent(redirectPath)}`);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/admin/login?redirectTo=${encodeURIComponent(redirectPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdminRole(profile.role)) {
    redirect("/admin/forbidden");
  }

  return { user, profile, supabase };
}

/**
 * Enforces admin authentication & active session verification inside Server Actions.
 * Never trusts client-provided user IDs, roles, or stale sessions.
 */
export async function requireAdminAction() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const sessionResult = await verifyAdminSessionToken(sessionToken);

  if (!sessionResult.valid) {
    return {
      authorized: false as const,
      error: "Admin session locked or expired. Please sign in again.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false as const,
      error: "Authentication required. Please sign in as an administrator.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdminRole(profile.role)) {
    return {
      authorized: false as const,
      error: "Forbidden: Administrator privileges are required for this action.",
    };
  }

  return {
    authorized: true as const,
    user,
    profile,
    supabase,
  };
}
