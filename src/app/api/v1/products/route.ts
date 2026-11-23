import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  isSupabaseConfigured,
  jsonNoStore,
  serializeMobileProduct,
} from "@/lib/mobile-api";

const MAX_PAGE_SIZE = 40;
const DEFAULT_PAGE_SIZE = 24;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return jsonNoStore(
      { error: "Store database is not configured in this environment." },
      503
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );
  const categorySlug = searchParams.get("category")?.trim() || null;
  const query = searchParams.get("q")?.trim() || null;
  const sort = searchParams.get("sort")?.trim() || "featured";
  const inStockOnly = searchParams.get("in_stock") === "true";

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .maybeSingle();
    if (!cat) {
      return jsonNoStore({
        items: [],
        page,
        limit,
        totalCount: 0,
        hasMore: false,
      });
    }
    categoryId = cat.id;
  }

  let dbQuery = supabase
    .from("products")
    .select(
      `
      *,
      category:categories(id, name, slug, image_url, sort_order, is_active),
      images:product_images(id, storage_path, alt_text, is_primary, sort_order)
    `,
      { count: "exact" }
    )
    .eq("is_available", true);

  if (categoryId) {
    dbQuery = dbQuery.eq("category_id", categoryId);
  }

  if (inStockOnly) {
    dbQuery = dbQuery.gt("stock_quantity", 0);
  }

  if (query) {
    const sanitized = query.replace(/[,%()]/g, " ").trim();
    if (sanitized.length > 0) {
      dbQuery = dbQuery.or(
        `name.ilike.%${sanitized}%,brand.ilike.%${sanitized}%`
      );
    }
  }

  switch (sort) {
    case "price_asc":
      dbQuery = dbQuery.order("price", { ascending: true });
      break;
    case "price_desc":
      dbQuery = dbQuery.order("price", { ascending: false });
      break;
    case "name_asc":
      dbQuery = dbQuery.order("name", { ascending: true });
      break;
    case "featured":
    default:
      dbQuery = dbQuery
        .order("created_at", { ascending: false })
        .order("name", { ascending: true });
      break;
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, count, error } = await dbQuery.range(from, to);

  if (error) {
    return jsonNoStore(
      { error: "Unable to load products right now. Please try again." },
      500
    );
  }

  const totalCount = count ?? 0;
  const items = (data ?? []).map((p) =>
    serializeMobileProduct(p as unknown as Record<string, unknown>)
  );

  return jsonNoStore({
    items,
    page,
    limit,
    totalCount,
    hasMore: from + items.length < totalCount,
  });
}
