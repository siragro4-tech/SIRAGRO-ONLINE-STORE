import { createAdminClient } from "@/lib/supabase/admin";
import { classifyStockStatus, shouldGroupCartActivity } from "@/lib/admin-rules";
import type { Database, Json } from "@/types/database.types";

type ActivityEventInsert =
  Database["public"]["Tables"]["admin_activity_events"]["Insert"];
type InventoryReason =
  Database["public"]["Tables"]["inventory_adjustments"]["Insert"]["reason"];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getLondonTodayDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
}

/**
 * Safely inserts an event into admin_activity_events.
 * Silently no-ops if admin client is unconfigured or migration 004 is pending.
 */
export async function recordAdminActivity(
  event: ActivityEventInsert
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("admin_activity_events").insert({
      ...event,
      metadata: event.metadata ?? {},
    });
  } catch {
    // Non-fatal so customer checkout/basket flows are never interrupted
  }
}

/**
 * Privacy-safe, server-side aggregated cart activity recorder.
 * - Uses only server-validated product ID, product name, and clamped quantity.
 * - Collects ZERO PII (no names, emails, addresses, IPs, or visitor IDs).
 * - Never modifies or reserves inventory.
 * - Groups rapid/repeated additions of the same product into one feed item (15m window).
 */
export async function recordServerCartActivity(
  productId: string,
  productName: string,
  quantityAdded: number
): Promise<void> {
  if (!UUID_REGEX.test(productId) || quantityAdded <= 0) return;

  try {
    const supabase = createAdminClient();
    const today = getLondonTodayDate();
    const nowIso = new Date().toISOString();

    // 1. Update aggregate daily counter (pure product-level aggregate, no visitor ID)
    const { data: existingDaily } = await supabase
      .from("cart_activity_daily")
      .select("id, add_count, total_units_added")
      .eq("activity_date", today)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingDaily) {
      await supabase
        .from("cart_activity_daily")
        .update({
          product_name_snapshot: productName,
          add_count: existingDaily.add_count + 1,
          total_units_added: existingDaily.total_units_added + quantityAdded,
          last_added_at: nowIso,
        })
        .eq("id", existingDaily.id);
    } else {
      await supabase.from("cart_activity_daily").insert({
        activity_date: today,
        product_id: productId,
        product_name_snapshot: productName,
        add_count: 1,
        total_units_added: quantityAdded,
        last_added_at: nowIso,
      });
    }

    // 2. Group rapid cart additions in the activity feed (15-minute throttle window)
    const { data: recentEvent } = await supabase
      .from("admin_activity_events")
      .select("id, metadata, created_at")
      .eq("event_type", "cart_activity")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      recentEvent &&
      shouldGroupCartActivity(recentEvent.created_at, Date.now(), 15)
    ) {
      const prevMeta =
        recentEvent.metadata &&
        typeof recentEvent.metadata === "object" &&
        !Array.isArray(recentEvent.metadata)
          ? (recentEvent.metadata as Record<string, unknown>)
          : {};
      const nextAddEvents = Number(prevMeta.add_events || 1) + 1;
      const nextTotalUnits = Number(prevMeta.total_units || 0) + quantityAdded;

      await supabase
        .from("admin_activity_events")
        .update({
          title: `Basket interest: ${productName}`,
          summary: `${nextTotalUnits} unit(s) added across ${nextAddEvents} basket action(s) in the last 15 mins (aggregate only).`,
          metadata: {
            add_events: nextAddEvents,
            total_units: nextTotalUnits,
          } as Json,
          is_read: false,
        })
        .eq("id", recentEvent.id);
    } else {
      await supabase.from("admin_activity_events").insert({
        event_type: "cart_activity",
        severity: "info",
        title: `Basket interest: ${productName}`,
        summary: `${quantityAdded} unit(s) added to shopper basket (aggregate only).`,
        product_id: productId,
        metadata: {
          add_events: 1,
          total_units: quantityAdded,
        } as Json,
      });
    }
  } catch {
    // Non-fatal: cart analytics must never break basket actions
  }
}

/**
 * Logs a stock change to inventory_adjustments and emits low/out-of-stock alerts if needed.
 */
export async function recordInventoryAdjustment(params: {
  productId: string;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  lowStockThreshold?: number;
  reason: InventoryReason;
  changedByProfileId?: string | null;
  changedByEmail?: string | null;
  notes?: string | null;
}): Promise<void> {
  const {
    productId,
    productName,
    previousQuantity,
    newQuantity,
    lowStockThreshold = 10,
    reason,
    changedByProfileId = null,
    changedByEmail = null,
    notes = null,
  } = params;

  if (!UUID_REGEX.test(productId)) return;

  try {
    const supabase = createAdminClient();
    const delta = newQuantity - previousQuantity;

    if (delta !== 0 || reason === "admin_product_create") {
      await supabase.from("inventory_adjustments").insert({
        product_id: productId,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        delta,
        reason,
        changed_by_profile_id: changedByProfileId,
        changed_by_email: changedByEmail,
        notes,
      });

      if (reason !== "order_paid") {
        await recordAdminActivity({
          event_type: "inventory_adjusted",
          severity: "info",
          title: `Stock updated: ${productName}`,
          summary: `Stock changed from ${previousQuantity} to ${newQuantity} (${delta >= 0 ? `+${delta}` : delta}) by ${changedByEmail || "system"}.`,
          product_id: productId,
          metadata: {
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            delta,
            reason,
          } as Json,
        });
      }
    }

    const stockStatus = classifyStockStatus(newQuantity, lowStockThreshold);
    if (stockStatus === "out_of_stock" || stockStatus === "low_stock") {
      const alertType =
        stockStatus === "out_of_stock" ? "out_of_stock_alert" : "low_stock_alert";

      // Avoid duplicate unread stock alerts for the same product & alert type
      const { data: existingUnread } = await supabase
        .from("admin_activity_events")
        .select("id")
        .eq("product_id", productId)
        .eq("event_type", alertType)
        .eq("is_read", false)
        .limit(1)
        .maybeSingle();

      if (!existingUnread) {
        await recordAdminActivity({
          event_type: alertType,
          severity: stockStatus === "out_of_stock" ? "error" : "warning",
          title:
            stockStatus === "out_of_stock"
              ? `Out of stock: ${productName}`
              : `Low stock alert: ${productName}`,
          summary:
            stockStatus === "out_of_stock"
              ? `${productName} has reached 0 units in stock.`
              : `${productName} is down to ${newQuantity} unit(s) (threshold: ${lowStockThreshold}).`,
          product_id: productId,
          metadata: {
            stock_quantity: newQuantity,
            low_stock_threshold: lowStockThreshold,
          } as Json,
        });
      }
    }
  } catch {
    // Non-fatal if migration 004 is pending
  }
}
