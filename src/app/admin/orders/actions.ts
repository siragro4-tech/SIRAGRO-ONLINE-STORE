"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendStatusUpdateEmail } from "@/lib/email";

export type OrderStatus =
  | "pending"
  | "processing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "collected"
  | "cancelled";

export interface StatusActionResult {
  success: boolean;
  message?: string;
  error?: string;
  noop?: boolean;
  emailSent?: boolean;
  emailError?: string;
}

/**
 * Valid allowed status transitions per fulfillment type.
 * Prevents arbitrary string manipulation and impossible state jumps.
 */
export const ALLOWED_TRANSITIONS: Record<
  "delivery" | "collection",
  Record<OrderStatus, OrderStatus[]>
> = {
  delivery: {
    pending: ["processing", "cancelled"],
    processing: ["out_for_delivery", "cancelled"],
    ready_for_pickup: [], // Not applicable for delivery
    out_for_delivery: ["delivered", "processing"],
    delivered: [], // Terminal
    collected: [], // Not applicable for delivery
    cancelled: [], // Terminal
  },
  collection: {
    pending: ["processing", "cancelled"],
    processing: ["ready_for_pickup", "cancelled"],
    ready_for_pickup: ["collected", "processing", "cancelled"],
    out_for_delivery: [], // Not applicable for collection
    delivered: [], // Not applicable for collection
    collected: [], // Terminal
    cancelled: [], // Terminal
  },
};

/**
 * Helper to check server-side admin credentials.
 */
async function verifyAdminAuth() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false as const, error: "Authentication required" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      authorized: false as const,
      error: "Forbidden: Administrative privileges required",
    };
  }

  return { authorized: true as const, user, profile, supabase };
}

/**
 * Safely updates order fulfillment status.
 * - Enforces admin authentication
 * - Enforces allowed state machine transitions
 * - Never modifies payment status
 * - Records audit trail in order_status_history
 * - Sends transactional email and logs status in order_notifications
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  adminNotes?: string,
  sendEmailNotification: boolean = true
): Promise<StatusActionResult> {
  const authCheck = await verifyAdminAuth();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const { profile, supabase } = authCheck;

  // 1. Fetch current order data
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchErr || !order) {
    return { success: false, error: "Order not found in database" };
  }

  const currentStatus = order.status as OrderStatus;
  const fulfilmentType = order.fulfilment_type as "delivery" | "collection";

  // 2. Prevent no-op duplicate updates
  if (currentStatus === newStatus) {
    return {
      success: true,
      noop: true,
      message: `Order #${order.order_number} is already in "${newStatus}" status. No changes made.`,
    };
  }

  // 3. Validate state transition rules
  const allowedNextStatuses =
    ALLOWED_TRANSITIONS[fulfilmentType]?.[currentStatus] || [];

  if (!allowedNextStatuses.includes(newStatus)) {
    return {
      success: false,
      error: `Invalid transition: A ${fulfilmentType} order cannot transition directly from "${currentStatus}" to "${newStatus}". Allowed transitions: ${
        allowedNextStatuses.length > 0
          ? allowedNextStatuses.join(", ")
          : "None (order is in terminal state)"
      }.`,
    };
  }

  // 4. Update order fulfillment status (PAYMENT STATUS IS UNTOUCHED)
  const updatedNotes = adminNotes?.trim()
    ? order.notes
      ? `${order.notes}\n[${new Date().toISOString()}] ${profile.email}: ${adminNotes.trim()}`
      : `[${new Date().toISOString()}] ${profile.email}: ${adminNotes.trim()}`
    : order.notes;

  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateErr) {
    console.error("[Orders Action] Failed to update status:", updateErr);
    return { success: false, error: `Database error: ${updateErr.message}` };
  }

  // 5. Record Audit History in order_status_history
  try {
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      previous_status: currentStatus,
      new_status: newStatus,
      changed_by_profile_id: profile.id,
      changed_by_email: profile.email,
      notes: adminNotes?.trim() || null,
    });
  } catch (historyErr) {
    console.warn(
      "[Orders Action] Notice: Could not record order_status_history (migration may still be pending):",
      historyErr
    );
  }

  // 6. Send Customer Notification Email (if requested)
  let emailSent = false;
  let emailErrorMessage: string | undefined;

  if (sendEmailNotification && order.customer_email) {
    const rawAddr = order.delivery_address as Record<string, string> | null;
    const formattedAddress = rawAddr
      ? `${rawAddr.line1 || rawAddr.line_1 || ""}, ${rawAddr.city || ""}, ${rawAddr.postcode || ""}`
      : null;

    const emailResult = await sendStatusUpdateEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      fulfilmentType,
      newStatus,
      deliveryAddress: formattedAddress,
      adminNotes: adminNotes?.trim() || null,
    });

    emailSent = emailResult.success;
    emailErrorMessage = emailResult.error;

    // 7. Persist notification log
    try {
      await supabase.from("order_notifications").insert({
        order_id: orderId,
        recipient_email: order.customer_email,
        notification_type: "status_update",
        status_target: newStatus,
        send_status: emailSent ? "sent" : "failed",
        last_error: emailErrorMessage || null,
        sent_at: emailSent ? new Date().toISOString() : null,
      });
    } catch (notifErr) {
      console.warn(
        "[Orders Action] Notice: Could not record order_notifications log:",
        notifErr
      );
    }
  }

  // 8. Revalidate routes
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");

  return {
    success: true,
    message: `Status updated from "${currentStatus}" to "${newStatus}".`,
    emailSent,
    emailError: emailErrorMessage,
  };
}

/**
 * Retries sending an email notification for a specific order status.
 */
export async function retryOrderNotificationAction(
  orderId: string,
  notificationId?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const authCheck = await verifyAdminAuth();
  if (!authCheck.authorized) {
    return { success: false, message: "Unauthorized", error: authCheck.error };
  }

  const { supabase } = authCheck;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { success: false, message: "Order not found" };
  }

  const rawAddr = order.delivery_address as Record<string, string> | null;
  const formattedAddress = rawAddr
    ? `${rawAddr.line1 || rawAddr.line_1 || ""}, ${rawAddr.city || ""}, ${rawAddr.postcode || ""}`
    : null;

  const emailResult = await sendStatusUpdateEmail({
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    fulfilmentType: order.fulfilment_type as "delivery" | "collection",
    newStatus: order.status,
    deliveryAddress: formattedAddress,
  });

  if (notificationId) {
    try {
      await supabase
        .from("order_notifications")
        .update({
          send_status: emailResult.success ? "sent" : "failed",
          last_error: emailResult.error || null,
          sent_at: emailResult.success ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", notificationId);
    } catch {
      // Non-fatal if table not migrated yet
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);

  if (!emailResult.success) {
    return {
      success: false,
      message: "Email sending failed on retry",
      error: emailResult.error,
    };
  }

  return {
    success: true,
    message: `Notification email successfully re-sent to ${order.customer_email}`,
  };
}

/**
 * Updates internal store notes for an order.
 */
export async function updateOrderNotesAction(
  orderId: string,
  notes: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const authCheck = await verifyAdminAuth();
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error };
  }

  const { supabase } = authCheck;

  const { error } = await supabase
    .from("orders")
    .update({
      notes: notes.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, message: "Notes updated successfully" };
}
