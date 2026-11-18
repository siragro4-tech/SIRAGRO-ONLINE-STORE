"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import { normalizeProductPrice, validateProductImageFile } from "@/lib/admin-rules";
import { recordInventoryAdjustment } from "@/lib/activity";
import {
  deleteProductImageFromStorage,
  uploadProductImage,
} from "@/lib/supabase/storage";

export interface ProductActionResult {
  success: boolean;
  message?: string;
  error?: string;
  productId?: string;
  archived?: boolean;
}

/**
 * Creates a new product and optional primary image.
 */
export async function createProductAction(
  formData: FormData
): Promise<ProductActionResult> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }
  const { profile, supabase } = auth;

  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();
  const categoryId = String(formData.get("category_id") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const price = parseFloat(String(formData.get("price") || "0"));
  const compareAtPriceRaw = String(formData.get("compare_at_price") || "").trim();
  const compareAtPrice = compareAtPriceRaw ? parseFloat(compareAtPriceRaw) : null;
  const unit = String(formData.get("unit") || "").trim() || null;
  const stockQuantity = Math.max(
    0,
    parseInt(String(formData.get("stock_quantity") || "0"), 10) || 0
  );
  const lowStockThresholdRaw = String(
    formData.get("low_stock_threshold") || "10"
  ).trim();
  const lowStockThreshold = Math.max(
    0,
    parseInt(lowStockThresholdRaw, 10) || 10
  );
  const isAvailable =
    formData.get("is_available") === "true" ||
    formData.get("is_available") === "on";
  const isAgeRestricted =
    formData.get("is_age_restricted") === "true" ||
    formData.get("is_age_restricted") === "on";
  const minimumAge = isAgeRestricted
    ? parseInt(String(formData.get("minimum_age") || "18"), 10) || 18
    : null;
  const barcode = String(formData.get("barcode") || "").trim() || null;
  const brand = String(formData.get("brand") || "").trim() || null;
  const weightKgRaw = String(formData.get("weight_kg") || "").trim();
  const weightKg = weightKgRaw ? parseFloat(weightKgRaw) : null;
  const seoTitle = String(formData.get("seo_title") || "").trim() || null;
  const seoDescription =
    String(formData.get("seo_description") || "").trim() || null;

  const imageUrl = String(formData.get("image_url") || "").trim();
  const imageFile = formData.get("image_file") as File | null;

  if (!name) {
    return { success: false, error: "Product name is required" };
  }

  if (isNaN(price) || price < 0) {
    return { success: false, error: "A valid positive price is required" };
  }

  // Validate uploaded file before creating database records
  let uploadedImagePath: string | null = null;
  if (imageFile && imageFile.size > 0 && imageFile.name) {
    const check = validateProductImageFile({
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size,
    });
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    try {
      const uploadRes = await uploadProductImage(imageFile);
      uploadedImagePath = uploadRes.storagePath;
    } catch (uploadErr) {
      return {
        success: false,
        error:
          uploadErr instanceof Error
            ? uploadErr.message
            : "Image upload failed",
      };
    }
  }

  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  // Try insert with low_stock_threshold; fall back gracefully if migration 004 is pending
  let insertResult = await supabase
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
      low_stock_threshold: lowStockThreshold,
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

  if (
    insertResult.error &&
    insertResult.error.message.includes("low_stock_threshold")
  ) {
    insertResult = await supabase
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
  }

  const { data: newProduct, error } = insertResult;

  if (error || !newProduct) {
    if (uploadedImagePath) {
      await deleteProductImageFromStorage(uploadedImagePath);
    }
    return {
      success: false,
      error: error?.message.includes("unique")
        ? `A product with slug "${slug}" already exists.`
        : error?.message || "Failed to create product",
    };
  }

  const finalImagePath = uploadedImagePath || imageUrl;
  if (finalImagePath) {
    await supabase.from("product_images").insert({
      product_id: newProduct.id,
      storage_path: finalImagePath,
      alt_text: name,
      sort_order: 0,
      is_primary: true,
    });
  }

  await recordInventoryAdjustment({
    productId: newProduct.id,
    productName: name,
    previousQuantity: 0,
    newQuantity: stockQuantity,
    lowStockThreshold,
    reason: "admin_product_create",
    changedByProfileId: profile.id,
    changedByEmail: profile.email,
    notes: "Initial stock upon product creation",
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/");

  return {
    success: true,
    message: `Product "${name}" added successfully.`,
    productId: newProduct.id,
  };
}

/**
 * Updates an existing product and manages its primary image (upload, replace, or remove).
 */
export async function updateProductAction(
  productId: string,
  formData: FormData
): Promise<ProductActionResult> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }
  const { profile, supabase } = auth;

  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();
  const categoryId = String(formData.get("category_id") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const price = parseFloat(String(formData.get("price") || "0"));
  const compareAtPriceRaw = String(formData.get("compare_at_price") || "").trim();
  const compareAtPrice = compareAtPriceRaw ? parseFloat(compareAtPriceRaw) : null;
  const unit = String(formData.get("unit") || "").trim() || null;
  const stockQuantity = Math.max(
    0,
    parseInt(String(formData.get("stock_quantity") || "0"), 10) || 0
  );
  const lowStockThresholdRaw = String(
    formData.get("low_stock_threshold") || "10"
  ).trim();
  const lowStockThreshold = Math.max(
    0,
    parseInt(lowStockThresholdRaw, 10) || 10
  );
  const isAvailable =
    formData.get("is_available") === "true" ||
    formData.get("is_available") === "on";
  const isAgeRestricted =
    formData.get("is_age_restricted") === "true" ||
    formData.get("is_age_restricted") === "on";
  const minimumAge = isAgeRestricted
    ? parseInt(String(formData.get("minimum_age") || "18"), 10) || 18
    : null;
  const barcode = String(formData.get("barcode") || "").trim() || null;
  const brand = String(formData.get("brand") || "").trim() || null;
  const weightKgRaw = String(formData.get("weight_kg") || "").trim();
  const weightKg = weightKgRaw ? parseFloat(weightKgRaw) : null;
  const seoTitle = String(formData.get("seo_title") || "").trim() || null;
  const seoDescription =
    String(formData.get("seo_description") || "").trim() || null;

  const removeImage = formData.get("remove_image") === "true";
  const imageUrl = String(formData.get("image_url") || "").trim();
  const imageFile = formData.get("image_file") as File | null;

  if (!name) {
    return { success: false, error: "Product name is required" };
  }

  if (isNaN(price) || price < 0) {
    return { success: false, error: "A valid positive price is required" };
  }

  // Validate file before mutating database
  let uploadedImagePath: string | null = null;
  if (imageFile && imageFile.size > 0 && imageFile.name) {
    const check = validateProductImageFile({
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size,
    });
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    try {
      const uploadRes = await uploadProductImage(imageFile);
      uploadedImagePath = uploadRes.storagePath;
    } catch (uploadErr) {
      return {
        success: false,
        error:
          uploadErr instanceof Error
            ? uploadErr.message
            : "Image upload failed",
      };
    }
  }

  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  const { data: prevProd } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .maybeSingle();

  let { error } = await supabase
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
      low_stock_threshold: lowStockThreshold,
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

  if (error && error.message.includes("low_stock_threshold")) {
    const retry = await supabase
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
    error = retry.error;
  }

  if (error) {
    if (uploadedImagePath) {
      await deleteProductImageFromStorage(uploadedImagePath);
    }
    return { success: false, error: error.message };
  }

  // Fetch existing primary image
  const { data: existingImg } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .maybeSingle();

  const newImagePath = uploadedImagePath || imageUrl;

  if (removeImage && !newImagePath) {
    if (existingImg) {
      await deleteProductImageFromStorage(existingImg.storage_path);
      await supabase.from("product_images").delete().eq("id", existingImg.id);
    }
  } else if (newImagePath) {
    if (existingImg) {
      if (existingImg.storage_path !== newImagePath) {
        await deleteProductImageFromStorage(existingImg.storage_path);
      }
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

  if (prevProd && prevProd.stock_quantity !== stockQuantity) {
    await recordInventoryAdjustment({
      productId,
      productName: name,
      previousQuantity: prevProd.stock_quantity,
      newQuantity: stockQuantity,
      lowStockThreshold,
      reason: "admin_product_edit",
      changedByProfileId: profile.id,
      changedByEmail: profile.email,
      notes: "Stock updated in product editor",
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
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
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }
  const { profile, supabase } = auth;

  if (isNaN(newStock) || newStock < 0) {
    return { success: false, error: "Stock quantity must be 0 or greater" };
  }

  const { data: prevProd } = await supabase
    .from("products")
    .select("name, stock_quantity")
    .eq("id", productId)
    .maybeSingle();

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

  if (prevProd && prevProd.stock_quantity !== newStock) {
    await recordInventoryAdjustment({
      productId,
      productName: prevProd.name,
      previousQuantity: prevProd.stock_quantity,
      newQuantity: newStock,
      reason: "admin_quick_edit",
      changedByProfileId: profile.id,
      changedByEmail: profile.email,
      notes: "Quick stock count update",
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  return { success: true, message: "Stock updated successfully." };
}

/**
 * Quick inline price update from the /admin/products table.
 */
export async function quickUpdatePriceAction(
  productId: string,
  rawPrice: number
): Promise<ProductActionResult> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const normalizedPrice = normalizeProductPrice(rawPrice);
  if (normalizedPrice === null) {
    return {
      success: false,
      error: "Price must be a valid non-negative GBP amount (0.00 or higher).",
    };
  }

  const { error } = await auth.supabase
    .from("products")
    .update({
      price: normalizedPrice,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  return {
    success: true,
    message: `Price updated to £${normalizedPrice.toFixed(2)}.`,
  };
}

/**
 * Toggle product availability (active / archived in store).
 */
export async function toggleProductStatusAction(
  productId: string,
  currentStatus: boolean
): Promise<ProductActionResult> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }
  const { supabase } = auth;

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
  revalidatePath("/admin");
  revalidatePath("/shop");
  return { success: true, message: "Product status toggled." };
}

/**
 * Safely deletes a product OR archives it if referenced in historical orders.
 * Never destroys historical order relationships.
 */
export async function deleteProductAction(
  productId: string
): Promise<ProductActionResult> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }
  const { supabase } = auth;

  // Check if product is referenced in any past customer order
  const { count: orderRefCount, error: refErr } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (refErr) {
    return { success: false, error: refErr.message };
  }

  if (orderRefCount && orderRefCount > 0) {
    // Archive/deactivate instead of hard-deleting to preserve past order audit records
    const { error: archiveErr } = await supabase
      .from("products")
      .update({
        is_available: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (archiveErr) {
      return { success: false, error: archiveErr.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/shop");
    return {
      success: true,
      archived: true,
      message:
        "This product appears in past orders, so it was archived (hidden from customers) instead of hard-deleted to preserve order records.",
    };
  }

  // Clean up stored product images first
  const { data: imgs } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId);

  if (imgs) {
    for (const img of imgs) {
      await deleteProductImageFromStorage(img.storage_path);
    }
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  return { success: true, message: "Product deleted permanently." };
}
