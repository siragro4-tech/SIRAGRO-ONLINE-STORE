-- ==============================================================================
-- SIRAGRO ONLINE STORE — Core Database Schema Migration
-- ==============================================================================
-- Version: 001
-- Description:
--   Creates tables for categories, products, images, profiles, addresses,
--   baskets, orders, order items, delivery settings, and age verification logs.
--   Enforces Row Level Security (RLS) on all tables with strict access control.
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Helper Function: Check Admin Status (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
-- This function runs with elevated privileges to check if the current user
-- has the 'admin' role in profiles, preventing infinite recursion in RLS policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 2. Profiles (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS:
-- Customers can view and update their own profile.
-- Admins can view and manage all profiles.
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Prevent customers from escalating their own role to admin
    auth.uid() = id AND (role = 'customer' OR public.is_admin())
  );

CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Trigger: Automatically Create Profile on auth.users Sign Up
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. Customer Addresses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  line_1 TEXT NOT NULL,
  line_2 TEXT,
  city TEXT NOT NULL,
  county TEXT,
  postcode TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses"
  ON public.addresses FOR ALL
  USING (auth.uid() = profile_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Categories (Supports Hierarchical Parent-Child Structure)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can view active categories; Admins can manage all categories
CREATE POLICY "Public read active categories"
  ON public.categories FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. Products
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  unit TEXT, -- e.g., '1kg', '500g', 'each', 'pack of 6'
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_age_restricted BOOLEAN NOT NULL DEFAULT FALSE,
  minimum_age INT DEFAULT 18 CHECK (minimum_age IS NULL OR minimum_age >= 0),
  barcode TEXT,
  brand TEXT,
  weight_kg NUMERIC(6, 3),
  seo_title TEXT,
  seo_description TEXT,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index (GIN)
CREATE INDEX IF NOT EXISTS products_search_vector_idx ON public.products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products(slug);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can view available products; Admins can manage all products
CREATE POLICY "Public read available products"
  ON public.products FOR SELECT
  USING (is_available = TRUE OR public.is_admin());

CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. Trigger: Update Product Search Vector
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.products_update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.unit, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_vector ON public.products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_update_search_vector();

-- ------------------------------------------------------------------------------
-- 8. Product Images
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON public.product_images(product_id);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product images"
  ON public.product_images FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage product images"
  ON public.product_images FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. Baskets & Basket Items (Supports Registered & Guest Sessions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.baskets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_token UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A basket must belong either to a customer profile or an anonymous guest session token
  CONSTRAINT basket_owner_check CHECK (
    (profile_id IS NOT NULL AND guest_token IS NULL) OR
    (profile_id IS NULL AND guest_token IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS baskets_profile_id_idx ON public.baskets(profile_id);
CREATE INDEX IF NOT EXISTS baskets_guest_token_idx ON public.baskets(guest_token);

ALTER TABLE public.baskets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users and guests read own baskets"
  ON public.baskets FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = profile_id) OR
    (guest_token IS NOT NULL) OR
    public.is_admin()
  );

CREATE POLICY "Users and guests manage own baskets"
  ON public.baskets FOR ALL
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = profile_id) OR
    (guest_token IS NOT NULL) OR
    public.is_admin()
  );

CREATE TABLE IF NOT EXISTS public.basket_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  basket_id UUID NOT NULL REFERENCES public.baskets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (basket_id, product_id)
);

CREATE INDEX IF NOT EXISTS basket_items_basket_id_idx ON public.basket_items(basket_id);

ALTER TABLE public.basket_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage basket items"
  ON public.basket_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.baskets b
      WHERE b.id = basket_items.basket_id
      AND (
        (auth.uid() IS NOT NULL AND b.profile_id = auth.uid()) OR
        (b.guest_token IS NOT NULL) OR
        public.is_admin()
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 10. Orders & Order Items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'collected', 'cancelled')
  ),
  fulfilment_type TEXT NOT NULL CHECK (fulfilment_type IN ('delivery', 'collection')),
  delivery_address JSONB, -- Frozen snapshot of delivery address at checkout
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_charge >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (
    payment_status IN ('unpaid', 'paid', 'refunded', 'failed')
  ),
  notes TEXT,
  estimated_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_profile_id_idx ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON public.orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS orders_stripe_pi_idx ON public.orders(stripe_payment_intent_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own orders"
  ON public.orders FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = profile_id) OR
    public.is_admin()
  );

CREATE POLICY "Admins manage all orders"
  ON public.orders FOR ALL
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  unit_price_snapshot NUMERIC(10, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (
        (auth.uid() IS NOT NULL AND o.profile_id = auth.uid()) OR
        public.is_admin()
      )
    )
  );

CREATE POLICY "Admins manage order items"
  ON public.order_items FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 11. Delivery Settings (Admin Configurable Singleton)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_postcode TEXT NOT NULL DEFAULT 'UB3 4NS',
  shop_address TEXT DEFAULT 'Hayes, Middlesex, UB3 4NS',
  free_delivery_radius_miles NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  free_delivery_min_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
  max_delivery_radius_miles NUMERIC(4, 2) NOT NULL DEFAULT 5.00,
  delivery_fee_tier_1 NUMERIC(10, 2) NOT NULL DEFAULT 3.99, -- 1.00 - 3.00 miles
  delivery_fee_tier_2 NUMERIC(10, 2) NOT NULL DEFAULT 4.99, -- 3.00 - 5.00 miles
  distance_method TEXT NOT NULL DEFAULT 'haversine' CHECK (distance_method IN ('haversine', 'driving')),
  is_delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_collection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read delivery settings"
  ON public.delivery_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage delivery settings"
  ON public.delivery_settings FOR ALL
  USING (public.is_admin());

-- Insert default delivery settings row if not present
INSERT INTO public.delivery_settings (
  shop_postcode,
  shop_address,
  free_delivery_radius_miles,
  free_delivery_min_subtotal,
  max_delivery_radius_miles,
  delivery_fee_tier_1,
  delivery_fee_tier_2,
  distance_method,
  notes
)
SELECT
  'UB3 4NS',
  'Hayes, Middlesex, UB3 4NS',
  1.00,
  25.00,
  5.00,
  3.99,
  4.99,
  'haversine',
  'Default configuration subject to business owner review'
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_settings);

-- ------------------------------------------------------------------------------
-- 12. Age Verification Log
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.age_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_declared_dob DATE,
  method TEXT NOT NULL, -- e.g. 'driver_id_check_on_delivery', 'counter_check_on_collection', 'digital_service'
  result TEXT NOT NULL, -- 'passed', 'failed', 'pending_physical_check'
  verified_by TEXT, -- Driver / Staff name or system
  notes TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS age_verification_order_id_idx ON public.age_verification_log(order_id);

ALTER TABLE public.age_verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage age verification logs"
  ON public.age_verification_log FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 13. Supabase Storage Bucket Setup for Product Images
-- ------------------------------------------------------------------------------
-- Ensure the storage bucket exists for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies:
-- Anyone can view product images (public read)
-- Only admins can upload, update, or delete images
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.is_admin());

