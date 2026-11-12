import Link from "next/link";
import type { Product } from "@/lib/products";

interface ProductCardProps {
  product: Product;
}

/**
 * Reusable, accessible product card component for supermarket listings.
 */
export function ProductCard({ product }: ProductCardProps) {
  const isDiscounted =
    product.compare_at_price && product.compare_at_price > product.price;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <article
      className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-md focus-within:ring-2 focus-within:ring-green-600"
      aria-labelledby={`product-heading-${product.id}`}
    >
      <div>
        {/* Product Image / Placeholder */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
          {/* Category indicator icon placeholder */}
          <div className="flex flex-col items-center justify-center p-4 text-center text-gray-400 group-hover:scale-105 transition-transform duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
              className="h-16 w-16 text-green-700/60"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            <span className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {product.brand || "SIRAGRO"}
            </span>
          </div>

          {/* Badges container */}
          <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
            {isDiscounted && (
              <span className="inline-flex items-center rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                Save £{(product.compare_at_price! - product.price).toFixed(2)}
              </span>
            )}
            {product.is_age_restricted && (
              <span
                className="inline-flex items-center rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm"
                title="Challenge 25: Age verification required upon delivery or collection"
              >
                {product.minimum_age || 18}+
              </span>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-3">
          {product.category && (
            <p className="text-xs font-medium text-green-700">
              {product.category.name}
            </p>
          )}

          <h3
            id={`product-heading-${product.id}`}
            className="mt-1 text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2"
          >
            <Link
              href={`/product/${product.slug}`}
              className="after:absolute after:inset-0 after:z-0 focus:outline-none"
            >
              {product.name}
            </Link>
          </h3>

          {product.unit && (
            <p className="mt-1 text-xs text-gray-500">{product.unit}</p>
          )}
        </div>
      </div>

      {/* Pricing & Add to Basket Button */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between z-10 relative">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-gray-900">
              £{product.price.toFixed(2)}
            </span>
            {isDiscounted && (
              <span className="text-xs text-gray-400 line-through">
                £{product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500">
            {isOutOfStock ? (
              <span className="text-red-600 font-semibold">Out of stock</span>
            ) : product.stock_quantity < 5 ? (
              <span className="text-amber-600 font-medium">Only {product.stock_quantity} left</span>
            ) : (
              <span className="text-green-600">In stock</span>
            )}
          </p>
        </div>

        {/* Quick Add Button — Stage 5 hooks this into the basket store */}
        <Link
          href={`/product/${product.slug}`}
          className="relative z-10 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "var(--color-primary)" }}
          aria-label={`View ${product.name}`}
        >
          View
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </article>
  );
}

