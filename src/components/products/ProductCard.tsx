import Link from "next/link";
import type { Product } from "@/lib/products";

interface ProductCardProps {
  product: Product;
}

/** Premium brand-coloured product mockup illustration per category */
function CategoryMockup({ slug, brand, className }: { slug?: string; brand?: string; className?: string }) {
  const cls = className ?? "w-full h-full";

  // Category config: gradient colours + icon path
  const configs: Record<string, { bg: string; accent: string; label: string; icon: React.ReactNode }> = {
    "fresh-produce": {
      bg: "from-[#1e3a2e] to-[#2d5a3d]",
      accent: "#4ade80",
      label: brand || "FARM FRESH",
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-hidden="true">
          <circle cx="32" cy="30" r="16" fill="white" fillOpacity="0.15" />
          <ellipse cx="32" cy="32" rx="11" ry="13" fill="white" fillOpacity="0.9" />
          <path d="M32 19 C32 19 36 13 42 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M26 28 Q32 22 38 28 Q32 38 26 28Z" fill="#323C4B" fillOpacity="0.5" />
          <line x1="32" y1="45" x2="32" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="32" cy="51" rx="6" ry="2" fill="white" fillOpacity="0.3" />
        </svg>
      ),
    },
    "dairy-eggs": {
      bg: "from-[#1a2d4a] to-[#243c5e]",
      accent: "#93c5fd",
      label: brand || "COUNTRY PURE",
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-hidden="true">
          <rect x="22" y="18" width="20" height="32" rx="5" fill="white" fillOpacity="0.9" />
          <rect x="24" y="10" width="16" height="10" rx="3" fill="white" fillOpacity="0.7" />
          <rect x="22" y="10" width="20" height="4" rx="2" fill="white" />
          <rect x="24" y="28" width="16" height="8" rx="2" fill="#93c5fd" fillOpacity="0.8" />
          <text x="32" y="23" textAnchor="middle" fontSize="5" fill="#1a2d4a" fontWeight="bold">MILK</text>
          <ellipse cx="32" cy="52" rx="8" ry="2.5" fill="white" fillOpacity="0.2" />
        </svg>
      ),
    },
    "bakery": {
      bg: "from-[#3d2a0e] to-[#5a3d14]",
      accent: "#fbbf24",
      label: brand || "FRESHLY BAKED",
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-hidden="true">
          <ellipse cx="32" cy="40" rx="20" ry="10" fill="white" fillOpacity="0.9" />
          <path d="M12 40 Q12 24 32 24 Q52 24 52 40" fill="white" fillOpacity="0.7" />
          <path d="M18 32 Q23 26 28 32" stroke="#5a3d14" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M36 30 Q41 24 46 30" stroke="#5a3d14" strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx="32" cy="52" rx="8" ry="2.5" fill="white" fillOpacity="0.2" />
        </svg>
      ),
    },
    "meat-fish": {
      bg: "from-[#3b1212] to-[#5a1a1a]",
      accent: "#f87171",
      label: brand || "PRIME CUT",
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-hidden="true">
          <ellipse cx="32" cy="36" rx="18" ry="12" fill="white" fillOpacity="0.9" />
          <ellipse cx="32" cy="36" rx="12" ry="7" fill="#f87171" fillOpacity="0.6" />
          <line x1="29" y1="16" x2="29" y2="27" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="35" y1="13" x2="35" y2="27" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="32" cy="13" rx="5" ry="2.5" fill="white" fillOpacity="0.7" />
          <ellipse cx="32" cy="52" rx="8" ry="2.5" fill="white" fillOpacity="0.2" />
        </svg>
      ),
    },
    "off-licence-beverages": {
      bg: "from-[#1e1535] to-[#2d1f52]",
      accent: "#a78bfa",
      label: brand || "PREMIUM SELECT",
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-hidden="true">
          <rect x="27" y="8" width="10" height="8" rx="2" fill="white" fillOpacity="0.8" />
          <path d="M27 16 L23 24 L23 50 Q23 54 32 54 Q41 54 41 50 L41 24 L37 16 Z" fill="white" fillOpacity="0.9" />
          <rect x="23" y="30" width="18" height="1.5" fill="#2d1f52" fillOpacity="0.3" />
          <ellipse cx="32" cy="43" rx="6" ry="8" fill="#a78bfa" fillOpacity="0.4" />
          <rect x="28" y="8" width="8" height="3" rx="1" fill="#2d1f52" fillOpacity="0.5" />
        </svg>
      ),
    },
    "cupboard-groceries": {
      bg: "from-[#2d1a06] to-[#4a2d0a]",
      accent: "#fb923c",
      label: brand || "PANTRY STAPLE",
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-hidden="true">
          <ellipse cx="32" cy="18" rx="13" ry="4.5" fill="white" fillOpacity="0.9" />
          <rect x="19" y="18" width="26" height="26" fill="white" fillOpacity="0.85" />
          <ellipse cx="32" cy="44" rx="13" ry="4.5" fill="white" fillOpacity="0.9" />
          <rect x="19" y="24" width="26" height="1" fill="#4a2d0a" fillOpacity="0.3" />
          <rect x="19" y="34" width="26" height="1" fill="#4a2d0a" fillOpacity="0.3" />
          <text x="32" y="32" textAnchor="middle" fontSize="5.5" fill="#4a2d0a" fontWeight="bold">STORE</text>
        </svg>
      ),
    },
    "frozen-goods": {
      bg: "from-[#0d2540] to-[#153555]",
      accent: "#7dd3fc",
      label: brand || "FROZEN BEST",
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-hidden="true">
          <circle cx="32" cy="32" r="20" fill="white" fillOpacity="0.12" />
          <line x1="32" y1="14" x2="32" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="14" y1="32" x2="50" y2="32" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="18" y1="18" x2="46" y2="46" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="46" y1="18" x2="18" y2="46" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="5" fill="white" />
          <circle cx="32" cy="15" r="2.5" fill="white" fillOpacity="0.8" />
          <circle cx="32" cy="49" r="2.5" fill="white" fillOpacity="0.8" />
          <circle cx="15" cy="32" r="2.5" fill="white" fillOpacity="0.8" />
          <circle cx="49" cy="32" r="2.5" fill="white" fillOpacity="0.8" />
        </svg>
      ),
    },
    "household-cleaning": {
      bg: "from-[#0d3025] to-[#164237]",
      accent: "#34d399",
      label: brand || "HOME CARE",
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-hidden="true">
          <rect x="28" y="26" width="16" height="24" rx="4" fill="white" fillOpacity="0.9" />
          <rect x="30" y="18" width="10" height="10" rx="3" fill="white" fillOpacity="0.75" />
          <path d="M30 23 L18 23 L18 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M18 30 L13 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="11" cy="28" r="1.5" fill="white" fillOpacity="0.9" />
          <circle cx="9" cy="25" r="1.5" fill="white" fillOpacity="0.6" />
          <circle cx="11" cy="22" r="1.5" fill="white" fillOpacity="0.4" />
          <rect x="30" y="34" width="10" height="6" rx="1.5" fill="#164237" fillOpacity="0.3" />
        </svg>
      ),
    },
  };

  const config = configs[slug ?? ""] ?? {
    bg: "from-[#1e2a38] to-[#2d3f52]",
    accent: "#94a3b8",
    label: brand || "QUALITY PICK",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-hidden="true">
        <rect x="14" y="22" width="36" height="30" rx="5" fill="white" fillOpacity="0.9" />
        <path d="M22 22 C22 14 42 14 42 22" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M23 34 L29 40 L41 28" stroke="#2d3f52" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="32" cy="56" rx="10" ry="3" fill="white" fillOpacity="0.2" />
      </svg>
    ),
  };

  return (
    <div className={`${cls} relative flex flex-col items-center justify-center bg-gradient-to-b ${config.bg} rounded-lg overflow-hidden`}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />
      {/* Glow behind icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-28 h-28 rounded-full" style={{ background: config.accent, opacity: 0.12, filter: "blur(20px)" }} />
      </div>
      {/* Icon */}
      <div className="relative z-10 drop-shadow-lg">
        {config.icon}
      </div>
      {/* Brand label */}
      <span className="relative z-10 mt-2 text-[9px] font-black tracking-widest uppercase" style={{ color: config.accent }}>
        {config.label}
      </span>
    </div>
  );
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
      className="group relative flex flex-col justify-between rounded-xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-[#323C4B] hover:shadow-lg focus-within:ring-2 focus-within:ring-[#323C4B]"
      aria-labelledby={`product-heading-${product.id}`}
    >
      <div>
        {/* Product Image Area — premium brand-coloured mockup */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg group-hover:scale-[1.02] transition-transform duration-300">
          <CategoryMockup slug={categorySlug} brand={product.brand ?? undefined} className="w-full h-full" />

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
            {isDiscounted && (
              <span className="inline-flex items-center rounded-md bg-[#323C4B] text-white px-2 py-0.5 text-xs font-black shadow-sm">
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
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-[1px]">
              <span className="rounded-md bg-[#323C4B] px-3 py-1 text-xs font-bold text-white">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="mt-3">
          {product.category && (
            <p className="text-xs font-bold text-[#323C4B]">
              {product.category.name}
            </p>
          )}

          <h3
            id={`product-heading-${product.id}`}
            className="mt-1 text-sm font-bold text-slate-800 group-hover:text-[#323C4B] transition-colors line-clamp-2"
          >
            <Link
              href={`/product/${product.slug}`}
              className="after:absolute after:inset-0 after:z-0 focus:outline-none"
            >
              {product.name}
            </Link>
          </h3>

          {product.unit && (
            <p className="mt-1 text-xs text-slate-500">{product.unit}</p>
          )}
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between z-10 relative">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-[#323C4B]">
              £{product.price.toFixed(2)}
            </span>
            {isDiscounted && (
              <span className="text-xs text-slate-400 line-through">
                £{product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {isOutOfStock ? (
              <span className="text-red-600 font-semibold">Out of stock</span>
            ) : product.stock_quantity < 5 ? (
              <span className="text-amber-600 font-medium">Only {product.stock_quantity} left</span>
            ) : (
              <span className="text-emerald-700 font-semibold">In stock</span>
            )}
          </p>
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="relative z-10 inline-flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white bg-[#323C4B] hover:bg-[#242c37] shadow-sm transition-all hover:scale-105 active:scale-95"
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
