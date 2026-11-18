/**
 * Pure, framework-agnostic business rules for SIRAGRO admin authorization,
 * revenue calculation, stock classification, image validation, and order workflow.
 */

export type SalesPeriod = "today" | "7d" | "month" | "all";

export type OrderStatusValue =
  | "pending"
  | "processing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "collected"
  | "cancelled";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export const ORDER_ALLOWED_TRANSITIONS: Record<
  "delivery" | "collection",
  Record<OrderStatusValue, OrderStatusValue[]>
> = {
  delivery: {
    pending: ["processing", "cancelled"],
    processing: ["out_for_delivery", "cancelled"],
    ready_for_pickup: [],
    out_for_delivery: ["delivered", "processing"],
    delivered: [],
    collected: [],
    cancelled: [],
  },
  collection: {
    pending: ["processing", "cancelled"],
    processing: ["ready_for_pickup", "cancelled"],
    ready_for_pickup: ["collected", "processing", "cancelled"],
    out_for_delivery: [],
    delivered: [],
    collected: [],
    cancelled: [],
  },
};

export function isAdminRole(role?: string | null): boolean {
  return role === "admin";
}

export function isValidOrderTransition(
  fulfilmentType: "delivery" | "collection",
  currentStatus: OrderStatusValue,
  newStatus: OrderStatusValue
): boolean {
  if (currentStatus === newStatus) return false;
  const allowed = ORDER_ALLOWED_TRANSITIONS[fulfilmentType]?.[currentStatus] || [];
  return allowed.includes(newStatus);
}

export function validateProductImageFile(file: {
  name: string;
  type: string;
  size: number;
}): { valid: true } | { valid: false; error: string } {
  if (!file || file.size <= 0) {
    return { valid: false, error: "Please select a non-empty image file." };
  }

  const normalizedType = (file.type || "").toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const hasAllowedExt = ["jpg", "jpeg", "png", "webp"].includes(ext);

  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      normalizedType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
    ) &&
    !(normalizedType === "" && hasAllowedExt)
  ) {
    return {
      valid: false,
      error: "Unsupported image format. Please upload a JPG, PNG, or WebP image.",
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "Image file is too large. Maximum allowed file size is 5 MB.",
    };
  }

  return { valid: true };
}

export function classifyStockStatus(
  stockQuantity: number,
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD
): "out_of_stock" | "low_stock" | "in_stock" {
  if (stockQuantity <= 0) return "out_of_stock";
  if (stockQuantity <= Math.max(0, lowStockThreshold)) return "low_stock";
  return "in_stock";
}

function getLondonDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(date);
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export interface RevenueOrderInput {
  total: number | string;
  refunded_amount?: number | string | null;
  payment_status: string;
  created_at: string;
}

export interface RevenueSummary {
  period: SalesPeriod;
  grossPaidRevenue: number;
  refundedTotal: number;
  netPaidRevenue: number;
  hasRecordedRefunds: boolean;
  paidOrderCount: number;
  averageOrderValue: number;
  awaitingPaymentCount: number;
  failedPaymentCount: number;
}

/**
 * Calculates revenue strictly from verified paid/refunded orders for a UK time period.
 * Unpaid and failed orders are excluded from revenue totals.
 */
export function calculateRevenueSummary(
  orders: RevenueOrderInput[],
  period: SalesPeriod,
  now: Date = new Date()
): RevenueSummary {
  const londonToday = getLondonDateKey(now);
  const londonMonth = londonToday.slice(0, 7);

  // Compute start date key (inclusive) for 7-day rolling UK window
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const londonSevenDaysAgo = getLondonDateKey(sevenDaysAgo);

  let grossPaidRevenue = 0;
  let refundedTotal = 0;
  let paidOrderCount = 0;
  let awaitingPaymentCount = 0;
  let failedPaymentCount = 0;

  for (const order of orders) {
    const orderDate = new Date(order.created_at);
    if (Number.isNaN(orderDate.getTime())) continue;

    const orderDay = getLondonDateKey(orderDate);

    if (period === "today" && orderDay !== londonToday) continue;
    if (period === "7d" && orderDay < londonSevenDaysAgo) continue;
    if (period === "month" && !orderDay.startsWith(londonMonth)) continue;

    if (order.payment_status === "unpaid") {
      awaitingPaymentCount += 1;
      continue;
    }

    if (order.payment_status === "failed") {
      failedPaymentCount += 1;
      continue;
    }

    if (order.payment_status === "paid" || order.payment_status === "refunded") {
      const orderTotal = Math.max(0, Number(order.total) || 0);
      grossPaidRevenue += orderTotal;
      paidOrderCount += 1;

      const explicitRefund = Number(order.refunded_amount || 0);
      if (explicitRefund > 0) {
        refundedTotal += Math.min(orderTotal, explicitRefund);
      } else if (order.payment_status === "refunded") {
        refundedTotal += orderTotal;
      }
    }
  }

  const roundedGross = roundMoney(grossPaidRevenue);
  const roundedRefunded = roundMoney(refundedTotal);
  const netPaidRevenue = Math.max(0, roundMoney(roundedGross - roundedRefunded));
  const averageOrderValue =
    paidOrderCount > 0 ? roundMoney(roundedGross / paidOrderCount) : 0;

  return {
    period,
    grossPaidRevenue: roundedGross,
    refundedTotal: roundedRefunded,
    netPaidRevenue,
    hasRecordedRefunds: roundedRefunded > 0,
    paidOrderCount,
    averageOrderValue,
    awaitingPaymentCount,
    failedPaymentCount,
  };
}

export function shouldGroupCartActivity(
  existingCreatedAtIso: string,
  nowMs: number,
  windowMinutes = 15
): boolean {
  const existingMs = Date.parse(existingCreatedAtIso);
  if (Number.isNaN(existingMs)) return false;
  const diffMs = nowMs - existingMs;
  return diffMs >= 0 && diffMs <= windowMinutes * 60 * 1000;
}

/**
 * Restricts post-login admin redirects strictly to internal /admin paths.
 * Prevents open redirects and protocol-relative redirect bypasses.
 */
export function sanitizeAdminRedirect(raw?: string | null): string {
  if (!raw) return "/admin";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/admin") || trimmed.startsWith("//")) {
    return "/admin";
  }
  if (trimmed === "/admin/login" || trimmed.startsWith("/admin/login?")) {
    return "/admin";
  }
  return trimmed;
}

/**
 * Normalizes and validates a non-negative GBP product price rounded to 2 decimals.
 */
export function normalizeProductPrice(raw: unknown): number | null {
  const num =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw.trim())
        : NaN;
  if (!Number.isFinite(num) || num < 0) return null;
  return roundMoney(num);
}

/**
 * Detects Postgres / PostgREST errors indicating an optional migration column or table is pending.
 */
export function isMissingSchemaError(message?: string | null): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("does not exist") ||
    lower.includes("schema cache") ||
    lower.includes("could not find")
  );
}

export function formatLondonShortDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatLondonDateTimeWithYear(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function isStripeSecretConfigured(secretKey?: string | null): boolean {
  if (!secretKey) return false;
  const trimmed = secretKey.trim();
  if (!trimmed || trimmed.includes("your-stripe-secret-key")) return false;
  return trimmed.startsWith("sk_");
}

export function isStripeWebhookConfigured(secret?: string | null): boolean {
  if (!secret) return false;
  const trimmed = secret.trim();
  if (!trimmed || trimmed.includes("your-stripe-webhook-secret")) return false;
  return trimmed.startsWith("whsec_");
}
