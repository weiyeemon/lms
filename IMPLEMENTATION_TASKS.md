# Leave Management System Implementation Tasks

This file tracks implementation work for the LMS project. Tasks are grouped so each item can be implemented and verified independently.

## Task 0 - Test Foundation

Status: Completed

Goal: Establish the project test foundation and local safety checks.

Completed scope:

- Added unit and migration test coverage.
- Added environment validation tests.
- Added local analysis/output ignores.
- Confirmed core verification commands are available through npm scripts.

Verification:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Task 1 - Data Security And Leave Schema

Status: Completed

Goal: Add the database structure and security policies for annual leave management.

Completed scope:

- Added Supabase migrations for employees, leave types, yearly balances, leave requests, public holidays, and notification delivery records.
- Seeded supported leave types: personal and medical.
- Added constraints, indexes, triggers, helper functions, and Row Level Security policies.
- Added request submission database function with working-day calculation, balance handling, and overlap prevention.

Verification:

```bash
npm test
```

## Task 2 - Employee Leave Request Flow

Status: Completed

Goal: Allow an employee to sign in, submit a leave request, and see the submitted request in history.

Completed scope:

- Added login page and Supabase password sign-in action.
- Added employee leave request page.
- Added leave request form for personal and medical leave.
- Shows current request history after submission.
- Added Playwright E2E coverage for the leave request flow.
- Added deployment environment checklist in `README.md`.

Verification:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

## Task 3 - Admin Leave Approval

Status: Not started

Goal: Allow an admin user to review pending leave requests and approve or reject them.

Implementation scope:

- Add an admin dashboard route for users whose employee role is `admin`.
- Show pending requests with employee name, leave type, date range, requested days, reason, and remaining balance.
- Add approve and reject actions.
- Require a decision note when rejecting.
- Store `request_status`, `approver_employee_id`, `decision_note`, and `decided_at`.
- Update balances only through controlled database functions.
- Prevent employees from approving their own requests unless explicitly allowed later.
- Add empty, loading, success, and error states.

Acceptance criteria:

- Admin can see all pending requests.
- Admin can approve a request and the employee history shows `Approved`.
- Admin can reject a request with a note and the employee history shows `Rejected`.
- Non-admin users cannot open or use the admin route.
- Duplicate decisions on the same request are rejected.

Verification:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Task 4 - Email Notification Delivery

Status: Not started

Goal: Notify employees and approvers when leave request status changes.

Implementation scope:

- Use the existing `notification_delivery_records` table as the delivery audit log.
- Add queued notification records for request submitted, approved, and rejected events.
- Add a server-side email sender integration.
- For Gmail SMTP, use an app password or OAuth-based provider credential, never a normal Gmail password.
- Store email credentials only in deployment environment variables.
- Add retry/error tracking by updating `delivery_status`, `attempt_count`, `last_error`, and `sent_at`.

Acceptance criteria:

- Submitting a leave request queues or sends an email to the approver/admin.
- Approving or rejecting a request queues or sends an email to the employee.
- Failed sends are recorded without breaking the leave decision transaction.
- No email secret is exposed to browser code or committed files.

Verification:

```bash
npm test
npm run lint
npx tsc --noEmit
```

## Task 5 - Employee And Balance Administration

Status: Not started

Goal: Give admins a safe way to maintain employee profiles and annual leave balances.

Implementation scope:

- Add admin employee list and detail pages.
- Link Supabase auth users to employee records through `auth_user_id`.
- Manage employee role, manager, employment status, and start/end dates.
- Initialize or adjust yearly balances for personal and medical leave.
- Add validation for lowercase unique email and unique employee code.

Acceptance criteria:

- Admin can create and update employee records.
- Admin can link an auth user to an employee.
- Admin can initialize annual balances for the current year.
- Employees can only view their own data.

Verification:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Task 6 - Production Deployment And Operations

Status: In progress

Goal: Keep the deployed Vercel app connected to the correct Supabase project and make testing repeatable.

Implementation scope:

- Confirm Supabase project ownership and organization transfer if needed.
- Confirm hosted database migrations are applied.
- Confirm Vercel environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Do not deploy `SUPABASE_SERVICE_ROLE_KEY` to the application runtime.
- Add an admin seed/runbook for creating the first admin employee account.
- Add a smoke-test checklist for login, request submission, and request history.

Acceptance criteria:

- Public Vercel URL loads successfully.
- Employee can log in and submit a request against the deployed Supabase DB.
- Request persists after refresh.
- Admin account setup is documented and repeatable.

Verification:

```bash
npm run build
```

Manual smoke test:

1. Open the deployed app.
2. Sign in as a linked employee.
3. Submit one personal or medical leave request.
4. Confirm the request appears in history after refresh.

