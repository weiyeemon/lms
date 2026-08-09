import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import type { Database } from "../lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const isConfigured = Boolean(supabaseUrl && serviceRoleKey && email && password);

let admin: SupabaseClient<Database>;
let employeeId: string;

async function findOrCreateUser() {
  const created = await admin.auth.admin.createUser({
    email: email!,
    password: password!,
    email_confirm: true,
  });
  if (created.data.user) return created.data.user;
  if (!created.error?.message.toLowerCase().includes("registered")) {
    throw created.error;
  }

  for (let page = 1; page <= 10; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (result.error) throw result.error;
    const existing = result.data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email!.toLowerCase(),
    );
    if (existing) {
      const updated = await admin.auth.admin.updateUserById(existing.id, {
        password: password!,
        email_confirm: true,
      });
      if (updated.error) throw updated.error;
      return updated.data.user;
    }
    if (result.data.users.length < 100) break;
  }
  throw new Error("Unable to create or find the E2E user.");
}

async function removeE2ERequests() {
  const requests = await admin
    .from("leave_requests")
    .select("id,balance_id,requested_days")
    .eq("employee_id", employeeId)
    .like("reason", "E2E leave request:%");
  if (requests.error) throw requests.error;

  for (const request of requests.data ?? []) {
    const deleted = await admin.from("leave_requests").delete().eq("id", request.id);
    if (deleted.error) throw deleted.error;
    if (!request.balance_id) continue;

    const balance = await admin
      .from("yearly_leave_balances")
      .select("pending_days")
      .eq("id", request.balance_id)
      .single();
    if (balance.error) throw balance.error;
    const updated = await admin
      .from("yearly_leave_balances")
      .update({
        pending_days: Math.max(
          0,
          Number(balance.data.pending_days) - Number(request.requested_days),
        ),
      })
      .eq("id", request.balance_id);
    if (updated.error) throw updated.error;
  }
}

function nextWeekday() {
  const now = new Date();
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + 14);
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  if (date.getUTCFullYear() !== now.getUTCFullYear()) {
    date.setUTCMonth(0, 6);
    while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
      date.setUTCDate(date.getUTCDate() + 1);
    }
  }
  return date.toISOString().slice(0, 10);
}

test.skip(!isConfigured, "Set the Supabase and E2E environment variables first.");

test.beforeAll(async () => {
  admin = createClient<Database>(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const user = await findOrCreateUser();
  const employeeValues = {
    auth_user_id: user.id,
    employee_code: `E2E-${user.id.slice(0, 8)}`,
    email: email!.toLowerCase(),
    first_name: "E2E",
    last_name: "Employee",
    role: "employee" as const,
    employment_status: "active" as const,
    start_date: "2020-01-01",
  };
  const existingEmployee = await admin
    .from("employees")
    .select("id")
    .eq("email", email!.toLowerCase())
    .maybeSingle();
  if (existingEmployee.error) throw existingEmployee.error;

  if (existingEmployee.data) {
    const updatedEmployee = await admin
      .from("employees")
      .update(employeeValues)
      .eq("id", existingEmployee.data.id)
      .select("id")
      .single();
    if (updatedEmployee.error) throw updatedEmployee.error;
    employeeId = updatedEmployee.data.id;
  } else {
    const insertedEmployee = await admin
      .from("employees")
      .insert(employeeValues)
      .select("id")
      .single();
    if (insertedEmployee.error) throw insertedEmployee.error;
    employeeId = insertedEmployee.data.id;
  }
  await removeE2ERequests();
});

test.afterAll(async () => {
  if (admin && employeeId) await removeE2ERequests();
});

test("employee submits a leave request and sees the persisted record", async ({
  page,
}) => {
  const leaveDate = nextWeekday();
  const reason = `E2E leave request: ${Date.now()}`;

  await page.goto("/login");
  await page.getByLabel("Work email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Plan your time away" }),
  ).toBeVisible();
  await page.getByLabel("Leave type").selectOption({ label: "Personal Leave" });
  await page.getByLabel("Start date").fill(leaveDate);
  await page.getByLabel("End date").fill(leaveDate);
  await page.getByLabel("Reason").fill(reason);
  await expect(page.getByTestId("deducted-days")).toHaveText("1 day");
  await page.getByRole("button", { name: "Submit request" }).click();

  await expect(
    page.getByText("Leave request submitted and added to your records."),
  ).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: reason });
  await expect(row).toContainText("Personal Leave");
  await expect(row).toContainText("Pending");

  await page.reload();
  await expect(page.getByRole("row").filter({ hasText: reason })).toBeVisible();
});
