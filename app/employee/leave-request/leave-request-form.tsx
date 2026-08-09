"use client";

import { useActionState, useMemo, useState } from "react";

import { calculateRequestedDays } from "@/features/leave-requests/calculation";
import {
  initialLeaveRequestActionState,
  type LeaveBalanceSummary,
  type LeaveTypeOption,
  type LeaveUnit,
} from "@/features/leave-requests/types";
import { submitLeaveRequest } from "./actions";

type Props = {
  leaveTypes: LeaveTypeOption[];
  balances: LeaveBalanceSummary[];
  holidayDates: string[];
  maxRequestDate: string;
};

export function LeaveRequestForm({
  leaveTypes,
  balances,
  holidayDates,
  maxRequestDate,
}: Props) {
  const [state, formAction, pending] = useActionState(
    submitLeaveRequest,
    initialLeaveRequestActionState,
  );
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveUnit, setLeaveUnit] = useState<LeaveUnit>("full_day");

  const duration = useMemo(() => {
    if (!startDate || !endDate) {
      return null;
    }
    return calculateRequestedDays({
      startDate,
      endDate,
      leaveUnit,
      holidayDates,
    });
  }, [endDate, holidayDates, leaveUnit, startDate]);

  const selectedBalance = balances.find(
    (balance) => balance.leaveTypeId === leaveTypeId,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          error={state.fieldErrors?.leaveTypeId}
          htmlFor="leaveTypeId"
          label="Leave type"
        >
          <select
            className="field-control"
            id="leaveTypeId"
            name="leaveTypeId"
            onChange={(event) => setLeaveTypeId(event.target.value)}
            required
            value={leaveTypeId}
          >
            {leaveTypes.map((leaveType) => (
              <option key={leaveType.id} value={leaveType.id}>
                {leaveType.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="rounded-2xl bg-emerald-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Available balance
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-950">
            {selectedBalance ? selectedBalance.remainingDays : "Not used yet"}
            {selectedBalance ? " days" : ""}
          </p>
          {!selectedBalance ? (
            <p className="mt-1 text-xs text-emerald-800">
              Your annual entitlement is created with your first request.
            </p>
          ) : null}
        </div>
        <Field
          error={state.fieldErrors?.startDate}
          htmlFor="startDate"
          label="Start date"
        >
          <input
            className="field-control"
            id="startDate"
            max={maxRequestDate}
            name="startDate"
            onChange={(event) => {
              setStartDate(event.target.value);
              if (!endDate) setEndDate(event.target.value);
            }}
            required
            type="date"
            value={startDate}
          />
        </Field>
        <Field
          error={state.fieldErrors?.endDate}
          htmlFor="endDate"
          label="End date"
        >
          <input
            className="field-control"
            id="endDate"
            max={maxRequestDate}
            min={startDate || undefined}
            name="endDate"
            onChange={(event) => setEndDate(event.target.value)}
            required
            type="date"
            value={endDate}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">Day type</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["full_day", "Full day"],
            ["half_day_morning", "First half"],
            ["half_day_afternoon", "Second half"],
          ].map(([value, label]) => (
            <label
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition has-checked:border-emerald-600 has-checked:bg-emerald-50"
              key={value}
            >
              <input
                checked={leaveUnit === value}
                className="accent-emerald-700"
                name="leaveUnit"
                onChange={() => setLeaveUnit(value as LeaveUnit)}
                type="radio"
                value={value}
              />
              {label}
            </label>
          ))}
        </div>
        {state.fieldErrors?.leaveUnit ? (
          <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.leaveUnit}</p>
        ) : null}
      </fieldset>

      <Field
        error={state.fieldErrors?.reason}
        htmlFor="reason"
        label="Reason"
      >
        <textarea
          className="field-control min-h-28 resize-y"
          id="reason"
          maxLength={1000}
          name="reason"
          placeholder="Add a concise note for your approver"
          required
        />
      </Field>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Deducted leave
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-950" data-testid="deducted-days">
            {duration?.days != null
              ? `${duration.days} ${duration.days === 1 ? "day" : "days"}`
              : "Select your dates"}
          </p>
          {duration?.error ? (
            <p className="mt-1 text-sm text-rose-600">{duration.error}</p>
          ) : null}
        </div>
        <button
          className="rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending || leaveTypes.length === 0 || Boolean(duration?.error)}
          type="submit"
        >
          {pending ? "Submitting..." : "Submit request"}
        </button>
      </div>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  error,
  htmlFor,
  label,
  children,
}: {
  error?: string;
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
