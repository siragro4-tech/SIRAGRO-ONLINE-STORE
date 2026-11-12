import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <p
        className="text-6xl font-bold"
        style={{ color: "var(--color-primary)" }}
      >
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Page not found</h1>
      <p
        className="mt-2 text-base"
        style={{ color: "var(--color-text-muted)" }}
      >
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Go Home
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center rounded-lg border-2 px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
          style={{
            borderColor: "var(--color-primary)",
            color: "var(--color-primary-dark)",
          }}
        >
          Browse Shop
        </Link>
      </div>
    </div>
  );
}

