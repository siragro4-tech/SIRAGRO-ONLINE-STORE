import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryBySlug, getProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: "price-asc" | "price-desc" | "newest" | "name" }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${category.name} | SIRAGRO Supermarket`,
    description: category.description || `Browse ${category.name} at SIRAGRO. Fast local delivery near UB3 and click & collect.`,
    openGraph: {
      title: `${category.name} | SIRAGRO`,
      description: category.description || `Shop ${category.name} online at SIRAGRO.`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10) || 1);
  const sort = resolvedSearchParams.sort || "newest";

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const { products, total, totalPages } = await getProducts({
    categorySlug: slug,
    page: currentPage,
    sort,
    limit: 12,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Accessible Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#323C4B] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#323C4B] transition-colors">
          Shop
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-900" aria-current="page">
          {category.name}
        </span>
      </nav>

      {/* Category Header */}
      <div className="mt-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#323C4B] text-white shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#323C4B] sm:text-3xl">
              {category.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {category.description || `Browse our full selection of ${category.name.toLowerCase()}.`}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Showing {products.length} of {total} products
        </p>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-base text-gray-600">
            No products are currently available in this aisle.
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex items-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Browse all aisles
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

      {/* Pagination */}
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
                href={`/category/${slug}?page=${currentPage - 1}`}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                &larr; Previous
              </Link>
            )}

            {currentPage < totalPages && (
              <Link
                href={`/category/${slug}?page=${currentPage + 1}`}
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

