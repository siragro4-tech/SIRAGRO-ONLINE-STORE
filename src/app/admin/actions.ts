"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/admin-auth";
import { isAdminRole, sanitizeAdminRedirect } from "@/lib/admin-rules";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminLoginResult = {
  error?: string;
};

/**
 * Authenticates an administrator through /admin/login and strictly rejects non-admin accounts.
 */
export async function adminLoginAction(
  prevState: AdminLoginResult | null,
  formData: FormData
): Promise<AdminLoginResult> {
  const email = formData.get("email")?.toString().trim() || "";
  const password = formData.get("password")?.toString() || "";
  const redirectTo = sanitizeAdminRedirect(
    formData.get("redirectTo")?.toString()
  );

  if (!email || !password) {
    return { error: "Please enter both your admin email address and password." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error:
        error?.message ||
        "Sign in failed. Please check your administrator email and password.",
    };
  }

  // Verify database role explicitly — customer accounts are signed back out immediately
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileErr || !profile || !isAdminRole(profile.role)) {
    await supabase.auth.signOut();
    return {
      error:
        "Access Denied: This email does not have administrator permissions to access /admin.",
    };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/**
 * Signs out the current session and returns to the /admin/login portal.
 */
export async function adminLogoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}

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
