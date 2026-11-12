import Link from "next/link";
import type { Product } from "@/lib/products";

interface ProductCardProps {
  product: Product;
}

/** SVG icon per category slug — crisp, clean, no AI images */
function CategoryIcon({ slug, className }: { slug?: string; className?: string }) {
  const cls = className ?? "h-16 w-16";

  switch (slug) {
    case "fresh-produce":
      return (
        // Leaf / apple icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className={cls} aria-hidden="true">
          <circle cx="24" cy="22" r="13" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
          <path d="M24 10 C18 10 13 15 13 22 C13 29 18 34 24 34 C30 34 35 29 35 22 C35 15 30 10 24 10Z" fill="#bbf7d0" />
          <path d="M24 10 C24 10 28 6 32 8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
          <path d="M24 34 L24 42" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 20 Q24 16 30 20 Q24 28 18 20Z" fill="#16a34a" opacity="0.6" />
        </svg>
      );

    case "dairy-eggs":
      return (
        // Milk bottle icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className={cls} aria-hidden="true">
          <rect x="16" y="14" width="16" height="26" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <rect x="18" y="8" width="12" height="8" rx="2" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2" />
          <path d="M18 24 Q24 20 30 24" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="24" cy="30" r="3" fill="#2563eb" opacity="0.3" />
          <text x="24" y="35" textAnchor="middle" fontSize="6" fill="#1d4ed8" fontWeight="bold">MILK</text>
        </svg>
      );

    case "bakery":
      return (
        // Bread loaf icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className={cls} aria-hidden="true">
          <ellipse cx="24" cy="30" rx="16" ry="8" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
          <path d="M8 30 Q8 18 24 18 Q40 18 40 30" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
          <path d="M14 24 Q18 20 22 24" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M26 22 Q30 18 34 22" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M8 30 L8 34 Q8 38 24 38 Q40 38 40 34 L40 30" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
        </svg>
      );

    case "meat-fish":
      return (
        // Meat/steak icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className={cls} aria-hidden="true">
          <ellipse cx="24" cy="26" rx="15" ry="10" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
          <ellipse cx="24" cy="26" rx="10" ry="6" fill="#fca5a5" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="22" y1="12" x2="22" y2="20" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="10" x2="26" y2="20" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="24" cy="11" rx="4" ry="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
        </svg>
      );

    case "off-licence-beverages":
      return (
        // Wine bottle icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className={cls} aria-hidden="true">
          <rect x="20" y="6" width="8" height="6" rx="1" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1.5" />
          <path d="M20 12 L17 18 L17 38 Q17 42 24 42 Q31 42 31 38 L31 18 L28 12 Z" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2" />
          <path d="M17 26 L31 26" stroke="#7c3aed" strokeWidth="1" strokeDasharray="2 2" />
          <ellipse cx="24" cy="34" rx="5" ry="6" fill="#c4b5fd" opacity="0.5" />
          <rect x="21" y="6" width="6" height="2" rx="1" fill="#7c3aed" />
        </svg>
      );

    case "cupboard-groceries":
      return (
        // Tin / can icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className={cls} aria-hidden="true">
          <ellipse cx="24" cy="14" rx="12" ry="4" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
          <rect x="12" y="14" width="24" height="22" fill="#ffedd5" stroke="#ea580c" strokeWidth="2" />
          <ellipse cx="24" cy="36" rx="12" ry="4" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
          <path d="M12 20 L36 20" stroke="#ea580c" strokeWidth="1" />
          <path d="M12 28 L36 28" stroke="#ea580c" strokeWidth="1" />
          <text x="24" y="26" textAnchor="middle" fontSize="7" fill="#c2410c" fontWeight="bold">STORE</text>
        </svg>
      );

    case "frozen-goods":
      return (
        // Snowflake icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className={cls} aria-hidden="true">
          <circle cx="24" cy="24" r="18" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          <line x1="24" y1="10" x2="24" y2="38" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="10" y1="24" x2="38" y2="24" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="13.5" y1="13.5" x2="34.5" y2="34.5" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="34.5" y1="13.5" x2="13.5" y2="34.5" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="24" r="4" fill="#0284c7" />
          <circle cx="24" cy="12" r="2" fill="#0284c7" />
          <circle cx="24" cy="36" r="2" fill="#0284c7" />
          <circle cx="12" cy="24" r="2" fill="#0284c7" />
          <circle cx="36" cy="24" r="2" fill="#0284c7" />
        </svg>
      );

    case "household-cleaning":
      return (
        // Spray bottle icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className={cls} aria-hidden="true">
          <rect x="20" y="20" width="14" height="20" rx="3" fill="#d1fae5" stroke="#059669" strokeWidth="2" />
          <rect x="22" y="14" width="8" height="8" rx="2" fill="#a7f3d0" stroke="#059669" strokeWidth="1.5" />
          <path d="M22 18 L14 18 L14 24" stroke="#059669" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M14 24 L10 24" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
          <circle cx="10" cy="22" r="1" fill="#059669" />
          <circle cx="8" cy="20" r="1" fill="#059669" opacity="0.6" />
          <circle cx="10" cy="18" r="1" fill="#059669" opacity="0.4" />
          <path d="M24 28 Q27 32 24 36" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeDasharray="2 2" />
        </svg>
      );

    default:
      // Generic grocery bag — clean and minimal
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className={cls} aria-hidden="true">
          <rect x="10" y="18" width="28" height="24" rx="4" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
          <path d="M17 18 C17 12 31 12 31 18" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M18 26 L22 30 L30 22" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

/**
 * Reusable, accessible product card component for supermarket listings.
 * Uses clean SVG category icons — no placeholder images.
 */
export function ProductCard({ product }: ProductCardProps) {
  const isDiscounted =
    product.compare_at_price && product.compare_at_price > product.price;
  const isOutOfStock = product.stock_quantity <= 0;
  const categorySlug = product.category?.slug;

  return (
    <article
      className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-green-300 hover:shadow-md focus-within:ring-2 focus-within:ring-green-600"
      aria-labelledby={`product-heading-${product.id}`}
    >
      <div>
        {/* Product Icon Area */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-100 group-hover:from-green-50 group-hover:to-emerald-50 transition-colors">
          <div className="flex flex-col items-center justify-center gap-1 group-hover:scale-110 transition-transform duration-200">
            <CategoryIcon slug={categorySlug} className="h-16 w-16" />
            {product.brand && (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {product.brand}
              </span>
            )}
          </div>

          {/* Badges */}
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

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[1px]">
              <span className="rounded-md bg-gray-800/80 px-3 py-1 text-xs font-bold text-white">
                Out of Stock
              </span>
            </div>
          )}
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

      {/* Pricing & CTA */}
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

        <Link
          href={`/product/${product.slug}`}
          className="relative z-10 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:scale-105 active:scale-95"
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
