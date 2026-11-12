import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Cookie Policy</h1>
      <p className="mt-4" style={{ color: "var(--color-text-muted)" }}>
        This page will display the cookie policy provided by the business owner.
        The content must be supplied and ideally reviewed by a solicitor before launch.
      </p>
    </div>
  );
}

