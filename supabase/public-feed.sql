-- Public AccessLens report feed
-- Run this in Supabase Dashboard → SQL Editor → New query.
-- This exposes only report information suitable for public viewing.
-- Citizen identity, private notes, and evidence-photo paths remain private.

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

create or replace view public.public_report_updates
with (security_invoker = false) as
select
  id,
  report_id,
  status,
  remark,
  created_at
from public.report_updates;

grant select on public.public_reports to anon, authenticated;
grant select on public.public_report_updates to anon, authenticated;
