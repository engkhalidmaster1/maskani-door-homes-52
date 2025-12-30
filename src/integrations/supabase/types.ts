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
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
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
      backup_logs: {
        Row: {
          backup_type: string | null
          created_at: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          status: string | null
        }
        Insert: {
          backup_type?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          status?: string | null
        }
        Update: {
          backup_type?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          status?: string | null
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
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      home_cards: {
        Row: {
          bg_color: string | null
          created_at: string | null
          description: string
          display_order: number
          icon_color: string | null
          icon_name: string
          id: string
          is_active: boolean | null
          path: string
          requires_auth: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string | null
          created_at?: string | null
          description: string
          display_order?: number
          icon_color?: string | null
          icon_name: string
          id?: string
          is_active?: boolean | null
          path: string
          requires_auth?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string | null
          created_at?: string | null
          description?: string
          display_order?: number
          icon_color?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          path?: string
          requires_auth?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      home_page_settings: {
        Row: {
          id: string
          search_bar_subtitle: string | null
          search_bar_title: string | null
          show_search_bar: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          search_bar_subtitle?: string | null
          search_bar_title?: string | null
          show_search_bar?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          search_bar_subtitle?: string | null
          search_bar_title?: string | null
          show_search_bar?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
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
            foreignKeyName: "office_reviews_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_reviews_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "real_estate_offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
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
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[] | null
          apartment: string | null
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          building: string | null
          created_at: string
          deal_status: string | null
          description: string | null
          floor: string | null
          furnished: string | null
          governorate: string | null
          id: string
          images: string[] | null
          is_hidden: boolean
          is_published: boolean
          latitude: number | null
          listing_type: string
          location: string | null
          longitude: number | null
          market: string | null
          price: number
          property_code: string
          property_type: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          apartment?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          created_at?: string
          deal_status?: string | null
          description?: string | null
          floor?: string | null
          furnished?: string | null
          governorate?: string | null
          id?: string
          images?: string[] | null
          is_hidden?: boolean
          is_published?: boolean
          latitude?: number | null
          listing_type: string
          location?: string | null
          longitude?: number | null
          market?: string | null
          price: number
          property_code: string
          property_type: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          apartment?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          created_at?: string
          deal_status?: string | null
          description?: string | null
          floor?: string | null
          furnished?: string | null
          governorate?: string | null
          id?: string
          images?: string[] | null
          is_hidden?: boolean
          is_published?: boolean
          latitude?: number | null
          listing_type?: string
          location?: string | null
          longitude?: number | null
          market?: string | null
          price?: number
          property_code?: string
          property_type?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "property_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
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
        Relationships: [
          {
            foreignKeyName: "real_estate_offices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "real_estate_offices_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          action_required: string | null
          alert_type: string | null
          created_at: string | null
          description: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_required?: string | null
          alert_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_required?: string | null
          alert_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          active_connections: number | null
          avg_response_time: number | null
          cpu_usage: number | null
          created_at: string | null
          disk_usage: number | null
          failed_requests: number | null
          id: string
          memory_usage: number | null
          timestamp: string | null
          total_requests: number | null
          uptime_hours: number | null
        }
        Insert: {
          active_connections?: number | null
          avg_response_time?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          disk_usage?: number | null
          failed_requests?: number | null
          id?: string
          memory_usage?: number | null
          timestamp?: string | null
          total_requests?: number | null
          uptime_hours?: number | null
        }
        Update: {
          active_connections?: number | null
          avg_response_time?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          disk_usage?: number | null
          failed_requests?: number | null
          id?: string
          memory_usage?: number | null
          timestamp?: string | null
          total_requests?: number | null
          uptime_hours?: number | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_publish: boolean
          created_at: string
          id: string
          images_count: number
          is_active: boolean
          is_verified: boolean
          limits: Json
          properties_count: number
          role: Database["public"]["Enums"]["user_role_type"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          can_publish?: boolean
          created_at?: string
          id?: string
          images_count?: number
          is_active?: boolean
          is_verified?: boolean
          limits?: Json
          properties_count?: number
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          can_publish?: boolean
          created_at?: string
          id?: string
          images_count?: number
          is_active?: boolean
          is_verified?: boolean
          limits?: Json
          properties_count?: number
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_statuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_statuses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      users_with_permissions: {
        Row: {
          account_created: string | null
          address: string | null
          can_publish: boolean | null
          email: string | null
          email_confirmed_at: string | null
          featured_limit: number | null
          full_name: string | null
          id: string | null
          images_count: number | null
          images_limit: number | null
          is_active: boolean | null
          is_verified: boolean | null
          last_sign_in_at: string | null
          limits: Json | null
          permissions_created: string | null
          permissions_updated: string | null
          phone: string | null
          properties_count: number | null
          properties_limit: number | null
          role: Database["public"]["Enums"]["user_role_type"] | null
          role_name_ar: string | null
          status_indicator: string | null
          storage_mb: number | null
          verified_at: string | null
          verified_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_broadcast_notification: {
        Args: { p_message: string; p_title: string }
        Returns: undefined
      }
      can_add_property: { Args: { uid?: string }; Returns: boolean }
      create_system_alert: {
        Args: {
          p_action_required?: string
          p_alert_type: string
          p_description: string
          p_title: string
        }
        Returns: string
      }
      delete_user_notification: { Args: { p_id: string }; Returns: boolean }
      ensure_super_admin: { Args: never; Returns: boolean }
      generate_property_code: {
        Args: { bedrooms_count: number; created_date?: string }
        Returns: string
      }
      get_active_alerts: {
        Args: never
        Returns: {
          action_required: string
          alert_type: string
          created_at: string
          description: string
          id: string
          resolved: boolean
          title: string
        }[]
      }
      get_active_home_cards: {
        Args: never
        Returns: {
          bg_color: string
          description: string
          display_order: number
          icon_color: string
          icon_name: string
          id: string
          path: string
          requires_auth: boolean
          title: string
        }[]
      }
      get_alerts_stats: { Args: never; Returns: Json }
      get_app_settings: { Args: never; Returns: Json }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_home_page_settings: {
        Args: never
        Returns: {
          id: string
          search_bar_subtitle: string
          search_bar_title: string
          show_search_bar: boolean
        }[]
      }
      get_next_property_sequence: {
        Args: { bedrooms_count?: number; target_date?: string }
        Returns: number
      }
      get_system_metrics: { Args: never; Returns: Json }
      get_user_limits: {
        Args: { uid?: string }
        Returns: {
          can_publish: boolean
          current_images: number
          current_properties: number
          featured_limit: number
          images_limit: number
          is_active: boolean
          is_verified: boolean
          properties_limit: number
          role: Database["public"]["Enums"]["user_role_type"]
          storage_mb: number
        }[]
      }
      get_user_role: {
        Args: { uid?: string }
        Returns: Database["public"]["Enums"]["user_role_type"]
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
      get_users_for_admin: {
        Args: never
        Returns: {
          account_created: string
          can_publish: boolean
          email: string
          full_name: string
          id: string
          images_limit: number
          is_active: boolean
          is_verified: boolean
          last_sign_in_at: string
          phone: string
          properties_count: number
          properties_limit: number
          role: Database["public"]["Enums"]["user_role_type"]
          role_name_ar: string
          status_indicator: string
        }[]
      }
      get_users_for_admin_v2: {
        Args: never
        Returns: {
          account_created: string
          can_publish: boolean
          email: string
          full_name: string
          id: string
          images_limit: number
          is_active: boolean
          is_verified: boolean
          last_sign_in_at: string
          phone: string
          properties_count: number
          properties_limit: number
          role: Database["public"]["Enums"]["user_role_type"]
          role_name_ar: string
          status_indicator: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { uid?: string }; Returns: boolean }
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
      mark_all_notifications_read: { Args: never; Returns: undefined }
      property_validation_core: {
        Args: { p_new: Json; p_old?: Json }
        Returns: string[]
      }
      resolve_alert: {
        Args: { alert_id: string; user_id: string }
        Returns: boolean
      }
      set_app_settings: { Args: { p_settings: Json }; Returns: undefined }
      set_maintenance_mode: { Args: { p_on: boolean }; Returns: undefined }
      set_user_role:
        | {
            Args: {
              admin_user_id?: string
              new_role: string
              target_user_id: string
            }
            Returns: boolean
          }
        | { Args: { new_role: string; user_id: string }; Returns: undefined }
      toggle_user_ban: {
        Args: { admin_id?: string; should_ban: boolean; target_user_id: string }
        Returns: boolean
      }
      update_card_order: {
        Args: { p_card_id: string; p_new_order: number }
        Returns: boolean
      }
      update_home_card: {
        Args: {
          p_bg_color: string
          p_card_id: string
          p_description: string
          p_icon_color: string
          p_icon_name: string
          p_path: string
          p_requires_auth: boolean
          p_title: string
        }
        Returns: boolean
      }
      update_home_page_settings: {
        Args: {
          p_search_bar_subtitle: string
          p_search_bar_title: string
          p_show_search_bar: boolean
        }
        Returns: boolean
      }
      update_system_metrics: {
        Args: {
          p_active_connections?: number
          p_avg_response_time?: number
          p_cpu_usage?: number
          p_disk_usage?: number
          p_failed_requests?: number
          p_memory_usage?: number
          p_total_requests?: number
        }
        Returns: string
      }
      update_user_role: {
        Args: {
          admin_id?: string
          new_role: Database["public"]["Enums"]["user_role_type"]
          target_user_id: string
        }
        Returns: boolean
      }
      update_user_status: {
        Args: {
          admin_user_id?: string
          new_status: Database["public"]["Enums"]["user_status"]
          target_user_id: string
        }
        Returns: boolean
      }
      validate_property_payload: { Args: { p_payload: Json }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      user_role_type: "admin" | "office" | "agent" | "publisher"
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
    : never = never,
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
      user_role_type: ["admin", "office", "agent", "publisher"],
      user_status: ["publisher", "trusted_owner", "office_agent"],
    },
  },
} as const
