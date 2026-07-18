-- AccessLens database schema
-- Run this in Supabase Dashboard → SQL Editor → New query.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('citizen', 'admin');
create type public.report_status as enum ('submitted', 'under_review', 'in_progress', 'resolved', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'citizen',
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  place_type text not null,
  location_name text not null,
  user_note text,
  photo_path text,
  issue_category text not null,
  severity text not null,
  affected_people text not null,
  accessibility_impact text not null,
  recommended_action text not null,
  ai_analysis jsonb,
  status public.report_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_updates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  status public.report_status,
  remark text not null,
  created_at timestamptz not null default now()
);

create index reports_citizen_id_idx on public.reports(citizen_id);
create index reports_status_idx on public.reports(status);
create index report_updates_report_id_idx on public.report_updates(report_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_updates enable row level security;

create policy "Citizens can view their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Citizens can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "Citizens can view their own reports"
  on public.reports for select
  to authenticated
  using (citizen_id = auth.uid() or public.is_admin());

create policy "Citizens can create their own reports"
  on public.reports for insert
  to authenticated
  with check (citizen_id = auth.uid());

create policy "Admins can update reports"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Citizens can view updates on their reports"
  on public.report_updates for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.reports
      where reports.id = report_updates.report_id
        and reports.citizen_id = auth.uid()
    )
  );

create policy "Admins can create report updates"
  on public.report_updates for insert
  to authenticated
  with check (public.is_admin() and author_id = auth.uid());

-- Add these tables to Supabase Realtime so status updates and remarks can appear live.
alter publication supabase_realtime add table public.reports;
alter publication supabase_realtime add table public.report_updates;

-- After your first account signs up, make it an administrator by replacing the UUID:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
