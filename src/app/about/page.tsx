import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about SIRAGRO — your local grocery and off-licence store.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">About Us</h1>
      <p className="mt-4" style={{ color: "var(--color-text-muted)" }}>
        Content will be provided by the business owner. This page will tell
        your story — who you are, your values, and your connection to the
        local community.
      </p>
    </div>
  );
}

