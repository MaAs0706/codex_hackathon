-- Run this once in the Supabase SQL Editor before using admin assignment.
-- It keeps assignment internal: public report views do not expose this column.

alter table public.reports
  add column if not exists assigned_admin_id uuid
  references public.profiles(id) on delete set null;

create index if not exists reports_assigned_admin_id_idx
  on public.reports (assigned_admin_id);
