"use server";

import { revalidatePath } from "next/cache";

import type {
  LeaveRequestActionState,
  LeaveUnit,
} from "@/features/leave-requests/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const leaveUnits = new Set<LeaveUnit>([
  "full_day",
  "half_day_morning",
  "half_day_afternoon",
]);

export async function submitLeaveRequest(
  _previousState: LeaveRequestActionState,
  formData: FormData,
): Promise<LeaveRequestActionState> {
  const leaveTypeId = String(formData.get("leaveTypeId") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const leaveUnitValue = String(formData.get("leaveUnit") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const fieldErrors: NonNullable<LeaveRequestActionState["fieldErrors"]> = {};

  if (!uuidPattern.test(leaveTypeId)) {
    fieldErrors.leaveTypeId = "Choose a leave type.";
  }
  if (!datePattern.test(startDate)) {
    fieldErrors.startDate = "Choose a valid start date.";
  }
  if (!datePattern.test(endDate)) {
    fieldErrors.endDate = "Choose a valid end date.";
  }
  if (!leaveUnits.has(leaveUnitValue as LeaveUnit)) {
    fieldErrors.leaveUnit = "Choose a day type.";
  }
  if (!reason) {
    fieldErrors.reason = "Tell your approver why you need leave.";
  } else if (reason.length > 1000) {
    fieldErrors.reason = "Reason must be 1,000 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      requestId: null,
      fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      status: "error",
      message: "Your session expired. Sign in and try again.",
      requestId: null,
    };
  }

  const { data, error } = await supabase.rpc("submit_leave_request", {
    p_leave_type_id: leaveTypeId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_leave_unit: leaveUnitValue as LeaveUnit,
    p_reason: reason,
  });

  if (error) {
    const knownMessages = [
      "End date cannot be before start date.",
      "A leave request must stay within one calendar year.",
      "Half-day leave must use a single date.",
      "Half-day leave must be on a working day.",
      "The selected range has no working days.",
      "Insufficient leave balance.",
      "This request overlaps an existing pending or approved request.",
      "Employee profile is missing or inactive.",
      "Leave type is unavailable.",
    ];
    const safeMessage = knownMessages.find((message) =>
      error.message.includes(message),
    );
    return {
      status: "error",
      message: safeMessage ?? "The request could not be submitted. Try again.",
      requestId: null,
    };
  }

  revalidatePath("/employee/leave-request");
  return {
    status: "success",
    message: "Leave request submitted and added to your records.",
    requestId: data,
  };
}
