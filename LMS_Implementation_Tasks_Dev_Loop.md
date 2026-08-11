# LMS Implementation Tasks --- Dev Loop

## Overview

This document defines the implementation tasks for the Leave Management
System (LMS), including the required outcomes for each development loop.

## Development Tasks

  -----------------------------------------------------------------------------------
  \#                      Branch                              Required Outcome
  ----------------------- ----------------------------------- -----------------------
  0                       `feature/lms-test-foundation`       Configure
                                                              unit/integration
                                                              testing, environment
                                                              validation, Supabase
                                                              dependencies, shared
                                                              application structure,
                                                              and meaningful dev-loop
                                                              test gates.

  1                       `feature/lms-data-security`         Add migrations for
                                                              employees, leave types,
                                                              yearly balances,
                                                              requests, holidays, and
                                                              notification delivery
                                                              records. Include
                                                              constraints, indexes,
                                                              seed leave types, and
                                                              Row Level Security
                                                              policies.

  2                       `feature/lms-auth-shell`            Implement
                                                              email/password
                                                              authentication,
                                                              protected routes,
                                                              role-based navigation,
                                                              employee self-access,
                                                              admin access, logout,
                                                              and unauthorized-state
                                                              handling.

  3                       `feature/lms-leave-calculation`     Implement inclusive
                                                              date calculation,
                                                              weekend and
                                                              public-holiday
                                                              exclusion, half days,
                                                              invalid-range handling,
                                                              and deterministic unit
                                                              tests.

  4                       `feature/lms-employee-balances`     Implement admin
                                                              employee management and
                                                              yearly balances by
                                                              employee and leave
                                                              type, including
                                                              entitlement and manual
                                                              carry-forward
                                                              adjustments.

  5                       `feature/lms-employee-requests`     Build the employee
                                                              dashboard, calculated
                                                              request form, request
                                                              history, balance
                                                              validation, pending-day
                                                              reservation, and
                                                              cancellation of pending
                                                              requests.

  6                       `feature/lms-admin-approvals`       Build the admin request
                                                              queue with filters,
                                                              remarks,
                                                              approve/reject/cancel
                                                              transitions, and atomic
                                                              movement between
                                                              pending and used
                                                              balances.

  7                       `feature/lms-gmail-notifications`   Send server-side Gmail
                                                              notifications for
                                                              submission and status
                                                              changes. Protect
                                                              sensitive details, log
                                                              delivery, support
                                                              retries, prevent
                                                              duplicates, and ensure
                                                              email failures never
                                                              roll back leave
                                                              transactions.

  8                       `feature/lms-mvp-hardening`         Add loading/error/empty
                                                              states, accessibility
                                                              checks, production
                                                              environment
                                                              documentation, security
                                                              review, deployment
                                                              validation, and
                                                              end-to-end tests for
                                                              the main employee/admin
                                                              workflow.
  -----------------------------------------------------------------------------------

------------------------------------------------------------------------

# Task 0 --- Test Foundation

**Branch:** `feature/lms-test-foundation`

## Required Outcome

Configure the project foundation for reliable unit and integration
testing, environment validation, Supabase dependencies, shared
application structure, and meaningful development-loop test gates.

## Scope

-   Establish the testing framework and test directory structure.
-   Configure unit tests for business logic.
-   Configure integration tests for Supabase/database interactions.
-   Add environment-variable validation.
-   Provide a consistent shared application structure.
-   Add scripts for local development and CI/dev-loop validation.
-   Ensure tests can run deterministically.
-   Document required local dependencies and setup.

## Acceptance Criteria

-   Unit tests can be executed with a single package command.
-   Integration tests can be executed against the expected Supabase
    environment.
-   Missing or invalid environment variables fail fast with useful
    messages.
-   Test configuration works locally and in CI.
-   At least one representative unit test and integration test are
    present.
-   Dev-loop test gates are documented and executable.

------------------------------------------------------------------------

# Task 1 --- Data Security

**Branch:** `feature/lms-data-security`

## Required Outcome

Create the core LMS database schema and security model.

## Database Objects

Create migrations for:

-   `employees`
-   `leave_types`
-   `yearly_leave_balances`
-   `leave_requests`
-   `public_holidays`
-   `notification_delivery_records`

## Required Database Features

### Constraints

Implement appropriate:

-   Primary keys
-   Foreign keys
-   Unique constraints
-   `NOT NULL` constraints
-   Check constraints
-   Status/value constraints
-   Date-range validation where appropriate

### Indexes

Add indexes for common access patterns, including:

-   Employee lookups
-   Leave requests by employee
-   Leave requests by status
-   Leave requests by date
-   Yearly balances by employee/year
-   Public holidays by date
-   Notification records by request/status

### Seed Data

Seed the initial leave types:

-   Annual Leave
-   Personal Leave
-   Sick Leave
-   Time Off in Lieu (TOIL)
-   Unpaid Leave

### Row Level Security

Implement Supabase Row Level Security policies covering:

-   Employee self-access
-   Employee access to their own leave requests
-   Employee access to their own balances
-   Admin access to employee and leave-management data
-   Appropriate restrictions on sensitive notification records

## Acceptance Criteria

-   All migrations apply successfully from a clean database.
-   Seed data is repeatable/idempotent where appropriate.
-   Foreign keys and constraints prevent invalid records.
-   Required indexes exist.
-   RLS is enabled on protected tables.
-   Policies are tested for employee and admin scenarios.
-   No sensitive table is unintentionally accessible through the client.

------------------------------------------------------------------------

# Task 2 --- Authentication Shell

**Branch:** `feature/lms-auth-shell`

## Required Outcome

Implement authentication and application-level authorization.

## Features

-   Email/password authentication
-   Login
-   Logout
-   Protected routes
-   Authentication session handling
-   Role-based navigation
-   Employee navigation
-   Admin navigation
-   Employee self-access
-   Admin access
-   Unauthorized-state handling

## Authorization Rules

### Employee

Employees can:

-   View their own dashboard
-   View their own balances
-   Create leave requests
-   View their own request history
-   Cancel eligible pending requests

Employees must not:

-   View another employee's private data
-   Approve/reject requests
-   Modify another employee's balance

### Admin

Admins can:

-   Manage employees
-   Manage yearly balances
-   View and process leave requests
-   Approve/reject/cancel requests
-   Manage relevant administrative data

## Acceptance Criteria

-   Unauthenticated users cannot access protected application routes.
-   Employees cannot access admin-only pages.
-   Admin navigation is only shown to authorized users.
-   Logout invalidates the active session.
-   Unauthorized access displays a clear state.
-   Authorization is enforced server-side/database-side, not only
    through UI hiding.

------------------------------------------------------------------------

# Task 3 --- Leave Calculation

**Branch:** `feature/lms-leave-calculation`

## Required Outcome

Implement deterministic leave-day calculation.

## Calculation Rules

Support:

-   Inclusive start and end dates
-   Weekend exclusion
-   Public-holiday exclusion
-   Full-day requests
-   First-half-day requests
-   Second-half-day requests
-   Invalid date ranges
-   Zero-day results where appropriate

## Examples

### Full Day

A Monday-to-Friday request with no holidays should calculate as:

`5 days`

### Weekend Exclusion

A Friday-to-Monday request should exclude Saturday and Sunday:

`2 working days`

### Half Day

A valid half-day request should calculate as:

`0.5 days`

### Invalid Range

If:

`startDate > endDate`

the request must be rejected.

## Acceptance Criteria

-   Calculation is inclusive.
-   Weekends are excluded.
-   Public holidays are excluded.
-   Half-day requests calculate correctly.
-   Invalid ranges are rejected.
-   Results are deterministic.
-   Unit tests cover normal, boundary, holiday, weekend, and
    invalid-range cases.

------------------------------------------------------------------------

# Task 4 --- Employee Balances

**Branch:** `feature/lms-employee-balances`

## Required Outcome

Allow administrators to manage employees and yearly leave balances.

## Employee Management

Admins can:

-   Create employees
-   Update employee information
-   Activate/deactivate employees
-   Assign roles where permitted
-   View employee records

## Yearly Balances

Manage balances by:

-   Employee
-   Year
-   Leave type

Support:

-   Annual entitlement
-   Carry-forward entitlement
-   Manual carry-forward adjustments
-   Used days
-   Pending/reserved days
-   Remaining balance

## Balance Model

A balance should make it possible to distinguish between:

-   Entitled days
-   Carry-forward days
-   Manual adjustments
-   Pending/reserved days
-   Used days
-   Available/remaining days

## Acceptance Criteria

-   Admins can manage employees.
-   Admins can view yearly balances.
-   Admins can configure entitlement.
-   Admins can make controlled carry-forward adjustments.
-   Balance calculations remain consistent after adjustments.
-   Employees can only see their own balances.

------------------------------------------------------------------------

# Task 5 --- Employee Requests

**Branch:** `feature/lms-employee-requests`

## Required Outcome

Build the employee leave-request workflow.

## Employee Dashboard

Display:

-   Current leave balances
-   Pending requests
-   Recent request history
-   Request status
-   Relevant leave information

## Request Form

Support:

-   Leave type
-   Start date
-   End date
-   Full day / half day
-   Calculated leave days
-   Optional reason/remarks where applicable

## Validation

Validate:

-   Date range
-   Leave type
-   Half-day rules
-   Available balance
-   Public holidays
-   Weekends
-   Duplicate/overlapping requests where applicable

## Pending-Day Reservation

When a request is submitted:

-   The calculated leave days become pending/reserved.
-   Available balance must reflect the reservation.
-   Pending requests must not consume used balance until approved.

## Cancellation

Employees can cancel eligible pending requests.

Cancellation must:

-   Remove the pending reservation.
-   Restore available balance.
-   Update request status.
-   Preserve an auditable request history.

## Acceptance Criteria

-   Employee can submit a valid request.
-   Calculated days are displayed before submission.
-   Insufficient balance prevents submission.
-   Pending days are reserved correctly.
-   Employee can cancel eligible pending requests.
-   Request history displays correct statuses.

------------------------------------------------------------------------

# Task 6 --- Admin Approvals

**Branch:** `feature/lms-admin-approvals`

## Required Outcome

Build the administrative leave approval workflow.

## Request Queue

Admins can:

-   View pending requests
-   Filter by employee
-   Filter by leave type
-   Filter by status
-   Filter by date
-   View request details
-   Add remarks

## Status Transitions

Support appropriate transitions such as:

-   Pending → Approved
-   Pending → Rejected
-   Pending → Cancelled

Invalid status transitions must be rejected.

## Balance Movement

### Approval

When a pending request is approved:

-   Pending/reserved days decrease.
-   Used days increase.
-   Available balance remains consistent.

### Rejection

When rejected:

-   Pending/reserved days decrease.
-   Used days remain unchanged.
-   Available balance is restored.

### Cancellation

When cancelled:

-   Pending/reserved days decrease.
-   Used days are adjusted only when required by the current state.
-   Balance remains consistent.

## Atomicity

Approval/rejection/cancellation and balance movement must be atomic.

A partial update must never leave:

-   Request status incorrect
-   Pending balance incorrect
-   Used balance incorrect
-   Available balance inconsistent

## Acceptance Criteria

-   Admin can filter and process requests.
-   Remarks are persisted where required.
-   Invalid status transitions are blocked.
-   Balance movement is transactional/atomic.
-   Concurrent updates cannot corrupt balances.

------------------------------------------------------------------------

# Task 7 --- Gmail Notifications

**Branch:** `feature/lms-gmail-notifications`

## Required Outcome

Implement reliable server-side Gmail notifications for leave-request
events.

## Notification Events

Send notifications for:

-   Leave request submission
-   Approval
-   Rejection
-   Cancellation/status changes where required

## Security

Emails must:

-   Avoid unnecessary sensitive information.
-   Include only information required by the recipient.
-   Never expose credentials, tokens, or internal security details.

## Delivery Logging

Store notification delivery records containing information such as:

-   Related request/event
-   Recipient
-   Notification type
-   Delivery status
-   Attempt count
-   Error information
-   Timestamps
-   Provider/message identifier where available

## Retry Support

Implement retry handling for transient failures.

Retries must:

-   Be bounded.
-   Avoid duplicate successful deliveries.
-   Record failures.
-   Allow failed notifications to be retried safely.

## Duplicate Prevention

Use an idempotency strategy so the same notification event is not sent
repeatedly due to retries or duplicate processing.

## Transaction Independence

Email failure must never roll back the leave transaction.

For example:

1.  Leave request is approved.
2.  Database transaction commits.
3.  Notification delivery is attempted separately.
4.  Gmail failure is logged.
5.  Leave approval remains successful.

## Acceptance Criteria

-   Notifications are sent server-side.
-   Delivery attempts are logged.
-   Retry handling exists.
-   Duplicate notifications are prevented.
-   Sensitive details are protected.
-   Gmail failure does not roll back leave transactions.

------------------------------------------------------------------------

# Task 8 --- MVP Hardening

**Branch:** `feature/lms-mvp-hardening`

## Required Outcome

Prepare the LMS MVP for production deployment and end-to-end validation.

## UI States

Add appropriate:

-   Loading states
-   Error states
-   Empty states
-   Disabled states
-   Success feedback
-   Validation feedback

## Accessibility

Perform accessibility checks for:

-   Keyboard navigation
-   Form labels
-   Focus management
-   Error messages
-   Color/contrast
-   Button and control semantics
-   Screen-reader-friendly states

## Production Documentation

Document:

-   Required environment variables
-   Supabase configuration
-   Authentication configuration
-   Gmail configuration
-   Database migration process
-   Deployment steps
-   Rollback considerations
-   Local development setup

## Security Review

Review:

-   Authentication
-   Authorization
-   Supabase RLS
-   API/server actions
-   Environment secrets
-   Database permissions
-   Sensitive logging
-   Email contents
-   Input validation
-   Session handling

## Deployment Validation

Verify:

-   Production build succeeds.
-   Database migrations apply correctly.
-   Environment validation succeeds.
-   Authentication works.
-   RLS policies work in production configuration.
-   Gmail notification configuration works.
-   Application health checks pass.

## End-to-End Tests

Cover the main employee/admin workflow:

1.  Employee logs in.
2.  Employee views balance.
3.  Employee creates leave request.
4.  Request is calculated correctly.
5.  Request becomes pending.
6.  Admin views the request.
7.  Admin approves the request.
8.  Balance moves from pending to used.
9.  Notification is generated/sent.
10. Employee sees the updated request status and balance.

Also cover:

-   Employee request cancellation
-   Admin rejection
-   Insufficient balance
-   Unauthorized admin access
-   Invalid date range
-   Weekend/holiday calculation

## Acceptance Criteria

-   Main employee/admin workflow passes end-to-end.
-   Production build succeeds.
-   Accessibility checks pass or documented exceptions exist.
-   Security review is completed.
-   Production configuration is documented.
-   Deployment validation is completed.
-   Critical error/loading/empty states are implemented.

------------------------------------------------------------------------

# Dev-Loop Completion Checklist

## Foundation

-   [ ] Test framework configured
-   [ ] Unit tests configured
-   [ ] Integration tests configured
-   [ ] Environment validation configured
-   [ ] Supabase test dependencies configured
-   [ ] CI/dev-loop test gates configured

## Database

-   [ ] All LMS migrations created
-   [ ] Constraints implemented
-   [ ] Indexes implemented
-   [ ] Leave types seeded
-   [ ] RLS enabled
-   [ ] RLS policies tested

## Authentication

-   [ ] Email/password login
-   [ ] Logout
-   [ ] Protected routes
-   [ ] Role-based navigation
-   [ ] Employee authorization
-   [ ] Admin authorization
-   [ ] Unauthorized state

## Leave Management

-   [ ] Inclusive date calculation
-   [ ] Weekend exclusion
-   [ ] Public-holiday exclusion
-   [ ] Full-day handling
-   [ ] Half-day handling
-   [ ] Invalid-range validation
-   [ ] Balance validation
-   [ ] Pending-day reservation
-   [ ] Employee cancellation
-   [ ] Admin approval
-   [ ] Admin rejection
-   [ ] Admin cancellation
-   [ ] Atomic balance updates

## Notifications

-   [ ] Server-side Gmail integration
-   [ ] Submission notification
-   [ ] Status-change notification
-   [ ] Delivery logging
-   [ ] Retry handling
-   [ ] Duplicate prevention
-   [ ] Sensitive-data protection
-   [ ] Failure isolation from leave transactions

## Hardening

-   [ ] Loading states
-   [ ] Error states
-   [ ] Empty states
-   [ ] Accessibility review
-   [ ] Security review
-   [ ] Production documentation
-   [ ] Deployment validation
-   [ ] End-to-end tests

# Recommended Dev-Loop Gate

Before merging each feature branch:

1.  Run formatting/lint checks.
2.  Run type checking.
3.  Run unit tests.
4.  Run integration tests where applicable.
5.  Run database migration validation for database-related changes.
6.  Verify RLS/security behavior for data-access changes.
7.  Run the relevant end-to-end tests for completed workflows.
8.  Verify production build for hardening/release changes.
9.  Document any intentional exceptions or known limitations.

A feature should be considered complete only when its implementation,
tests, security requirements, and acceptance criteria are all satisfied.
