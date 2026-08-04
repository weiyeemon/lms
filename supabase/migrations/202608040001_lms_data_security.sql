create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  employee_code text not null,
  email text not null,
  first_name text not null,
  last_name text not null,
  role text not null default 'employee',
  employment_status text not null default 'active',
  manager_employee_id uuid references public.employees(id) on delete set null,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_employee_code_not_blank check (length(trim(employee_code)) > 0),
  constraint employees_email_not_blank check (length(trim(email)) > 0),
  constraint employees_email_lowercase check (email = lower(email)),
  constraint employees_role_valid check (role in ('employee', 'admin')),
  constraint employees_status_valid check (
    employment_status in ('active', 'inactive', 'terminated')
  ),
  constraint employees_date_range_valid check (end_date is null or end_date >= start_date),
  constraint employees_not_own_manager check (
    manager_employee_id is null or manager_employee_id <> id
  )
);

create unique index employees_employee_code_unique_idx
  on public.employees (lower(employee_code));
create unique index employees_email_unique_idx
  on public.employees (lower(email));
create index employees_auth_user_id_idx on public.employees (auth_user_id);
create index employees_manager_employee_id_idx on public.employees (manager_employee_id);
create index employees_status_idx on public.employees (employment_status);

create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  annual_entitlement_days numeric(5, 2) not null default 0,
  allow_carry_forward boolean not null default false,
  max_carry_forward_days numeric(5, 2) not null default 0,
  requires_document boolean not null default false,
  paid boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_types_code_not_blank check (length(trim(code)) > 0),
  constraint leave_types_name_not_blank check (length(trim(name)) > 0),
  constraint leave_types_entitlement_nonnegative check (annual_entitlement_days >= 0),
  constraint leave_types_carry_forward_nonnegative check (max_carry_forward_days >= 0),
  constraint leave_types_carry_forward_requires_flag check (
    allow_carry_forward or max_carry_forward_days = 0
  )
);

create index leave_types_active_sort_idx on public.leave_types (active, sort_order, name);

create trigger leave_types_set_updated_at
before update on public.leave_types
for each row execute function public.set_updated_at();

create table public.yearly_leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  balance_year integer not null,
  entitlement_days numeric(6, 2) not null default 0,
  carry_forward_days numeric(6, 2) not null default 0,
  adjustment_days numeric(6, 2) not null default 0,
  used_days numeric(6, 2) not null default 0,
  pending_days numeric(6, 2) not null default 0,
  remaining_days numeric(6, 2) generated always as (
    entitlement_days + carry_forward_days + adjustment_days - used_days - pending_days
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yearly_leave_balances_year_valid check (
    balance_year between 2000 and 2100
  ),
  constraint yearly_leave_balances_entitlement_nonnegative check (entitlement_days >= 0),
  constraint yearly_leave_balances_carry_forward_nonnegative check (carry_forward_days >= 0),
  constraint yearly_leave_balances_used_nonnegative check (used_days >= 0),
  constraint yearly_leave_balances_pending_nonnegative check (pending_days >= 0),
  constraint yearly_leave_balances_employee_year_type_unique unique (
    employee_id,
    leave_type_id,
    balance_year
  )
);

create index yearly_leave_balances_employee_year_idx
  on public.yearly_leave_balances (employee_id, balance_year);
create index yearly_leave_balances_leave_type_idx
  on public.yearly_leave_balances (leave_type_id);

create trigger yearly_leave_balances_set_updated_at
before update on public.yearly_leave_balances
for each row execute function public.set_updated_at();

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  balance_id uuid references public.yearly_leave_balances(id) on delete set null,
  request_status text not null default 'pending',
  start_date date not null,
  end_date date not null,
  leave_unit text not null default 'full_day',
  requested_days numeric(5, 2) not null,
  reason text,
  employee_note text,
  approver_employee_id uuid references public.employees(id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_status_valid check (
    request_status in ('pending', 'approved', 'rejected', 'cancelled')
  ),
  constraint leave_requests_unit_valid check (
    leave_unit in ('full_day', 'half_day_morning', 'half_day_afternoon')
  ),
  constraint leave_requests_date_range_valid check (end_date >= start_date),
  constraint leave_requests_requested_days_positive check (requested_days > 0),
  constraint leave_requests_half_day_single_date check (
    leave_unit = 'full_day' or start_date = end_date
  ),
  constraint leave_requests_decision_state_valid check (
    (
      request_status in ('approved', 'rejected')
      and approver_employee_id is not null
      and decided_at is not null
    )
    or (
      request_status in ('pending', 'cancelled')
      and decided_at is null
    )
  ),
  constraint leave_requests_cancel_state_valid check (
    (request_status = 'cancelled' and cancelled_at is not null)
    or (request_status <> 'cancelled' and cancelled_at is null)
  )
);

create index leave_requests_employee_status_idx
  on public.leave_requests (employee_id, request_status, start_date desc);
create index leave_requests_approver_status_idx
  on public.leave_requests (approver_employee_id, request_status, start_date desc);
create index leave_requests_leave_type_idx on public.leave_requests (leave_type_id);
create index leave_requests_balance_idx on public.leave_requests (balance_id);
create index leave_requests_date_range_idx
  on public.leave_requests (start_date, end_date);

create trigger leave_requests_set_updated_at
before update on public.leave_requests
for each row execute function public.set_updated_at();

create table public.public_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  region text not null default 'default',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_holidays_name_not_blank check (length(trim(name)) > 0),
  constraint public_holidays_region_not_blank check (length(trim(region)) > 0)
);

create index public_holidays_active_date_idx
  on public.public_holidays (active, holiday_date);
create index public_holidays_region_date_idx
  on public.public_holidays (region, holiday_date);

create trigger public_holidays_set_updated_at
before update on public.public_holidays
for each row execute function public.set_updated_at();

create table public.notification_delivery_records (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid references public.leave_requests(id) on delete cascade,
  recipient_employee_id uuid references public.employees(id) on delete set null,
  channel text not null default 'email',
  event_type text not null,
  provider text not null default 'gmail_smtp',
  delivery_status text not null default 'queued',
  to_email text not null,
  subject text not null,
  provider_message_id text,
  idempotency_key text not null unique,
  attempt_count integer not null default 0,
  last_error text,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_delivery_channel_valid check (channel in ('email')),
  constraint notification_delivery_event_type_valid check (
    event_type in (
      'leave_request_submitted',
      'leave_request_approved',
      'leave_request_rejected',
      'leave_request_cancelled'
    )
  ),
  constraint notification_delivery_provider_valid check (
    provider in ('gmail_smtp', 'resend')
  ),
  constraint notification_delivery_status_valid check (
    delivery_status in ('queued', 'sent', 'failed', 'skipped')
  ),
  constraint notification_delivery_to_email_not_blank check (length(trim(to_email)) > 0),
  constraint notification_delivery_subject_not_blank check (length(trim(subject)) > 0),
  constraint notification_delivery_attempt_count_nonnegative check (attempt_count >= 0),
  constraint notification_delivery_sent_state_valid check (
    (delivery_status = 'sent' and sent_at is not null)
    or (delivery_status <> 'sent')
  ),
  constraint notification_delivery_failed_state_valid check (
    (delivery_status = 'failed' and failed_at is not null)
    or (delivery_status <> 'failed')
  )
);

create index notification_delivery_leave_request_idx
  on public.notification_delivery_records (leave_request_id);
create index notification_delivery_recipient_idx
  on public.notification_delivery_records (recipient_employee_id);
create index notification_delivery_status_queued_idx
  on public.notification_delivery_records (delivery_status, queued_at);
create index notification_delivery_event_type_idx
  on public.notification_delivery_records (event_type);

create trigger notification_delivery_records_set_updated_at
before update on public.notification_delivery_records
for each row execute function public.set_updated_at();

insert into public.leave_types (
  code,
  name,
  description,
  annual_entitlement_days,
  allow_carry_forward,
  max_carry_forward_days,
  requires_document,
  paid,
  active,
  sort_order
) values
  ('personal', 'Personal Leave', 'Paid personal leave entitlement.', 12, true, 5, false, true, true, 10),
  ('medical', 'Medical Leave', 'Paid medical leave. Documentation may be required by policy.', 7, false, 0, true, true, true, 20)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  annual_entitlement_days = excluded.annual_entitlement_days,
  allow_carry_forward = excluded.allow_carry_forward,
  max_carry_forward_days = excluded.max_carry_forward_days,
  requires_document = excluded.requires_document,
  paid = excluded.paid,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employees.id
  from public.employees
  where employees.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_employee_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employees
    where employees.auth_user_id = auth.uid()
      and employees.role = 'admin'
      and employees.employment_status = 'active'
  )
$$;

revoke all on function public.current_employee_id() from public;
revoke all on function public.current_employee_is_admin() from public;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.current_employee_is_admin() to authenticated;

alter table public.employees enable row level security;
alter table public.leave_types enable row level security;
alter table public.yearly_leave_balances enable row level security;
alter table public.leave_requests enable row level security;
alter table public.public_holidays enable row level security;
alter table public.notification_delivery_records enable row level security;

alter table public.employees force row level security;
alter table public.leave_types force row level security;
alter table public.yearly_leave_balances force row level security;
alter table public.leave_requests force row level security;
alter table public.public_holidays force row level security;
alter table public.notification_delivery_records force row level security;

create policy employees_select_own_or_admin
on public.employees for select to authenticated
using (auth_user_id = auth.uid() or public.current_employee_is_admin());

create policy employees_admin_insert
on public.employees for insert to authenticated
with check (public.current_employee_is_admin());

create policy employees_admin_update
on public.employees for update to authenticated
using (public.current_employee_is_admin())
with check (public.current_employee_is_admin());

create policy employees_admin_delete
on public.employees for delete to authenticated
using (public.current_employee_is_admin());

create policy leave_types_select_authenticated
on public.leave_types for select to authenticated
using (active or public.current_employee_is_admin());

create policy leave_types_admin_insert
on public.leave_types for insert to authenticated
with check (public.current_employee_is_admin());

create policy leave_types_admin_update
on public.leave_types for update to authenticated
using (public.current_employee_is_admin())
with check (public.current_employee_is_admin());

create policy leave_types_admin_delete
on public.leave_types for delete to authenticated
using (public.current_employee_is_admin());

create policy yearly_leave_balances_select_own_or_admin
on public.yearly_leave_balances for select to authenticated
using (employee_id = public.current_employee_id() or public.current_employee_is_admin());

create policy yearly_leave_balances_admin_insert
on public.yearly_leave_balances for insert to authenticated
with check (public.current_employee_is_admin());

create policy yearly_leave_balances_admin_update
on public.yearly_leave_balances for update to authenticated
using (public.current_employee_is_admin())
with check (public.current_employee_is_admin());

create policy yearly_leave_balances_admin_delete
on public.yearly_leave_balances for delete to authenticated
using (public.current_employee_is_admin());

create policy leave_requests_select_related_or_admin
on public.leave_requests for select to authenticated
using (
  employee_id = public.current_employee_id()
  or approver_employee_id = public.current_employee_id()
  or public.current_employee_is_admin()
);

create policy leave_requests_employee_insert_pending
on public.leave_requests for insert to authenticated
with check (
  employee_id = public.current_employee_id()
  and request_status = 'pending'
);

create policy leave_requests_employee_update_own_pending
on public.leave_requests for update to authenticated
using (
  employee_id = public.current_employee_id()
  and request_status = 'pending'
)
with check (
  employee_id = public.current_employee_id()
  and request_status in ('pending', 'cancelled')
);

create policy leave_requests_admin_update
on public.leave_requests for update to authenticated
using (public.current_employee_is_admin())
with check (public.current_employee_is_admin());

create policy leave_requests_admin_delete
on public.leave_requests for delete to authenticated
using (public.current_employee_is_admin());

create policy public_holidays_select_authenticated
on public.public_holidays for select to authenticated
using (active or public.current_employee_is_admin());

create policy public_holidays_admin_insert
on public.public_holidays for insert to authenticated
with check (public.current_employee_is_admin());

create policy public_holidays_admin_update
on public.public_holidays for update to authenticated
using (public.current_employee_is_admin())
with check (public.current_employee_is_admin());

create policy public_holidays_admin_delete
on public.public_holidays for delete to authenticated
using (public.current_employee_is_admin());

create policy notification_delivery_select_recipient_or_admin
on public.notification_delivery_records for select to authenticated
using (
  recipient_employee_id = public.current_employee_id()
  or public.current_employee_is_admin()
);

create policy notification_delivery_admin_insert
on public.notification_delivery_records for insert to authenticated
with check (public.current_employee_is_admin());

create policy notification_delivery_admin_update
on public.notification_delivery_records for update to authenticated
using (public.current_employee_is_admin())
with check (public.current_employee_is_admin());

create policy notification_delivery_admin_delete
on public.notification_delivery_records for delete to authenticated
using (public.current_employee_is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.employees,
  public.leave_types,
  public.yearly_leave_balances,
  public.leave_requests,
  public.public_holidays,
  public.notification_delivery_records
to authenticated;
