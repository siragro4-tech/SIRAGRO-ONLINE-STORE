"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { MobileMenu } from "./MobileMenu";

const CATEGORIES = [
  { slug: "fresh-produce",         label: "Fresh Produce",        emoji: "🥦", color: "#16a34a" },
  { slug: "dairy-eggs",            label: "Dairy & Eggs",         emoji: "🥛", color: "#0284c7" },
  { slug: "bakery",                label: "Bakery",               emoji: "🍞", color: "#d97706" },
  { slug: "meat-fish",             label: "Meat & Fish",          emoji: "🥩", color: "#dc2626" },
  { slug: "off-licence-beverages", label: "Off-Licence",          emoji: "🍷", color: "#7c3aed" },
  { slug: "cupboard-groceries",    label: "Cupboard & Groceries", emoji: "🥫", color: "#ea580c" },
  { slug: "frozen-goods",          label: "Frozen Goods",         emoji: "❄️", color: "#0891b2" },
  { slug: "household-cleaning",    label: "Household & Cleaning", emoji: "🧼", color: "#059669" },
] as const;

const NAV_LINKS = [
  { href: "/shop",          label: "Shop All" },
  { href: "/about",         label: "About Us" },
  { href: "/contact",       label: "Contact" },
  { href: "/delivery-info", label: "Delivery" },
] as const;

interface HeaderProps {
  initialItemCount?: number;
}

export function Header({ initialItemCount = 0 }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = initialItemCount;

  return (
    <header className="sticky top-0 z-50 w-full" style={{ boxShadow: "0 4px 16px rgba(26,61,43,0.35)" }}>

      {/* ── Layer 1: Signboard-green utility bar ── */}
      <div
        className="hidden md:block text-xs"
        style={{ background: "linear-gradient(90deg, #122b1e 0%, #1a3d2b 50%, #122b1e 100%)", color: "#a7f3d0" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
              </svg>
              147 North Hyde Road, Hayes UB3 4NS
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              0208 848 4840
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Mon–Sun: 7am – 10pm
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <span style={{ color: "#245c3f" }}>|</span>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <span style={{ color: "#245c3f" }}>|</span>
            <Link href="/delivery-info" className="hover:text-white transition-colors flex items-center gap-1">
              🚚 Delivery Info
            </Link>
          </div>
        </div>
      </div>

      {/* ── Layer 2: Main brand header (signboard teal) ── */}
      <div style={{ background: "linear-gradient(135deg, #1a3d2b 0%, #245c3f 60%, #1a3d2b 100%)" }}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">

          {/* Logo + wordmark */}
          <Link href="/" className="flex flex-shrink-0 items-center gap-3 group" aria-label="SIRAGRO home">
            <Logo size={52} dark />
            <div className="hidden sm:block leading-tight">
              <div className="text-xl font-black tracking-widest text-white uppercase drop-shadow-md">
                SIRAGRO
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                Supermarket &amp; Off-Licence
              </div>
            </div>
          </Link>

          {/* Search bar */}
          <div className="flex-1 min-w-0">
            <HeaderSearchBar />
          </div>

          {/* Account icon */}
          <Link
            href="/account"
            className="hidden md:flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl p-2.5 text-white/80 hover:text-white hover:bg-white/15 transition-all"
            aria-label="My account"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="text-[10px] font-semibold">Account</span>
          </Link>

          {/* Basket */}
          <Link
            href="/basket"
            className="flex-shrink-0 relative flex flex-col items-center gap-0.5 rounded-xl p-2.5 transition-all"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
            aria-label={`Shopping basket — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
          >
            <div className="relative">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {itemCount > 0 && (
                <span
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-white"
                  style={{ backgroundColor: "#f59e0b" }}
                  aria-hidden="true"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">Basket</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="rounded-xl p-2.5 text-white md:hidden hover:bg-white/15 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Layer 3: Colourful category strip ── */}
      <nav
        className="hidden md:block overflow-x-auto"
        style={{ background: "linear-gradient(90deg, #0f2419 0%, #1a3d2b 100%)", borderTop: "1px solid #245c3f" }}
        aria-label="Shop by category"
      >
        <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* All Departments */}
          <Link
            href="/shop"
            className="flex flex-shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-black text-white whitespace-nowrap transition-all hover:bg-white/10 border-r"
            style={{ borderColor: "#245c3f" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            All Departments
          </Link>

          {/* Category links — each with its accent colour on hover */}
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group flex flex-shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-all"
              style={{ color: "#d1fae5" }}
            >
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm transition-transform group-hover:scale-125"
                style={{ background: `${cat.color}33` }}
              >
                {cat.emoji}
              </span>
              <span className="group-hover:text-white transition-colors">{cat.label}</span>
            </Link>
          ))}

          {/* Off-Licence badge */}
          <div className="ml-auto flex-shrink-0 px-4 py-1.5">
            <Link
              href="/category/off-licence-beverages"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black text-white shadow-lg transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
            >
              🍷 Off-Licence
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={NAV_LINKS}
        itemCount={itemCount}
      />
    </header>
  );
}
