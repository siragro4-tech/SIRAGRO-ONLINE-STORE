import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  isSupabaseConfigured,
  jsonNoStore,
  serializeMobileProduct,
} from "@/lib/mobile-api";
import { evaluateFulfilmentAvailability } from "@/lib/delivery-rules";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return jsonNoStore(
      { error: "Store database is not configured in this environment." },
      503
    );
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const [categoriesRes, featuredRes, deliveryRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, image_url, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select(
        `
        *,
        category:categories(id, name, slug, image_url, sort_order, is_active),
        images:product_images(id, storage_path, alt_text, is_primary, sort_order)
      `
      )
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("delivery_settings").select("*").limit(1).maybeSingle(),
  ]);

  if (categoriesRes.error || featuredRes.error) {
    return jsonNoStore(
      {
        error: "Unable to load store home data right now. Please retry.",
        categoriesError: categoriesRes.error?.message ?? null,
        featuredError: featuredRes.error?.message ?? null,
      },
      500
    );
  }

  const fulfilment = evaluateFulfilmentAvailability(
    deliveryRes.data,
    Boolean(deliveryRes.error)
  );

  return jsonNoStore({
    categories: categoriesRes.data ?? [],
    featuredProducts: (featuredRes.data ?? []).map((p) =>
      serializeMobileProduct(p as unknown as Record<string, unknown>)
    ),
    // No fake promotions — only real backend promotions if/when added
    promotions: [],
    fulfilment,
  });
}
