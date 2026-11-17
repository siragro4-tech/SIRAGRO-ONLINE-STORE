import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-auth";
import { CsvImportTool } from "@/components/admin/CsvImportTool";

export const metadata: Metadata = {
  title: "Bulk CSV Import",
};

export default async function AdminImportPage() {
  await requireAdminPage("/admin/import");
  return <CsvImportTool />;
}
