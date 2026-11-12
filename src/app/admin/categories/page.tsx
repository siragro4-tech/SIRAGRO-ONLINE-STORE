import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "@/lib/products";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const metadata: Metadata = {
  title: "Categories & Aisles",
};

export default async function AdminCategoriesPage() {
  const supabase = await createServerSupabaseClient();

  let categories = FALLBACK_CATEGORIES.map((c) => ({
    ...c,
    product_count: FALLBACK_PRODUCTS.filter((p) => p.category_id === c.id).length,
  }));

  try {
    const { data: dbCategories, error } = await supabase
      .from("categories")
      .select("*, products(id)")
      .order("sort_order", { ascending: true });

    if (!error && dbCategories && dbCategories.length > 0) {
      categories = dbCategories.map((c) => ({
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
    }
  } catch {
    // Fallback to static categories
  }

  return <CategoryManager categories={categories} />;
}

