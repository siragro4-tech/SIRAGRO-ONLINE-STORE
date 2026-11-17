/**
 * Server-only Supabase Storage helpers.
 * NEVER import this file into a Client Component ("use client").
 * For the client-safe image URL helper, use @/lib/product-image instead.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProductImageUrl } from "@/lib/product-image";
import { validateProductImageFile } from "@/lib/admin-rules";

// Re-export so server code has a single import point
export { getProductImageUrl } from "@/lib/product-image";

const SAFE_EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Validates and uploads an image file to the Supabase Storage 'product-images' bucket.
 * Never stores binary image data in PostgreSQL tables.
 */
export async function uploadProductImage(
  file: File,
  folder = "products"
): Promise<{ storagePath: string; publicUrl: string }> {
  const validation = validateProductImageFile({
    name: file.name,
    type: file.type,
    size: file.size,
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = await createServerSupabaseClient();

  const fileExt =
    SAFE_EXTENSION_BY_MIME[file.type.toLowerCase()] ||
    file.name.split(".").pop()?.toLowerCase() ||
    "jpg";
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

/**
 * Deletes a stored object from the 'product-images' bucket when it is a bucket path
 * (ignores external URLs starting with http/https or leading slash).
 */
export async function deleteProductImageFromStorage(
  storagePath?: string | null
): Promise<void> {
  if (
    !storagePath ||
    storagePath.startsWith("http://") ||
    storagePath.startsWith("https://") ||
    storagePath.startsWith("/")
  ) {
    return;
  }

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.storage.from("product-images").remove([storagePath]);
  } catch {
    // Non-fatal cleanup failure
  }
}
