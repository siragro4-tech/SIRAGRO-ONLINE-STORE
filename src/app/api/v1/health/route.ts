import { jsonNoStore, isSupabaseConfigured } from "@/lib/mobile-api";

export async function GET() {
  return jsonNoStore({
    status: "ok",
    apiVersion: "v1",
    supabaseConfigured: isSupabaseConfigured(),
  });
}
