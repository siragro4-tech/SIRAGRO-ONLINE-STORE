export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          role: "customer" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          role?: "customer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          role?: "customer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          profile_id: string;
          label: string | null;
          line_1: string;
          line_2: string | null;
          city: string;
          county: string | null;
          postcode: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          label?: string | null;
          line_1: string;
          line_2?: string | null;
          city: string;
          county?: string | null;
          postcode: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          label?: string | null;
          line_1?: string;
          line_2?: string | null;
          city?: string;
          county?: string | null;
          postcode?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          unit: string | null;
          stock_quantity: number;
          is_available: boolean;
          is_age_restricted: boolean;
          minimum_age: number | null;
          barcode: string | null;
          brand: string | null;
          weight_kg: number | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          unit?: string | null;
          stock_quantity?: number;
          is_available?: boolean;
          is_age_restricted?: boolean;
          minimum_age?: number | null;
          barcode?: string | null;
          brand?: string | null;
          weight_kg?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          unit?: string | null;
          stock_quantity?: number;
          is_available?: boolean;
          is_age_restricted?: boolean;
          minimum_age?: number | null;
          barcode?: string | null;
          brand?: string | null;
          weight_kg?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          storage_path?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      baskets: {
        Row: {
          id: string;
          profile_id: string | null;
          guest_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          guest_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          guest_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      basket_items: {
        Row: {
          id: string;
          basket_id: string;
          product_id: string;
          quantity: number;
          added_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          basket_id: string;
          product_id: string;
          quantity: number;
          added_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          basket_id?: string;
          product_id?: string;
          quantity?: number;
          added_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          profile_id: string | null;
          status:
            | "pending"
            | "processing"
            | "ready_for_pickup"
            | "out_for_delivery"
            | "delivered"
            | "collected"
            | "cancelled";
          fulfilment_type: "delivery" | "collection";
          delivery_address: Json | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          subtotal: number;
          delivery_charge: number;
          total: number;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          payment_status: "unpaid" | "paid" | "refunded" | "failed";
          notes: string | null;
          estimated_delivery_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          profile_id?: string | null;
          status?:
            | "pending"
            | "processing"
            | "ready_for_pickup"
            | "out_for_delivery"
            | "delivered"
            | "collected"
            | "cancelled";
          fulfilment_type: "delivery" | "collection";
          delivery_address?: Json | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          subtotal: number;
          delivery_charge?: number;
          total: number;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          payment_status?: "unpaid" | "paid" | "refunded" | "failed";
          notes?: string | null;
          estimated_delivery_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          profile_id?: string | null;
          status?:
            | "pending"
            | "processing"
            | "ready_for_pickup"
            | "out_for_delivery"
            | "delivered"
            | "collected"
            | "cancelled";
          fulfilment_type?: "delivery" | "collection";
          delivery_address?: Json | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          subtotal?: number;
          delivery_charge?: number;
          total?: number;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          payment_status?: "unpaid" | "paid" | "refunded" | "failed";
          notes?: string | null;
          estimated_delivery_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          unit_price_snapshot: number;
          quantity: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name_snapshot: string;
          unit_price_snapshot: number;
          quantity: number;
          line_total: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name_snapshot?: string;
          unit_price_snapshot?: number;
          quantity?: number;
          line_total?: number;
        };
        Relationships: [];
      };
      delivery_settings: {
        Row: {
          id: string;
          shop_postcode: string;
          shop_address: string | null;
          free_delivery_radius_miles: number;
          free_delivery_min_subtotal: number;
          max_delivery_radius_miles: number;
          delivery_fee_tier_1: number;
          delivery_fee_tier_2: number;
          distance_method: "haversine" | "driving";
          is_delivery_enabled: boolean;
          is_collection_enabled: boolean;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_postcode?: string;
          shop_address?: string | null;
          free_delivery_radius_miles?: number;
          free_delivery_min_subtotal?: number;
          max_delivery_radius_miles?: number;
          delivery_fee_tier_1?: number;
          delivery_fee_tier_2?: number;
          distance_method?: "haversine" | "driving";
          is_delivery_enabled?: boolean;
          is_collection_enabled?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_postcode?: string;
          shop_address?: string | null;
          free_delivery_radius_miles?: number;
          free_delivery_min_subtotal?: number;
          max_delivery_radius_miles?: number;
          delivery_fee_tier_1?: number;
          delivery_fee_tier_2?: number;
          distance_method?: "haversine" | "driving";
          is_delivery_enabled?: boolean;
          is_collection_enabled?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      age_verification_log: {
        Row: {
          id: string;
          order_id: string;
          customer_declared_dob: string | null;
          method: string;
          result: string;
          verified_by: string | null;
          notes: string | null;
          verified_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          customer_declared_dob?: string | null;
          method: string;
          result: string;
          verified_by?: string | null;
          notes?: string | null;
          verified_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          customer_declared_dob?: string | null;
          method?: string;
          result?: string;
          verified_by?: string | null;
          notes?: string | null;
          verified_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

