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
      role_limits_by_name: {
        Row: {
          role_name: string
          max_properties: number
          max_images: number
          max_featured: number
          storage_mb: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          role_name: string
          max_properties?: number
          max_images?: number
          max_featured?: number
          storage_mb?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          role_name?: string
          max_properties?: number
          max_images?: number
          max_featured?: number
          storage_mb?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          user_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          user_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      log_audit_entry: {
        Args: {
          p_action: string
          p_resource_type: string
          p_resource_id: string
          p_details: Json
          p_user_id: string
        }
        Returns: void
      }
      admin_broadcast_notification: {
        Args: { p_title: string; p_message: string }
        Returns: void
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      admin_verify_user: {
        Args: { p_user_id: string; p_verified: boolean }
        Returns: void
      }
      admin_set_role_limit: {
        Args: {
          p_role_name: string
          p_max_properties: number
          p_max_images: number
          p_max_featured: number
          p_storage_mb: number
        }
        Returns: void
      }
      admin_set_user_role: {
        Args: { p_user_id: string; p_role: string }
        Returns: void
      }
      update_user_status: {
        Args: {
          admin_user_id?: string
          new_status: Database["public"]["Enums"]["user_status"]
          target_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
      user_status: ["publisher", "trusted_owner", "office_agent"],
    },
  },
} as const
