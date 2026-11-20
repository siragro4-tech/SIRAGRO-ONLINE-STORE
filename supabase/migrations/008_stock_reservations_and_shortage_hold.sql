-- ==============================================================================
-- SIRAGRO ONLINE STORE — Atomic Stock Reservations & Post-Payment Shortage Hold
-- ==============================================================================
-- Version: 008
-- Description:
--   Forward migration (leaves 001-007 untouched).
--   1. Creates `stock_reservations` with expiry (`expires_at`) and UNIQUE(draft_id, product_id)
--      to prevent concurrent online overselling while checkout is in progress.
--   2. Adds `'needs_customer_confirmation'` to `orders.status` and
--      `order_status_history.new_status` CHECK constraints, plus `orders.shortage_details`.
--   3. Creates `reserve_checkout_draft_stock(p_draft_id, p_ttl_minutes)` and
--      `release_checkout_draft_reservations(p_draft_id, p_reason)`.
--   4. Updates `process_paid_order_from_draft(...)` so unexpected post-payment
--      shortages preserve `payment_status = 'paid'`, hold `status = 'needs_customer_confirmation'`,
--      make zero partial stock decrements, never clamp stock to 0, and alert staff.
-- NOTE: Do not apply automatically; review and apply in staging first.
-- ==============================================================================

-- 1. Stock Reservations Table (Server / service_role only)
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id UUID NOT NULL REFERENCES public.checkout_drafts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0 AND quantity <= 20),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'released', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (draft_id, product_id)
);

CREATE INDEX IF NOT EXISTS stock_reservations_product_active_idx
  ON public.stock_reservations(product_id, status, expires_at);

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stock_reservations FROM PUBLIC, anon, authenticated;

-- 2. Shortage Details & 'needs_customer_confirmation' Fulfilment Hold Status
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shortage_details JSONB;

DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
      AND pg_get_constraintdef(oid) NOT ILIKE '%payment_status%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS %I',
      constraint_rec.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (
    status IN (
      'pending',
      'needs_customer_confirmation',
      'processing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'collected',
      'cancelled'
    )
  );

DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.order_status_history'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%new_status%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.order_status_history DROP CONSTRAINT IF EXISTS %I',
      constraint_rec.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.order_status_history
  ADD CONSTRAINT order_status_history_new_status_check
  CHECK (
    new_status IN (
      'pending',
      'needs_customer_confirmation',
      'processing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'collected',
      'cancelled'
    )
  );

-- 3. Atomic Stock Reservation RPC (Deterministic Product-ID Locking)
CREATE OR REPLACE FUNCTION public.reserve_checkout_draft_stock(
  p_draft_id UUID,
  p_ttl_minutes INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
  v_reserved_others INT;
  v_available INT;
  v_shortages JSONB := '[]'::jsonb;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_expires_at := NOW() + make_interval(mins => GREATEST(1, LEAST(60, COALESCE(p_ttl_minutes, 15))));

  -- Expire stale reservations before checking availability
  UPDATE public.stock_reservations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at <= NOW();

  -- Lock products in deterministic product_id ASC order
  FOR v_item IN
    SELECT *
    FROM public.checkout_draft_items
    WHERE draft_id = p_draft_id
    ORDER BY product_id ASC
  LOOP
    SELECT id, name, stock_quantity, is_available INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_product.is_available THEN
      v_available := 0;
    ELSE
      SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_others
      FROM public.stock_reservations
      WHERE product_id = v_item.product_id
        AND status = 'active'
        AND expires_at > NOW()
        AND draft_id <> p_draft_id;

      v_available := GREATEST(0, v_product.stock_quantity - v_reserved_others);
    END IF;

    IF v_available < v_item.quantity THEN
      v_shortages := v_shortages || jsonb_build_object(
        'productId', v_item.product_id,
        'productName', v_item.product_name_snapshot,
        'requestedQuantity', v_item.quantity,
        'availableQuantity', v_available,
        'unitPrice', v_item.unit_price_snapshot
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(v_shortages) > 0 THEN
    UPDATE public.checkout_drafts
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_draft_id AND status = 'pending';

    RETURN jsonb_build_object(
      'ok', FALSE,
      'shortages', v_shortages
    );
  END IF;

  -- All items sufficient: upsert active reservations
  FOR v_item IN
    SELECT *
    FROM public.checkout_draft_items
    WHERE draft_id = p_draft_id
    ORDER BY product_id ASC
  LOOP
    INSERT INTO public.stock_reservations (
      draft_id,
      product_id,
      quantity,
      status,
      expires_at
    )
    VALUES (
      p_draft_id,
      v_item.product_id,
      v_item.quantity,
      'active',
      v_expires_at
    )
    ON CONFLICT (draft_id, product_id)
    DO UPDATE SET
      quantity = EXCLUDED.quantity,
      status = 'active',
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW();
  END LOOP;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'expires_at', v_expires_at
  );
END;
$$;

-- 4. Idempotent Reservation Release RPC
CREATE OR REPLACE FUNCTION public.release_checkout_draft_reservations(
  p_draft_id UUID,
  p_reason TEXT DEFAULT 'released'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_res_status TEXT;
  v_target_draft_status TEXT;
BEGIN
  v_target_res_status := CASE WHEN p_reason = 'expired' THEN 'expired' ELSE 'released' END;
  v_target_draft_status := CASE WHEN p_reason = 'expired' THEN 'expired' ELSE 'cancelled' END;

  UPDATE public.stock_reservations
  SET status = v_target_res_status, updated_at = NOW()
  WHERE draft_id = p_draft_id AND status = 'active';

  UPDATE public.checkout_drafts
  SET status = v_target_draft_status, updated_at = NOW()
  WHERE id = p_draft_id AND status = 'pending';
END;
$$;

-- 5. Updated Atomic Paid-Order Processor (Holds at 'needs_customer_confirmation' on Shortage)
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
  v_reserved_others INT;
  v_available INT;
  v_has_stock_conflict BOOLEAN := FALSE;
  v_shortages JSONB := '[]'::jsonb;
  v_conflict_notes TEXT := '';
  v_notif_id UUID;
  v_order_status TEXT;
BEGIN
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

  -- Step A: Transactionally claim Stripe event_id
  INSERT INTO public.stripe_webhook_events (event_id, event_type)
  VALUES (p_event_id, COALESCE(p_event_type, 'checkout.session.completed'))
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id INTO v_claimed_event_id;

  IF v_claimed_event_id IS NULL THEN
    RETURN jsonb_build_object('status', 'deduplicated');
  END IF;

  -- Step B: Prevent duplicate order for the same Checkout Session
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

  -- Step C: Lock draft & verify expected GBP pence total
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

  -- Expire stale reservations by other checkouts
  UPDATE public.stock_reservations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at <= NOW() AND draft_id <> p_draft_id;

  -- Step D: Lock all products in deterministic product_id ASC order and verify ALL stock
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

    IF NOT FOUND OR NOT v_product.is_available THEN
      v_available := 0;
    ELSE
      SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_others
      FROM public.stock_reservations
      WHERE product_id = v_item.product_id
        AND status = 'active'
        AND expires_at > NOW()
        AND draft_id <> p_draft_id;

      v_available := GREATEST(0, v_product.stock_quantity - v_reserved_others);
    END IF;

    IF v_available < v_item.quantity THEN
      v_has_stock_conflict := TRUE;
      v_shortages := v_shortages || jsonb_build_object(
        'productId', v_item.product_id,
        'productName', v_item.product_name_snapshot,
        'requestedQuantity', v_item.quantity,
        'availableQuantity', v_available
      );
      v_conflict_notes := v_conflict_notes || format(
        '"%s" (requested %s, available %s). ',
        v_item.product_name_snapshot,
        v_item.quantity,
        v_available
      );
    END IF;
  END LOOP;

  -- Preserve payment_status = 'paid'; put fulfilment on hold if shortage occurred
  v_order_status := CASE
    WHEN v_has_stock_conflict THEN 'needs_customer_confirmation'
    ELSE 'processing'
  END;

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
    shortage_details,
    notes
  )
  VALUES (
    p_order_number,
    v_draft.profile_id,
    v_order_status,
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
    CASE WHEN v_has_stock_conflict THEN v_shortages ELSE NULL END,
    CASE
      WHEN v_has_stock_conflict THEN 'NEEDS_CUSTOMER_CONFIRMATION: ' || trim(v_conflict_notes)
      ELSE NULL
    END
  )
  RETURNING id INTO v_order_id;

  -- Step E: Insert immutable order_items snapshots; decrement stock ONLY if zero shortages
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

  -- Convert or release this draft's stock reservations
  UPDATE public.stock_reservations
  SET status = CASE WHEN v_has_stock_conflict THEN 'released' ELSE 'converted' END,
      updated_at = NOW()
  WHERE draft_id = p_draft_id AND status = 'active';

  -- Step F: Challenge 25 pending physical check log
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

  -- Step G: Queue durable notification & admin activity event
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
      v_order_status,
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
      WHEN v_has_stock_conflict THEN format('Paid Order #%s On Hold — Needs Customer Confirmation', p_order_number)
      ELSE format('Paid Order #%s (£%s)', p_order_number, to_char(v_draft.total, 'FM999990.00'))
    END,
    CASE
      WHEN v_has_stock_conflict THEN 'Payment succeeded, but stock is insufficient for: ' || trim(v_conflict_notes) || 'Do not approve, pick, or dispatch until customer confirms.'
      ELSE format('Payment confirmed by Stripe webhook • %s', v_draft.fulfilment_type)
    END,
    v_order_id,
    jsonb_build_object(
      'order_number', p_order_number,
      'total', v_draft.total,
      'fulfilment_type', v_draft.fulfilment_type,
      'stripe_session_id', p_stripe_session_id,
      'inventory_conflict', v_has_stock_conflict,
      'shortages', v_shortages
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
    'order_status', v_order_status,
    'notification_id', v_notif_id,
    'inventory_conflict', v_has_stock_conflict,
    'shortages', v_shortages
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_checkout_draft_stock(UUID, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_checkout_draft_reservations(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_paid_order_from_draft(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, INT, TEXT) FROM PUBLIC, anon, authenticated;
