import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your Account",
  description: "Manage your SIRAGRO account, view orders, and update your details.",
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Your Account</h1>
      <p className="mt-4" style={{ color: "var(--color-text-muted)" }}>
        Login and account management coming in Stage 3.
      </p>
      <div className="mt-6">
        <Link
          href="/shop"
          className="text-sm font-medium underline"
          style={{ color: "var(--color-primary)" }}
        >
          &larr; Continue shopping
        </Link>
      </div>
    </div>
  );
}

