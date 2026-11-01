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
      admin_credentials: {
        Row: {
          active: boolean
          admin_id: string
          created_at: string
          failed_attempts: number
          id: string
          last_login_at: string | null
          locked_until: string | null
          pin_hash: string
          pin_salt: string
          position: string
          recovery_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          admin_id: string
          created_at?: string
          failed_attempts?: number
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          pin_hash: string
          pin_salt: string
          position?: string
          recovery_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          admin_id?: string
          created_at?: string
          failed_attempts?: number
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          pin_hash?: string
          pin_salt?: string
          position?: string
          recovery_id?: string
          updated_at?: string
        }
        Relationships: []
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
      applications: {
        Row: {
          app_key: string
          app_name: string
          app_slug: string
          app_type: string
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          app_key: string
          app_name: string
          app_slug: string
          app_type?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          app_key?: string
          app_name?: string
          app_slug?: string
          app_type?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
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
      coms_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          name: string
          subject: string | null
          type: string
          updated_at: string
          usage_count: number
          user_id: string
          variables: string[] | null
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          name: string
          subject?: string | null
          type?: string
          updated_at?: string
          usage_count?: number
          user_id: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
          variables?: string[] | null
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
      inbound_messages: {
        Row: {
          body: string
          channel: string
          created_at: string
          direction: string
          id: string
          is_archived: boolean
          is_read: boolean
          is_starred: boolean
          priority: string
          related_ticket_id: string | null
          reply_to_message_id: string | null
          sender: string
          sender_name: string | null
          sender_user_id: string | null
          source_app: string | null
          subject: string
          target_user_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          channel?: string
          created_at?: string
          direction?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_starred?: boolean
          priority?: string
          related_ticket_id?: string | null
          reply_to_message_id?: string | null
          sender: string
          sender_name?: string | null
          sender_user_id?: string | null
          source_app?: string | null
          subject?: string
          target_user_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          direction?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_starred?: boolean
          priority?: string
          related_ticket_id?: string | null
          reply_to_message_id?: string | null
          sender?: string
          sender_name?: string | null
          sender_user_id?: string | null
          source_app?: string | null
          subject?: string
          target_user_id?: string | null
          type?: string
          updated_at?: string
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
          app_id: string
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email_verified: boolean
          id: string
          metadata: Json
          phone: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean
          id?: string
          metadata?: Json
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean
          id?: string
          metadata?: Json
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          first_response_at: string | null
          fr_at_risk_alert_at: string | null
          fr_breach_alert_at: string | null
          id: string
          last_replied_at: string | null
          message: string
          priority: string
          res_at_risk_alert_at: string | null
          res_breach_alert_at: string | null
          resolved_at: string | null
          sender_email: string | null
          sender_name: string | null
          sender_user_id: string | null
          sla_first_response_minutes: number | null
          sla_resolution_minutes: number | null
          source_app: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_response_at?: string | null
          fr_at_risk_alert_at?: string | null
          fr_breach_alert_at?: string | null
          id?: string
          last_replied_at?: string | null
          message: string
          priority?: string
          res_at_risk_alert_at?: string | null
          res_breach_alert_at?: string | null
          resolved_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_user_id?: string | null
          sla_first_response_minutes?: number | null
          sla_resolution_minutes?: number | null
          source_app?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_response_at?: string | null
          fr_at_risk_alert_at?: string | null
          fr_breach_alert_at?: string | null
          id?: string
          last_replied_at?: string | null
          message?: string
          priority?: string
          res_at_risk_alert_at?: string | null
          res_breach_alert_at?: string | null
          resolved_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_user_id?: string | null
          sla_first_response_minutes?: number | null
          sla_resolution_minutes?: number | null
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
      ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          message_id: string | null
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          ticket_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          message_id?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          ticket_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          message_id?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          ticket_id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      ticket_audit_log: {
        Row: {
          action: string
          actor_kind: string
          actor_label: string | null
          actor_user_id: string | null
          attachment_id: string | null
          created_at: string
          details: string | null
          from_status: string | null
          id: string
          message_id: string | null
          metadata: Json
          ticket_id: string
          to_status: string | null
        }
        Insert: {
          action: string
          actor_kind?: string
          actor_label?: string | null
          actor_user_id?: string | null
          attachment_id?: string | null
          created_at?: string
          details?: string | null
          from_status?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json
          ticket_id: string
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_kind?: string
          actor_label?: string | null
          actor_user_id?: string | null
          attachment_id?: string | null
          created_at?: string
          details?: string | null
          from_status?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json
          ticket_id?: string
          to_status?: string | null
        }
        Relationships: []
      }
      user_app_access: {
        Row: {
          active: boolean
          app_id: string
          created_at: string
          id: string
          permissions: Json
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          app_id: string
          created_at?: string
          id?: string
          permissions?: Json
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          app_id?: string
          created_at?: string
          id?: string
          permissions?: Json
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_app_access_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_document_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          document_id: string
          id: string
          parent_id: string | null
          range_from: number | null
          range_to: number | null
          resolved: boolean
          selection_text: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          document_id: string
          id?: string
          parent_id?: string | null
          range_from?: number | null
          range_to?: number | null
          resolved?: boolean
          selection_text?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          document_id?: string
          id?: string
          parent_id?: string | null
          range_from?: number | null
          range_to?: number | null
          resolved?: boolean
          selection_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "workspace_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_document_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workspace_document_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_document_shares: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          expires_at: string | null
          id: string
          mode: string
          revoked: boolean
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          expires_at?: string | null
          id?: string
          mode?: string
          revoked?: boolean
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          expires_at?: string | null
          id?: string
          mode?: string
          revoked?: boolean
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "workspace_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_document_versions: {
        Row: {
          content_json: Json
          created_at: string
          created_by: string | null
          document_id: string
          id: string
        }
        Insert: {
          content_json: Json
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
        }
        Update: {
          content_json?: Json
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "workspace_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_documents: {
        Row: {
          classification: string | null
          content_json: Json
          content_text: string
          created_at: string
          id: string
          language: string | null
          outline: Json | null
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          classification?: string | null
          content_json?: Json
          content_text?: string
          created_at?: string
          id?: string
          language?: string | null
          outline?: Json | null
          owner_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          classification?: string | null
          content_json?: Json
          content_text?: string
          created_at?: string
          id?: string
          language?: string | null
          outline?: Json | null
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_drive_state: {
        Row: {
          created_at: string
          state_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          state_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          state_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_sheet_shares: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          mode: string
          revoked: boolean
          sheet_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          mode?: string
          revoked?: boolean
          sheet_id: string
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          mode?: string
          revoked?: boolean
          sheet_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_sheet_shares_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "workspace_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_sheets: {
        Row: {
          content_text: string
          created_at: string
          id: string
          owner_id: string
          title: string
          updated_at: string
          workbook_json: Json
        }
        Insert: {
          content_text?: string
          created_at?: string
          id?: string
          owner_id: string
          title?: string
          updated_at?: string
          workbook_json?: Json
        }
        Update: {
          content_text?: string
          created_at?: string
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
          workbook_json?: Json
        }
        Relationships: []
      }
      workspace_slide_shares: {
        Row: {
          created_at: string
          created_by: string | null
          deck_id: string
          expires_at: string | null
          id: string
          mode: string
          revoked: boolean
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deck_id: string
          expires_at?: string | null
          id?: string
          mode?: string
          revoked?: boolean
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deck_id?: string
          expires_at?: string | null
          id?: string
          mode?: string
          revoked?: boolean
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_slide_shares_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "workspace_slides"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_slides: {
        Row: {
          content_text: string
          created_at: string
          deck_json: Json
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content_text?: string
          created_at?: string
          deck_json?: Json
          id?: string
          owner_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          content_text?: string
          created_at?: string
          deck_json?: Json
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_app_profile: {
        Args: { _app_id: string; _user_id: string }
        Returns: string
      }
      ensure_self_app_access: { Args: { _app_slug: string }; Returns: string }
      get_shared_document: {
        Args: { _token: string }
        Returns: {
          content_json: Json
          id: string
          mode: string
          title: string
          updated_at: string
        }[]
      }
      get_shared_sheet: {
        Args: { _token: string }
        Returns: {
          id: string
          mode: string
          title: string
          updated_at: string
          workbook_json: Json
        }[]
      }
      get_shared_slides: {
        Args: { _token: string }
        Returns: {
          deck_json: Json
          id: string
          mode: string
          title: string
          updated_at: string
        }[]
      }
      has_app_access: {
        Args: { _app_slug: string; _user_id: string }
        Returns: boolean
      }
      has_app_access_by_id: {
        Args: { _app_id: string; _user_id: string }
        Returns: boolean
      }
      process_sla_alerts: { Args: never; Returns: number }
      update_shared_document: {
        Args: {
          _content_json: Json
          _content_text: string
          _title?: string
          _token: string
        }
        Returns: boolean
      }
      update_shared_sheet: {
        Args: {
          _content_text: string
          _title?: string
          _token: string
          _workbook_json: Json
        }
        Returns: boolean
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
