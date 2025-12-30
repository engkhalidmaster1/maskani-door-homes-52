// نوع المستخدم كما يعيده get_users_for_admin
export type UserData = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  properties_count: number;
  properties_limit: number;
  images_limit: number;
  can_publish: boolean;
  is_verified: boolean;
  is_active: boolean;
  role_name_ar: string;
  status_indicator: string;
  account_created: string;
  last_sign_in_at: string;
};
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          notes: string | null
          reason: string | null
          target_office_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          target_office_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          target_office_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_activity_log_target_office_id_fkey"
            columns: ["target_office_id"]
            isOneToOne: false
            referencedRelation: "real_estate_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          permissions: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          permissions?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          permissions?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: number
          resource_id: string
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: number
          resource_id: string
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: number
          resource_id?: string
          resource_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      banner_settings: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string | null
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          text?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          settings: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          settings: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          settings?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          related_office_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          related_office_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          related_office_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_office_id_fkey"
            columns: ["related_office_id"]
            isOneToOne: false
            referencedRelation: "real_estate_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_contact_requests: {
        Row: {
          contact_method: string | null
          created_at: string | null
          id: string
          message: string
          office_id: string
          responded_at: string | null
          sender_email: string | null
          sender_name: string
          sender_phone: string
          status: string | null
        }
        Insert: {
          contact_method?: string | null
          created_at?: string | null
          id?: string
          message: string
          office_id: string
          responded_at?: string | null
          sender_email?: string | null
          sender_name: string
          sender_phone: string
          status?: string | null
        }
        Update: {
          contact_method?: string | null
          created_at?: string | null
          id?: string
          message?: string
          office_id?: string
          responded_at?: string | null
          sender_email?: string | null
          sender_name?: string
          sender_phone?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_contact_requests_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "real_estate_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_reviews: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          comment: string
          created_at: string | null
          id: string
          office_id: string
          rating: number
          reviewer_email: string | null
          reviewer_name: string
          reviewer_phone: string | null
          updated_at: string | null
          user_id: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          comment: string
          created_at?: string | null
          id?: string
          office_id: string
          rating: number
          reviewer_email?: string | null
          reviewer_name: string
          reviewer_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          comment?: string
          created_at?: string | null
          id?: string
          office_id?: string
          rating?: number
          reviewer_email?: string | null
          reviewer_name?: string
          reviewer_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "office_reviews_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "real_estate_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[] | null
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_published: boolean
          is_hidden?: boolean // تمت إضافته مؤقتاً يدويًا
          latitude: number | null
          listing_type: string
          location: string | null
          longitude: number | null
          market: string | null
          price: number
          property_code: string
          property_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_published?: boolean
          is_hidden?: boolean // تمت إضافته مؤقتاً يدويًا
          latitude?: number | null
          listing_type: string
          location?: string | null
          longitude?: number | null
          market?: string | null
          price: number
          property_code: string
          property_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_published?: boolean
          is_hidden?: boolean // تمت إضافته مؤقتاً يدويًا
          latitude?: number | null
          listing_type?: string
          location?: string | null
          longitude?: number | null
          market?: string | null
          price?: number
          property_code?: string
          property_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          created_at: string | null
          document_id: string
          document_name: string | null
          document_type: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          name: string
          notes: string | null
          office_id: string | null
          property_id: string
          size: number
          type: string
          updated_at: string | null
          uploaded_by: string | null
          url: string
          user_id: string
          verification_notes: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          document_name?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          name: string
          notes?: string | null
          office_id?: string | null
          property_id: string
          size: number
          type: string
          updated_at?: string | null
          uploaded_by?: string | null
          url: string
          user_id: string
          verification_notes?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          document_name?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          notes?: string | null
          office_id?: string | null
          property_id?: string
          size?: number
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
          url?: string
          user_id?: string
          verification_notes?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "real_estate_offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_offices: {
        Row: {
          address: string
          created_at: string | null
          description: string | null
          documents_pending_count: number | null
          documents_verified_count: number | null
          email: string | null
          id: string
          latitude: number | null
          license_document_url: string | null
          license_number: string
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string
          registration_certificate_url: string | null
          services: string[] | null
          social_media: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address: string
          created_at?: string | null
          description?: string | null
          documents_pending_count?: number | null
          documents_verified_count?: number | null
          email?: string | null
          id?: string
          latitude?: number | null
          license_document_url?: string | null
          license_number: string
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone: string
          registration_certificate_url?: string | null
          services?: string[] | null
          social_media?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string
          created_at?: string | null
          description?: string | null
          documents_pending_count?: number | null
          documents_verified_count?: number | null
          email?: string | null
          id?: string
          latitude?: number | null
          license_document_url?: string | null
          license_number?: string
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string
          registration_certificate_url?: string | null
          services?: string[] | null
          social_media?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_statuses: {
        Row: {
          can_publish: boolean
          created_at: string
          id: string
          images_limit: number
          is_verified: boolean
          properties_limit: number
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          can_publish?: boolean
          created_at?: string
          id?: string
          images_limit?: number
          is_verified?: boolean
          properties_limit?: number
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          can_publish?: boolean
          created_at?: string
          id?: string
          images_limit?: number
          is_verified?: boolean
          properties_limit?: number
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          properties_count: number;
          can_publish: boolean;
          is_verified: boolean;
          is_active: boolean;
          limits: Json;
          last_sign_in_at: string | null;
        };
        Insert: {
          user_id: string;
          role?: Database["public"]["Enums"]["app_role"];
          properties_count?: number;
          can_publish?: boolean;
          is_verified?: boolean;
          is_active?: boolean;
          limits?: Json;
          last_sign_in_at?: string | null;
        };
        Update: {
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          properties_count?: number;
          can_publish?: boolean;
          is_verified?: boolean;
          is_active?: boolean;
          limits?: Json;
          last_sign_in_at?: string | null;
        };
        Relationships: [];
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_broadcast_notification: {
        Args: { p_message: string; p_title: string }
        Returns: undefined
      }
      delete_user_notification: {
        Args: { p_id: string }
        Returns: boolean
      }
      generate_property_code: {
        Args: { bedrooms_count: number; created_date?: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_next_property_sequence: {
        Args: { bedrooms_count?: number; target_date?: string }
        Returns: number
      }
      get_user_status: {
        Args: { user_id_param?: string }
        Returns: {
          can_publish: boolean
          current_properties_count: number
          images_limit: number
          is_verified: boolean
          properties_limit: number
          status: Database["public"]["Enums"]["user_status"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      log_audit_entry: {
        Args: {
          p_action: string
          p_details: Json
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_personal_notification_for_user: {
        Args: { p_user_id: string; p_title: string; p_message: string; p_type?: string }
        Returns: string
      }
      get_app_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      set_app_settings: {
        Args: { p_settings: Json }
        Returns: undefined
      }
      set_maintenance_mode: {
        Args: { p_on: boolean }
        Returns: undefined
      }
      
      update_user_status: {
        Args: {
          admin_user_id?: string
          new_status: Database["public"]["Enums"]["user_status"]
          target_user_id: string
        }
        Returns: boolean
      }
      ensure_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_user_role: {
        Args: { target_user_id: string; new_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      get_users_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          role: string | null;
          properties_count: number | null;
          properties_limit: number | null;
          images_limit: number | null;
          can_publish: boolean | null;
          is_verified: boolean | null;
          is_active: boolean | null;
          role_name_ar: string | null;
          status_indicator: string | null;
          account_created: string | null;
          last_sign_in_at: string | null;
        }[]
      }
      get_users_for_admin_v2: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          role: string | null;
          properties_count: number | null;
          properties_limit: number | null;
          images_limit: number | null;
          can_publish: boolean | null;
          is_verified: boolean | null;
          is_active: boolean | null;
          role_name_ar: string | null;
          status_indicator: string | null;
          account_created: string | null;
          last_sign_in_at: string | null;
        }[]
      }
      toggle_user_ban: {
        Args: { target_user_id: string; should_ban: boolean }
        Returns: boolean
      }
      get_property_type_config: {
        Args: { p_property_type: string }
        Returns: Json
      }
      list_property_types: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_property_payload: {
        Args: { payload: Json }
        Returns: Json
      }
      get_active_home_cards: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          description: string
          icon_name: string
          path: string
          requires_auth: boolean
          bg_color: string
          icon_color: string
          display_order: number
        }[]
      }
      update_card_order: {
        Args: {
          p_card_id: string
          p_new_order: number
        }
        Returns: undefined
      }
      update_home_card: {
        Args: {
          p_card_id: string
          p_title?: string
          p_description?: string
          p_icon_name?: string
          p_path?: string
          p_requires_auth?: boolean
          p_bg_color?: string
          p_icon_color?: string
        }
        Returns: undefined
      }
      get_home_page_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          show_search_bar: boolean
          search_bar_title: string
          search_bar_subtitle: string
        }[]
      }
      update_home_page_settings: {
        Args: {
          p_show_search_bar: boolean
          p_search_bar_title: string
          p_search_bar_subtitle: string
        }
        Returns: boolean
      }
    }
    Enums: {
  app_role: "admin" | "office" | "agent" | "publisher"
      user_status: "publisher" | "trusted_owner" | "office_agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "office", "agent", "publisher"],
      user_status: ["publisher", "trusted_owner", "office_agent"],
    },
  },
} as const
