import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDashboardPreview } from "@/components/preview/AdminDashboardPreview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard Design Preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminDashboardPreviewPage() {
  // Strictly available in local development mode only; returns 404 everywhere else.
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <AdminDashboardPreview />;
}
