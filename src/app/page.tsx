import { Suspense } from "react";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { SearchBar } from "@/components/products/SearchBar";

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
  ]);

  return (
    <div>
      {/* 1. Hero Section with Local Branding & Search */}
      <section
        className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-green-50/70 to-white py-12 sm:py-16"
        aria-labelledby="hero-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              📍 Local Delivery &amp; In-Store Collection near UB3
            </span>

            <h1
              id="hero-heading"
              className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            >
              Your Fresh Local Grocery &amp; Off-Licence
            </h1>

            <p className="mt-4 text-base text-gray-600 sm:text-lg">
              Fresh produce, daily essentials, cold drinks, bakery, and off-licence goods.
              Delivered straight to your doorstep or ready for fast in-store pickup.
            </p>

            {/* Prominent Search Bar */}
            <div className="mt-8 mx-auto max-w-xl">
              <Suspense fallback={<div className="h-10 bg-gray-100 rounded-full" />}>
                <SearchBar placeholder="Search 1,500+ products (e.g. milk, apples, basmati rice, gin)..." />
              </Suspense>
            </div>

            {/* Quick Benefits Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-gray-600">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                Free delivery over £25 within 1 mile
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                Delivery up to 5 miles
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                In-store collection always free
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category / Supermarket Aisles */}
      <section className="py-12 sm:py-16" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="categories-heading"
                className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
              >
                Shop by Supermarket Aisle
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Browse our aisles for fresh groceries and pantry essentials.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center text-sm font-semibold text-green-700 hover:text-green-800"
            >
              View all products &rarr;
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-green-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-700 group-hover:bg-green-100 transition-colors">
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
                      d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                    />
                  </svg>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {cat.description || "Browse selection"}
                  </p>
                </div>

                <span className="mt-3 inline-flex items-center text-xs font-semibold text-green-700">
                  Shop aisle &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Popular & Featured Grocery Products */}
      <section
        className="border-t border-gray-200 bg-gray-50/50 py-12 sm:py-16"
        aria-labelledby="popular-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                Fresh &amp; Popular
              </span>
              <h2
                id="popular-heading"
                className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
              >
                Supermarket Essentials
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-green-700 hover:text-green-800"
            >
              See all items &rarr;
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Local Service & Responsibility Banner */}
      <section className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75m0 3.75h3.75m-3.75 0h-6.75m6.75 0v3.75m0 0h3.75m-3.75 0h-6.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Local Delivery Area</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Serving residents and businesses within 5 miles of our shop near UB3 4NS. Free delivery over £25 within 1 mile.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Responsible Off-Licence</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Strict Challenge 25 policy. Mandatory photographic ID verification upon delivery or in-store collection for all age-restricted items.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Safe Card Payments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Card details are processed securely by Stripe. We never store your payment card numbers on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
