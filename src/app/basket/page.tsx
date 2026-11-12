import type { Metadata } from "next";
import Link from "next/link";
import { getBasket } from "@/lib/basket";
import { BasketItemRow } from "@/components/basket/BasketItemRow";
import { BasketSummaryCard } from "@/components/basket/BasketSummaryCard";

export const metadata: Metadata = {
  title: "Your Shopping Basket",
  description: "Review your selected groceries and order total before checkout.",
};

export default async function BasketPage() {
  const summary = await getBasket();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb / Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-green-700 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-green-700 transition-colors">
          Shop
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-900" aria-current="page">
          Your Basket
        </span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Your Shopping Basket
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"} in basket
        </p>
      </div>

      {summary.items.length === 0 ? (
        /* Empty Basket State */
        <div className="mt-12 rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
          </div>

          <h2 className="mt-4 text-lg font-bold text-gray-900">
            Your basket is currently empty
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Explore our fresh produce, dairy, bakery, drinks, and grocery essentials
            available for delivery near UB3 or collection.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Start Shopping
            </Link>
            <Link
              href="/category/fresh-produce"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Browse Fresh Produce
            </Link>
          </div>
        </div>
      ) : (
        /* Populated Basket Grid */
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Items List */}
          <div className="lg:col-span-8">
            <ul className="divide-y divide-gray-200" role="list">
              {summary.items.map((item) => (
                <BasketItemRow key={item.productId} item={item} />
              ))}
            </ul>

            <div className="mt-6">
              <Link
                href="/shop"
                className="inline-flex items-center text-sm font-semibold text-green-700 hover:text-green-800"
              >
                &larr; Continue shopping
              </Link>
            </div>
          </div>

          {/* Sticky Summary Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <BasketSummaryCard summary={summary} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
