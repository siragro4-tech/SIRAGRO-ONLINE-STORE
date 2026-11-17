export type StripeSessionValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Verifies that a Stripe Checkout session is settled in GBP before recording
 * an order as paid. Rejects non-GBP or unpaid/null currency sessions.
 */
export function validatePaidGbpStripeSession(session: {
  payment_status?: string | null;
  currency?: string | null;
  amount_total?: number | null;
}): StripeSessionValidationResult {
  if (session.payment_status !== "paid") {
    return {
      valid: false,
      reason: `Stripe session payment_status is "${session.payment_status || "unknown"}", expected "paid".`,
    };
  }

  const normalizedCurrency = session.currency?.trim().toLowerCase();
  if (normalizedCurrency !== "gbp") {
    return {
      valid: false,
      reason: `Unsupported Stripe session currency "${session.currency || "missing"}"; expected "gbp".`,
    };
  }

  if (
    typeof session.amount_total !== "number" ||
    !Number.isFinite(session.amount_total) ||
    session.amount_total < 0
  ) {
    return {
      valid: false,
      reason: "Stripe session amount_total is missing or invalid.",
    };
  }

  return { valid: true };
}

/**
 * Checks if a Supabase/Postgres error indicates migration 005
 * (stripe_webhook_events table) has not yet been applied.
 */
export function isMissingStripeEventsTableError(error: {
  code?: string | null;
  message?: string | null;
} | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}
