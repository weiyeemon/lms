export type LeaveUnit =
  | "full_day"
  | "half_day_morning"
  | "half_day_afternoon";

export type LeaveTypeOption = {
  id: string;
  code: "personal" | "medical";
  name: string;
  requiresDocument: boolean;
};

export type LeaveBalanceSummary = {
  leaveTypeId: string;
  remainingDays: number;
};

export type LeaveRequestRecord = {
  id: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string | null;
  decisionNote: string | null;
  createdAt: string;
};

export type LeaveRequestActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  requestId: string | null;
  fieldErrors?: Partial<
    Record<"leaveTypeId" | "startDate" | "endDate" | "leaveUnit" | "reason", string>
  >;
};

export const initialLeaveRequestActionState: LeaveRequestActionState = {
  status: "idle",
  message: null,
  requestId: null,
};
