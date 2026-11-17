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
          low_stock_threshold?: number;
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
          low_stock_threshold?: number;
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
          low_stock_threshold?: number;
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
          refunded_amount?: number;
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
          refunded_amount?: number;
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
          refunded_amount?: number;
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
      contact_messages: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string;
          subject: string;
          message: string;
          status: "new" | "read" | "replied";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email: string;
          subject: string;
          message: string;
          status?: "new" | "read" | "replied";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string;
          subject?: string;
          message?: string;
          status?: "new" | "read" | "replied";
          created_at?: string;
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
          is_delivery_pricing_confirmed?: boolean;
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
          is_delivery_pricing_confirmed?: boolean;
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
          is_delivery_pricing_confirmed?: boolean;
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
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          previous_status: string | null;
          new_status:
            | "pending"
            | "processing"
            | "ready_for_pickup"
            | "out_for_delivery"
            | "delivered"
            | "collected"
            | "cancelled";
          changed_by_profile_id: string | null;
          changed_by_email: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          previous_status?: string | null;
          new_status:
            | "pending"
            | "processing"
            | "ready_for_pickup"
            | "out_for_delivery"
            | "delivered"
            | "collected"
            | "cancelled";
          changed_by_profile_id?: string | null;
          changed_by_email: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          previous_status?: string | null;
          new_status?:
            | "pending"
            | "processing"
            | "ready_for_pickup"
            | "out_for_delivery"
            | "delivered"
            | "collected"
            | "cancelled";
          changed_by_profile_id?: string | null;
          changed_by_email?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      order_notifications: {
        Row: {
          id: string;
          order_id: string;
          recipient_email: string;
          notification_type: string;
          status_target: string;
          send_status: "pending" | "sent" | "failed" | "not_configured";
          attempt_count: number;
          last_error: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          recipient_email: string;
          notification_type?: string;
          status_target: string;
          send_status?: "pending" | "sent" | "failed" | "not_configured";
          attempt_count?: number;
          last_error?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          recipient_email?: string;
          notification_type?: string;
          status_target?: string;
          send_status?: "pending" | "sent" | "failed" | "not_configured";
          attempt_count?: number;
          last_error?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_activity_events: {
        Row: {
          id: string;
          event_type:
            | "order_placed_unpaid"
            | "order_paid"
            | "order_refunded"
            | "order_payment_failed"
            | "cart_activity"
            | "low_stock_alert"
            | "out_of_stock_alert"
            | "inventory_adjusted"
            | "order_status_updated"
            | "contact_message";
          severity: "info" | "success" | "warning" | "error";
          title: string;
          summary: string;
          order_id: string | null;
          product_id: string | null;
          metadata: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type:
            | "order_placed_unpaid"
            | "order_paid"
            | "order_refunded"
            | "order_payment_failed"
            | "cart_activity"
            | "low_stock_alert"
            | "out_of_stock_alert"
            | "inventory_adjusted"
            | "order_status_updated"
            | "contact_message";
          severity?: "info" | "success" | "warning" | "error";
          title: string;
          summary: string;
          order_id?: string | null;
          product_id?: string | null;
          metadata?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?:
            | "order_placed_unpaid"
            | "order_paid"
            | "order_refunded"
            | "order_payment_failed"
            | "cart_activity"
            | "low_stock_alert"
            | "out_of_stock_alert"
            | "inventory_adjusted"
            | "order_status_updated"
            | "contact_message";
          severity?: "info" | "success" | "warning" | "error";
          title?: string;
          summary?: string;
          order_id?: string | null;
          product_id?: string | null;
          metadata?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      cart_activity_daily: {
        Row: {
          id: string;
          activity_date: string;
          product_id: string;
          product_name_snapshot: string;
          add_count: number;
          total_units_added: number;
          last_added_at: string;
        };
        Insert: {
          id?: string;
          activity_date?: string;
          product_id: string;
          product_name_snapshot: string;
          add_count?: number;
          total_units_added?: number;
          last_added_at?: string;
        };
        Update: {
          id?: string;
          activity_date?: string;
          product_id?: string;
          product_name_snapshot?: string;
          add_count?: number;
          total_units_added?: number;
          last_added_at?: string;
        };
        Relationships: [];
      };
      inventory_adjustments: {
        Row: {
          id: string;
          product_id: string;
          previous_quantity: number;
          new_quantity: number;
          delta: number;
          reason:
            | "admin_quick_edit"
            | "admin_product_edit"
            | "admin_product_create"
            | "csv_import"
            | "order_paid";
          changed_by_profile_id: string | null;
          changed_by_email: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          previous_quantity: number;
          new_quantity: number;
          delta: number;
          reason:
            | "admin_quick_edit"
            | "admin_product_edit"
            | "admin_product_create"
            | "csv_import"
            | "order_paid";
          changed_by_profile_id?: string | null;
          changed_by_email?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          previous_quantity?: number;
          new_quantity?: number;
          delta?: number;
          reason?:
            | "admin_quick_edit"
            | "admin_product_edit"
            | "admin_product_create"
            | "csv_import"
            | "order_paid";
          changed_by_profile_id?: string | null;
          changed_by_email?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          event_id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          event_id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          processed_at?: string;
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
      get_sales_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_paid_revenue: number;
          total_paid_orders: number;
          average_order_value: number;
          today_paid_revenue: number;
          today_paid_orders: number;
          month_paid_revenue: number;
          month_paid_orders: number;
        };
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

