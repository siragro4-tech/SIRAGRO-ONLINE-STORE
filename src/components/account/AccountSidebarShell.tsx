"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/auth/actions";
import { Logo } from "@/components/layout/Logo";

interface AccountSidebarShellProps {
  displayName: string;
  userEmail: string;
  ordersCount: number;
  addressesCount: number;
  isAdmin: boolean;
  children: React.ReactNode;
}

const SECTION_LINKS = [
  { id: "orders", label: "My Orders", icon: "📦" },
  { id: "addresses", label: "Saved Addresses", icon: "📍" },
  { id: "profile", label: "Personal Details", icon: "👤" },
] as const;

/**
 * Responsive sidebar menu & layout shell for /account.
 * Renders a slide-out drawer + quick pills on mobile/tablet and a sticky sidebar on desktop.
 */
export function AccountSidebarShell({
  displayName,
  userEmail,
  ordersCount,
  addressesCount,
  isAdmin,
  children,
}: AccountSidebarShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("orders");

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  const countsById: Record<string, number | undefined> = {
    orders: ordersCount,
    addresses: addressesCount,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Mobile / Tablet Account Top Controls */}
      <div className="mb-5 space-y-3 lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#323C4B] text-sm font-black text-white uppercase">
              {(displayName || userEmail || "C").charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[#323C4B]">
                {displayName || "My Account"}
              </p>
              <p className="truncate text-xs text-slate-500">{userEmail}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#323C4B] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#242c37] transition-colors"
            aria-label="Open account navigation menu"
            aria-controls="account-sidebar-drawer"
            aria-expanded={drawerOpen}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            Menu
          </button>
        </div>

        {/* Horizontal Quick Jump Pills on Small Screens */}
        <nav
          aria-label="Account sections quick links"
          className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          {SECTION_LINKS.map((sec) => {
            const count = countsById[sec.id];
            const isSelected = activeSection === sec.id;
            return (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={() => setActiveSection(sec.id)}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                  isSelected
                    ? "bg-[#323C4B] text-white shadow-2xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {sec.icon} {sec.label}
                {typeof count === "number" ? ` (${count})` : ""}
              </a>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="shrink-0 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100"
            >
              Admin Control Centre &rarr;
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Responsive Account Sidebar (Drawer < lg, Sticky Card >= lg) */}
        <aside
          id="account-sidebar-drawer"
          className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] shrink-0 flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out lg:sticky lg:top-28 lg:z-auto lg:h-auto lg:max-h-[calc(100dvh-8rem)] lg:w-64 lg:max-w-none lg:translate-x-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:shadow-xs ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Sidebar Brand Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 bg-[#323C4B] px-5 py-4 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <Logo size={36} dark />
              <div className="min-w-0">
                <p className="truncate text-sm font-black tracking-wide text-white">
                  {displayName || "SIRAGRO Buyer"}
                </p>
                <p className="truncate text-[11px] text-slate-300">
                  {isAdmin ? "Admin & Customer Account" : "Customer Account"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg p-1.5 text-slate-200 hover:bg-[#242c37] lg:hidden"
              aria-label="Close account sidebar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Scrollable Account Menu Links */}
          <nav
            className="flex-1 overflow-y-auto p-3.5 space-y-1"
            aria-label="My Account Sidebar"
          >
            {SECTION_LINKS.map((sec) => {
              const count = countsById[sec.id];
              const isSelected = activeSection === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => {
                    setActiveSection(sec.id);
                    setDrawerOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isSelected
                      ? "bg-[#323C4B] text-white shadow-2xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-[#323C4B]"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span aria-hidden="true">{sec.icon}</span>
                    <span className="truncate">{sec.label}</span>
                  </span>
                  {typeof count === "number" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isSelected
                          ? "bg-white text-[#323C4B]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </a>
              );
            })}

            <div className="my-2 border-t border-slate-100" />

            <Link
              href="/shop"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#323C4B] transition-colors"
            >
              <span>🛒 Browse Groceries</span>
              <span className="text-xs text-slate-400">&rarr;</span>
            </Link>

            <Link
              href="/basket"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#323C4B] transition-colors"
            >
              <span>🛍️ My Basket</span>
              <span className="text-xs text-slate-400">&rarr;</span>
            </Link>

            <Link
              href="/contact"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#323C4B] transition-colors"
            >
              <span>💬 Store Support</span>
              <span className="text-xs text-slate-400">&rarr;</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setDrawerOpen(false)}
                className="mt-2 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100 transition-colors"
              >
                <span>⚙️ Admin Dashboard</span>
                <span className="text-xs">&rarr;</span>
              </Link>
            )}
          </nav>

          {/* Pinned Footer */}
          <div className="shrink-0 border-t border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Signed in email
              </p>
              <p className="truncate text-xs font-bold text-slate-800">
                {userEmail}
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-xl bg-slate-200/70 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Main Account Content */}
        <div className="flex-1 min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}
