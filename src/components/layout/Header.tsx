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
    <header className="sticky top-0 z-50 w-full shadow-lg">

      {/* ── Layer 1: Top Utility Bar (Black Awning / Store details) ── */}
      <div className="bg-[#0f172a] text-slate-300 text-xs border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="text-emerald-400">📍</span>
              147 North Hyde Road, Hayes UB3 4NS
            </span>
            <span className="hidden sm:flex items-center gap-1.5 font-medium">
              <span className="text-emerald-400">📞</span>
              020 8813 6458 / 0208 848 4840
            </span>
            <span className="hidden md:flex items-center gap-1.5 font-medium">
              <span className="text-amber-400">🕐</span>
              Open Daily: 7am – 10pm
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <span className="text-slate-600">|</span>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <span className="text-slate-600">|</span>
            <Link href="/delivery-info" className="hover:text-white transition-colors text-emerald-400 font-semibold flex items-center gap-1">
              🚚 Delivery (5 Miles)
            </Link>
          </div>
        </div>
      </div>

      {/* ── Layer 2: Main Storefront Fascia Bar (Matches exact Slate Navy Fascia) ── */}
      <div className="bg-[#1e293b] border-b border-slate-700">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">

          {/* Store Logo & Signboard Name */}
          <Link href="/" className="flex flex-shrink-0 items-center gap-3 group" aria-label="SIRAGRO home">
            <Logo size={52} dark />
            <div className="hidden sm:block leading-tight">
              <div className="fascia-3d-text text-2xl font-black tracking-wider text-white uppercase">
                SIRAGRO
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                Off Licence · Grocery · Fresh Foods
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
            className="hidden md:flex flex-shrink-0 flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="My account"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="text-[10px] font-medium">Account</span>
          </Link>

          {/* Basket */}
          <Link
            href="/basket"
            className="flex-shrink-0 relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            aria-label={`Shopping basket — ${itemCount} items`}
          >
            <div className="relative">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-900 text-[11px] font-black">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">Basket</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="rounded-lg p-2 text-white md:hidden hover:bg-slate-800 transition-colors"
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

      {/* ── Layer 3: Storefront Departments Strip ── */}
      <nav className="hidden md:block bg-[#0f172a] text-slate-200 border-b border-slate-800 overflow-x-auto" aria-label="Shop categories">
        <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/shop"
            className="flex flex-shrink-0 items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-400 hover:bg-slate-800 transition-colors border-r border-slate-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            All Aisles
          </Link>

          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex flex-shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors whitespace-nowrap"
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </Link>
          ))}

          <div className="ml-auto flex-shrink-0 pl-3 py-1.5">
            <Link
              href="/category/off-licence-beverages"
              className="inline-flex items-center gap-1.5 rounded-md bg-red-700 hover:bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition-colors"
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
