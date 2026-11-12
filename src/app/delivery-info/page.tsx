import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery Information",
  description:
    "Find out about SIRAGRO delivery areas, charges, and collection options.",
};

export default function DeliveryInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Delivery Information</h1>
      <p className="mt-4" style={{ color: "var(--color-text-muted)" }}>
        Full delivery details coming soon. We deliver within a 5-mile radius of
        our shop near UB3. Free delivery on orders over £25 within 1 mile.
        In-store collection is always available.
      </p>
    </div>
  );
}

