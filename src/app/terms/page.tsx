import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Terms &amp; Conditions</h1>
      <p className="mt-4" style={{ color: "var(--color-text-muted)" }}>
        This page will display the terms and conditions provided by the business owner.
        The content must be supplied and ideally reviewed by a solicitor before launch.
      </p>
    </div>
  );
}

