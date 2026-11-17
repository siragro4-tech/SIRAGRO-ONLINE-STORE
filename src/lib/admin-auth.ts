import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/admin-rules";

/**
 * Enforces admin authentication & role verification on Server Component pages.
 * Redirects unauthenticated visitors to /login and non-admin users to /admin/forbidden.
 */
export async function requireAdminPage(redirectPath: string = "/admin") {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectPath)}`);
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
 * Enforces admin authentication & role verification inside Server Actions.
 * Never trusts client-provided user IDs or roles.
 */
export async function requireAdminAction() {
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
