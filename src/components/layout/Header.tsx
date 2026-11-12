"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { MobileMenu } from "./MobileMenu";

const CATEGORIES = [
  { slug: "fresh-produce",         label: "Fresh Fruits & Veg",   emoji: "🥦" },
  { slug: "dairy-eggs",            label: "Dairy Products",       emoji: "🥛" },
  { slug: "bakery",                label: "Fresh Bakery",         emoji: "🍞" },
  { slug: "meat-fish",             label: "Meat & Fish",          emoji: "🥩" },
  { slug: "off-licence-beverages", label: "Off Licence & Beers",  emoji: "🍷" },
  { slug: "cupboard-groceries",    label: "Grocery & Cupboard",   emoji: "🥫" },
  { slug: "frozen-goods",          label: "Frozen Foods",         emoji: "❄️" },
  { slug: "household-cleaning",    label: "Household Essentials", emoji: "🧼" },
] as const;

const NAV_LINKS = [
  { href: "/shop",          label: "Shop All" },
  { href: "/about",         label: "About Us" },
  { href: "/contact",       label: "Contact" },
  { href: "/delivery-info", label: "Delivery Info" },
] as const;

interface HeaderProps {
  initialItemCount?: number;
}

export function Header({ initialItemCount = 0 }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = initialItemCount;

  return (
    <header className="sticky top-0 z-50 w-full shadow-md" style={{ backgroundColor: "#323C4B" }}>

      {/* ── Layer 1: Top Utility Bar (#242c37 & White) ── */}
      <div className="bg-[#242c37] text-white/90 text-xs border-b border-[#3d495b]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 font-medium">
              <span>📍</span>
              147 North Hyde Road, Hayes UB3 4NS
            </span>
            <span className="hidden sm:flex items-center gap-1.5 font-semibold text-white">
              <span>📞</span>
              020 8813 6458 / 0208 848 4840
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-white/80">
              <span>🕐</span>
              Daily: 7am – 10pm
            </span>
          </div>
          <div className="flex items-center gap-4 font-medium text-white">
            <Link href="/login" className="hover:text-white/80 transition-colors">Sign In</Link>
            <span className="text-white/40">|</span>
            <Link href="/register" className="hover:text-white/80 transition-colors">Register</Link>
            <span className="text-white/40">|</span>
            <Link
              href="/delivery-info"
              className="rounded bg-white text-[#323C4B] font-bold px-2 py-0.5 hover:bg-white/90 transition-colors flex items-center gap-1"
            >
              🚚 Delivery (5 Miles)
            </Link>
          </div>
        </div>
      </div>

      {/* ── Layer 2: Main Storefront Bar (#323C4B & Pure White) ── */}
      <div className="bg-[#323C4B] border-b border-[#414e60]">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">

          {/* Store Logo & Signboard Name */}
          <Link href="/" className="flex flex-shrink-0 items-center gap-3.5 group" aria-label="SIRAGRO home">
            <Logo size={56} dark />
            <div className="hidden sm:block leading-tight">
              <div className="fascia-3d-text text-2xl sm:text-3xl font-black tracking-wider text-white uppercase">
                SIRAGRO
              </div>
              <div className="text-[10px] font-bold tracking-widest text-white/90 uppercase">
                Supermarket &amp; Off Licence
              </div>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 min-w-0">
            <HeaderSearchBar />
          </div>

          {/* User Account */}
          <Link
            href="/account"
            className="hidden md:flex flex-shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-white hover:bg-white/10 transition-colors"
            aria-label="My account"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="text-[11px] font-bold">Account</span>
          </Link>

          {/* Basket Button (Clean White with #323C4B Text) */}
          <Link
            href="/basket"
            className="flex-shrink-0 relative flex items-center gap-2 rounded-lg px-4 py-2 bg-white text-[#323C4B] hover:bg-white/95 font-bold text-sm shadow-md transition-all active:scale-95"
            aria-label={`Shopping basket — ${itemCount} items`}
          >
            <div className="relative">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#323C4B] text-white text-[11px] font-black border-2 border-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Basket</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="rounded-lg p-2 text-white md:hidden hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Layer 3: Department Navigation Strip (#2b3441 & Pure White) ── */}
      <nav className="hidden md:block bg-[#2b3441] text-white border-b border-[#3d495b] overflow-x-auto" aria-label="Shop categories">
        <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/shop"
            className="flex flex-shrink-0 items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-[#242c37] hover:bg-[#1b2129] transition-colors border-r border-[#3d495b]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            All Departments
          </Link>

          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex flex-shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </Link>
          ))}

          <div className="ml-auto flex-shrink-0 pl-3 py-1.5">
            <Link
              href="/category/off-licence-beverages"
              className="inline-flex items-center gap-1.5 rounded bg-white text-[#323C4B] hover:bg-white/90 px-3 py-1 text-xs font-black shadow-sm transition-colors"
            >
              🍷 Off Licence
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={NAV_LINKS}
        itemCount={itemCount}
      />
    </header>
  );
}
