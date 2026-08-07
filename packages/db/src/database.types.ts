export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          assignee: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          done_at: string | null
          due_at: string
          id: string
          kind: Database["public"]["Enums"]["activity_kind"]
          lead_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          done_at?: string | null
          due_at: string
          id?: string
          kind?: Database["public"]["Enums"]["activity_kind"]
          lead_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          done_at?: string | null
          due_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["activity_kind"]
          lead_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_assignee_fkey"
            columns: ["assignee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          client_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["approval_item_type"]
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["approval_item_type"]
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["approval_item_type"]
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      clause_library: {
        Row: {
          approved: boolean
          body_ar: string
          category: string
          created_at: string
          id: string
          key: string
          sort: number
          title_ar: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          body_ar: string
          category?: string
          created_at?: string
          id?: string
          key: string
          sort?: number
          title_ar: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          body_ar?: string
          category?: string
          created_at?: string
          id?: string
          key?: string
          sort?: number
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          budget_tier: string | null
          company: string
          created_at: string
          decision_maker: string | null
          id: string
          sector: string | null
          status: Database["public"]["Enums"]["client_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          budget_tier?: string | null
          company: string
          created_at?: string
          decision_maker?: string | null
          id?: string
          sector?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          budget_tier?: string | null
          company?: string
          created_at?: string
          decision_maker?: string | null
          id?: string
          sector?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          lead_id: string | null
          name: string
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          lead_id?: string | null
          name: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          lead_id?: string | null
          name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      document_counters: {
        Row: {
          next_number: number
          prefix: string
        }
        Insert: {
          next_number: number
          prefix: string
        }
        Update: {
          next_number?: number
          prefix?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          issued_on: string | null
          number: string | null
          payload: Json
          payment_account_id: string | null
          scope_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          supersedes: string | null
          total: number | null
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          valid_until: string | null
          version: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          issued_on?: string | null
          number?: string | null
          payload?: Json
          payment_account_id?: string | null
          scope_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          supersedes?: string | null
          total?: number | null
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          issued_on?: string | null
          number?: string | null
          payload?: Json
          payment_account_id?: string | null
          scope_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          supersedes?: string | null
          total?: number | null
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "scopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_supersedes_fkey"
            columns: ["supersedes"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          note: string | null
          supplier: string | null
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          note?: string | null
          supplier?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          note?: string | null
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          client_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["interaction_kind"]
          lead_id: string | null
          logged_by: string | null
          occurred_at: string
          summary: string
        }
        Insert: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["interaction_kind"]
          lead_id?: string | null
          logged_by?: string | null
          occurred_at?: string
          summary: string
        }
        Update: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["interaction_kind"]
          lead_id?: string | null
          logged_by?: string | null
          occurred_at?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_definitions: {
        Row: {
          direction: Database["public"]["Enums"]["kpi_direction"]
          id: string
          key: string
          label_ar: string
          label_en: string
          playbook_id: string
          unit: string | null
        }
        Insert: {
          direction: Database["public"]["Enums"]["kpi_direction"]
          id?: string
          key: string
          label_ar: string
          label_en: string
          playbook_id: string
          unit?: string | null
        }
        Update: {
          direction?: Database["public"]["Enums"]["kpi_direction"]
          id?: string
          key?: string
          label_ar?: string
          label_en?: string
          playbook_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_definitions_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          client_id: string | null
          company: string | null
          created_at: string
          expected_close: string | null
          id: string
          lost_reason: string | null
          name: string
          notes: string | null
          outcome: Database["public"]["Enums"]["lead_outcome"]
          owner: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage: Database["public"]["Enums"]["lead_stage"]
          tags: string[]
          updated_at: string
          utm: Json
          value: number | null
        }
        Insert: {
          client_id?: string | null
          company?: string | null
          created_at?: string
          expected_close?: string | null
          id?: string
          lost_reason?: string | null
          name: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["lead_outcome"]
          owner?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          tags?: string[]
          updated_at?: string
          utm?: Json
          value?: number | null
        }
        Update: {
          client_id?: string | null
          company?: string | null
          created_at?: string
          expected_close?: string | null
          id?: string
          lost_reason?: string | null
          name?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["lead_outcome"]
          owner?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          tags?: string[]
          updated_at?: string
          utm?: Json
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          kind: Database["public"]["Enums"]["leave_kind"]
          member: string
          note: string | null
          starts_on: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          kind?: Database["public"]["Enums"]["leave_kind"]
          member: string
          note?: string | null
          starts_on: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          kind?: Database["public"]["Enums"]["leave_kind"]
          member?: string
          note?: string | null
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_member_fkey"
            columns: ["member"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          client_id: string
          created_at: string
          id: string
          read_at: string | null
          sender: string
        }
        Insert: {
          body: string
          channel?: Database["public"]["Enums"]["message_channel"]
          client_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          client_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_fkey"
            columns: ["sender"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          conversions: number | null
          cpa: number | null
          created_at: string
          custom: Json
          hours_saved: number | null
          id: string
          metric_date: string
          project_id: string
          roas: number | null
          spend: number | null
          updated_at: string
        }
        Insert: {
          conversions?: number | null
          cpa?: number | null
          created_at?: string
          custom?: Json
          hours_saved?: number | null
          id?: string
          metric_date: string
          project_id: string
          roas?: number | null
          spend?: number | null
          updated_at?: string
        }
        Update: {
          conversions?: number | null
          cpa?: number | null
          created_at?: string
          custom?: Json
          hours_saved?: number | null
          id?: string
          metric_date?: string
          project_id?: string
          roas?: number | null
          spend?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          active: boolean
          approved: boolean
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          key: string
          locale: string
          subject: string | null
        }
        Insert: {
          active?: boolean
          approved?: boolean
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          key: string
          locale?: string
          subject?: string | null
        }
        Update: {
          active?: boolean
          approved?: boolean
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          key?: string
          locale?: string
          subject?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          client_id: string | null
          created_at: string
          dedupe_key: string | null
          error: string | null
          event_key: string
          id: string
          locale: string
          payload: Json
          read_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          recipient_profile: string | null
          request_id: number | null
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_key: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          client_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          error?: string | null
          event_key: string
          id?: string
          locale?: string
          payload?: Json
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_profile?: string | null
          request_id?: number | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          client_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          error?: string | null
          event_key?: string
          id?: string
          locale?: string
          payload?: Json
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_profile?: string | null
          request_id?: number | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_profile_fkey"
            columns: ["recipient_profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          active: boolean
          bank_name: string
          beneficiary_name: string
          created_at: string
          iban: string
          id: string
          internal_label: string
          is_default: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          bank_name?: string
          beneficiary_name: string
          created_at?: string
          iban: string
          id?: string
          internal_label: string
          is_default?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          bank_name?: string
          beneficiary_name?: string
          created_at?: string
          iban?: string
          id?: string
          internal_label?: string
          is_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          bank_ref: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_on: string
          payment_account_id: string | null
        }
        Insert: {
          amount: number
          bank_ref?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on?: string
          payment_account_id?: string | null
        }
        Update: {
          amount?: number
          bank_ref?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on?: string
          payment_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_stages: {
        Row: {
          id: string
          method_phase: Database["public"]["Enums"]["method_phase"]
          name_ar: string
          name_en: string
          playbook_id: string
          sort: number
        }
        Insert: {
          id?: string
          method_phase: Database["public"]["Enums"]["method_phase"]
          name_ar: string
          name_en: string
          playbook_id: string
          sort: number
        }
        Update: {
          id?: string
          method_phase?: Database["public"]["Enums"]["method_phase"]
          name_ar?: string
          name_en?: string
          playbook_id?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "playbook_stages_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          category_id: string
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["project_mode"]
          name_ar: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          mode: Database["public"]["Enums"]["project_mode"]
          name_ar: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["project_mode"]
          name_ar?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          capacity_hours_week: number
          client_id: string | null
          cost_rate_hourly: number | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          skills: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity_hours_week?: number
          client_id?: string | null
          cost_rate_hourly?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity_hours_week?: number
          client_id?: string | null
          cost_rate_hourly?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          method_phase: Database["public"]["Enums"]["method_phase"]
          mode: Database["public"]["Enums"]["project_mode"]
          name: string
          playbook_id: string
          roadmap_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          method_phase?: Database["public"]["Enums"]["method_phase"]
          mode: Database["public"]["Enums"]["project_mode"]
          name: string
          playbook_id: string
          roadmap_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          method_phase?: Database["public"]["Enums"]["method_phase"]
          mode?: Database["public"]["Enums"]["project_mode"]
          name?: string
          playbook_id?: string
          roadmap_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          bucket: string
          caller_hash: string
          hits: number
          window_start: string
        }
        Insert: {
          bucket: string
          caller_hash: string
          hits?: number
          window_start?: string
        }
        Update: {
          bucket?: string
          caller_hash?: string
          hits?: number
          window_start?: string
        }
        Relationships: []
      }
      recurring_invoices: {
        Row: {
          active: boolean
          amount: number
          client_id: string
          created_at: string
          day_of_month: number
          id: string
          last_generated: string | null
          note: string | null
          payment_account_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount: number
          client_id: string
          created_at?: string
          day_of_month?: number
          id?: string
          last_generated?: string | null
          note?: string | null
          payment_account_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          client_id?: string
          created_at?: string
          day_of_month?: number
          id?: string
          last_generated?: string | null
          note?: string | null
          payment_account_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          pdf_url: string | null
          period: string
          project_id: string
          published_to_portal: boolean
          summary_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pdf_url?: string | null
          period: string
          project_id: string
          published_to_portal?: boolean
          summary_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pdf_url?: string | null
          period?: string
          project_id?: string
          published_to_portal?: boolean
          summary_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          approved_at: string | null
          channels: string[]
          created_at: string
          id: string
          priorities: string[]
          scope_id: string
          tools: string[]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          channels?: string[]
          created_at?: string
          id?: string
          priorities?: string[]
          scope_id: string
          tools?: string[]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          channels?: string[]
          created_at?: string
          id?: string
          priorities?: string[]
          scope_id?: string
          tools?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmaps_scope_id_fkey"
            columns: ["scope_id"]
            isOneToOne: false
            referencedRelation: "scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      role_profiles: {
        Row: {
          created_at: string
          id: string
          pillars: Json
          role_key: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pillars?: Json
          role_key: string
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pillars?: Json
          role_key?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      scopes: {
        Row: {
          client_id: string
          created_at: string
          id: string
          responsibilities: string | null
          service_ids: string[]
          status: Database["public"]["Enums"]["scope_status"]
          timeline: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          responsibilities?: string | null
          service_ids?: string[]
          status?: Database["public"]["Enums"]["scope_status"]
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          responsibilities?: string | null
          service_ids?: string[]
          status?: Database["public"]["Enums"]["scope_status"]
          timeline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scopes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          slug: string
          sort: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          slug: string
          sort?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      services_catalog: {
        Row: {
          active: boolean
          category_id: string
          created_at: string
          id: string
          name_ar: string
          name_en: string
          slug: string
          sort: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id: string
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          slug: string
          sort?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          sort?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_catalog_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          ends_on: string | null
          goal: string | null
          id: string
          number: number
          project_id: string
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          goal?: string | null
          id?: string
          number: number
          project_id: string
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          goal?: string | null
          id?: string
          number?: number
          project_id?: string
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          default_days: number
          id: string
          needs_client_approval: boolean
          role: Database["public"]["Enums"]["user_role"]
          sort: number
          stage_id: string
          title_ar: string
          title_en: string
        }
        Insert: {
          default_days?: number
          id?: string
          needs_client_approval?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          sort?: number
          stage_id: string
          title_ar: string
          title_en: string
        }
        Update: {
          default_days?: number
          id?: string
          needs_client_approval?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          sort?: number
          stage_id?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "playbook_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          blocked_by: string | null
          created_at: string
          deliverable_url: string | null
          due: string | null
          id: string
          needs_client_approval: boolean
          project_id: string
          service_id: string | null
          sort: number
          sprint_id: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          blocked_by?: string | null
          created_at?: string
          deliverable_url?: string | null
          due?: string | null
          id?: string
          needs_client_approval?: boolean
          project_id: string
          service_id?: string | null
          sort?: number
          sprint_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          blocked_by?: string | null
          created_at?: string
          deliverable_url?: string | null
          due?: string | null
          id?: string
          needs_client_approval?: boolean
          project_id?: string
          service_id?: string | null
          sort?: number
          sprint_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_fkey"
            columns: ["assignee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "playbook_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          member: string
          minutes: number
          note: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          member?: string
          minutes: number
          note?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          member?: string
          minutes?: number
          note?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_member_fkey"
            columns: ["member"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_entries: {
        Row: {
          amount: number
          campaign: string | null
          created_at: string
          created_by: string | null
          id: string
          spend_date: string
          wallet_id: string
        }
        Insert: {
          amount: number
          campaign?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          spend_date?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          campaign?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          spend_date?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_entries_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          budget: number
          client_id: string
          created_at: string
          id: string
          note: string | null
          updated_at: string
        }
        Insert: {
          budget: number
          client_id: string
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number
          client_id?: string
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      website_clients: {
        Row: {
          client_id: string
          consent_public: boolean
          created_at: string
          display_name_ar: string
          display_name_en: string | null
          id: string
          logo_url: string | null
          published: boolean
          sort: number
          updated_at: string
        }
        Insert: {
          client_id: string
          consent_public?: boolean
          created_at?: string
          display_name_ar: string
          display_name_en?: string | null
          id?: string
          logo_url?: string | null
          published?: boolean
          sort?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          consent_public?: boolean
          created_at?: string
          display_name_ar?: string
          display_name_en?: string | null
          id?: string
          logo_url?: string | null
          published?: boolean
          sort?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      check_rate_limit: {
        Args: {
          p_bucket: string
          p_caller_hash: string
          p_max_per_hour: number
        }
        Returns: boolean
      }
      create_project_from_playbook: {
        Args: { p_client_id: string; p_name: string; p_playbook_slug: string }
        Returns: string
      }
      current_client_id: { Args: never; Returns: string }
      dispatch_notifications: { Args: never; Returns: undefined }
      enqueue_notification: {
        Args: {
          p_channel: Database["public"]["Enums"]["notification_channel"]
          p_client_id?: string
          p_dedupe?: string
          p_event: string
          p_payload: Json
          p_recipient_email?: string
          p_recipient_profile?: string
          p_scheduled_for?: string
          p_template: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_project_member: { Args: { pid: string }; Returns: boolean }
      is_strategist_plus: { Args: never; Returns: boolean }
      is_team: { Args: never; Returns: boolean }
      next_document_number: { Args: { p_prefix: string }; Returns: string }
      notify_team: {
        Args: {
          p_client?: string
          p_dedupe_prefix?: string
          p_event: string
          p_payload: Json
          p_template: string
        }
        Returns: undefined
      }
      render_template: {
        Args: { p_body: string; p_payload: Json }
        Returns: string
      }
      run_daily_jobs: { Args: never; Returns: undefined }
    }
    Enums: {
      activity_kind: "call" | "meeting" | "task" | "deadline" | "followup"
      approval_item_type:
        | "scope"
        | "roadmap"
        | "deliverable"
        | "report"
        | "task"
      approval_status: "pending" | "approved" | "rejected"
      client_status: "active" | "paused" | "archived"
      document_status:
        | "draft"
        | "sent"
        | "signed"
        | "active"
        | "expired"
        | "void"
      document_type:
        | "quote"
        | "sow"
        | "nda"
        | "sla"
        | "msa"
        | "amc"
        | "coc"
        | "invoice"
        | "credit_note"
      interaction_kind: "call" | "whatsapp" | "email" | "meeting" | "note"
      kpi_direction: "up" | "down"
      lead_outcome: "open" | "won" | "lost"
      lead_source: "call" | "whatsapp" | "email" | "site"
      lead_stage:
        | "discovery_call"
        | "opportunity_analysis"
        | "scoping"
        | "roadmap"
        | "live"
        | "optimize"
      leave_kind: "annual" | "sick" | "unpaid" | "other"
      message_channel: "portal" | "whatsapp" | "email"
      method_phase: "analyze" | "generate" | "market" | "adapt"
      notification_channel: "inapp" | "email" | "whatsapp"
      notification_status:
        | "queued"
        | "sent"
        | "failed"
        | "skipped"
        | "cancelled"
      payment_method: "transfer" | "cash" | "card" | "other"
      project_mode: "recurring" | "milestone"
      project_status:
        | "planning"
        | "active"
        | "paused"
        | "completed"
        | "archived"
      scope_status: "draft" | "sent" | "approved" | "rejected"
      task_status: "todo" | "in_progress" | "review" | "done" | "blocked"
      user_role: "admin" | "strategist" | "executor" | "client"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_kind: ["call", "meeting", "task", "deadline", "followup"],
      approval_item_type: ["scope", "roadmap", "deliverable", "report", "task"],
      approval_status: ["pending", "approved", "rejected"],
      client_status: ["active", "paused", "archived"],
      document_status: ["draft", "sent", "signed", "active", "expired", "void"],
      document_type: [
        "quote",
        "sow",
        "nda",
        "sla",
        "msa",
        "amc",
        "coc",
        "invoice",
        "credit_note",
      ],
      interaction_kind: ["call", "whatsapp", "email", "meeting", "note"],
      kpi_direction: ["up", "down"],
      lead_outcome: ["open", "won", "lost"],
      lead_source: ["call", "whatsapp", "email", "site"],
      lead_stage: [
        "discovery_call",
        "opportunity_analysis",
        "scoping",
        "roadmap",
        "live",
        "optimize",
      ],
      leave_kind: ["annual", "sick", "unpaid", "other"],
      message_channel: ["portal", "whatsapp", "email"],
      method_phase: ["analyze", "generate", "market", "adapt"],
      notification_channel: ["inapp", "email", "whatsapp"],
      notification_status: ["queued", "sent", "failed", "skipped", "cancelled"],
      payment_method: ["transfer", "cash", "card", "other"],
      project_mode: ["recurring", "milestone"],
      project_status: ["planning", "active", "paused", "completed", "archived"],
      scope_status: ["draft", "sent", "approved", "rejected"],
      task_status: ["todo", "in_progress", "review", "done", "blocked"],
      user_role: ["admin", "strategist", "executor", "client"],
    },
  },
} as const

