-- ==============================================================================
-- SIRAGRO ONLINE STORE — Mobile API & Atomic Order Processing Migration
-- ==============================================================================
-- Version: 006
-- Description:
--   Additive migration providing:
--   1. `public.process_paid_order_atomic(...)` RPC for transaction-safe order
--      creation, product-ID-based lookup (not product name), row-level stock
--      locking (`FOR UPDATE`), and explicit oversell conflict flagging without
--      silently clamping stock to hide oversells.
--   2. `public.merge_guest_basket_to_user(...)` RPC for atomic guest-to-user
--      basket merging upon mobile/web sign-in.
-- NOTE: Do not apply automatically; review and apply in staging first.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.process_paid_order_atomic(
  p_stripe_session_id TEXT,
  p_payment_intent_id TEXT,
  p_order_number TEXT,
  p_profile_id UUID,
  p_fulfilment_type TEXT,
  p_delivery_address JSONB,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_subtotal NUMERIC,
  p_delivery_charge NUMERIC,
  p_total NUMERIC,
  p_has_age_restricted BOOLEAN,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_current_stock INTEGER;
  v_has_stock_conflict BOOLEAN := FALSE;
  v_conflict_notes TEXT := '';
BEGIN
  -- 1. Idempotency check inside transaction
  SELECT id INTO v_existing_id
  FROM public.orders
  WHERE stripe_checkout_session_id = p_stripe_session_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'existing',
      'order_id', v_existing_id,
      'stock_conflict', FALSE
    );
  END IF;

  -- 2. Lock and validate stock by stable product_id BEFORE inserting
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::UUID;
    v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::INTEGER, 1));

    IF v_product_id IS NULL THEN
      v_has_stock_conflict := TRUE;
      v_conflict_notes := v_conflict_notes || format('Missing product_id for "%s". ', COALESCE(v_item->>'name', 'unknown'));
      CONTINUE;
    END IF;

    SELECT stock_quantity INTO v_current_stock
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_has_stock_conflict := TRUE;
      v_conflict_notes := v_conflict_notes || format('Product %s not found. ', v_product_id);
    ELSIF v_current_stock < v_qty THEN
      -- Do NOT silently clamp to 0 to hide an oversell; record conflict for staff review
      v_has_stock_conflict := TRUE;
      v_conflict_notes := v_conflict_notes || format(
        'Insufficient stock for %s (available: %s, ordered: %s). ',
        COALESCE(v_item->>'name', v_product_id::TEXT),
        v_current_stock,
        v_qty
      );
    END IF;
  END LOOP;

  -- 3. Insert order record
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
    notes
  )
  VALUES (
    p_order_number,
    p_profile_id,
    'processing',
    p_fulfilment_type,
    p_delivery_address,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_subtotal,
    p_delivery_charge,
    p_total,
    p_stripe_session_id,
    p_payment_intent_id,
    'paid',
    CASE
      WHEN v_has_stock_conflict THEN 'STOCK_CONFLICT_REQUIRES_REVIEW: ' || trim(v_conflict_notes)
      ELSE NULL
    END
  )
  RETURNING id INTO v_order_id;

  -- 4. Insert order_items snapshots and decrement stock atomically when sufficient
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::UUID;
    v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::INTEGER, 1));

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
      v_product_id,
      COALESCE(v_item->>'name', 'Grocery Item'),
      COALESCE((v_item->>'unit_price')::NUMERIC, 0),
      v_qty,
      COALESCE((v_item->>'line_total')::NUMERIC, 0)
    );

    IF v_product_id IS NOT NULL THEN
      SELECT stock_quantity INTO v_current_stock
      FROM public.products
      WHERE id = v_product_id;

      IF FOUND AND v_current_stock >= v_qty THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity - v_qty
        WHERE id = v_product_id;

        INSERT INTO public.inventory_adjustments (
          product_id,
          product_name_snapshot,
          previous_quantity,
          new_quantity,
          delta,
          reason,
          notes
        )
        VALUES (
          v_product_id,
          COALESCE(v_item->>'name', 'Grocery Item'),
          v_current_stock,
          v_current_stock - v_qty,
          -v_qty,
          'order_paid',
          format('Atomic deduction for paid order #%s', p_order_number)
        );
      END IF;
    END IF;
  END LOOP;

  -- 5. Log Challenge 25 pending physical check if age-restricted
  IF p_has_age_restricted THEN
    INSERT INTO public.age_verification_log (
      order_id,
      method,
      result,
      notes
    )
    VALUES (
      v_order_id,
      CASE
        WHEN p_fulfilment_type = 'delivery' THEN 'driver_id_check_on_delivery'
        ELSE 'counter_check_on_collection'
      END,
      'pending_physical_check',
      'Customer acknowledged 18+ requirement at checkout. Physical Challenge 25 photo ID check required.'
    );
  END IF;

  -- 6. Flag oversell conflicts in admin_activity_events for manual review (no auto-refund/substitution)
  IF v_has_stock_conflict THEN
    INSERT INTO public.admin_activity_events (
      event_type,
      severity,
      title,
      summary,
      order_id,
      metadata
    )
    VALUES (
      'order_stock_conflict',
      'error',
      format('Paid Order #%s has insufficient stock — review required', p_order_number),
      trim(v_conflict_notes),
      v_order_id,
      jsonb_build_object(
        'order_number', p_order_number,
        'stripe_session_id', p_stripe_session_id,
        'requires_manual_resolution', TRUE
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'created',
    'order_id', v_order_id,
    'stock_conflict', v_has_stock_conflict
  );
END;
$$;

-- Atomic guest-to-authenticated basket merge (server-only via service_role)
CREATE OR REPLACE FUNCTION public.merge_guest_basket_to_user(
  p_guest_token UUID,
  p_profile_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_basket_id UUID;
  v_user_basket_id UUID;
  v_item RECORD;
BEGIN
  SELECT id INTO v_guest_basket_id
  FROM public.baskets
  WHERE guest_token = p_guest_token
    AND profile_id IS NULL
  LIMIT 1;

  IF v_guest_basket_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO v_user_basket_id
  FROM public.baskets
  WHERE profile_id = p_profile_id
  LIMIT 1;

  IF v_user_basket_id IS NULL THEN
    INSERT INTO public.baskets (profile_id)
    VALUES (p_profile_id)
    RETURNING id INTO v_user_basket_id;
  END IF;

  FOR v_item IN
    SELECT product_id, quantity
    FROM public.basket_items
    WHERE basket_id = v_guest_basket_id
  LOOP
    INSERT INTO public.basket_items (basket_id, product_id, quantity)
    VALUES (v_user_basket_id, v_item.product_id, LEAST(20, GREATEST(1, v_item.quantity)))
    ON CONFLICT (basket_id, product_id)
    DO UPDATE SET quantity = LEAST(20, public.basket_items.quantity + EXCLUDED.quantity);
  END LOOP;

  DELETE FROM public.baskets WHERE id = v_guest_basket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.process_paid_order_atomic(TEXT, TEXT, TEXT, UUID, TEXT, JSONB, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.merge_guest_basket_to_user(UUID, UUID) FROM PUBLIC, anon, authenticated;
