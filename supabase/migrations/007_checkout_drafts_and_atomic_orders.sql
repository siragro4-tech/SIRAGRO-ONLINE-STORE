-- ==============================================================================
-- SIRAGRO ONLINE STORE — Server Checkout Drafts & Atomic Paid-Order Processing
-- ==============================================================================
-- Version: 007
-- Description:
--   Forward migration (leaves 001-006 untouched). Safe whether 006 was applied or not.
--   1. Creates `checkout_drafts` and `checkout_draft_items` (server-authoritative
--      draft snapshots with stable product IDs and expected GBP pence total).
--   2. Adds `inventory_conflict` flag to `orders` for paid orders with
--      insufficient stock requiring staff review (never clamps stock to zero).
--   3. Expands `admin_activity_events.event_type` CHECK constraint to include
--      'order_stock_conflict'.
--   4. Creates `process_paid_order_from_draft(...)` and `process_stripe_refund_atomic(...)`
--      with transactional Stripe event deduplication, deterministic product row
--      locking (`ORDER BY product_id ASC FOR UPDATE`), full-order stock check
--      before decrement, valid `inventory_adjustments` columns (matching 004),
--      and queued `order_notifications`.
-- NOTE: Do not apply automatically; review and apply in staging first.
-- ==============================================================================

-- 1. Server-Created Checkout Drafts (Server / service_role only)
CREATE TABLE IF NOT EXISTS public.checkout_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  fulfilment_type TEXT NOT NULL CHECK (fulfilment_type IN ('delivery', 'collection')),
  delivery_address JSONB,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_charge >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  expected_total_pence INT NOT NULL CHECK (expected_total_pence >= 0),
  currency TEXT NOT NULL DEFAULT 'gbp' CHECK (currency = 'gbp'),
  has_age_restricted_items BOOLEAN NOT NULL DEFAULT FALSE,
  age_restriction_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_checkout_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS checkout_drafts_profile_id_idx
  ON public.checkout_drafts(profile_id);
CREATE INDEX IF NOT EXISTS checkout_drafts_status_idx
  ON public.checkout_drafts(status, created_at DESC);

ALTER TABLE public.checkout_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_drafts FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.checkout_draft_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id UUID NOT NULL REFERENCES public.checkout_drafts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name_snapshot TEXT NOT NULL,
  unit_price_snapshot NUMERIC(10, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
  quantity INT NOT NULL CHECK (quantity > 0 AND quantity <= 20),
  line_total_snapshot NUMERIC(10, 2) NOT NULL CHECK (line_total_snapshot >= 0),
  is_age_restricted_snapshot BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (draft_id, product_id)
);

CREATE INDEX IF NOT EXISTS checkout_draft_items_draft_id_idx
  ON public.checkout_draft_items(draft_id);

ALTER TABLE public.checkout_draft_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_draft_items FROM PUBLIC, anon, authenticated;

-- 2. Explicit Inventory Conflict Flag on Orders (separate from payment_status & status)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS inventory_conflict BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Safely Expand admin_activity_events.event_type CHECK Constraint for 'order_stock_conflict'
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.admin_activity_events'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%event_type%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.admin_activity_events DROP CONSTRAINT IF EXISTS %I',
      constraint_rec.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.admin_activity_events
  ADD CONSTRAINT admin_activity_events_event_type_check
  CHECK (
    event_type IN (
      'order_placed_unpaid',
      'order_paid',
      'order_refunded',
      'order_payment_failed',
      'order_stock_conflict',
      'cart_activity',
      'low_stock_alert',
      'out_of_stock_alert',
      'inventory_adjusted',
      'order_status_updated',
      'contact_message'
    )
  );

-- 4. Atomic Paid-Order Processing from Server-Created Draft
CREATE OR REPLACE FUNCTION public.process_paid_order_from_draft(
  p_event_id TEXT,
  p_event_type TEXT,
  p_draft_id UUID,
  p_stripe_session_id TEXT,
  p_payment_intent_id TEXT,
  p_order_number TEXT,
  p_amount_total_pence INT,
  p_currency TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed_event_id TEXT;
  v_existing_order_id UUID;
  v_draft public.checkout_drafts%ROWTYPE;
  v_order_id UUID;
  v_item RECORD;
  v_product RECORD;
  v_has_stock_conflict BOOLEAN := FALSE;
  v_conflict_notes TEXT := '';
  v_notif_id UUID;
BEGIN
  -- Validate inputs strictly
  IF p_event_id IS NULL OR length(trim(p_event_id)) = 0 THEN
    RAISE EXCEPTION 'Invalid Stripe event_id';
  END IF;

  IF p_stripe_session_id IS NULL OR length(trim(p_stripe_session_id)) = 0 THEN
    RAISE EXCEPTION 'Invalid Stripe session_id';
  END IF;

  IF lower(COALESCE(p_currency, '')) <> 'gbp' THEN
    RAISE EXCEPTION 'Unsupported currency: %', COALESCE(p_currency, 'null');
  END IF;

  IF p_amount_total_pence IS NULL OR p_amount_total_pence < 0 THEN
    RAISE EXCEPTION 'Invalid amount_total_pence';
  END IF;

  -- Step A: Transactionally claim the Stripe event_id inside this transaction
  INSERT INTO public.stripe_webhook_events (event_id, event_type)
  VALUES (p_event_id, COALESCE(p_event_type, 'checkout.session.completed'))
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id INTO v_claimed_event_id;

  IF v_claimed_event_id IS NULL THEN
    RETURN jsonb_build_object('status', 'deduplicated');
  END IF;

  -- Step B: Prevent duplicate order for the same Checkout Session even under a different event_id
  SELECT id INTO v_existing_order_id
  FROM public.orders
  WHERE stripe_checkout_session_id = p_stripe_session_id
  LIMIT 1;

  IF v_existing_order_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'existing_session',
      'order_id', v_existing_order_id
    );
  END IF;

  -- Step C: Lock the server-created draft and verify expected GBP pence total
  SELECT * INTO v_draft
  FROM public.checkout_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checkout draft % not found', p_draft_id;
  END IF;

  IF v_draft.expected_total_pence <> p_amount_total_pence THEN
    RAISE EXCEPTION 'Amount mismatch for draft % (expected %, got %)',
      p_draft_id, v_draft.expected_total_pence, p_amount_total_pence;
  END IF;

  -- Step D: Lock all product rows in deterministic product_id ASC order and verify ALL stock before decrementing
  FOR v_item IN
    SELECT *
    FROM public.checkout_draft_items
    WHERE draft_id = p_draft_id
    ORDER BY product_id ASC
  LOOP
    SELECT id, stock_quantity, is_available INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_has_stock_conflict := TRUE;
      v_conflict_notes := v_conflict_notes || format('Product %s no longer exists. ', v_item.product_id);
    ELSIF NOT v_product.is_available THEN
      v_has_stock_conflict := TRUE;
      v_conflict_notes := v_conflict_notes || format('Product "%s" is unavailable. ', v_item.product_name_snapshot);
    ELSIF v_product.stock_quantity < v_item.quantity THEN
      v_has_stock_conflict := TRUE;
      v_conflict_notes := v_conflict_notes || format(
        'Insufficient stock for "%s" (available: %s, ordered: %s). ',
        v_item.product_name_snapshot,
        v_product.stock_quantity,
        v_item.quantity
      );
    END IF;
  END LOOP;

  -- Step E: Create the paid order (payment_status = 'paid' kept separate from status = 'processing')
  INSERT INTO public.orders (
    order_number,
    profile_id,
    status,
    fulfilment_type,
    delivery_address,
    customer_name,
    customer_email,
    customer_phone,
    subtotal,
    delivery_charge,
    total,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    payment_status,
    inventory_conflict,
    notes
  )
  VALUES (
    p_order_number,
    v_draft.profile_id,
    'processing',
    v_draft.fulfilment_type,
    v_draft.delivery_address,
    v_draft.customer_name,
    v_draft.customer_email,
    v_draft.customer_phone,
    v_draft.subtotal,
    v_draft.delivery_charge,
    v_draft.total,
    p_stripe_session_id,
    p_payment_intent_id,
    'paid',
    v_has_stock_conflict,
    CASE
      WHEN v_has_stock_conflict THEN 'INVENTORY_CONFLICT_REVIEW_REQUIRED: ' || trim(v_conflict_notes)
      ELSE NULL
    END
  )
  RETURNING id INTO v_order_id;

  -- Step F: Insert immutable order_items snapshots; decrement stock ONLY if ALL items had sufficient stock
  FOR v_item IN
    SELECT *
    FROM public.checkout_draft_items
    WHERE draft_id = p_draft_id
    ORDER BY product_id ASC
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      unit_price_snapshot,
      quantity,
      line_total
    )
    VALUES (
      v_order_id,
      v_item.product_id,
      v_item.product_name_snapshot,
      v_item.unit_price_snapshot,
      v_item.quantity,
      v_item.line_total_snapshot
    );

    IF NOT v_has_stock_conflict THEN
      SELECT stock_quantity INTO v_product
      FROM public.products
      WHERE id = v_item.product_id;

      UPDATE public.products
      SET stock_quantity = v_product.stock_quantity - v_item.quantity
      WHERE id = v_item.product_id;

      -- Uses strictly the columns defined in migration 004_admin_activity_and_inventory.sql
      INSERT INTO public.inventory_adjustments (
        product_id,
        previous_quantity,
        new_quantity,
        delta,
        reason,
        notes
      )
      VALUES (
        v_item.product_id,
        v_product.stock_quantity,
        v_product.stock_quantity - v_item.quantity,
        -v_item.quantity,
        'order_paid',
        format('Atomic deduction for paid order #%s', p_order_number)
      );
    END IF;
  END LOOP;

  -- Step G: Challenge 25 pending physical check log
  IF v_draft.has_age_restricted_items THEN
    INSERT INTO public.age_verification_log (order_id, method, result, notes)
    VALUES (
      v_order_id,
      CASE
        WHEN v_draft.fulfilment_type = 'delivery' THEN 'driver_id_check_on_delivery'
        ELSE 'counter_check_on_collection'
      END,
      'pending_physical_check',
      'Customer acknowledged 18+ requirement at checkout. Physical Challenge 25 photo ID check required.'
    );
  END IF;

  -- Step H: Queue durable notification & activity records inside the transaction
  IF v_draft.customer_email IS NOT NULL AND length(trim(v_draft.customer_email)) > 0 THEN
    INSERT INTO public.order_notifications (
      order_id,
      recipient_email,
      notification_type,
      status_target,
      send_status,
      attempt_count
    )
    VALUES (
      v_order_id,
      v_draft.customer_email,
      'confirmation',
      'processing',
      'pending',
      0
    )
    RETURNING id INTO v_notif_id;
  END IF;

  INSERT INTO public.admin_activity_events (
    event_type,
    severity,
    title,
    summary,
    order_id,
    metadata
  )
  VALUES (
    CASE WHEN v_has_stock_conflict THEN 'order_stock_conflict' ELSE 'order_paid' END,
    CASE WHEN v_has_stock_conflict THEN 'error' ELSE 'success' END,
    CASE
      WHEN v_has_stock_conflict THEN format('Paid Order #%s has insufficient stock — staff review required', p_order_number)
      ELSE format('Paid Order #%s (£%s)', p_order_number, to_char(v_draft.total, 'FM999990.00'))
    END,
    CASE
      WHEN v_has_stock_conflict THEN trim(v_conflict_notes)
      ELSE format('Payment confirmed by Stripe webhook • %s', v_draft.fulfilment_type)
    END,
    v_order_id,
    jsonb_build_object(
      'order_number', p_order_number,
      'total', v_draft.total,
      'fulfilment_type', v_draft.fulfilment_type,
      'stripe_session_id', p_stripe_session_id,
      'inventory_conflict', v_has_stock_conflict
    )
  );

  UPDATE public.checkout_drafts
  SET status = 'completed',
      stripe_checkout_session_id = p_stripe_session_id,
      updated_at = NOW()
  WHERE id = p_draft_id;

  RETURN jsonb_build_object(
    'status', 'created',
    'order_id', v_order_id,
    'notification_id', v_notif_id,
    'inventory_conflict', v_has_stock_conflict
  );
END;
$$;

-- 5. Atomic, Idempotent Stripe Refund Processing
CREATE OR REPLACE FUNCTION public.process_stripe_refund_atomic(
  p_event_id TEXT,
  p_payment_intent_id TEXT,
  p_amount_refunded_pence INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed_event_id TEXT;
  v_order RECORD;
  v_refunded_gbp NUMERIC(10, 2);
BEGIN
  IF p_event_id IS NULL OR length(trim(p_event_id)) = 0 THEN
    RAISE EXCEPTION 'Invalid Stripe event_id';
  END IF;

  INSERT INTO public.stripe_webhook_events (event_id, event_type)
  VALUES (p_event_id, 'charge.refunded')
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id INTO v_claimed_event_id;

  IF v_claimed_event_id IS NULL THEN
    RETURN jsonb_build_object('status', 'deduplicated');
  END IF;

  SELECT id, order_number, total, refunded_amount INTO v_order
  FROM public.orders
  WHERE stripe_payment_intent_id = p_payment_intent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'order_not_found');
  END IF;

  v_refunded_gbp := LEAST(
    v_order.total,
    GREATEST(
      COALESCE(v_order.refunded_amount, 0.00),
      ROUND(GREATEST(0, COALESCE(p_amount_refunded_pence, 0)) / 100.0, 2)
    )
  );

  UPDATE public.orders
  SET payment_status = 'refunded',
      refunded_amount = v_refunded_gbp,
      updated_at = NOW()
  WHERE id = v_order.id;

  INSERT INTO public.admin_activity_events (
    event_type,
    severity,
    title,
    summary,
    order_id,
    metadata
  )
  VALUES (
    'order_refunded',
    'warning',
    format('Order #%s Refunded (£%s)', v_order.order_number, to_char(v_refunded_gbp, 'FM999990.00')),
    format('Stripe webhook confirmed refund total of £%s for order #%s.', to_char(v_refunded_gbp, 'FM999990.00'), v_order.order_number),
    v_order.id,
    jsonb_build_object(
      'order_number', v_order.order_number,
      'refunded_amount', v_refunded_gbp,
      'stripe_payment_intent_id', p_payment_intent_id
    )
  );

  RETURN jsonb_build_object(
    'status', 'refunded',
    'order_id', v_order.id,
    'refunded_amount', v_refunded_gbp
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_paid_order_from_draft(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, INT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_stripe_refund_atomic(TEXT, TEXT, INT) FROM PUBLIC, anon, authenticated;
