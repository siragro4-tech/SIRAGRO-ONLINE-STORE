"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Logo } from "./Logo";

const CATEGORIES = [
  { slug: "fresh-produce",         label: "Fresh Fruits & Veg",   emoji: "🥦" },
  { slug: "dairy-eggs",            label: "Dairy Products",       emoji: "🥛" },
  { slug: "bakery",                label: "Fresh Bakery",         emoji: "🍞" },
  { slug: "meat-fish",             label: "Meat & Fish",          emoji: "🥩" },
  { slug: "off-licence-beverages", label: "Off Licence & Beers",  emoji: "🍷" },
  { slug: "cupboard-groceries",    label: "Grocery & Cupboard",   emoji: "🥫" },
  { slug: "frozen-goods",          label: "Frozen Foods",         emoji: "❄️" },
  { slug: "household-cleaning",    label: "Household Essentials", emoji: "🧼" },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: ReadonlyArray<{ href: string; label: string }>;
  itemCount?: number;
}

export function MobileMenu({ open, onClose, itemCount = 0 }: MobileMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out panel in #323C4B & White */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto shadow-2xl bg-[#323C4B] text-white"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-[#414e60] px-4 py-4 bg-[#242c37]">
          <Link href="/" onClick={onClose} className="flex items-center gap-3">
            <Logo size={42} dark />
            <div className="text-white leading-tight">
              <div className="text-lg font-black tracking-wider uppercase">SIRAGRO</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                Supermarket &amp; Off-Licence
              </div>
            </div>
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-lg p-2 text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 border-b border-[#414e60] p-4 bg-[#2b3441]">
          <Link
            href="/account"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-bold text-white hover:bg-white/10 border border-white/20 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            My Account
          </Link>
          <Link
            href="/basket"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-black text-[#323C4B] bg-white hover:bg-white/90 shadow transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            Basket ({itemCount})
          </Link>
        </div>

        {/* Categories */}
        <div className="flex-1 px-4 py-4">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/70">
            Shop by Department
          </p>
          <nav className="space-y-1">
            <Link
              href="/shop"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              🛒 All Departments
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer — Sign In & Register only */}
        <div className="border-t border-[#414e60] p-4 bg-[#242c37]">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-sm font-black text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-sm font-black text-[#323C4B] bg-white hover:bg-white/90 shadow transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Register
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
