import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionToken,
  getClearAdminSessionCookieOptions,
} from "@/lib/admin-session";

/**
 * Updates session cookies and enforces strict route-level authentication/authorization.
 * When the admin page is left, the ephemeral admin session is invalidated so returning
 * always requires re-authenticating with administrator credentials.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase credentials are not configured yet, allow non-admin paths through in development
  if (!supabaseUrl || !supabaseAnonKey) {
    if (
      request.nextUrl.pathname.startsWith("/admin") &&
      request.nextUrl.pathname !== "/admin/login"
    ) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Guard /admin routes
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/forbidden" &&
    pathname !== "/admin/login"
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // Verify role in database - NOT just relying on token claims
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/forbidden";
      return NextResponse.redirect(url);
    }

    // Verify active ephemeral admin session
    const adminSessionToken = request.cookies.get(
      ADMIN_SESSION_COOKIE_NAME
    )?.value;
    const sessionCheck = await verifyAdminSessionToken(adminSessionToken);

    if (!sessionCheck.valid) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirectTo", pathname);
      const res = NextResponse.redirect(url);
      res.cookies.set(
        ADMIN_SESSION_COOKIE_NAME,
        "",
        getClearAdminSessionCookieOptions()
      );
      return res;
    }
  }

  // 1b. On /admin/login: NEVER auto-redirect to /admin.
  // Visiting /admin/login always requires entering credentials. Clear any stale admin token.
  if (pathname === "/admin/login") {
    if (request.cookies.has(ADMIN_SESSION_COOKIE_NAME)) {
      supabaseResponse.cookies.set(
        ADMIN_SESSION_COOKIE_NAME,
        "",
        getClearAdminSessionCookieOptions()
      );
    }
  }

  // 1c. When the admin leaves the admin dashboard to view the public site or account,
  // revoke the ephemeral admin session immediately so returning requires entering credentials again.
  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    request.cookies.has(ADMIN_SESSION_COOKIE_NAME)
  ) {
    supabaseResponse.cookies.set(
      ADMIN_SESSION_COOKIE_NAME,
      "",
      getClearAdminSessionCookieOptions()
    );
    await supabase.auth.signOut();
  }

  // 2. Guard /account routes (must be logged in)
  if (pathname.startsWith("/account")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 3. Prevent logged-in users from accessing /login or /register
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return supabaseResponse;
}
