import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your Basket",
  description: "Review the items in your basket before checkout.",
};

export default function BasketPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Your Basket</h1>
      <p className="mt-4" style={{ color: "var(--color-text-muted)" }}>
        Your basket is empty.
      </p>
      <div className="mt-6">
        <Link
          href="/shop"
          className="inline-flex items-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
}

