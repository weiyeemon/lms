import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  LeaveBalanceSummary,
  LeaveRequestRecord,
  LeaveTypeOption,
} from "./types";

export type EmployeeContext = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export async function getEmployeeLeaveRequestData() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const subject = claimsData?.claims?.sub;

  if (!subject) {
    return { status: "unauthenticated" as const };
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id,email,first_name,last_name,employment_status")
    .eq("auth_user_id", subject)
    .maybeSingle();

  if (employeeError) {
    throw new Error("Unable to load the employee profile.");
  }
  if (!employee || employee.employment_status !== "active") {
    return { status: "missing_employee" as const };
  }

  const year = new Date().getUTCFullYear();
  const [leaveTypesResult, balancesResult, holidaysResult, requestsResult] =
    await Promise.all([
      supabase
        .from("leave_types")
        .select("id,code,name,requires_document")
        .eq("active", true)
        .in("code", ["personal", "medical"])
        .order("sort_order"),
      supabase
        .from("yearly_leave_balances")
        .select("leave_type_id,remaining_days")
        .eq("employee_id", employee.id)
        .eq("balance_year", year),
      supabase
        .from("public_holidays")
        .select("holiday_date")
        .eq("active", true)
        .gte("holiday_date", `${year}-01-01`)
        .lte("holiday_date", `${year}-12-31`),
      supabase
        .from("leave_requests")
        .select(
          "id,start_date,end_date,requested_days,request_status,reason,decision_note,created_at,leave_type:leave_types(name)",
        )
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  const firstError = [
    leaveTypesResult.error,
    balancesResult.error,
    holidaysResult.error,
    requestsResult.error,
  ].find(Boolean);
  if (firstError) {
    throw new Error("Unable to load leave request data.");
  }

  const leaveTypes: LeaveTypeOption[] = (leaveTypesResult.data ?? [])
    .filter(
      (item): item is typeof item & { code: "personal" | "medical" } =>
        item.code === "personal" || item.code === "medical",
    )
    .map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      requiresDocument: item.requires_document,
    }));

  const balances: LeaveBalanceSummary[] = (balancesResult.data ?? []).map(
    (item) => ({
      leaveTypeId: item.leave_type_id,
      remainingDays: Number(item.remaining_days),
    }),
  );

  const requests: LeaveRequestRecord[] = (requestsResult.data ?? []).map(
    (item) => ({
      id: item.id,
      leaveTypeName: item.leave_type?.name ?? "Leave",
      startDate: item.start_date,
      endDate: item.end_date,
      requestedDays: Number(item.requested_days),
      status: item.request_status,
      reason: item.reason,
      decisionNote: item.decision_note,
      createdAt: item.created_at,
    }),
  );

  return {
    status: "ready" as const,
    employee: {
      id: employee.id,
      email: employee.email,
      firstName: employee.first_name,
      lastName: employee.last_name,
    } satisfies EmployeeContext,
    leaveTypes,
    balances,
    holidayDates: (holidaysResult.data ?? []).map((item) => item.holiday_date),
    requests,
    maxRequestDate: `${year}-12-31`,
  };
}
