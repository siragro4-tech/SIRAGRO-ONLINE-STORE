"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

/**
 * Logs in an existing customer using email and password.
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const redirectTo = formData.get("redirectTo")?.toString() || "/account";

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/**
 * Registers a new customer account.
 */
export async function registerAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const firstName = formData.get("firstName")?.toString().trim() || "";
  const lastName = formData.get("lastName")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().trim() || "";

  if (!email || !password) {
    return { error: "Please enter an email address and password." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is required by Supabase:
  if (data.user && data.session === null) {
    return {
      success: true,
      message:
        "Account created! Please check your email inbox to confirm your email address.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/account");
}

/**
 * Logs out the currently authenticated user.
 */
export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Requests a password reset link for the provided email.
 */
export async function forgotPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim();

  if (!email) {
    return { error: "Please enter your email address." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message:
      "If an account with that email exists, we have sent a password reset link.",
  };
}

/**
 * Updates the user's password using the active session from the reset link.
 */
export async function updatePasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message: "Your password has been successfully updated. You can now log in.",
  };
}

