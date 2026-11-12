"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";

interface AddToBasketSectionProps {
  product: Product;
}

export function AddToBasketSection({ product }: AddToBasketSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const isOutOfStock = product.stock_quantity <= 0;
  const maxAllowed = Math.min(product.stock_quantity, 20);

  function handleAdd() {
    // In Stage 5, this will dispatch to the basket store / cookie / Supabase
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-6 border-t border-b border-gray-200 py-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Quantity Controls */}
        <div className="flex items-center rounded-lg border border-gray-300 bg-white">
          <button
            type="button"
            disabled={quantity <= 1 || isOutOfStock}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 rounded-l-lg"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="w-12 text-center text-sm font-semibold text-gray-900" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            disabled={quantity >= maxAllowed || isOutOfStock}
            onClick={() => setQuantity((q) => Math.min(maxAllowed, q + 1))}
            className="flex h-11 w-11 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 rounded-r-lg"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Add to Basket Button */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-base font-semibold text-white shadow-sm transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {added ? (
            <>
              <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Added to Basket!
            </>
          ) : isOutOfStock ? (
            "Out of Stock"
          ) : (
            `Add to Basket • £${(product.price * quantity).toFixed(2)}`
          )}
        </button>
      </div>

      {isOutOfStock && (
        <p className="mt-2 text-xs text-red-600 font-medium">
          This item is currently out of stock. Please check back soon or choose another product.
        </p>
      )}
    </div>
  );
}

