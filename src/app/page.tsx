import Link from "next/link";

/**
 * Placeholder homepage.
 * This will be replaced with featured categories, hero banner,
 * and promotional sections in Stage 4.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero section */}
      <section className="text-center" aria-labelledby="hero-heading">
        <h1
          id="hero-heading"
          className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: "var(--color-primary-dark)" }}
        >
          Welcome to SIRAGRO
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg" style={{ color: "var(--color-text-muted)" }}>
          Your local grocery and off-licence store — now online. Fresh produce,
          everyday essentials, drinks and more, delivered to your door or ready
          for collection.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center rounded-lg px-8 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Shop Now
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center rounded-lg border-2 px-8 py-3 text-lg font-semibold transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              borderColor: "var(--color-primary)",
              color: "var(--color-primary-dark)",
            }}
          >
            About Us
          </Link>
        </div>
      </section>

      {/* Placeholder category grid — will be dynamic in Stage 4 */}
      <section className="mt-20" aria-labelledby="categories-heading">
        <h2
          id="categories-heading"
          className="text-center text-2xl font-bold sm:text-3xl"
        >
          Shop by Category
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            "Fresh Produce",
            "Dairy & Eggs",
            "Bakery",
            "Meat & Fish",
            "Drinks",
            "Snacks",
            "Frozen",
            "Household",
          ].map((category) => (
            <div
              key={category}
              className="flex h-32 items-center justify-center rounded-xl border-2 text-center font-semibold transition-shadow hover:shadow-md sm:h-40"
              style={{ borderColor: "var(--color-border)" }}
            >
              {category}
            </div>
          ))}
        </div>
      </section>

      {/* Store info */}
      <section className="mt-20 text-center" aria-labelledby="info-heading">
        <h2 id="info-heading" className="text-2xl font-bold sm:text-3xl">
          Delivery & Collection
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: "var(--color-text-muted)" }}>
          Free delivery on orders over £25 within 1 mile. Paid delivery up to
          5 miles. In-store collection always available.
        </p>
      </section>
    </div>
  );
}

