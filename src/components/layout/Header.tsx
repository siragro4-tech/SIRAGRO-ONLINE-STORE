"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { MobileMenu } from "./MobileMenu";
import { createClient } from "@/lib/supabase/client";

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const itemCount = initialItemCount;

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) {
          setUserEmail(data.user.email);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // In case Supabase client isn't configured in dev yet
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full shadow-md" style={{ backgroundColor: "#323C4B" }}>

      {/* ── Layer 1: Top Utility Bar (Slow Horizontally Moving Marquee Ticker) ── */}
      <div className="bg-[#242c37] text-white/90 text-xs border-b border-[#3d495b] overflow-hidden flex items-center py-2">
        <div className="marquee-container flex-1">
          <div className="marquee-content-right flex items-center gap-12 font-medium">
            {/* Set 1 */}
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span>📍</span>
              <strong>147 North Hyde Road, Hayes UB3 4NS</strong>
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-white font-bold">
              <span>📞</span>
              <strong>020 8813 6458 / 0208 848 4840</strong>
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-white/80">
              <span>🕐</span>
              Daily: 7am – 10pm
            </span>
            <Link href="/delivery-info" className="flex items-center gap-1.5 whitespace-nowrap text-white font-bold hover:underline">
              <span>🚚</span>
              Delivery up to 5 Miles (Free over £25 within 1 mile)
            </Link>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-white/80">
              <span>🏪</span>
              Click &amp; Collect in 30 Mins
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-white/80">
              <span>🪪</span>
              Licensed Retailer · Challenge 25
            </span>

            {/* Set 2 (for continuous seamless loop) */}
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span>📍</span>
              <strong>147 North Hyde Road, Hayes UB3 4NS</strong>
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-white font-bold">
              <span>📞</span>
              <strong>020 8813 6458 / 0208 848 4840</strong>
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-white/80">
              <span>🕐</span>
              Daily: 7am – 10pm
            </span>
            <Link href="/delivery-info" className="flex items-center gap-1.5 whitespace-nowrap text-white font-bold hover:underline">
              <span>🚚</span>
              Delivery up to 5 Miles (Free over £25 within 1 mile)
            </Link>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-white/80">
              <span>🏪</span>
              Click &amp; Collect in 30 Mins
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-white/80">
              <span>🪪</span>
              Licensed Retailer · Challenge 25
            </span>
          </div>
        </div>
      </div>

      {/* ── Layer 2: Main Storefront Bar ── */}
      <div className="bg-[#323C4B] border-b border-[#414e60]">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">

          {/* Store Logo & Signboard Name */}
          <Link href="/" className="flex flex-shrink-0 items-center gap-3 group" aria-label="SIRAGRO home">
            <Logo size={52} dark />
            <div className="hidden sm:block leading-tight">
              <div className="fascia-3d-text text-2xl font-black tracking-wider text-white uppercase">
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

          {/* Account Profile OR Clean Sign In Pill */}
          {userEmail ? (
            /* ONLY shows when user has created an account / logged in */
            <Link
              href="/account"
              className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 hover:scale-105"
              aria-label="My account"
            >
              <div className="w-6 h-6 rounded-full bg-white text-[#323C4B] font-black text-xs flex items-center justify-center uppercase shadow-sm">
                {userEmail.charAt(0)}
              </div>
              <span className="text-xs font-bold">My Account</span>
            </Link>
          ) : (
            /* Clean Sign In action when not logged in */
            <Link
              href="/login"
              className="hidden md:flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              <span>Sign In</span>
            </Link>
          )}

          {/* Basket Button (Icon Only) */}
          <Link
            href="/basket"
            className="flex-shrink-0 relative flex items-center justify-center rounded-xl p-2.5 bg-white text-[#323C4B] hover:bg-white/95 shadow-md transition-all hover:scale-110 active:scale-95"
            aria-label={`Shopping basket — ${itemCount} items`}
          >
            <div className="relative">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#323C4B] text-white text-[11px] font-black border-2 border-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </div>
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

      {/* ── Layer 3: Slow Horizontally Scrolling Department Ticker (No scrollbar, smooth glide, pauses on hover) ── */}
      <nav className="bg-[#2b3441] text-white border-b border-[#3d495b] overflow-hidden flex items-center" aria-label="Shop categories">
        {/* Stationary All Departments Button on the left */}
        <Link
          href="/shop"
          className="flex flex-shrink-0 items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-[#242c37] hover:bg-[#1b2129] transition-colors border-r border-[#3d495b] z-10 shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          All Departments
        </Link>

        {/* Seamless slow horizontal marquee ticker */}
        <div className="marquee-container flex-1 py-2">
          <div className="marquee-content flex items-center gap-8">
            {/* Set 1 */}
            {CATEGORIES.map((cat) => (
              <Link
                key={`cat-1-${cat.slug}`}
                href={`/category/${cat.slug}`}
                className="flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-white hover:scale-105 transition-all whitespace-nowrap px-2"
              >
                <span className="text-sm">{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}

            {/* Set 2 (for continuous seamless loop) */}
            {CATEGORIES.map((cat) => (
              <Link
                key={`cat-2-${cat.slug}`}
                href={`/category/${cat.slug}`}
                className="flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-white hover:scale-105 transition-all whitespace-nowrap px-2"
              >
                <span className="text-sm">{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}

            {/* Set 3 */}
            {CATEGORIES.map((cat) => (
              <Link
                key={`cat-3-${cat.slug}`}
                href={`/category/${cat.slug}`}
                className="flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-white hover:scale-105 transition-all whitespace-nowrap px-2"
              >
                <span className="text-sm">{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Stationary Off Licence badge on the right */}
        <div className="flex-shrink-0 px-3 py-1.5 z-10 bg-[#2b3441] border-l border-[#3d495b]">
          <Link
            href="/category/off-licence-beverages"
            className="inline-flex items-center gap-1.5 rounded bg-white text-[#323C4B] hover:bg-white/90 px-3 py-1 text-xs font-black shadow-sm transition-transform hover:scale-105"
          >
            🍷 Off Licence
          </Link>
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
