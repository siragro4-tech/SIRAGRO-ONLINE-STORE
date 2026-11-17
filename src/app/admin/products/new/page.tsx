import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-auth";
import { getCategories } from "@/lib/products";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Add Product",
};

export default async function NewProductPage() {
  await requireAdminPage("/admin/products/new");
  const categories = await getCategories();

  return (
    <div>
      <ProductForm categories={categories} />
    </div>
  );
}
