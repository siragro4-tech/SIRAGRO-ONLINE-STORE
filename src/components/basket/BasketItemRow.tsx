"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { BasketItem } from "@/lib/basket";
import { updateBasketItemQuantityAction, removeBasketItemAction } from "@/app/basket/actions";
import { CategoryMockup } from "@/components/products/ProductCard";

interface BasketItemRowProps {
  item: BasketItem;
}

export function BasketItemRow({ item }: BasketItemRowProps) {
  const [isPending, startTransition] = useTransition();
  const { product, quantity, lineTotal } = item;
  const maxStock = Math.min(product.stock_quantity, 20);

  function handleQuantityChange(newQty: number) {
    startTransition(async () => {
      await updateBasketItemQuantityAction(product.id, newQty);
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await removeBasketItemAction(product.id);
    });
  }

  return (
    <li className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-5 border-b border-gray-200 gap-4 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Product Image & Title */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <CategoryMockup
            slug={product.category?.slug}
            brand={product.brand ?? undefined}
            className="w-full h-full"
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 hover:text-[#323C4B] transition-colors">
              <Link href={`/product/${product.slug}`}>{product.name}</Link>
            </h3>
            {product.is_age_restricted && (
              <span className="inline-flex items-center rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                {product.minimum_age || 18}+
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-gray-500 font-medium">
            {product.unit || "Each"} • £{product.price.toFixed(2)} each
          </p>
        </div>
      </div>

      {/* Stepper, Line Total & Remove Button */}
      <div className="flex items-center justify-between sm:justify-end gap-6">
        {/* Quantity Stepper */}
        <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg"
            aria-label={`Decrease quantity of ${product.name}`}
          >
            -
          </button>
          <span className="w-9 text-center text-xs font-semibold text-gray-900" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            disabled={quantity >= maxStock || isPending}
            onClick={() => handleQuantityChange(quantity + 1)}
            className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 rounded-r-lg"
            aria-label={`Increase quantity of ${product.name}`}
          >
            +
          </button>
        </div>

        {/* Line Price */}
        <div className="text-right min-w-[70px]">
          <p className="text-base font-bold text-gray-900">
            £{lineTotal.toFixed(2)}
          </p>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={isPending}
          className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label={`Remove ${product.name} from basket`}
          title="Remove item"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </li>
  );
}

