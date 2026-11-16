"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ContactActionResult = {
  success?: boolean;
  error?: string;
};

export async function submitContactMessageAction(input: {
  name: string;
  phone?: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactActionResult> {
  const name = input.name.trim();
  const phone = input.phone?.trim() || null;
  const email = input.email.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!name || !email || !subject || !message) {
    return { error: "Please complete all required fields before sending." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      phone,
      email,
      subject,
      message,
    });

    if (error) {
      console.error("[Contact] Failed to save contact message:", error.message);
      return {
        error:
          "We could not save your message right now. Please try again or call us on 020 8813 6458.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("[Contact] Unexpected error saving message:", err);
    return {
      error:
        "We could not save your message right now. Please try again or call us on 020 8813 6458.",
    };
  }
}

