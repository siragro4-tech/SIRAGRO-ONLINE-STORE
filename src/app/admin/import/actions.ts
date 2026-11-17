"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import { csvToObjects } from "@/lib/csv";
import { recordInventoryAdjustment } from "@/lib/activity";

export interface ImportRowError {
  row: number;
  name: string;
  error: string;
}

export interface ImportResult {
  success: boolean;
  totalParsed: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: ImportRowError[];
  message?: string;
}

/**
 * Server Action: Parses, validates, and batch imports/upserts products from CSV.
 */
export async function importProductsCsvAction(
  csvText: string,
  duplicateMode: "update" | "skip" = "update"
): Promise<ImportResult> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return {
      success: false,
      totalParsed: 0,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [{ row: 0, name: "Auth", error: auth.error }],
    };
  }

  const { profile, supabase } = auth;
  const { rows } = csvToObjects(csvText);

  if (rows.length === 0) {
    return {
      success: false,
      totalParsed: 0,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [{ row: 0, name: "File", error: "No product rows found in CSV." }],
    };
  }

  // Fetch all existing categories for mapping
  const { data: dbCategories, error: catErr } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (catErr) {
    return {
      success: false,
      totalParsed: rows.length,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [
        { row: 0, name: "Database", error: `Failed to load categories: ${catErr.message}` },
      ],
    };
  }

  const categoriesList = dbCategories || [];
  const errors: ImportRowError[] = [];
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // Row 1 is header
    const name = (row.name || row.title || "").trim();

    if (!name) {
      errors.push({
        row: rowNumber,
        name: "(Missing name)",
        error: "Product name is required",
      });
      continue;
    }

    const priceRaw = (row.price || "").trim();
    const cleanedPrice = priceRaw.replace(/[^0-9.-]/g, "");
    const price = parseFloat(cleanedPrice);
    if (!priceRaw || isNaN(price) || price < 0) {
      errors.push({
        row: rowNumber,
        name,
        error: `Invalid price "${row.price || ""}" — must be 0 or greater`,
      });
      continue;
    }

    const compareAtRaw = (row.compare_at_price || row.rrp || "").replace(/[^0-9.-]/g, "");
    const compareAtPrice = compareAtRaw ? parseFloat(compareAtRaw) : null;
    if (compareAtPrice !== null && (isNaN(compareAtPrice) || compareAtPrice < 0)) {
      errors.push({
        row: rowNumber,
        name,
        error: `Invalid compare_at_price "${row.compare_at_price}"`,
      });
      continue;
    }

    const stockRaw = (row.stock_quantity || row.stock || "0").trim();
    const stockQuantity = parseInt(stockRaw, 10);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      errors.push({
        row: rowNumber,
        name,
        error: `Invalid stock_quantity "${row.stock_quantity}" — must be a whole number >= 0`,
      });
      continue;
    }

    let slug = (row.slug || "").trim().toLowerCase();
    if (!slug) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    // Match Category by slug or name
    const categoryIdentifier = (row.category_slug || row.category || "").trim().toLowerCase();
    let categoryId: string | null = null;
    if (categoryIdentifier) {
      const matched = categoriesList.find(
        (c) =>
          c.slug.toLowerCase() === categoryIdentifier ||
          c.name.toLowerCase() === categoryIdentifier
      );
      if (!matched) {
        errors.push({
          row: rowNumber,
          name,
          error: `Unknown category "${row.category_slug || row.category}"`,
        });
        continue;
      }
      categoryId = matched.id;
    }

    const unit = (row.unit || row.pack_size || "each").trim();
    const brand = (row.brand || "SIRAGRO").trim();
    const barcode = (row.barcode || row.ean || "").trim() || null;
    const description = (row.description || "").trim() || null;

    const isAgeRestrictedRaw = (row.is_age_restricted || row.age_restricted || "").trim().toLowerCase();
    const isAgeRestricted = ["true", "1", "yes", "y"].includes(isAgeRestrictedRaw);
    const minimumAgeRaw = parseInt((row.minimum_age || "18").replace(/[^0-9]/g, ""), 10);
    const minimumAge = isAgeRestricted ? minimumAgeRaw || 18 : null;

    const isAvailableRaw = (row.is_available || "true").trim().toLowerCase();
    const isAvailable = !["false", "0", "no", "n"].includes(isAvailableRaw);

    const imageUrl = (row.image_url || row.image || "").trim();
    if (
      imageUrl &&
      !imageUrl.startsWith("http://") &&
      !imageUrl.startsWith("https://") &&
      !imageUrl.startsWith("/")
    ) {
      errors.push({
        row: rowNumber,
        name,
        error: `Invalid image_url "${imageUrl}" — must start with http(s):// or /`,
      });
      continue;
    }

    try {
      const { data: existing } = await supabase
        .from("products")
        .select("id, stock_quantity")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        if (duplicateMode === "skip") {
          skippedCount++;
          continue;
        }

        const { error: updateErr } = await supabase
          .from("products")
          .update({
            name,
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
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateErr) {
          errors.push({ row: rowNumber, name, error: updateErr.message });
        } else {
          updatedCount++;

          if (existing.stock_quantity !== stockQuantity) {
            await recordInventoryAdjustment({
              productId: existing.id,
              productName: name,
              previousQuantity: existing.stock_quantity,
              newQuantity: stockQuantity,
              reason: "csv_import",
              changedByProfileId: profile.id,
              changedByEmail: profile.email,
              notes: "Updated via CSV import",
            });
          }

          if (imageUrl) {
            const { data: primaryImg } = await supabase
              .from("product_images")
              .select("id")
              .eq("product_id", existing.id)
              .eq("is_primary", true)
              .maybeSingle();

            if (primaryImg) {
              await supabase
                .from("product_images")
                .update({ storage_path: imageUrl, alt_text: name })
                .eq("id", primaryImg.id);
            } else {
              await supabase.from("product_images").insert({
                product_id: existing.id,
                storage_path: imageUrl,
                alt_text: name,
                is_primary: true,
                sort_order: 0,
              });
            }
          }
        }
      } else {
        const { data: newProd, error: insertErr } = await supabase
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
          })
          .select("id")
          .single();

        if (insertErr || !newProd) {
          errors.push({
            row: rowNumber,
            name,
            error: insertErr?.message || "Insert failed",
          });
        } else {
          importedCount++;

          await recordInventoryAdjustment({
            productId: newProd.id,
            productName: name,
            previousQuantity: 0,
            newQuantity: stockQuantity,
            reason: "csv_import",
            changedByProfileId: profile.id,
            changedByEmail: profile.email,
            notes: "Created via CSV import",
          });

          if (imageUrl) {
            await supabase.from("product_images").insert({
              product_id: newProd.id,
              storage_path: imageUrl,
              alt_text: name,
              is_primary: true,
              sort_order: 0,
            });
          }
        }
      }
    } catch (rowErr: unknown) {
      const msg = rowErr instanceof Error ? rowErr.message : "Database error";
      errors.push({ row: rowNumber, name, error: msg });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/");

  return {
    success: errors.length === 0 || importedCount > 0 || updatedCount > 0,
    totalParsed: rows.length,
    importedCount,
    updatedCount,
    skippedCount,
    errors,
    message: `Import finished: ${importedCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${errors.length} failed.`,
  };
}
