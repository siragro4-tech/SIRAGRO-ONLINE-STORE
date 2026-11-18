"use client";

import { usePathname } from "next/navigation";

interface StorefrontShellProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  scrollEffects: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Hides the public grocery header & footer on isolated portal routes (/admin, /preview)
 * so the admin sidebar and dashboard never collide with the sticky storefront bar.
 */
export function StorefrontShell({
  header,
  footer,
  scrollEffects,
  children,
}: StorefrontShellProps) {
  const pathname = usePathname() || "";
  const isPortalRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/preview");

  if (isPortalRoute) {
    return (
      <main id="main-content" className="flex-1 min-w-0">
        {children}
      </main>
    );
  }

  return (
    <>
      {header}
      {scrollEffects}
      <main id="main-content" className="flex-1 min-w-0">
        {children}
      </main>
      {footer}
    </>
  );
}
