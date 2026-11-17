export type NotificationSendStatus =
  | "pending"
  | "sent"
  | "failed"
  | "not_configured";

export type EmailDispatchResult = {
  success: boolean;
  notConfigured?: boolean;
  skipped?: boolean;
  data?: unknown;
  error?: string;
};

/**
 * Checks whether the Resend email provider API key is genuinely configured.
 * Rejects missing, empty, or placeholder values so simulated/missing providers
 * are never reported as delivered emails.
 */
export function isEmailProviderConfigured(
  apiKey: string | undefined | null
): boolean {
  if (!apiKey) return false;
  const trimmed = apiKey.trim();
  if (!trimmed || trimmed === "re_your-resend-api-key") {
    return false;
  }
  return true;
}

/**
 * Maps an email dispatch result into an accurate persistent notification status.
 * Guarantees simulated, missing-provider, or failed deliveries are never stored as "sent".
 */
export function resolveNotificationRecord(
  result: EmailDispatchResult,
  nowIso: string = new Date().toISOString()
): {
  send_status: NotificationSendStatus;
  last_error: string | null;
  sent_at: string | null;
} {
  if (result.success) {
    return {
      send_status: "sent",
      last_error: null,
      sent_at: nowIso,
    };
  }

  if (result.notConfigured) {
    return {
      send_status: "not_configured",
      last_error:
        result.error ||
        "Email provider is not configured — email was NOT sent.",
      sent_at: null,
    };
  }

  return {
    send_status: "failed",
    last_error: result.error || "Email delivery failed — email was NOT sent.",
    sent_at: null,
  };
}

/**
 * Computes the next notification attempt count accurately.
 */
export function getNextAttemptCount(currentAttemptCount: number | null | undefined): number {
  const safeCurrent =
    typeof currentAttemptCount === "number" &&
    Number.isFinite(currentAttemptCount) &&
    currentAttemptCount > 0
      ? Math.floor(currentAttemptCount)
      : 0;
  return safeCurrent + 1;
}

/**
 * Checks if a database error indicates migration 005 ('not_configured' enum/check)
 * has not yet been applied to order_notifications.send_status.
 */
export function isLegacyNotificationConstraintError(error: {
  code?: string | null;
  message?: string | null;
} | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  return (
    error.code === "23514" ||
    msg.includes("check constraint") ||
    msg.includes("send_status")
  );
}
