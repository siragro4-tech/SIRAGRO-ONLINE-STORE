"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-auth";
import {
  ORDER_ALLOWED_TRANSITIONS,
  isValidOrderTransition,
  type OrderStatusValue,
} from "@/lib/admin-rules";
import { recordAdminActivity } from "@/lib/activity";
import {
  sendOrderConfirmationEmail,
  sendStatusUpdateEmail,
} from "@/lib/email";
import {
  getNextAttemptCount,
  isLegacyNotificationConstraintError,
  resolveNotificationRecord,
  type NotificationSendStatus,
} from "@/lib/email-status";
import type { Json } from "@/types/database.types";

export type OrderStatus = OrderStatusValue;

export interface StatusActionResult {
  success: boolean;
  message?: string;
  error?: string;
  noop?: boolean;
  emailSent?: boolean;
  emailStatus?: NotificationSendStatus | "skipped";
  emailError?: string;
}

/**
 * Safely updates order fulfillment status.
 * - Enforces admin authentication
 * - Enforces allowed state machine transitions
 * - Never modifies payment status
 * - Records audit trail in order_status_history and admin_activity_events
 * - Sends transactional email and logs status in order_notifications
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  adminNotes?: string,
  sendEmailNotification: boolean = true
): Promise<StatusActionResult> {
  const authCheck = await requireAdminAction();
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
    ORDER_ALLOWED_TRANSITIONS[fulfilmentType]?.[currentStatus] || [];

  if (!isValidOrderTransition(fulfilmentType, currentStatus, newStatus)) {
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

  // 5.5 Record in Admin Activity Feed
  await recordAdminActivity({
    event_type: "order_status_updated",
    severity: newStatus === "cancelled" ? "warning" : "info",
    title: `Order #${order.order_number} → ${newStatus.replace(/_/g, " ")}`,
    summary: `Fulfilment updated from "${currentStatus}" to "${newStatus}" by ${profile.email}. Payment status remains "${order.payment_status}".`,
    order_id: orderId,
    metadata: {
      order_number: order.order_number,
      previous_status: currentStatus,
      new_status: newStatus,
    } as Json,
  });

  // 6. Send Customer Notification Email (if requested and not already sent for this target status)
  let emailSent = false;
  let emailStatus: NotificationSendStatus | "skipped" | undefined;
  let emailErrorMessage: string | undefined;

  if (sendEmailNotification && order.customer_email) {
    let alreadySentForTarget = false;
    try {
      const { data: existingSent } = await supabase
        .from("order_notifications")
        .select("id")
        .eq("order_id", orderId)
        .eq("notification_type", "status_update")
        .eq("status_target", newStatus)
        .eq("send_status", "sent")
        .limit(1)
        .maybeSingle();
      if (existingSent) {
        alreadySentForTarget = true;
      }
    } catch {
      // Proceed cleanly if notification table check is unavailable
    }

    if (alreadySentForTarget) {
      emailStatus = "skipped";
    } else {
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

      const resolved = resolveNotificationRecord(emailResult);
      emailSent = resolved.send_status === "sent";
      emailStatus = resolved.send_status;
      emailErrorMessage = resolved.last_error || undefined;

      // 7. Persist notification log accurately (never record 'sent' when simulated/unconfigured)
      try {
        const { error: insertNotifErr } = await supabase
          .from("order_notifications")
          .insert({
            order_id: orderId,
            recipient_email: order.customer_email,
            notification_type: "status_update",
            status_target: newStatus,
            send_status: resolved.send_status,
            attempt_count: 1,
            last_error: resolved.last_error,
            sent_at: resolved.sent_at,
          });

        if (
          insertNotifErr &&
          resolved.send_status === "not_configured" &&
          isLegacyNotificationConstraintError(insertNotifErr)
        ) {
          await supabase.from("order_notifications").insert({
            order_id: orderId,
            recipient_email: order.customer_email,
            notification_type: "status_update",
            status_target: newStatus,
            send_status: "failed",
            attempt_count: 1,
            last_error:
              resolved.last_error ||
              "Email provider not configured — email was not sent.",
            sent_at: null,
          });
        }
      } catch (notifErr) {
        console.warn(
          "[Orders Action] Notice: Could not record order_notifications log:",
          notifErr
        );
      }
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
    emailStatus,
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
  const authCheck = await requireAdminAction();
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

  let existingNotif: {
    id: string;
    notification_type: string;
    status_target: string;
    send_status: string;
    attempt_count: number;
  } | null = null;

  if (notificationId) {
    const { data: notifRow, error: notifLookupErr } = await supabase
      .from("order_notifications")
      .select("id, notification_type, status_target, send_status, attempt_count")
      .eq("id", notificationId)
      .eq("order_id", orderId)
      .maybeSingle();

    if (notifLookupErr || !notifRow) {
      return {
        success: false,
        message: "Notification record could not be loaded for this order.",
        error: notifLookupErr?.message,
      };
    }

    if (notifRow.send_status === "sent") {
      return {
        success: true,
        message: "Notification was already sent — duplicate send prevented.",
      };
    }

    existingNotif = notifRow;
  }

  const targetStatus = existingNotif?.status_target || order.status;
  const rawAddr = order.delivery_address as Record<string, string> | null;
  const formattedAddress = rawAddr
    ? `${rawAddr.line1 || rawAddr.line_1 || ""}, ${rawAddr.city || ""}, ${rawAddr.postcode || ""}`
    : null;

  let emailResult;
  if (existingNotif?.notification_type === "confirmation") {
    const [{ data: items }, { data: ageLog }] = await Promise.all([
      supabase
        .from("order_items")
        .select("product_name_snapshot, quantity, unit_price_snapshot, line_total")
        .eq("order_id", orderId),
      supabase
        .from("age_verification_log")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle(),
    ]);

    emailResult = await sendOrderConfirmationEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      fulfilmentType: order.fulfilment_type as "delivery" | "collection",
      deliveryAddress: formattedAddress || undefined,
      items: (items || []).map((i) => ({
        name: i.product_name_snapshot,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price_snapshot),
        lineTotal: Number(i.line_total),
      })),
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.delivery_charge),
      total: Number(order.total),
      hasAgeRestrictedItems: Boolean(ageLog),
    });
  } else {
    emailResult = await sendStatusUpdateEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      fulfilmentType: order.fulfilment_type as "delivery" | "collection",
      newStatus: targetStatus,
      deliveryAddress: formattedAddress,
    });
  }

  const resolved = resolveNotificationRecord(emailResult);
  const nextAttemptCount = getNextAttemptCount(existingNotif?.attempt_count);

  if (notificationId) {
    try {
      const { error: updateNotifErr } = await supabase
        .from("order_notifications")
        .update({
          send_status: resolved.send_status,
          attempt_count: nextAttemptCount,
          last_error: resolved.last_error,
          sent_at: resolved.sent_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("order_id", orderId);

      if (
        updateNotifErr &&
        resolved.send_status === "not_configured" &&
        isLegacyNotificationConstraintError(updateNotifErr)
      ) {
        await supabase
          .from("order_notifications")
          .update({
            send_status: "failed",
            attempt_count: nextAttemptCount,
            last_error:
              resolved.last_error ||
              "Email provider not configured — email was not sent.",
            sent_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", notificationId)
          .eq("order_id", orderId);
      }
    } catch {
      // Non-fatal if table not migrated yet
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);

  if (!emailResult.success) {
    return {
      success: false,
      message: emailResult.notConfigured
        ? "Email provider not configured — email was not sent"
        : "Email sending failed on retry",
      error: emailResult.error,
    };
  }

  return {
    success: true,
    message: `Notification email sent successfully (attempt #${nextAttemptCount}).`,
  };
}

/**
 * Updates internal store notes for an order.
 */
export async function updateOrderNotesAction(
  orderId: string,
  notes: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const authCheck = await requireAdminAction();
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
