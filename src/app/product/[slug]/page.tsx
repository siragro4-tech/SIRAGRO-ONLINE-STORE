import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug, getProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { AddToBasketSection } from "@/components/products/AddToBasketSection";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    title: product.seo_title || `${product.name} | SIRAGRO Supermarket`,
    description:
      product.seo_description ||
      product.description ||
      `Buy ${product.name} online from SIRAGRO. Fast local delivery near UB3 and click & collect.`,
    alternates: {
      canonical: `${siteUrl}/product/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} • £${product.price.toFixed(2)} | SIRAGRO`,
      description: product.description || `Order ${product.name} online.`,
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Get up to 4 related products from the same category
  const { products: relatedProducts } = await getProducts({
    categorySlug: product.category?.slug,
    limit: 5,
  });

  const filteredRelated = relatedProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const isDiscounted =
    product.compare_at_price && product.compare_at_price > product.price;

  // JSON-LD Structured Data for search engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.brand || "SIRAGRO",
    },
    sku: product.barcode || product.id,
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: product.price.toFixed(2),
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "GroceryStore",
        name: "SIRAGRO",
      },
    },
  };

  return (
    <>
      {/* Inject JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-green-700 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-green-700 transition-colors">
            Shop
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                href={`/category/${product.category.slug}`}
                className="hover:text-green-700 transition-colors"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="font-semibold text-gray-900 truncate max-w-xs" aria-current="page">
            {product.name}
          </span>
        </nav>

        {/* Main Product Container */}
        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left: Product Image / Gallery */}
          <div>
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center p-8">
              {/* Image Graphic / Placeholder */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-green-100 p-8 text-green-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.2}
                    stroke="currentColor"
                    className="h-28 w-28"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                </div>
                <span className="mt-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {product.brand || "SIRAGRO Fresh"}
                </span>
              </div>

              {/* Badges */}
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {isDiscounted && (
                  <span className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
                    Special Offer • Save £{(product.compare_at_price! - product.price).toFixed(2)}
                  </span>
                )}
                {product.is_age_restricted && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white shadow-sm">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    Age {product.minimum_age || 18}+ Only
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Product Details & Purchase Form */}
          <div className="flex flex-col justify-between">
            <div>
              {product.brand && (
                <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
                  {product.brand}
                </p>
              )}

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>

              {product.unit && (
                <p className="mt-1 text-base text-gray-500 font-medium">
                  {product.unit}
                </p>
              )}

              {/* Price Block */}
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  £{product.price.toFixed(2)}
                </span>
                {isDiscounted && (
                  <span className="text-lg text-gray-400 line-through">
                    £{product.compare_at_price!.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock Status Badge */}
              <div className="mt-3">
                {product.stock_quantity <= 0 ? (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                    ✕ Out of Stock
                  </span>
                ) : product.stock_quantity < 5 ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    ⚠ Low Stock: Only {product.stock_quantity} remaining
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                    ✓ In Stock (Fresh for collection or delivery)
                  </span>
                )}
              </div>

              {/* Age Restriction Advisory Banner */}
              {product.is_age_restricted && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900"
                >
                  <p className="font-bold flex items-center gap-1.5 text-sm text-red-800">
                    🔞 Age-Restricted Off-Licence Product ({product.minimum_age || 18}+)
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Under the Licensing Act 2003, it is an offence to purchase alcohol for anyone under 18.
                    We operate a strict <strong>Challenge 25</strong> policy. Our delivery driver or collection counter
                    staff will request valid photographic ID (Passport, UK Driving Licence, or PASS card).
                  </p>
                </div>
              )}

              {/* Add to Basket Component */}
              <AddToBasketSection product={product} />

              {/* Description & Specs */}
              <div className="mt-6 space-y-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Product Details
                </h2>
                <p className="text-sm leading-relaxed text-gray-600">
                  {product.description || "Fresh grocery item from SIRAGRO."}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-xs">
                  {product.unit && (
                    <>
                      <dt className="text-gray-500 font-medium">Pack / Unit</dt>
                      <dd className="text-gray-900 font-semibold">{product.unit}</dd>
                    </>
                  )}
                  {product.weight_kg && (
                    <>
                      <dt className="text-gray-500 font-medium">Approx. Weight</dt>
                      <dd className="text-gray-900 font-semibold">{product.weight_kg} kg</dd>
                    </>
                  )}
                  {product.barcode && (
                    <>
                      <dt className="text-gray-500 font-medium">Barcode / EAN</dt>
                      <dd className="text-gray-900 font-mono">{product.barcode}</dd>
                    </>
                  )}
                  {product.category && (
                    <>
                      <dt className="text-gray-500 font-medium">Aisle</dt>
                      <dd className="text-gray-900 font-semibold">{product.category.name}</dd>
                    </>
                  )}
                </dl>
              </div>
            </div>

            {/* Fulfilment & Delivery Highlights */}
            <div className="mt-8 rounded-xl bg-gray-50 p-4 text-xs text-gray-600 border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">🚚 Home Delivery:</span>
                <span>Free delivery over £25 within 1 mile near UB3. Paid delivery up to 5 miles.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">🏬 Click &amp; Collect:</span>
                <span>Free collection from our shop near UB3 4NS.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {filteredRelated.length > 0 && (
          <section className="mt-16 border-t border-gray-200 pt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-2xl font-bold tracking-tight text-gray-900">
              More from {product.category?.name || "this aisle"}
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredRelated.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

