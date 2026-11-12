"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

/** Main navigation links shown to all customers. */
const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Site-wide header with responsive navigation.
 *
 * Desktop: horizontal nav bar with links and basket icon.
 * Mobile:  hamburger button that opens a slide-out menu.
 */
interface HeaderProps {
  initialItemCount?: number;
}

export function Header({ initialItemCount = 0 }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = initialItemCount;

  return (
    <header
      className="sticky top-0 z-50 border-b shadow-sm"
      style={{
        backgroundColor: "var(--color-bg)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight"
          style={{ color: "var(--color-primary-dark)" }}
          aria-label="SIRAGRO home"
        >
          <Logo className="h-8 w-8" />
          <span>SIRAGRO</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--color-text)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right-side actions */}
        <div className="hidden items-center gap-4 md:flex">
          {/* Search link */}
          <Link
            href="/shop"
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Search products"
          >
            <SearchIcon className="h-5 w-5" />
          </Link>

          {/* Account link */}
          <Link
            href="/account"
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Your account"
          >
            <UserIcon className="h-5 w-5" />
          </Link>

          {/* Basket link with item count badge */}
          <Link
            href="/basket"
            className="relative rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label={`View basket (${itemCount} items)`}
          >
            <BasketIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: "var(--color-primary)" }}
                aria-hidden="true"
              >
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label="Open menu"
        >
          <HamburgerIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile slide-out menu */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={navLinks}
        itemCount={itemCount}
      />
    </header>
  );
}

/* ---------------------------------------------------------------
 * Inline SVG icon components
 * (Small, self-contained — no icon library needed yet.)
 * --------------------------------------------------------------- */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  );
}

function BasketIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

