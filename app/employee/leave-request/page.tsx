import { redirect } from "next/navigation";

import { signOut } from "@/app/login/actions";
import { getEmployeeLeaveRequestData } from "@/features/leave-requests/data";
import type { LeaveRequestRecord } from "@/features/leave-requests/types";
import { LeaveRequestForm } from "./leave-request-form";

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`));
}

function StatusBadge({ status }: { status: LeaveRequestRecord["status"] }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    cancelled: "bg-slate-200 text-slate-700",
  };
  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default async function LeaveRequestPage() {
  const data = await getEmployeeLeaveRequestData();
  if (data.status === "unauthenticated") {
    redirect("/login");
  }

  if (data.status === "missing_employee") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <section className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
          <h1 className="text-2xl font-semibold text-slate-950">Employee profile required</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Your login is valid, but it is not linked to an active employee record. Ask an administrator to connect your account.
          </p>
          <form action={signOut} className="mt-6">
            <button className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white" type="submit">Sign out</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f6] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Leave Management</p>
            <p className="mt-1 font-semibold">Employee workspace</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{data.employee.firstName} {data.employee.lastName}</p>
              <p className="text-xs text-slate-500">{data.employee.email}</p>
            </div>
            <form action={signOut}>
              <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50" type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold text-emerald-700">New request</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Plan your time away</h1>
          <p className="mt-3 text-lg leading-8 text-slate-600">Choose your dates, review the deduction, and submit the request for approval.</p>
        </section>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold">Leave request details</h2>
            <p className="mt-2 text-sm text-slate-500">Weekends and configured public holidays are excluded automatically.</p>
            <div className="mt-7">
              {data.leaveTypes.length > 0 ? (
                <LeaveRequestForm balances={data.balances} holidayDates={data.holidayDates} leaveTypes={data.leaveTypes} maxRequestDate={data.maxRequestDate} />
              ) : (
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No active leave types are available.</p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <p className="text-sm font-semibold text-emerald-700">My leave requests</p>
              <h2 className="mt-1 text-2xl font-semibold">Request history</h2>
            </div>
            {data.requests.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <p className="font-semibold text-slate-800">No requests yet</p>
                <p className="mt-2 text-sm text-slate-500">Your submitted requests will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr><th className="px-6 py-4">Submitted</th><th className="px-4 py-4">Leave</th><th className="px-4 py-4">Dates</th><th className="px-4 py-4">Days</th><th className="px-4 py-4">Status</th><th className="px-6 py-4">Reason / remark</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.requests.map((request) => (
                      <tr data-request-id={request.id} key={request.id}>
                        <td className="whitespace-nowrap px-6 py-5 text-slate-600">{formatDate(request.createdAt)}</td>
                        <td className="px-4 py-5 font-semibold">{request.leaveTypeName}</td>
                        <td className="whitespace-nowrap px-4 py-5 text-slate-600">{formatDate(request.startDate)}{request.startDate !== request.endDate ? ` - ${formatDate(request.endDate)}` : ""}</td>
                        <td className="px-4 py-5 font-semibold">{request.requestedDays}</td>
                        <td className="px-4 py-5"><StatusBadge status={request.status} /></td>
                        <td className="max-w-64 px-6 py-5 text-slate-600"><span>{request.reason ?? "No reason provided"}</span>{request.decisionNote ? <span className="mt-1 block text-xs text-slate-500">Admin: {request.decisionNote}</span> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
      <style>{`.field-control{width:100%;border-radius:.75rem;border:1px solid #cbd5e1;background:#fff;padding:.75rem 1rem;outline:none;transition:.15s}.field-control:focus{border-color:#059669;box-shadow:0 0 0 4px #d1fae5}`}</style>
    </main>
  );
}
