/**
 * Ephemeral Admin Session Security
 *
 * Implements strict, session-scoped administrator authorization gates:
 * 1. Requires explicit re-authentication with email and password when leaving the admin dashboard.
 * 2. Employs session-only cookie flags (cleared on browser/tab exit).
 * 3. Uses Web Crypto HMAC-SHA256 signatures compatible with Edge middleware, Server Components, and Server Actions.
 */

export const ADMIN_SESSION_COOKIE_NAME = "siragro_admin_session";

// Maximum active session lifetime (2 hours) before mandatory re-authentication
export const ADMIN_SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export interface AdminSessionPayload {
  userId: string;
  email: string;
  role: "admin";
  issuedAt: number;
  nonce: string;
}

function getSessionSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.GUEST_SESSION_SECRET ||
    "siragro-ephemeral-admin-session-gate-key"
  );
}

function base64UrlEncode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf8");
  }
  return atob(base64);
}

async function signHmacSha256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates a cryptographically signed admin session token.
 */
export async function createAdminSessionToken(
  userId: string,
  email: string
): Promise<string> {
  const nonce =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const payload: AdminSessionPayload = {
    userId,
    email: email.toLowerCase().trim(),
    role: "admin",
    issuedAt: Date.now(),
    nonce,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await signHmacSha256(getSessionSecret(), encodedPayload);
  return `${encodedPayload}.${signature}`;
}

/**
 * Validates an ephemeral admin session token.
 * Rejects expired, tampered, or invalid tokens.
 */
export async function verifyAdminSessionToken(
  token: string | null | undefined,
  maxAgeMs: number = ADMIN_SESSION_MAX_AGE_MS
): Promise<{ valid: boolean; payload?: AdminSessionPayload }> {
  if (!token || typeof token !== "string") {
    return { valid: false };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) {
    return { valid: false };
  }

  try {
    const expectedSignature = await signHmacSha256(
      getSessionSecret(),
      encodedPayload
    );

    if (expectedSignature.length !== signature.length) {
      return { valid: false };
    }

    let mismatch = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    if (mismatch !== 0) {
      return { valid: false };
    }

    const json = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(json) as AdminSessionPayload;

    if (payload.role !== "admin" || !payload.userId || !payload.email) {
      return { valid: false };
    }

    const now = Date.now();
    if (now - payload.issuedAt > maxAgeMs) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

/**
 * Returns cookie options for setting the admin session.
 * NOTE: maxAge and expires are intentionally omitted so the cookie is a
 * session-only cookie that the browser automatically destroys when closed.
 */
export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

/**
 * Returns cookie options to immediately delete the admin session cookie.
 */
export function getClearAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}
