export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type EmployeeRole = "employee" | "admin";
type EmploymentStatus = "active" | "inactive" | "terminated";
type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
type LeaveUnit = "full_day" | "half_day_morning" | "half_day_afternoon";
type NotificationChannel = "email";
type NotificationEventType =
  | "leave_request_submitted"
  | "leave_request_approved"
  | "leave_request_rejected"
  | "leave_request_cancelled";
type NotificationProvider = "gmail_smtp" | "resend";
type NotificationDeliveryStatus = "queued" | "sent" | "failed" | "skipped";

type Tables = {
  employees: {
    Row: {
      id: string;
      auth_user_id: string | null;
      employee_code: string;
      email: string;
      first_name: string;
      last_name: string;
      role: EmployeeRole;
      employment_status: EmploymentStatus;
      manager_employee_id: string | null;
      start_date: string;
      end_date: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      auth_user_id?: string | null;
      employee_code: string;
      email: string;
      first_name: string;
      last_name: string;
      role?: EmployeeRole;
      employment_status?: EmploymentStatus;
      manager_employee_id?: string | null;
      start_date: string;
      end_date?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      auth_user_id?: string | null;
      employee_code?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      role?: EmployeeRole;
      employment_status?: EmploymentStatus;
      manager_employee_id?: string | null;
      start_date?: string;
      end_date?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "employees_auth_user_id_fkey";
        columns: ["auth_user_id"];
        isOneToOne: true;
        referencedRelation: "users";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "employees_manager_employee_id_fkey";
        columns: ["manager_employee_id"];
        isOneToOne: false;
        referencedRelation: "employees";
        referencedColumns: ["id"];
      },
    ];
  };
  leave_types: {
    Row: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      annual_entitlement_days: number;
      allow_carry_forward: boolean;
      max_carry_forward_days: number;
      requires_document: boolean;
      paid: boolean;
      active: boolean;
      sort_order: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      code: string;
      name: string;
      description?: string | null;
      annual_entitlement_days?: number;
      allow_carry_forward?: boolean;
      max_carry_forward_days?: number;
      requires_document?: boolean;
      paid?: boolean;
      active?: boolean;
      sort_order?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      code?: string;
      name?: string;
      description?: string | null;
      annual_entitlement_days?: number;
      allow_carry_forward?: boolean;
      max_carry_forward_days?: number;
      requires_document?: boolean;
      paid?: boolean;
      active?: boolean;
      sort_order?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  yearly_leave_balances: {
    Row: {
      id: string;
      employee_id: string;
      leave_type_id: string;
      balance_year: number;
      entitlement_days: number;
      carry_forward_days: number;
      adjustment_days: number;
      used_days: number;
      pending_days: number;
      remaining_days: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      employee_id: string;
      leave_type_id: string;
      balance_year: number;
      entitlement_days?: number;
      carry_forward_days?: number;
      adjustment_days?: number;
      used_days?: number;
      pending_days?: number;
      remaining_days?: never;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      employee_id?: string;
      leave_type_id?: string;
      balance_year?: number;
      entitlement_days?: number;
      carry_forward_days?: number;
      adjustment_days?: number;
      used_days?: number;
      pending_days?: number;
      remaining_days?: never;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "yearly_leave_balances_employee_id_fkey";
        columns: ["employee_id"];
        isOneToOne: false;
        referencedRelation: "employees";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "yearly_leave_balances_leave_type_id_fkey";
        columns: ["leave_type_id"];
        isOneToOne: false;
        referencedRelation: "leave_types";
        referencedColumns: ["id"];
      },
    ];
  };
  leave_requests: {
    Row: {
      id: string;
      employee_id: string;
      leave_type_id: string;
      balance_id: string | null;
      request_status: LeaveRequestStatus;
      start_date: string;
      end_date: string;
      leave_unit: LeaveUnit;
      requested_days: number;
      reason: string | null;
      employee_note: string | null;
      approver_employee_id: string | null;
      decided_at: string | null;
      decision_note: string | null;
      cancelled_at: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      employee_id: string;
      leave_type_id: string;
      balance_id?: string | null;
      request_status?: LeaveRequestStatus;
      start_date: string;
      end_date: string;
      leave_unit?: LeaveUnit;
      requested_days: number;
      reason?: string | null;
      employee_note?: string | null;
      approver_employee_id?: string | null;
      decided_at?: string | null;
      decision_note?: string | null;
      cancelled_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      employee_id?: string;
      leave_type_id?: string;
      balance_id?: string | null;
      request_status?: LeaveRequestStatus;
      start_date?: string;
      end_date?: string;
      leave_unit?: LeaveUnit;
      requested_days?: number;
      reason?: string | null;
      employee_note?: string | null;
      approver_employee_id?: string | null;
      decided_at?: string | null;
      decision_note?: string | null;
      cancelled_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "leave_requests_employee_id_fkey";
        columns: ["employee_id"];
        isOneToOne: false;
        referencedRelation: "employees";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "leave_requests_leave_type_id_fkey";
        columns: ["leave_type_id"];
        isOneToOne: false;
        referencedRelation: "leave_types";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "leave_requests_balance_id_fkey";
        columns: ["balance_id"];
        isOneToOne: false;
        referencedRelation: "yearly_leave_balances";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "leave_requests_approver_employee_id_fkey";
        columns: ["approver_employee_id"];
        isOneToOne: false;
        referencedRelation: "employees";
        referencedColumns: ["id"];
      },
    ];
  };
  public_holidays: {
    Row: {
      id: string;
      holiday_date: string;
      name: string;
      region: string;
      active: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      holiday_date: string;
      name: string;
      region?: string;
      active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      holiday_date?: string;
      name?: string;
      region?: string;
      active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  notification_delivery_records: {
    Row: {
      id: string;
      leave_request_id: string | null;
      recipient_employee_id: string | null;
      channel: NotificationChannel;
      event_type: NotificationEventType;
      provider: NotificationProvider;
      delivery_status: NotificationDeliveryStatus;
      to_email: string;
      subject: string;
      provider_message_id: string | null;
      idempotency_key: string;
      attempt_count: number;
      last_error: string | null;
      queued_at: string;
      sent_at: string | null;
      failed_at: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      leave_request_id?: string | null;
      recipient_employee_id?: string | null;
      channel?: NotificationChannel;
      event_type: NotificationEventType;
      provider?: NotificationProvider;
      delivery_status?: NotificationDeliveryStatus;
      to_email: string;
      subject: string;
      provider_message_id?: string | null;
      idempotency_key: string;
      attempt_count?: number;
      last_error?: string | null;
      queued_at?: string;
      sent_at?: string | null;
      failed_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      leave_request_id?: string | null;
      recipient_employee_id?: string | null;
      channel?: NotificationChannel;
      event_type?: NotificationEventType;
      provider?: NotificationProvider;
      delivery_status?: NotificationDeliveryStatus;
      to_email?: string;
      subject?: string;
      provider_message_id?: string | null;
      idempotency_key?: string;
      attempt_count?: number;
      last_error?: string | null;
      queued_at?: string;
      sent_at?: string | null;
      failed_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "notification_delivery_records_leave_request_id_fkey";
        columns: ["leave_request_id"];
        isOneToOne: false;
        referencedRelation: "leave_requests";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "notification_delivery_records_recipient_employee_id_fkey";
        columns: ["recipient_employee_id"];
        isOneToOne: false;
        referencedRelation: "employees";
        referencedColumns: ["id"];
      },
    ];
  };
};

export type Database = {
  public: {
    Tables: Tables;
    Views: Record<string, never>;
    Functions: {
      current_employee_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      current_employee_is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
