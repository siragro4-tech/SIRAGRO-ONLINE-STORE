"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CategoryActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Creates a new category in Supabase.
 */
export async function createCategoryAction(
  formData: FormData
): Promise<CategoryActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();
  const description = String(formData.get("description") || "").trim() || null;
  const imageUrl = String(formData.get("image_url") || "").trim() || null;
  const sortOrder = parseInt(String(formData.get("sort_order") || "0"), 10) || 0;
  const isActive = formData.get("is_active") === "true" || formData.get("is_active") === "on";

  if (!name) {
    return { success: false, error: "Category name is required" };
  }

  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description,
    image_url: imageUrl,
    sort_order: sortOrder,
    is_active: isActive,
  });

  if (error) {
    return {
      success: false,
      error: error.message.includes("unique")
        ? `A category with slug "${slug}" already exists.`
        : error.message,
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: true, message: `Category "${name}" created successfully.` };
}

/**
 * Updates an existing category in Supabase.
 */
export async function updateCategoryAction(
  categoryId: string,
  formData: FormData
): Promise<CategoryActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();
  const description = String(formData.get("description") || "").trim() || null;
  const imageUrl = String(formData.get("image_url") || "").trim() || null;
  const sortOrder = parseInt(String(formData.get("sort_order") || "0"), 10) || 0;
  const isActive = formData.get("is_active") === "true" || formData.get("is_active") === "on";

  if (!name) {
    return { success: false, error: "Category name is required" };
  }

  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      description,
      image_url: imageUrl,
      sort_order: sortOrder,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: true, message: `Category updated successfully.` };
}

/**
 * Toggles a category's active/inactive visibility.
 */
export async function toggleCategoryStatusAction(
  categoryId: string,
  currentStatus: boolean
): Promise<CategoryActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: true, message: `Category status updated.` };
}

/**
 * Deletes a category (prevents deletion if products are assigned).
 */
export async function deleteCategoryAction(
  categoryId: string
): Promise<CategoryActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  // Check if products exist in this category
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete: ${count} product(s) are currently assigned to this category. Reassign or delete those products first.`,
    };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: true, message: `Category deleted successfully.` };
}

