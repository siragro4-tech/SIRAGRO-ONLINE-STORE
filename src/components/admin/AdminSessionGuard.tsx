"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TAB_SESSION_KEY = "siragro_admin_tab_active";
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity auto-locks

/**
 * Client-side guard that protects the admin dashboard:
 * 1. Tracks tab-scoped session activation in sessionStorage.
 * 2. When the user navigates away or closes the tab, fires sendBeacon to /api/admin/lock.
 * 3. Intercepts clicks on links that leave the /admin section.
 * 4. Auto-locks after 15 minutes of inactivity.
 */
export function AdminSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    // 1. Mark this specific browser tab as active
    sessionStorage.setItem(TAB_SESSION_KEY, String(Date.now()));

    // 2. Lock session on page exit / unload
    const handlePageHide = () => {
      sessionStorage.removeItem(TAB_SESSION_KEY);
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/admin/lock");
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    // 3. Intercept clicks on links leaving the admin portal
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // If clicking an external link or a link outside /admin (like "Open Storefront")
      const isInternalAdmin =
        href.startsWith("/admin") && !href.startsWith("/admin/login");

      if (!isInternalAdmin && !href.startsWith("#") && !href.startsWith("javascript:")) {
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon("/api/admin/lock");
        }
        sessionStorage.removeItem(TAB_SESSION_KEY);
      }
    };

    document.addEventListener("click", handleDocumentClick, true);

    // 4. Inactivity auto-lock timer
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(async () => {
        sessionStorage.removeItem(TAB_SESSION_KEY);
        try {
          await fetch("/api/admin/lock", { method: "POST" });
        } catch {
          // Ignore network errors on lock
        }
        router.push("/admin/login?reason=timeout");
      }, INACTIVITY_TIMEOUT_MS);
    };

    const userActivityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    userActivityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      document.removeEventListener("click", handleDocumentClick, true);
      userActivityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [router]);

  return null;
}
