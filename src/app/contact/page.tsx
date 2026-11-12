import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with SIRAGRO. Find our address, phone number, and opening hours.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-4" style={{ color: "var(--color-text-muted)" }}>
        Contact form and shop details coming in Stage 11. This page will show
        your address, phone number, email, opening hours, and a map.
      </p>
    </div>
  );
}

