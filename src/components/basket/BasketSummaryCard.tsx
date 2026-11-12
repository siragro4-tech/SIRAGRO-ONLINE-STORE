"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { BasketSummary } from "@/lib/basket";
import { clearBasketAction } from "@/app/basket/actions";

interface BasketSummaryCardProps {
  summary: BasketSummary;
}

export function BasketSummaryCard({ summary }: BasketSummaryCardProps) {
  const [isPending, startTransition] = useTransition();
  const {
    subtotal,
    itemCount,
    hasAgeRestrictedItems,
    qualifiesForFreeDeliveryWithin1Mile,
    amountNeededForFreeDelivery,
  } = summary;

  function handleClear() {
    if (confirm("Are you sure you want to empty your basket?")) {
      startTransition(async () => {
        await clearBasketAction();
      });
    }
  }

  // Calculate percentage toward £25 free delivery threshold
  const freeDeliveryPercent = Math.min(100, Math.round((subtotal / 25.0) * 100));

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
        Order Summary
      </h2>

      {/* Free Delivery Tracker Meter */}
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50/80 p-3.5 text-xs text-green-900">
        <div className="flex items-center justify-between font-medium">
          <span>Delivery within 1 mile:</span>
          <span className="font-bold">
            {qualifiesForFreeDeliveryWithin1Mile ? "FREE Delivery Qualified!" : `£${subtotal.toFixed(2)} of £25.00`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 w-full rounded-full bg-green-200 overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all duration-300"
            style={{ width: `${freeDeliveryPercent}%` }}
          />
        </div>

        <p className="mt-1.5 text-[11px] text-green-800">
          {qualifiesForFreeDeliveryWithin1Mile
            ? "✓ Your order qualifies for Free Delivery within 1 mile!"
            : `Add £${amountNeededForFreeDelivery.toFixed(2)} more groceries to get FREE delivery within 1 mile!`}
        </p>
      </div>

      {/* Cost Breakdown */}
      <div className="mt-5 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
          <span className="font-semibold text-gray-900">£{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>Delivery &amp; Fulfilment</span>
          <span>Calculated at checkout</span>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4 flex justify-between items-baseline">
        <span className="text-base font-bold text-gray-900">Estimated Total</span>
        <span className="text-2xl font-extrabold text-gray-900">
          £{subtotal.toFixed(2)}
        </span>
      </div>

      {/* Age Restriction Warning */}
      {hasAgeRestrictedItems && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900"
        >
          <p className="font-bold text-red-800 flex items-center gap-1">
            🔞 Challenge 25 Reminder:
          </p>
          <p className="mt-0.5 leading-relaxed">
            Your basket includes age-restricted items. Valid photographic ID will be requested upon delivery or collection.
          </p>
        </div>
      )}

      {/* Checkout CTA */}
      <div className="mt-6 space-y-3">
        <Link
          href="/checkout"
          className="flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-sm transition-opacity hover:opacity-95"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Proceed to Checkout &rarr;
        </Link>

        <button
          type="button"
          onClick={handleClear}
          disabled={isPending}
          className="w-full text-center text-xs font-medium text-gray-500 hover:text-red-600 transition-colors py-1"
        >
          Empty basket
        </button>
      </div>

      {/* Trust info */}
      <div className="mt-6 border-t border-gray-200 pt-4 text-[11px] text-gray-500 space-y-1">
        <p>• Free collection from our shop near UB3 4NS</p>
        <p>• Home delivery up to 5 miles</p>
        <p>• Safe &amp; encrypted Stripe payment checkout</p>
      </div>
    </div>
  );
}

