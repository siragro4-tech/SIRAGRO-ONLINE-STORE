-- ==============================================================================
-- SIRAGRO ONLINE STORE — Admin Activity, Cart Aggregates & Inventory Audit Log
-- ==============================================================================
-- Version: 004
-- Description:
--   1. Adds `low_stock_threshold` on `products` (default 10) and `refunded_amount`
--      on `orders` (default 0.00) for accurate stock alerts and net sales reports.
--   2. Creates `admin_activity_events` for in-dashboard notifications (unpaid vs
--      paid orders, Stripe webhooks, grouped cart activity, low/out-of-stock alerts,
--      inventory adjustments, order status changes, and contact enquiries).
--   3. Creates `cart_activity_daily` for privacy-friendly aggregate cart metrics
--      (no PII, no IP addresses, no visitor identifiers).
--   4. Creates `inventory_adjustments` to record an audit trail of stock changes.
--   5. Enforces Row Level Security (RLS) restricting admin tables to admins only.
-- ==============================================================================

-- 1. Optional columns for per-product low-stock threshold & order refund tracking
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 10
  CHECK (low_stock_threshold >= 0);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00
  CHECK (refunded_amount >= 0);

-- ------------------------------------------------------------------------------
-- 2. Admin Activity & Notification Events (Admin-Only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'order_placed_unpaid',
      'order_paid',
      'order_refunded',
      'order_payment_failed',
      'cart_activity',
      'low_stock_alert',
      'out_of_stock_alert',
      'inventory_adjusted',
      'order_status_updated',
      'contact_message'
    )
  ),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (
    severity IN ('info', 'success', 'warning', 'error')
  ),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_activity_events_created_at_idx
  ON public.admin_activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_events_type_idx
  ON public.admin_activity_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_events_unread_idx
  ON public.admin_activity_events(is_read) WHERE is_read = FALSE;

ALTER TABLE public.admin_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage activity events" ON public.admin_activity_events;
CREATE POLICY "Admins manage activity events"
  ON public.admin_activity_events FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Privacy-Safe Aggregate Cart Activity (Zero PII)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_activity_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'Europe/London')::date),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name_snapshot TEXT NOT NULL,
  add_count INT NOT NULL DEFAULT 0 CHECK (add_count >= 0),
  total_units_added INT NOT NULL DEFAULT 0 CHECK (total_units_added >= 0),
  last_added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (activity_date, product_id)
);

CREATE INDEX IF NOT EXISTS cart_activity_daily_date_idx
  ON public.cart_activity_daily(activity_date DESC, total_units_added DESC);

ALTER TABLE public.cart_activity_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read aggregate cart activity" ON public.cart_activity_daily;
CREATE POLICY "Admins read aggregate cart activity"
  ON public.cart_activity_daily FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. Inventory Adjustment Audit History
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  previous_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  delta INT NOT NULL,
  reason TEXT NOT NULL CHECK (
    reason IN (
      'admin_quick_edit',
      'admin_product_edit',
      'admin_product_create',
      'csv_import',
      'order_paid'
    )
  ),
  changed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_by_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_adjustments_product_id_idx
  ON public.inventory_adjustments(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_adjustments_created_at_idx
  ON public.inventory_adjustments(created_at DESC);

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage inventory adjustments" ON public.inventory_adjustments;
CREATE POLICY "Admins manage inventory adjustments"
  ON public.inventory_adjustments FOR ALL
  USING (public.is_admin());
