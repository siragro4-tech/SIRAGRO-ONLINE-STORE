-- ==============================================================================
-- SIRAGRO ONLINE STORE — Safety Remediation Migration
-- ==============================================================================
-- Version: 005
-- Description:
--   1. Adds `is_delivery_pricing_confirmed` (DEFAULT FALSE) to `delivery_settings`
--      so unconfirmed delivery charges fail closed at checkout until confirmed.
--   2. Expands `order_notifications.send_status` CHECK constraint to include
--      'not_configured' so simulated/missing email providers are never logged as 'sent'.
--   3. Removes permissive anonymous guest_token RLS policies on `baskets` and
--      `basket_items`, restricting direct Supabase client access to authenticated
--      owners (or admins). Guest baskets are accessed strictly server-side using
--      verified HttpOnly signed cookies.
--   4. Creates `stripe_webhook_events` for durable Stripe webhook event ID
--      deduplication (admin read-only, server service_role write-only).
-- ==============================================================================

-- 1. Delivery Pricing Confirmation Gate (Fail Closed by Default)
ALTER TABLE public.delivery_settings
  ADD COLUMN IF NOT EXISTS is_delivery_pricing_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Accurate Email Notification Statuses ('not_configured' supported alongside 'pending'/'sent'/'failed')
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.order_notifications'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%send_status%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.order_notifications DROP CONSTRAINT IF EXISTS %I',
      constraint_rec.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.order_notifications
  ADD CONSTRAINT order_notifications_send_status_check
  CHECK (send_status IN ('pending', 'sent', 'failed', 'not_configured'));

-- 3. Lock Down Guest Basket RLS Policies (Server-Only Access for Guests)
DROP POLICY IF EXISTS "Users and guests read own baskets" ON public.baskets;
DROP POLICY IF EXISTS "Users and guests manage own baskets" ON public.baskets;
DROP POLICY IF EXISTS "Authenticated users read own baskets" ON public.baskets;
DROP POLICY IF EXISTS "Authenticated users manage own baskets" ON public.baskets;

CREATE POLICY "Authenticated users read own baskets"
  ON public.baskets FOR SELECT
  USING ((auth.uid() IS NOT NULL AND auth.uid() = profile_id) OR public.is_admin());

CREATE POLICY "Authenticated users manage own baskets"
  ON public.baskets FOR ALL
  USING ((auth.uid() IS NOT NULL AND auth.uid() = profile_id) OR public.is_admin())
  WITH CHECK ((auth.uid() IS NOT NULL AND auth.uid() = profile_id) OR public.is_admin());

DROP POLICY IF EXISTS "Users manage basket items" ON public.basket_items;
DROP POLICY IF EXISTS "Authenticated users manage own basket items" ON public.basket_items;

CREATE POLICY "Authenticated users manage own basket items"
  ON public.basket_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.baskets b
      WHERE b.id = basket_items.basket_id
        AND ((auth.uid() IS NOT NULL AND b.profile_id = auth.uid()) OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.baskets b
      WHERE b.id = basket_items.basket_id
        AND ((auth.uid() IS NOT NULL AND b.profile_id = auth.uid()) OR public.is_admin())
    )
  );

-- 4. Durable Stripe Webhook Event Deduplication Table
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_processed_at_idx
  ON public.stripe_webhook_events(processed_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read stripe webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Admins read stripe webhook events"
  ON public.stripe_webhook_events FOR SELECT
  USING (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.stripe_webhook_events FROM anon, authenticated;
