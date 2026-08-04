import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "202608040001_lms_data_security.sql",
  ),
  "utf8",
);

const requiredTables = [
  "employees",
  "leave_types",
  "yearly_leave_balances",
  "leave_requests",
  "public_holidays",
  "notification_delivery_records",
] as const;

describe("LMS data security migration", () => {
  test("creates each required LMS table", () => {
    for (const table of requiredTables) {
      expect(migration).toContain(`create table public.${table}`);
    }
  });

  test("enables and forces RLS for each application table", () => {
    for (const table of requiredTables) {
      expect(migration).toContain(
        `alter table public.${table} enable row level security;`,
      );
      expect(migration).toContain(
        `alter table public.${table} force row level security;`,
      );
    }
  });

  test("defines authenticated employee/admin helper functions for policies", () => {
    expect(migration).toContain(
      "create or replace function public.current_employee_id()",
    );
    expect(migration).toContain(
      "create or replace function public.current_employee_is_admin()",
    );
    expect(migration).toContain("where employees.auth_user_id = auth.uid()");
  });

  test("seeds expected leave types idempotently", () => {
    for (const code of ["personal", "medical"]) {
      expect(migration).toContain(`('${code}'`);
    }

    for (const removedCode of ["annual", "sick", "unpaid", "toil"]) {
      expect(migration).not.toContain(`('${removedCode}'`);
    }

    expect(migration).toContain("on conflict (code) do update set");
  });

  test("adds constraints and indexes for high-value access paths", () => {
    expect(migration).toContain(
      "constraint yearly_leave_balances_employee_year_type_unique unique",
    );
    expect(migration).toContain("leave_requests_employee_status_idx");
    expect(migration).toContain("leave_requests_date_range_idx");
    expect(migration).toContain("notification_delivery_status_queued_idx");
    expect(migration).toContain("idempotency_key text not null unique");
  });

  test("prevents employees from writing admin-only tables through RLS policies", () => {
    expect(migration).toContain("employees_admin_insert");
    expect(migration).toContain("yearly_leave_balances_admin_update");
    expect(migration).toContain("public_holidays_admin_delete");
    expect(migration).toContain("notification_delivery_admin_insert");
    expect(migration).toContain("with check (public.current_employee_is_admin())");
  });
});
