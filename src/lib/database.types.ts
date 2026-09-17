/**
 * Supabase database types for TableCraft.
 * Hand-written to match supabase/migrations/0001_initial_schema.sql
 * (source: 05-Backend-Schema.md).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      site_settings: {
        Row: {
          id: string;
          name: string;
          tagline: string | null;
          logo_url: string | null;
          description: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          timezone: string;
          currency: string;
          social_links: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
      };
      admins: {
        Row: {
          id: string;
          full_name: string | null;
          role: "owner" | "staff";
        };
        Insert: Partial<Database["public"]["Tables"]["admins"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["admins"]["Row"]>;
      };
      customer_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["customer_profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["customer_profiles"]["Row"]>;
      };
      menu_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          display_order: number;
          is_active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["menu_categories"]["Row"]>;
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          dietary_tags: string[];
          is_featured: boolean;
          is_available: boolean;
          display_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
      };
      gallery_images: {
        Row: {
          id: string;
          image_url: string;
          alt_text: string;
          caption: string | null;
          display_order: number;
          is_active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["gallery_images"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["gallery_images"]["Row"]>;
      };
      restaurant_tables: {
        Row: {
          id: string;
          table_number: string;
          section: string;
          capacity_min: number;
          capacity_max: number;
          is_active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["restaurant_tables"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["restaurant_tables"]["Row"]>;
      };
      business_hours: {
        Row: {
          id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["business_hours"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["business_hours"]["Row"]>;
      };
      holiday_closures: {
        Row: {
          id: string;
          closure_date: string;
          reason: string | null;
          is_full_day: boolean;
          closed_from: string | null;
          closed_to: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["holiday_closures"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["holiday_closures"]["Row"]>;
      };
      reservations: {
        Row: {
          id: string;
          table_id: string;
          user_id: string | null;
          guest_name: string;
          guest_email: string;
          guest_phone: string;
          party_size: number;
          start_time: string;
          end_time: string;
          status: "confirmed" | "arrived" | "seated" | "cancelled" | "completed" | "no_show";
          confirmation_code: string;
          special_requests: string | null;
          created_at: string;
          updated_at: string;
          cancelled_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["reservations"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["reservations"]["Row"]>;
      };
      blog_posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          cover_image_url: string | null;
          post_type: "blog" | "event" | "special";
          event_date: string | null;
          is_published: boolean;
          published_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["blog_posts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Row"]>;
      };
      testimonials: {
        Row: {
          id: string;
          customer_name: string;
          customer_photo_url: string | null;
          rating: number;
          quote: string;
          is_approved: boolean;
          is_featured: boolean;
          display_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["testimonials"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Row"]>;
      };
      reservation_settings: {
        Row: {
          id: string;
          slot_duration_minutes: number;
          booking_window_days: number;
          min_notice_hours: number;
          max_party_size: number;
        };
        Insert: Partial<Database["public"]["Tables"]["reservation_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["reservation_settings"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_admin_profile: {
        Args: Record<string, never>;
        Returns: {
          full_name: string | null;
          role: string | null;
        };
      };
      book_reservation: {
        Args: {
          p_guest_name: string;
          p_guest_email: string;
          p_guest_phone: string;
          p_party_size: number;
          p_start_time: string;
          p_special_requests?: string;
          p_section?: string;
        };
        Returns: Json;
      };
      cancel_reservation: {
        Args: {
          p_confirmation_code: string;
          p_guest_email?: string;
        };
        Returns: Json;
      };
      create_manual_reservation: {
        Args: {
          p_table_id: string;
          p_guest_name: string;
          p_guest_email: string;
          p_guest_phone: string;
          p_party_size: number;
          p_start_time: string;
          p_end_time: string;
          p_special_requests?: string;
        };
        Returns: Json;
      };
      get_reservation_config: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_available_times: {
        Args: {
          p_date: string;
          p_party_size: number;
          p_section?: string;
        };
        Returns: Json;
      };
      get_month_availability: {
        Args: {
          p_month_start: string;
          p_party_size: number;
          p_section?: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
