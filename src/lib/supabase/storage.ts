/**
 * Server-only Supabase Storage helpers.
 * NEVER import this file into a Client Component ("use client").
 * For the client-safe image URL helper, use @/lib/product-image instead.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProductImageUrl } from "@/lib/product-image";

// Re-export so server code has a single import point
export { getProductImageUrl } from "@/lib/product-image";

/**
 * Uploads an image file to the Supabase Storage 'product-images' bucket.
 * Returns the stored file path or throws an error.
 * SERVER-ONLY — uses createServerSupabaseClient (next/headers).
 */
export async function uploadProductImage(
  file: File,
  folder = "products"
): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = await createServerSupabaseClient();

  const fileExt = file.name.split(".").pop() || "jpg";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const filePath = `${folder}/${uniqueId}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload product image: ${error.message}`);
  }

  const publicUrl = getProductImageUrl(filePath);

  return {
    storagePath: filePath,
    publicUrl,
  };
}
