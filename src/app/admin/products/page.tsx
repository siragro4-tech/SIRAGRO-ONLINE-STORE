import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin-auth";
import { getCategories, type Product } from "@/lib/products";
import { ProductListTable } from "@/components/admin/ProductListTable";

export const metadata: Metadata = {
  title: "Products & Inventory",
};

const PAGE_SIZE = 25;

interface AdminProductsPageProps {
  searchParams: Promise<{
    page?: string;
    filter?: string;
    category?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const filter = params.filter || "all";
  const category = params.category || "all";
  const search = (params.search || "").trim();
  const sort = params.sort || "newest";

  const { supabase } = await requireAdminPage("/admin/products");
  const categories = await getCategories();

  // Build server-side query for 1,500+ product scale
  let query = supabase
    .from("products")
    .select("*, category:categories(*), images:product_images(*)", {
      count: "exact",
    });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,brand.ilike.%${search}%,barcode.ilike.%${search}%`
    );
  }

  if (category !== "all") {
    query = query.eq("category_id", category);
  }

  if (filter === "in_stock") {
    query = query.gt("stock_quantity", 10);
  } else if (filter === "low_stock") {
    query = query.gt("stock_quantity", 0).lte("stock_quantity", 10);
  } else if (filter === "out_of_stock") {
    query = query.lte("stock_quantity", 0);
  } else if (filter === "inactive") {
    query = query.eq("is_available", false);
  } else if (filter === "age_restricted") {
    query = query.eq("is_age_restricted", true);
  }

  if (sort === "name_asc") {
    query = query.order("name", { ascending: true });
  } else if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else if (sort === "stock_asc") {
    query = query.order("stock_quantity", { ascending: true });
  } else if (sort === "stock_desc") {
    query = query.order("stock_quantity", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const fromIndex = (currentPage - 1) * PAGE_SIZE;
  const toIndex = fromIndex + PAGE_SIZE - 1;
  query = query.range(fromIndex, toIndex);

  const { data: dbProducts, count, error } = await query;

  // Lightweight status summary counts across whole catalogue
  const { data: stockSnapshot } = await supabase
    .from("products")
    .select("stock_quantity, is_available, is_age_restricted");

  const counts = {
    all: stockSnapshot?.length ?? count ?? 0,
    in_stock:
      stockSnapshot?.filter((p) => p.stock_quantity > 10).length ?? 0,
    low_stock:
      stockSnapshot?.filter(
        (p) => p.stock_quantity > 0 && p.stock_quantity <= 10
      ).length ?? 0,
    out_of_stock:
      stockSnapshot?.filter((p) => p.stock_quantity <= 0).length ?? 0,
    inactive:
      stockSnapshot?.filter((p) => !p.is_available).length ?? 0,
    age_restricted:
      stockSnapshot?.filter((p) => p.is_age_restricted).length ?? 0,
  };

  const totalMatching = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalMatching / PAGE_SIZE));

  return (
    <ProductListTable
      products={(dbProducts || []) as unknown as Product[]}
      categories={categories}
      counts={counts}
      totalMatching={totalMatching}
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={PAGE_SIZE}
      initialFilter={filter}
      initialCategory={category}
      initialSearch={search}
      initialSort={sort}
      loadError={error?.message || null}
    />
  );
}
