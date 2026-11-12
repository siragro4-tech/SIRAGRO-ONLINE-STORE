import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FALLBACK_PRODUCTS, getCategories, type Product } from "@/lib/products";
import { ProductListTable } from "@/components/admin/ProductListTable";

export const metadata: Metadata = {
  title: "Products & Inventory",
};

interface AdminProductsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const { filter } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const categories = await getCategories();

  let products: Product[] = FALLBACK_PRODUCTS.map((prod) => ({
    ...prod,
    category: categories.find((c) => c.id === prod.category_id) || null,
  }));

  try {
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*)")
      .order("created_at", { ascending: false });

    if (!error && dbProducts && dbProducts.length > 0) {
      products = dbProducts as unknown as Product[];
    }
  } catch {
    // Fallback to static products
  }

  return (
    <ProductListTable
      products={products}
      categories={categories}
      initialFilter={filter || "all"}
    />
  );
}

