"use server";

import { getBasket } from "@/lib/basket";
import { calculateDeliveryCharge, type DeliveryCalculationResult } from "@/lib/delivery";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recordAdminActivity } from "@/lib/activity";
import {
  processCheckoutSubmission,
  type CheckoutActionResult,
} from "@/lib/checkout-flow";

export type { CheckoutActionResult };

/**
 * Validates a delivery postcode against shop coordinates (UB3 4NS).
 * Strictly computed on the server.
 */
export async function validatePostcodeAction(
  postcode: string
): Promise<DeliveryCalculationResult> {
  const summary = await getBasket();
  return await calculateDeliveryCharge({
    fulfilmentType: "delivery",
    postcode,
    subtotal: summary.subtotal,
  });
}

/**
 * Validates the checkout form and creates a Stripe Checkout session.
 */
export async function createCheckoutSessionAction(
  prevState: CheckoutActionResult | null,
  formData: FormData
): Promise<CheckoutActionResult> {
  void prevState;
  return await processCheckoutSubmission(formData, {
    getBasket,
    calculateDeliveryCharge,
    getProfileId: async () => {
      try {
        const supabase = await createServerSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        return user?.id || null;
      } catch {
        return null;
      }
    },
    createStripeCheckoutSession,
    recordCheckoutInitiatedActivity: async ({
      stripeSessionId,
      fulfilmentType,
      expectedTotal,
      itemCount,
    }) => {
      await recordAdminActivity({
        event_type: "order_placed_unpaid",
        severity: "info",
        title: `Checkout initiated — awaiting payment (£${expectedTotal.toFixed(2)})`,
        summary: `${itemCount} item(s) • ${
          fulfilmentType === "delivery" ? "Home Delivery" : "In-Store Collection"
        }. Payment not yet confirmed by Stripe webhook.`,
        metadata: {
          stripe_session_id: stripeSessionId,
          fulfilment_type: fulfilmentType,
          expected_total: expectedTotal,
          item_count: itemCount,
        },
      });
    },
  });
}

