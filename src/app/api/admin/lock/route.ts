import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getClearAdminSessionCookieOptions,
} from "@/lib/admin-session";

/**
 * Endpoint called when an administrator leaves the admin dashboard (pagehide/beforeunload/tab close).
 * Immediately deletes the active admin session cookie and signs out the session.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_SESSION_COOKIE_NAME,
    "",
    getClearAdminSessionCookieOptions()
  );

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Non-fatal if Supabase was already signed out
  }

  const response = NextResponse.json({ locked: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    "",
    getClearAdminSessionCookieOptions()
  );
  return response;
}
