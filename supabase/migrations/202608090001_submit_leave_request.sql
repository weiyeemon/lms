create or replace function public.submit_leave_request(
  p_leave_type_id uuid,
  p_start_date date,
  p_end_date date,
  p_leave_unit text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id uuid;
  v_leave_type public.leave_types%rowtype;
  v_balance public.yearly_leave_balances%rowtype;
  v_requested_days numeric(5, 2);
  v_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select employees.id
  into v_employee_id
  from public.employees
  where employees.auth_user_id = auth.uid()
    and employees.employment_status = 'active'
  for update;

  if v_employee_id is null then
    raise exception 'Employee profile is missing or inactive.' using errcode = '42501';
  end if;

  if p_end_date < p_start_date then
    raise exception 'End date cannot be before start date.' using errcode = '22007';
  end if;

  if extract(year from p_start_date) <> extract(year from p_end_date) then
    raise exception 'A leave request must stay within one calendar year.' using errcode = '22007';
  end if;

  if p_leave_unit not in ('full_day', 'half_day_morning', 'half_day_afternoon') then
    raise exception 'Invalid leave unit.' using errcode = '22023';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 or length(trim(p_reason)) > 1000 then
    raise exception 'Reason must contain between 1 and 1000 characters.' using errcode = '22023';
  end if;

  select leave_types.*
  into v_leave_type
  from public.leave_types
  where leave_types.id = p_leave_type_id
    and leave_types.active
    and leave_types.code in ('personal', 'medical');

  if v_leave_type.id is null then
    raise exception 'Leave type is unavailable.' using errcode = '22023';
  end if;

  if p_leave_unit <> 'full_day' then
    if p_start_date <> p_end_date then
      raise exception 'Half-day leave must use a single date.' using errcode = '22007';
    end if;

    if extract(isodow from p_start_date) in (6, 7)
      or exists (
        select 1
        from public.public_holidays
        where public_holidays.holiday_date = p_start_date
          and public_holidays.active
      ) then
      raise exception 'Half-day leave must be on a working day.' using errcode = '22007';
    end if;

    v_requested_days := 0.5;
  else
    select count(*)::numeric(5, 2)
    into v_requested_days
    from generate_series(
      p_start_date::timestamp,
      p_end_date::timestamp,
      interval '1 day'
    ) as selected_day
    where extract(isodow from selected_day) between 1 and 5
      and not exists (
        select 1
        from public.public_holidays
        where public_holidays.holiday_date = selected_day::date
          and public_holidays.active
      );
  end if;

  if v_requested_days <= 0 then
    raise exception 'The selected range has no working days.' using errcode = '22007';
  end if;

  if exists (
    select 1
    from public.leave_requests
    where leave_requests.employee_id = v_employee_id
      and leave_requests.request_status in ('pending', 'approved')
      and daterange(leave_requests.start_date, leave_requests.end_date, '[]')
        && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'This request overlaps an existing pending or approved request.' using errcode = '23505';
  end if;

  insert into public.yearly_leave_balances (
    employee_id,
    leave_type_id,
    balance_year,
    entitlement_days
  ) values (
    v_employee_id,
    p_leave_type_id,
    extract(year from p_start_date)::integer,
    v_leave_type.annual_entitlement_days
  )
  on conflict (employee_id, leave_type_id, balance_year) do nothing;

  select yearly_leave_balances.*
  into v_balance
  from public.yearly_leave_balances
  where yearly_leave_balances.employee_id = v_employee_id
    and yearly_leave_balances.leave_type_id = p_leave_type_id
    and yearly_leave_balances.balance_year = extract(year from p_start_date)::integer
  for update;

  if v_balance.remaining_days < v_requested_days then
    raise exception 'Insufficient leave balance.' using errcode = 'P0001';
  end if;

  update public.yearly_leave_balances
  set pending_days = pending_days + v_requested_days
  where id = v_balance.id;

  insert into public.leave_requests (
    employee_id,
    leave_type_id,
    balance_id,
    request_status,
    start_date,
    end_date,
    leave_unit,
    requested_days,
    reason
  ) values (
    v_employee_id,
    p_leave_type_id,
    v_balance.id,
    'pending',
    p_start_date,
    p_end_date,
    p_leave_unit,
    v_requested_days,
    trim(p_reason)
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.submit_leave_request(uuid, date, date, text, text) from public;
grant execute on function public.submit_leave_request(uuid, date, date, text, text) to authenticated;

grant select, insert, update, delete on
  public.employees,
  public.leave_types,
  public.yearly_leave_balances,
  public.leave_requests,
  public.public_holidays,
  public.notification_delivery_records
to service_role;
