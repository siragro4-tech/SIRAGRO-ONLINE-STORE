-- ==============================================================================
-- SIRAGRO ONLINE STORE — Order Status History & Notification Logs Migration
-- ==============================================================================
-- Version: 002
-- Description:
--   1. Creates `order_status_history` table to audit all order fulfillment transitions.
--   2. Creates `order_notifications` table to track customer status email deliveries and retries.
--   3. Creates an optimized database function `get_sales_metrics()` for admin reporting.
--   4. Configures Row Level Security (RLS) restricting all access to administrators.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Order Status History Table (Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL CHECK (
    new_status IN ('pending', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'collected', 'cancelled')
  ),
  changed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_by_email TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS order_status_history_created_at_idx ON public.order_status_history(created_at DESC);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Only Admins can view and create status history records
CREATE POLICY "Admins manage order status history"
  ON public.order_status_history FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. Order Notifications Log (Email Delivery Tracking & Retry Pipeline)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'status_update', -- 'confirmation', 'status_update'
  status_target TEXT NOT NULL, -- e.g. 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'collected', 'cancelled'
  send_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    send_status IN ('pending', 'sent', 'failed')
  ),
  attempt_count INT NOT NULL DEFAULT 1,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_notifications_order_id_idx ON public.order_notifications(order_id);
CREATE INDEX IF NOT EXISTS order_notifications_send_status_idx ON public.order_notifications(send_status);

ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- Only Admins can view and manage order notifications
CREATE POLICY "Admins manage order notifications"
  ON public.order_notifications FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Optimized Database Function: Sales Metrics Aggregate
-- ------------------------------------------------------------------------------
-- Calculates accurate gross paid revenue, orders count, and AOV from paid orders only.
CREATE OR REPLACE FUNCTION public.get_sales_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_paid_revenue', COALESCE(SUM(total), 0.00),
    'total_paid_orders', COUNT(*),
    'average_order_value', CASE WHEN COUNT(*) > 0 THEN ROUND(COALESCE(SUM(total), 0.00) / COUNT(*), 2) ELSE 0.00 END,
    'today_paid_revenue', COALESCE(SUM(CASE WHEN created_at >= date_trunc('day', NOW() AT TIME ZONE 'Europe/London') AT TIME ZONE 'Europe/London' THEN total ELSE 0 END), 0.00),
    'today_paid_orders', COUNT(CASE WHEN created_at >= date_trunc('day', NOW() AT TIME ZONE 'Europe/London') AT TIME ZONE 'Europe/London' THEN 1 END),
    'month_paid_revenue', COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', NOW() AT TIME ZONE 'Europe/London') AT TIME ZONE 'Europe/London' THEN total ELSE 0 END), 0.00),
    'month_paid_orders', COUNT(CASE WHEN created_at >= date_trunc('month', NOW() AT TIME ZONE 'Europe/London') AT TIME ZONE 'Europe/London' THEN 1 END)
  ) INTO result
  FROM public.orders
  WHERE payment_status = 'paid';

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

