import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse our full range of groceries, fresh produce, drinks, snacks, dairy, frozen goods, household items and off-licence products.",
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Shop All Products</h1>
      <p className="mt-4" style={{ color: "var(--color-text-muted)" }}>
        Product catalogue coming in Stage 4. This page will show all products
        with search, filters, and pagination.
      </p>
    </div>
  );
}

