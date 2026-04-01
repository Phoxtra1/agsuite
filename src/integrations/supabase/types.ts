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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acs_events: {
        Row: {
          created_at: string
          id: string
          payload: Json
          source: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          source: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          source?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      acs_intelligence_outputs: {
        Row: {
          category: string
          confidence: number | null
          created_at: string
          id: string
          intelligence: Json
          source_pipeline: string | null
          source_platforms: string[] | null
          summary: string | null
          title: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          category: string
          confidence?: number | null
          created_at?: string
          id?: string
          intelligence?: Json
          source_pipeline?: string | null
          source_platforms?: string[] | null
          summary?: string | null
          title: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          category?: string
          confidence?: number | null
          created_at?: string
          id?: string
          intelligence?: Json
          source_pipeline?: string | null
          source_platforms?: string[] | null
          summary?: string | null
          title?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      acs_processing_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_count: number | null
          metadata: Json | null
          output_count: number | null
          pipeline: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_count?: number | null
          metadata?: Json | null
          output_count?: number | null
          pipeline: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_count?: number | null
          metadata?: Json | null
          output_count?: number | null
          pipeline?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      acs_raw_data: {
        Row: {
          batch_id: string | null
          created_at: string
          dataset_type: string
          id: string
          ingested_at: string
          metadata: Json | null
          platform: string
          raw_payload: Json
          source_ref: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          dataset_type: string
          id?: string
          ingested_at?: string
          metadata?: Json | null
          platform: string
          raw_payload?: Json
          source_ref?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          dataset_type?: string
          id?: string
          ingested_at?: string
          metadata?: Json | null
          platform?: string
          raw_payload?: Json
          source_ref?: string | null
        }
        Relationships: []
      }
      acs_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          records_synced: number | null
          source: string
          started_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          source: string
          started_at?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          source?: string
          started_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      acs_transformation_audit: {
        Row: {
          changes_summary: string | null
          created_at: string
          id: string
          input_snapshot: Json | null
          output_snapshot: Json | null
          processing_log_id: string | null
          raw_data_id: string | null
          transform_type: string
        }
        Insert: {
          changes_summary?: string | null
          created_at?: string
          id?: string
          input_snapshot?: Json | null
          output_snapshot?: Json | null
          processing_log_id?: string | null
          raw_data_id?: string | null
          transform_type: string
        }
        Update: {
          changes_summary?: string | null
          created_at?: string
          id?: string
          input_snapshot?: Json | null
          output_snapshot?: Json | null
          processing_log_id?: string | null
          raw_data_id?: string | null
          transform_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "acs_transformation_audit_processing_log_id_fkey"
            columns: ["processing_log_id"]
            isOneToOne: false
            referencedRelation: "acs_processing_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acs_transformation_audit_raw_data_id_fkey"
            columns: ["raw_data_id"]
            isOneToOne: false
            referencedRelation: "acs_raw_data"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used_at?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          audience: number
          audience_group: string | null
          clicked: number
          content: string | null
          created_at: string
          delivered: number
          id: string
          name: string
          opened: number
          scheduled_at: string | null
          sent: number
          status: string
          subject: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: number
          audience_group?: string | null
          clicked?: number
          content?: string | null
          created_at?: string
          delivered?: number
          id?: string
          name: string
          opened?: number
          scheduled_at?: string | null
          sent?: number
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: number
          audience_group?: string | null
          clicked?: number
          content?: string | null
          created_at?: string
          delivered?: number
          id?: string
          name?: string
          opened?: number
          scheduled_at?: string | null
          sent?: number
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coms_logs: {
        Row: {
          brevo_message_id: string | null
          channel: string
          created_at: string
          delivery_status: string
          details: string | null
          event: string
          id: string
          message_type: string | null
          recipient: string
          source_app: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          brevo_message_id?: string | null
          channel: string
          created_at?: string
          delivery_status?: string
          details?: string | null
          event: string
          id?: string
          message_type?: string | null
          recipient: string
          source_app?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          brevo_message_id?: string | null
          channel?: string
          created_at?: string
          delivery_status?: string
          details?: string | null
          event?: string
          id?: string
          message_type?: string | null
          recipient?: string
          source_app?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_devices: {
        Row: {
          browser: string | null
          device_fingerprint: string
          first_seen_at: string
          id: string
          ip_address: string | null
          last_seen_at: string
          location_hint: string | null
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_fingerprint: string
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          location_hint?: string | null
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_fingerprint?: string
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          location_hint?: string | null
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          admin_url: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_external: boolean | null
          is_public: boolean | null
          name: string
          product_type: string
          short_name: string | null
          sort_order: number
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          admin_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id: string
          is_external?: boolean | null
          is_public?: boolean | null
          name: string
          product_type?: string
          short_name?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          admin_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_external?: boolean | null
          is_public?: boolean | null
          name?: string
          product_type?: string
          short_name?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email_verified: boolean
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          source_app: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          source_app?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          source_app?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          invited_email: string | null
          role: string
          status: string
          team_owner_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: string
          status?: string
          team_owner_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: string
          status?: string
          team_owner_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
