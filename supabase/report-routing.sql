-- Run this once in the Supabase SQL Editor to store AI-suggested departments.

alter table public.reports
  add column if not exists target_department text;

-- Recreate the public-safe report view with the new routing field appended.
create or replace view public.public_reports
with (security_invoker = false) as
select
  id,
  place_type,
  location_name,
  issue_category,
  severity,
  affected_people,
  accessibility_impact,
  recommended_action,
  status,
  created_at,
  updated_at,
  target_department
from public.reports;

grant select on public.public_reports to anon, authenticated;

-- Refresh the Supabase API schema cache immediately.
notify pgrst, 'reload schema';
