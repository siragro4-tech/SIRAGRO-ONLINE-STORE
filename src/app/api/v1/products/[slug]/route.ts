import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  isSupabaseConfigured,
  jsonNoStore,
  serializeMobileProduct,
} from "@/lib/mobile-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseConfigured()) {
    return jsonNoStore(
      { error: "Store database is not configured in this environment." },
      503
    );
  }

  const { slug } = await context.params;
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(id, name, slug, image_url, sort_order, is_active),
      images:product_images(id, storage_path, alt_text, is_primary, sort_order)
    `
    )
    .eq("slug", slug)
    .eq("is_available", true)
    .maybeSingle();

  if (error) {
    return jsonNoStore(
      { error: "Unable to load product details right now." },
      500
    );
  }

  if (!data) {
    return jsonNoStore({ error: "Product not found." }, 404);
  }

  return jsonNoStore({
    product: serializeMobileProduct(data as unknown as Record<string, unknown>),
  });
}
