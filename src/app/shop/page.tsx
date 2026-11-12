import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { SearchBar } from "@/components/products/SearchBar";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse groceries, fresh produce, chilled dairy, drinks, snacks and household essentials online from SIRAGRO.",
};

interface ShopPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: "price-asc" | "price-desc" | "newest" | "name";
    page?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const selectedCategory = resolvedParams.category || "";
  const sort = resolvedParams.sort || "newest";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const [categories, { products, total, totalPages }] = await Promise.all([
    getCategories(),
    getProducts({
      query,
      categorySlug: selectedCategory,
      sort,
      page: currentPage,
      limit: 12,
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {query ? `Search Results for "${query}"` : "All Supermarket Products"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Showing {products.length} of {total} products
            {selectedCategory && ` in ${categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}`}
          </p>
        </div>

        <div className="w-full md:max-w-md">
          <Suspense fallback={<div className="h-10 bg-gray-100 rounded-full" />}>
            <SearchBar placeholder="Search products..." />
          </Suspense>
        </div>
      </div>

      {/* Aisle Category Pills */}
      <nav className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Category filter">
        <Link
          href={`/shop${query ? `?q=${encodeURIComponent(query)}` : ""}`}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            !selectedCategory
              ? "bg-green-700 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Aisles
        </Link>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          const params = new URLSearchParams();
          if (query) params.set("q", query);
          params.set("category", cat.slug);

          return (
            <Link
              key={cat.id}
              href={`/shop?${params.toString()}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </nav>

      {/* Products Grid or Empty State */}
      {products.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No products found</h2>
          <p className="mt-1 text-sm text-gray-500">
            We couldn&apos;t find any grocery items matching your query. Try a different search term or browse all aisles.
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex items-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Clear filters &amp; view all
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Accessible Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6"
          aria-label="Pagination Navigation"
        >
          <div>
            <p className="text-sm text-gray-700">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </p>
          </div>

          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/shop?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  ...(selectedCategory ? { category: selectedCategory } : {}),
                  page: String(currentPage - 1),
                }).toString()}`}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                &larr; Previous
              </Link>
            )}

            {currentPage < totalPages && (
              <Link
                href={`/shop?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  ...(selectedCategory ? { category: selectedCategory } : {}),
                  page: String(currentPage + 1),
                }).toString()}`}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next &rarr;
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
