import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-auth";
import { CategoryManager } from "@/components/admin/CategoryManager";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Categories & Aisles",
};

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"] & {
  product_count?: number;
};

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdminPage("/admin/categories");

  const { data: dbCategories, error } = await supabase
    .from("categories")
    .select("*, products(id)")
    .order("sort_order", { ascending: true });

  const categories: CategoryRow[] = (dbCategories || []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parent_id: c.parent_id,
    description: c.description,
    image_url: c.image_url,
    sort_order: c.sort_order,
    is_active: c.is_active,
    created_at: c.created_at,
    updated_at: c.updated_at,
    product_count: Array.isArray(c.products) ? c.products.length : 0,
  }));

  return (
    <CategoryManager
      categories={categories}
      loadError={error?.message || null}
    />
  );
}
