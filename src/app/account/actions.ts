"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AccountActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

/**
 * Updates the customer's personal profile (first name, last name, phone).
 */
export async function updateProfileAction(
  prevState: AccountActionResult | null,
  formData: FormData
): Promise<AccountActionResult> {
  const firstName = formData.get("firstName")?.toString().trim() || "";
  const lastName = formData.get("lastName")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().trim() || "";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update your profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  return { success: true, message: "Profile details updated successfully." };
}

/**
 * Adds a new delivery address for the customer.
 */
export async function addAddressAction(
  prevState: AccountActionResult | null,
  formData: FormData
): Promise<AccountActionResult> {
  const label = formData.get("label")?.toString().trim() || "Home";
  const line1 = formData.get("line1")?.toString().trim();
  const line2 = formData.get("line2")?.toString().trim() || "";
  const city = formData.get("city")?.toString().trim();
  const county = formData.get("county")?.toString().trim() || "";
  const postcode = formData.get("postcode")?.toString().trim().toUpperCase();
  const isDefault = formData.get("isDefault") === "true";

  if (!line1 || !city || !postcode) {
    return { error: "Please enter your street address, town/city, and postcode." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to save addresses." };
  }

  // If setting as default, unset existing defaults first
  if (isDefault) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", user.id);
  }

  const { error } = await supabase.from("addresses").insert({
    profile_id: user.id,
    label,
    line_1: line1,
    line_2: line2 || null,
    city,
    county: county || null,
    postcode,
    is_default: isDefault,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { success: true, message: "Address added successfully." };
}

/**
 * Deletes a saved address.
 */
export async function deleteAddressAction(addressId: string): Promise<AccountActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to manage addresses." };
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { success: true, message: "Address removed." };
}

/**
 * Sets an address as the default delivery address.
 */
export async function setDefaultAddressAction(addressId: string): Promise<AccountActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  // Unset previous defaults
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("profile_id", user.id);

  // Set new default
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { success: true, message: "Default address updated." };
}

