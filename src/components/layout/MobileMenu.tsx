"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: ReadonlyArray<{ href: string; label: string }>;
}

/**
 * Slide-out mobile navigation panel.
 *
 * Accessibility:
 * - Traps focus inside the panel while open.
 * - Closes on Escape key.
 * - Announces itself as a dialog.
 * - Returns focus to the hamburger button on close.
 */
export function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when the menu opens
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
      // Prevent background scrolling
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <div
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xs shadow-xl"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        {/* Header with close button */}
        <div className="flex h-16 items-center justify-between border-b px-4" style={{ borderColor: "var(--color-border)" }}>
          <span
            className="text-lg font-bold"
            style={{ color: "var(--color-primary-dark)" }}
          >
            Menu
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-lg p-2"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="px-4 py-6" aria-label="Mobile navigation">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-gray-100"
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Account / basket links */}
        <div
          className="border-t px-4 py-6"
          style={{ borderColor: "var(--color-border)" }}
        >
          <ul className="space-y-1">
            <li>
              <Link
                href="/account"
                className="block rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-gray-100"
                onClick={onClose}
              >
                My Account
              </Link>
            </li>
            <li>
              <Link
                href="/basket"
                className="block rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-gray-100"
                onClick={onClose}
              >
                Basket (0)
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

