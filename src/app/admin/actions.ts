"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";

export async function markActivityReadAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("admin_activity_events")
    .update({ is_read: true })
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/activity");
  return { success: true };
}

export async function markAllActivityReadAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("admin_activity_events")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/activity");
  return { success: true };
}

export async function updateContactMessageStatusAction(
  messageId: string,
  status: "new" | "read" | "replied"
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", messageId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activity");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateDeliverySettingsAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const auth = await requireAdminAction();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const settingsId = String(formData.get("id") || "").trim();
  const isDeliveryEnabled = formData.get("is_delivery_enabled") === "true";
  const isCollectionEnabled = formData.get("is_collection_enabled") === "true";
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!settingsId) {
    return { success: false, error: "Delivery settings record ID is missing." };
  }

  if (!isDeliveryEnabled && !isCollectionEnabled) {
    return {
      success: false,
      error: "At least one fulfilment method (Home Delivery or In-Store Collection) must remain enabled.",
    };
  }

  const { error } = await auth.supabase
    .from("delivery_settings")
    .update({
      is_delivery_enabled: isDeliveryEnabled,
      is_collection_enabled: isCollectionEnabled,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settingsId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/checkout");
  return { success: true, message: "Store fulfilment settings updated." };
}
