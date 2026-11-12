import type { Metadata } from "next";
import { CsvImportTool } from "@/components/admin/CsvImportTool";

export const metadata: Metadata = {
  title: "Bulk CSV Import",
};

export default function AdminImportPage() {
  return <CsvImportTool />;
}

