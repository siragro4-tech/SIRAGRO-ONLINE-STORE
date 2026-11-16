"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBasketItemAction } from "@/app/basket/actions";

interface QuickAddOverlayProps {
  productId: string;
  productName: string;
  isOutOfStock: boolean;
}

export function QuickAddOverlay({
  productId,
  productName,
  isOutOfStock,
}: QuickAddOverlayProps) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (isOutOfStock) {
    return null;
  }

  function handleQuickAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      await addBasketItemAction(productId, 1);
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2000);
    });
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-[#323C4B]/70 backdrop-blur-[2px] p-4 transition-all duration-200 ${
        added || isPending
          ? "visible opacity-100"
          : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={handleQuickAdd}
        disabled={isPending}
        aria-label={`Add ${productName} to cart`}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold shadow-lg transition-all active:scale-95 disabled:opacity-75 ${
          added || isPending
            ? "pointer-events-auto"
            : "pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
        } ${
          added
            ? "bg-emerald-500 text-white"
            : "bg-white text-[#323C4B] hover:bg-slate-100"
        }`}
      >
        {isPending ? (
          "Adding..."
        ) : added ? (
          <>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
              />
            </svg>
            Added to Cart!
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
}
