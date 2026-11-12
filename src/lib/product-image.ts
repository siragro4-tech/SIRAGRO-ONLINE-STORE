/**
 * Client-safe utility for generating publicly accessible product image URLs.
 * This file has NO server-side imports and is safe to use in both
 * Server Components and Client Components.
 */

const PLACEHOLDER = "/images/placeholder-product.svg";

/**
 * Returns a publicly accessible URL for a product image.
 * Handles:
 * - External URLs (http/https) → returned as-is
 * - Absolute paths starting with "/" → returned as-is
 * - Supabase Storage relative paths → prefixed with the public storage URL
 * - null/undefined → returns placeholder SVG path
 */
export function getProductImageUrl(path?: string | null): string {
  if (!path) {
    return PLACEHOLDER;
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("/")
  ) {
    return path;
  }

  // Build a Supabase public storage URL from an env var that is NEXT_PUBLIC_
  // so it is safely available in both server and client bundles.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/product-images/${path}`;
  }

  return path;
}

