import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Creates a privileged Supabase client using the SERVICE ROLE key.
 * 
 * SECURITY WARNING:
 * - NEVER import or execute this file in browser/client code.
 * - ONLY use for verified webhooks (e.g. Stripe), background sync, or elevated admin tasks.
 * - This client completely bypasses Row Level Security (RLS).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

