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
            referencedRelation: "client_360"
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
            referencedRelation: "document_margins"
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
      allocation_rules: {
        Row: {
          bucket: string
          cap_pct: number
          name_ar: string
          sort: number
          tap_pct: number
        }
        Insert: {
          bucket: string
          cap_pct: number
          name_ar: string
          sort?: number
          tap_pct: number
        }
        Update: {
          bucket?: string
          cap_pct?: number
          name_ar?: string
          sort?: number
          tap_pct?: number
        }
        Relationships: []
      }
      allocations: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          income: number
          note: string | null
          period_start: string
          rows: Json
          run_date: string
          status: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          income?: number
          note?: string | null
          period_start: string
          rows?: Json
          run_date: string
          status?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          income?: number
          note?: string | null
          period_start?: string
          rows?: Json
          run_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
      attachments: {
        Row: {
          created_at: string
          entity: string
          entity_id: string
          filename: string
          id: string
          label: string | null
          mime: string | null
          path: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity: string
          entity_id: string
          filename: string
          id?: string
          label?: string | null
          mime?: string | null
          path: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity?: string
          entity_id?: string
          filename?: string
          id?: string
          label?: string | null
          mime?: string | null
          path?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
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
      checklist_runs: {
        Row: {
          allocation_id: string | null
          checklist_key: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          flag_reason: string | null
          flagged_by: string | null
          id: string
          states: Json
          status: Database["public"]["Enums"]["checklist_run_status"]
          task_id: string | null
        }
        Insert: {
          allocation_id?: string | null
          checklist_key: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          flag_reason?: string | null
          flagged_by?: string | null
          id?: string
          states?: Json
          status?: Database["public"]["Enums"]["checklist_run_status"]
          task_id?: string | null
        }
        Update: {
          allocation_id?: string | null
          checklist_key?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          flag_reason?: string | null
          flagged_by?: string | null
          id?: string
          states?: Json
          status?: Database["public"]["Enums"]["checklist_run_status"]
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_runs_checklist_key_fkey"
            columns: ["checklist_key"]
            isOneToOne: false
            referencedRelation: "pause_checklists"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "checklist_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
          city: string | null
          company: string
          cr_number: string | null
          created_at: string
          decision_maker: string | null
          id: string
          sector: string | null
          status: Database["public"]["Enums"]["client_status"]
          tags: string[]
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          budget_tier?: string | null
          city?: string | null
          company: string
          cr_number?: string | null
          created_at?: string
          decision_maker?: string | null
          id?: string
          sector?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[]
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          budget_tier?: string | null
          city?: string | null
          company?: string
          cr_number?: string | null
          created_at?: string
          decision_maker?: string | null
          id?: string
          sector?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[]
          updated_at?: string
          vat_number?: string | null
          website?: string | null
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
      document_costs: {
        Row: {
          costs: Json
          created_at: string
          document_id: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          costs?: Json
          created_at?: string
          document_id: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          costs?: Json
          created_at?: string
          document_id?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_costs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "document_margins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_costs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "document_margins"
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
      experiments: {
        Row: {
          baseline: number | null
          created_at: string
          created_by: string | null
          decision_note: string | null
          duration_weeks: number | null
          ended_at: string | null
          hypothesis: string
          id: string
          issue_id: string | null
          metric_key: string | null
          playbook_id: string | null
          result: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["experiment_status"]
          target: number | null
          title: string
          updated_at: string
        }
        Insert: {
          baseline?: number | null
          created_at?: string
          created_by?: string | null
          decision_note?: string | null
          duration_weeks?: number | null
          ended_at?: string | null
          hypothesis: string
          id?: string
          issue_id?: string | null
          metric_key?: string | null
          playbook_id?: string | null
          result?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          target?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          baseline?: number | null
          created_at?: string
          created_by?: string | null
          decision_note?: string | null
          duration_weeks?: number | null
          ended_at?: string | null
          hypothesis?: string
          id?: string
          issue_id?: string | null
          metric_key?: string | null
          playbook_id?: string | null
          result?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          target?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
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
      incentive_plans: {
        Row: {
          active: boolean
          created_at: string
          id: string
          notes: string | null
          pool_pct: number
          profile_id: string
          starts_on: string | null
          updated_at: string
          vesting_years: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          pool_pct: number
          profile_id: string
          starts_on?: string | null
          updated_at?: string
          vesting_years?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          pool_pct?: number
          profile_id?: string
          starts_on?: string | null
          updated_at?: string
          vesting_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "incentive_plans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
      issues: {
        Row: {
          auto_filed: boolean
          client_id: string | null
          created_at: string
          details: string | null
          document_id: string | null
          id: string
          original_id: string | null
          priority: number
          project_id: string | null
          raised_by: string | null
          root_cause: string | null
          solved_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at: string
        }
        Insert: {
          auto_filed?: boolean
          client_id?: string | null
          created_at?: string
          details?: string | null
          document_id?: string | null
          id?: string
          original_id?: string | null
          priority?: number
          project_id?: string | null
          raised_by?: string | null
          root_cause?: string | null
          solved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at?: string
        }
        Update: {
          auto_filed?: boolean
          client_id?: string | null
          created_at?: string
          details?: string | null
          document_id?: string | null
          id?: string
          original_id?: string | null
          priority?: number
          project_id?: string | null
          raised_by?: string | null
          root_cause?: string | null
          solved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_margins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_original_id_fkey"
            columns: ["original_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_raised_by_fkey"
            columns: ["raised_by"]
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
      meeting_todos: {
        Row: {
          created_at: string
          done_at: string | null
          due: string
          id: string
          meeting_id: string | null
          owner: string | null
          title: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          due?: string
          id?: string
          meeting_id?: string | null
          owner?: string | null
          title: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          due?: string
          id?: string
          meeting_id?: string | null
          owner?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_todos_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_todos_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          headlines: string | null
          held_on: string
          id: string
          kind: Database["public"]["Enums"]["meeting_kind"]
          rating: number | null
        }
        Insert: {
          created_at?: string
          headlines?: string | null
          held_on?: string
          id?: string
          kind?: Database["public"]["Enums"]["meeting_kind"]
          rating?: number | null
        }
        Update: {
          created_at?: string
          headlines?: string | null
          held_on?: string
          id?: string
          kind?: Database["public"]["Enums"]["meeting_kind"]
          rating?: number | null
        }
        Relationships: []
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "project_costs"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
      pause_checklists: {
        Row: {
          active: boolean
          items: Json
          key: string
          kind: string
          last_caught: Json
          name_ar: string
        }
        Insert: {
          active?: boolean
          items?: Json
          key: string
          kind?: string
          last_caught?: Json
          name_ar: string
        }
        Update: {
          active?: boolean
          items?: Json
          key?: string
          kind?: string
          last_caught?: Json
          name_ar?: string
        }
        Relationships: []
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
            referencedRelation: "document_margins"
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
      people_reviews: {
        Row: {
          created_at: string
          gwc: Json
          id: string
          note: string | null
          quarter: string
          reviewer: string
          subject: string
          value_scores: Json
        }
        Insert: {
          created_at?: string
          gwc?: Json
          id?: string
          note?: string | null
          quarter: string
          reviewer?: string
          subject: string
          value_scores?: Json
        }
        Update: {
          created_at?: string
          gwc?: Json
          id?: string
          note?: string | null
          quarter?: string
          reviewer?: string
          subject?: string
          value_scores?: Json
        }
        Relationships: [
          {
            foreignKeyName: "people_reviews_reviewer_fkey"
            columns: ["reviewer"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_reviews_subject_fkey"
            columns: ["subject"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      playbook_versions: {
        Row: {
          changelog: string
          evidence_url: string | null
          experiment_id: string | null
          id: string
          playbook_id: string
          released_at: string
          released_by: string | null
          version: string
        }
        Insert: {
          changelog: string
          evidence_url?: string | null
          experiment_id?: string | null
          id?: string
          playbook_id: string
          released_at?: string
          released_by?: string | null
          version: string
        }
        Update: {
          changelog?: string
          evidence_url?: string | null
          experiment_id?: string | null
          id?: string
          playbook_id?: string
          released_at?: string
          released_by?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_versions_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_versions_released_by_fkey"
            columns: ["released_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          category_id: string
          created_at: string
          doc_gaps: string | null
          documentation_grade: Database["public"]["Enums"]["documentation_grade"]
          id: string
          mode: Database["public"]["Enums"]["project_mode"]
          name_ar: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          doc_gaps?: string | null
          documentation_grade?: Database["public"]["Enums"]["documentation_grade"]
          id?: string
          mode: Database["public"]["Enums"]["project_mode"]
          name_ar: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          doc_gaps?: string | null
          documentation_grade?: Database["public"]["Enums"]["documentation_grade"]
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
      primary_aims: {
        Row: {
          profile_id: string
          shared_excerpt: string | null
          statement: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          shared_excerpt?: string | null
          statement?: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          shared_excerpt?: string | null
          statement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "primary_aims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profit_distributions: {
        Row: {
          amount_distributed: number
          amount_retained: number
          created_at: string
          created_by: string | null
          distributed_on: string
          id: string
          note: string | null
        }
        Insert: {
          amount_distributed: number
          amount_retained: number
          created_at?: string
          created_by?: string | null
          distributed_on?: string
          id?: string
          note?: string | null
        }
        Update: {
          amount_distributed?: number
          amount_retained?: number
          created_at?: string
          created_by?: string | null
          distributed_on?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profit_distributions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "project_costs"
            referencedColumns: ["id"]
          },
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
      rocks: {
        Row: {
          created_at: string
          id: string
          linked_project: string | null
          owner: string
          quarter: string
          status: Database["public"]["Enums"]["rock_status"]
          success_criteria: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_project?: string | null
          owner: string
          quarter: string
          status?: Database["public"]["Enums"]["rock_status"]
          success_criteria?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_project?: string | null
          owner?: string
          quarter?: string
          status?: Database["public"]["Enums"]["rock_status"]
          success_criteria?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rocks_linked_project_fkey"
            columns: ["linked_project"]
            isOneToOne: false
            referencedRelation: "project_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocks_linked_project_fkey"
            columns: ["linked_project"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rocks_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          custom_premium_pct: number
          id: string
          package_id: string | null
          responsibilities: string | null
          service_ids: string[]
          status: Database["public"]["Enums"]["scope_status"]
          timeline: string | null
          updated_at: string
          why_no_package_fit: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          custom_premium_pct?: number
          id?: string
          package_id?: string | null
          responsibilities?: string | null
          service_ids?: string[]
          status?: Database["public"]["Enums"]["scope_status"]
          timeline?: string | null
          updated_at?: string
          why_no_package_fit?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          custom_premium_pct?: number
          id?: string
          package_id?: string | null
          responsibilities?: string | null
          service_ids?: string[]
          status?: Database["public"]["Enums"]["scope_status"]
          timeline?: string | null
          updated_at?: string
          why_no_package_fit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scopes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scopes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scopes_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecard_entries: {
        Row: {
          computed_at: string
          is_green: boolean | null
          metric_key: string
          value: number | null
          week_start: string
        }
        Insert: {
          computed_at?: string
          is_green?: boolean | null
          metric_key: string
          value?: number | null
          week_start: string
        }
        Update: {
          computed_at?: string
          is_green?: boolean | null
          metric_key?: string
          value?: number | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorecard_entries_metric_key_fkey"
            columns: ["metric_key"]
            isOneToOne: false
            referencedRelation: "scorecard_metrics"
            referencedColumns: ["key"]
          },
        ]
      }
      scorecard_metrics: {
        Row: {
          active: boolean
          direction: Database["public"]["Enums"]["metric_direction"]
          green_threshold: number | null
          key: string
          name_ar: string
          seat_id: string | null
          sort: number
          source: string
        }
        Insert: {
          active?: boolean
          direction?: Database["public"]["Enums"]["metric_direction"]
          green_threshold?: number | null
          key: string
          name_ar: string
          seat_id?: string | null
          sort?: number
          source?: string
        }
        Update: {
          active?: boolean
          direction?: Database["public"]["Enums"]["metric_direction"]
          green_threshold?: number | null
          key?: string
          name_ar?: string
          seat_id?: string | null
          sort?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorecard_metrics_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          holder: string | null
          id: string
          measurables: Json
          name_ar: string
          name_en: string
          reports_to: string | null
          roles: Json
          sort: number
        }
        Insert: {
          holder?: string | null
          id?: string
          measurables?: Json
          name_ar: string
          name_en: string
          reports_to?: string | null
          roles?: Json
          sort?: number
        }
        Update: {
          holder?: string | null
          id?: string
          measurables?: Json
          name_ar?: string
          name_en?: string
          reports_to?: string | null
          roles?: Json
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "seats_holder_fkey"
            columns: ["holder"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seats_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "seats"
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
      service_packages: {
        Row: {
          active: boolean
          base_price: number | null
          created_at: string
          description_ar: string | null
          id: string
          key: string
          name_ar: string
          name_en: string
          options: Json
          payment_terms: Database["public"]["Enums"]["package_terms"]
          playbook_ids: string[]
          service_ids: string[]
          sort: number
          tagline_ar: string | null
          timeline_weeks: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number | null
          created_at?: string
          description_ar?: string | null
          id?: string
          key: string
          name_ar: string
          name_en: string
          options?: Json
          payment_terms?: Database["public"]["Enums"]["package_terms"]
          playbook_ids?: string[]
          service_ids?: string[]
          sort?: number
          tagline_ar?: string | null
          timeline_weeks?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number | null
          created_at?: string
          description_ar?: string | null
          id?: string
          key?: string
          name_ar?: string
          name_en?: string
          options?: Json
          payment_terms?: Database["public"]["Enums"]["package_terms"]
          playbook_ids?: string[]
          service_ids?: string[]
          sort?: number
          tagline_ar?: string | null
          timeline_weeks?: number | null
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
          tvr_repeatable: number | null
          tvr_teachable: number | null
          tvr_valuable: number | null
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
          tvr_repeatable?: number | null
          tvr_teachable?: number | null
          tvr_valuable?: number | null
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
          tvr_repeatable?: number | null
          tvr_teachable?: number | null
          tvr_valuable?: number | null
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
            referencedRelation: "project_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          mentions: string[]
          task_id: string
        }
        Insert: {
          author?: string
          body: string
          created_at?: string
          id?: string
          mentions?: string[]
          task_id: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          mentions?: string[]
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          checklist_key: string | null
          default_days: number
          emt_class: Database["public"]["Enums"]["emt_class"]
          id: string
          needs_client_approval: boolean
          role: Database["public"]["Enums"]["user_role"]
          sort: number
          stage_id: string
          title_ar: string
          title_en: string
        }
        Insert: {
          checklist_key?: string | null
          default_days?: number
          emt_class?: Database["public"]["Enums"]["emt_class"]
          id?: string
          needs_client_approval?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          sort?: number
          stage_id: string
          title_ar: string
          title_en: string
        }
        Update: {
          checklist_key?: string | null
          default_days?: number
          emt_class?: Database["public"]["Enums"]["emt_class"]
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
            foreignKeyName: "task_templates_checklist_key_fkey"
            columns: ["checklist_key"]
            isOneToOne: false
            referencedRelation: "pause_checklists"
            referencedColumns: ["key"]
          },
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
          executed_by: string | null
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
          executed_by?: string | null
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
          executed_by?: string | null
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
            foreignKeyName: "tasks_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_costs"
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
      vision: {
        Row: {
          core_focus: Json
          core_values: Json
          id: number
          one_year_plan: string | null
          ten_year_target: string | null
          three_year_picture: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          core_focus?: Json
          core_values?: Json
          id?: number
          one_year_plan?: string | null
          ten_year_target?: string | null
          three_year_picture?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          core_focus?: Json
          core_values?: Json
          id?: number
          one_year_plan?: string | null
          ten_year_target?: string | null
          three_year_picture?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vision_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
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
      client_360: {
        Row: {
          active_projects: number | null
          bought_package: boolean | null
          company: string | null
          contacts_count: number | null
          created_at: string | null
          id: string | null
          invoiced_total: number | null
          last_interaction_at: string | null
          open_balance: number | null
          paid_total: number | null
          pending_approvals: number | null
          projects_count: number | null
          scopes_count: number | null
          sector: string | null
          status: Database["public"]["Enums"]["client_status"] | null
          tags: string[] | null
          wallet_budget: number | null
        }
        Insert: {
          active_projects?: never
          bought_package?: never
          company?: string | null
          contacts_count?: never
          created_at?: string | null
          id?: string | null
          invoiced_total?: never
          last_interaction_at?: never
          open_balance?: never
          paid_total?: never
          pending_approvals?: never
          projects_count?: never
          scopes_count?: never
          sector?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          tags?: string[] | null
          wallet_budget?: never
        }
        Update: {
          active_projects?: never
          bought_package?: never
          company?: string | null
          contacts_count?: never
          created_at?: string | null
          id?: string | null
          invoiced_total?: never
          last_interaction_at?: never
          open_balance?: never
          paid_total?: never
          pending_approvals?: never
          projects_count?: never
          scopes_count?: never
          sector?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
          tags?: string[] | null
          wallet_budget?: never
        }
        Relationships: []
      }
      data_quality: {
        Row: {
          entity: string | null
          entity_id: string | null
          issue: string | null
          label: string | null
        }
        Relationships: []
      }
      document_margins: {
        Row: {
          client_id: string | null
          id: string | null
          issued_on: string | null
          margin_pct: number | null
          number: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          total: number | null
          total_cost: number | null
          type: Database["public"]["Enums"]["document_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_analytics: {
        Row: {
          avg_days_to_win: number | null
          leads_total: number | null
          lost: number | null
          open: number | null
          open_value: number | null
          source: Database["public"]["Enums"]["lead_source"] | null
          win_rate_pct: number | null
          won: number | null
        }
        Relationships: []
      }
      project_costs: {
        Row: {
          client_id: string | null
          hours_logged: number | null
          id: string | null
          labor_cost: number | null
          mode: Database["public"]["Enums"]["project_mode"] | null
          name: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          tasks_done: number | null
          tasks_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_360"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
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
      compute_scorecard: { Args: never; Returns: undefined }
      compute_scorecard_extras: { Args: { v_week: string }; Returns: undefined }
      compute_scorecard_sellable: {
        Args: { v_week: string }
        Returns: undefined
      }
      compute_scorecard_v2: { Args: never; Returns: undefined }
      compute_scorecard_v3: { Args: never; Returns: undefined }
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
      generate_allocation: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_project_member: { Args: { pid: string }; Returns: boolean }
      is_strategist_plus: { Args: never; Returns: boolean }
      is_team: { Args: never; Returns: boolean }
      next_document_number: { Args: { p_prefix: string }; Returns: string }
      normalize_digits: { Args: { t: string }; Returns: string }
      normalize_phone_sa: { Args: { t: string }; Returns: string }
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
      run_daily_jobs_v2: { Args: never; Returns: undefined }
      run_daily_jobs_v3: { Args: never; Returns: undefined }
      send_overdue_reminders: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
      checklist_run_status: "in_progress" | "passed" | "flagged"
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
      documentation_grade: "A" | "B" | "C"
      emt_class: "entrepreneur" | "manager" | "technician"
      experiment_status: "proposed" | "running" | "won" | "lost"
      interaction_kind: "call" | "whatsapp" | "email" | "meeting" | "note"
      issue_status: "identified" | "discussing" | "solved" | "dropped"
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
      meeting_kind: "l10" | "quarterly" | "annual"
      message_channel: "portal" | "whatsapp" | "email"
      method_phase: "analyze" | "generate" | "market" | "adapt"
      metric_direction: "up" | "down"
      notification_channel: "inapp" | "email" | "whatsapp"
      notification_status:
        | "queued"
        | "sent"
        | "failed"
        | "skipped"
        | "cancelled"
      package_terms: "upfront_100" | "split_50_25_25" | "monthly"
      payment_method: "transfer" | "cash" | "card" | "other"
      project_mode: "recurring" | "milestone"
      project_status:
        | "planning"
        | "active"
        | "paused"
        | "completed"
        | "archived"
      rock_status: "on_track" | "off_track" | "done" | "dropped"
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
      checklist_run_status: ["in_progress", "passed", "flagged"],
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
      documentation_grade: ["A", "B", "C"],
      emt_class: ["entrepreneur", "manager", "technician"],
      experiment_status: ["proposed", "running", "won", "lost"],
      interaction_kind: ["call", "whatsapp", "email", "meeting", "note"],
      issue_status: ["identified", "discussing", "solved", "dropped"],
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
      meeting_kind: ["l10", "quarterly", "annual"],
      message_channel: ["portal", "whatsapp", "email"],
      method_phase: ["analyze", "generate", "market", "adapt"],
      metric_direction: ["up", "down"],
      notification_channel: ["inapp", "email", "whatsapp"],
      notification_status: ["queued", "sent", "failed", "skipped", "cancelled"],
      package_terms: ["upfront_100", "split_50_25_25", "monthly"],
      payment_method: ["transfer", "cash", "card", "other"],
      project_mode: ["recurring", "milestone"],
      project_status: ["planning", "active", "paused", "completed", "archived"],
      rock_status: ["on_track", "off_track", "done", "dropped"],
      scope_status: ["draft", "sent", "approved", "rejected"],
      task_status: ["todo", "in_progress", "review", "done", "blocked"],
      user_role: ["admin", "strategist", "executor", "client"],
    },
  },
} as const

