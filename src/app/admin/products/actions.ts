"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { uploadProductImage } from "@/lib/supabase/storage";

export interface ProductActionResult {
  success: boolean;
  message?: string;
  error?: string;
  productId?: string;
}

/**
 * Creates a new product and optional primary image.
 */
export async function createProductAction(
  formData: FormData
): Promise<ProductActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();
  const categoryId = String(formData.get("category_id") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const price = parseFloat(String(formData.get("price") || "0"));
  const compareAtPriceRaw = String(formData.get("compare_at_price") || "").trim();
  const compareAtPrice = compareAtPriceRaw ? parseFloat(compareAtPriceRaw) : null;
  const unit = String(formData.get("unit") || "").trim() || null;
  const stockQuantity = parseInt(String(formData.get("stock_quantity") || "0"), 10) || 0;
  const isAvailable = formData.get("is_available") === "true" || formData.get("is_available") === "on";
  const isAgeRestricted = formData.get("is_age_restricted") === "true" || formData.get("is_age_restricted") === "on";
  const minimumAge = isAgeRestricted
    ? parseInt(String(formData.get("minimum_age") || "18"), 10) || 18
    : null;
  const barcode = String(formData.get("barcode") || "").trim() || null;
  const brand = String(formData.get("brand") || "").trim() || null;
  const weightKgRaw = String(formData.get("weight_kg") || "").trim();
  const weightKg = weightKgRaw ? parseFloat(weightKgRaw) : null;
  const seoTitle = String(formData.get("seo_title") || "").trim() || null;
  const seoDescription = String(formData.get("seo_description") || "").trim() || null;

  const imageUrl = String(formData.get("image_url") || "").trim();
  const imageFile = formData.get("image_file") as File | null;

  if (!name) {
    return { success: false, error: "Product name is required" };
  }

  if (isNaN(price) || price < 0) {
    return { success: false, error: "A valid positive price is required" };
  }

  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  // Insert product record
  const { data: newProduct, error } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      category_id: categoryId,
      description,
      price,
      compare_at_price: compareAtPrice,
      unit,
      stock_quantity: stockQuantity,
      is_available: isAvailable,
      is_age_restricted: isAgeRestricted,
      minimum_age: minimumAge,
      barcode,
      brand,
      weight_kg: weightKg,
      seo_title: seoTitle,
      seo_description: seoDescription,
    })
    .select("id")
    .single();

  if (error || !newProduct) {
    return {
      success: false,
      error: error?.message.includes("unique")
        ? `A product with slug "${slug}" already exists.`
        : error?.message || "Failed to create product",
    };
  }

  // Handle image upload or image URL
  let finalImagePath = imageUrl;
  if (imageFile && imageFile.size > 0 && imageFile.name) {
    try {
      const uploadRes = await uploadProductImage(imageFile);
      finalImagePath = uploadRes.storagePath;
    } catch (uploadErr) {
      console.warn("Storage upload notice (falling back):", uploadErr);
    }
  }

  if (finalImagePath) {
    await supabase.from("product_images").insert({
      product_id: newProduct.id,
      storage_path: finalImagePath,
      alt_text: name,
      sort_order: 0,
      is_primary: true,
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/category/${categoryId}`);
  revalidatePath("/");

  return {
    success: true,
    message: `Product "${name}" added successfully.`,
    productId: newProduct.id,
  };
}

/**
 * Updates an existing product and its primary image.
 */
export async function updateProductAction(
  productId: string,
  formData: FormData
): Promise<ProductActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();
  const categoryId = String(formData.get("category_id") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const price = parseFloat(String(formData.get("price") || "0"));
  const compareAtPriceRaw = String(formData.get("compare_at_price") || "").trim();
  const compareAtPrice = compareAtPriceRaw ? parseFloat(compareAtPriceRaw) : null;
  const unit = String(formData.get("unit") || "").trim() || null;
  const stockQuantity = parseInt(String(formData.get("stock_quantity") || "0"), 10) || 0;
  const isAvailable = formData.get("is_available") === "true" || formData.get("is_available") === "on";
  const isAgeRestricted = formData.get("is_age_restricted") === "true" || formData.get("is_age_restricted") === "on";
  const minimumAge = isAgeRestricted
    ? parseInt(String(formData.get("minimum_age") || "18"), 10) || 18
    : null;
  const barcode = String(formData.get("barcode") || "").trim() || null;
  const brand = String(formData.get("brand") || "").trim() || null;
  const weightKgRaw = String(formData.get("weight_kg") || "").trim();
  const weightKg = weightKgRaw ? parseFloat(weightKgRaw) : null;
  const seoTitle = String(formData.get("seo_title") || "").trim() || null;
  const seoDescription = String(formData.get("seo_description") || "").trim() || null;

  const imageUrl = String(formData.get("image_url") || "").trim();
  const imageFile = formData.get("image_file") as File | null;

  if (!name) {
    return { success: false, error: "Product name is required" };
  }

  if (isNaN(price) || price < 0) {
    return { success: false, error: "A valid positive price is required" };
  }

  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      slug,
      category_id: categoryId,
      description,
      price,
      compare_at_price: compareAtPrice,
      unit,
      stock_quantity: stockQuantity,
      is_available: isAvailable,
      is_age_restricted: isAgeRestricted,
      minimum_age: minimumAge,
      barcode,
      brand,
      weight_kg: weightKg,
      seo_title: seoTitle,
      seo_description: seoDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Handle primary image update if provided
  let newImagePath = imageUrl;
  if (imageFile && imageFile.size > 0 && imageFile.name) {
    try {
      const uploadRes = await uploadProductImage(imageFile);
      newImagePath = uploadRes.storagePath;
    } catch (uploadErr) {
      console.warn("Storage upload notice (falling back):", uploadErr);
    }
  }

  if (newImagePath) {
    // Check if primary image already exists
    const { data: existingImg } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .eq("is_primary", true)
      .single();

    if (existingImg) {
      await supabase
        .from("product_images")
        .update({
          storage_path: newImagePath,
          alt_text: name,
        })
        .eq("id", existingImg.id);
    } else {
      await supabase.from("product_images").insert({
        product_id: productId,
        storage_path: newImagePath,
        alt_text: name,
        sort_order: 0,
        is_primary: true,
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath(`/product/${slug}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return {
    success: true,
    message: `Product "${name}" updated successfully.`,
    productId,
  };
}

/**
 * Quick inline stock adjustment for warehouse inventory counting.
 */
export async function quickUpdateStockAction(
  productId: string,
  newStock: number
): Promise<ProductActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  if (isNaN(newStock) || newStock < 0) {
    return { success: false, error: "Stock quantity must be 0 or greater" };
  }

  const { error } = await supabase
    .from("products")
    .update({
      stock_quantity: newStock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true, message: "Stock updated successfully." };
}

/**
 * Toggle product availability.
 */
export async function toggleProductStatusAction(
  productId: string,
  currentStatus: boolean
): Promise<ProductActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase
    .from("products")
    .update({
      is_available: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true, message: "Product status toggled." };
}

/**
 * Delete a product.
 */
export async function deleteProductAction(
  productId: string
): Promise<ProductActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true, message: "Product deleted successfully." };
}

