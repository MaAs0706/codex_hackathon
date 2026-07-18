-- AccessLens photo storage
-- Run this in Supabase Dashboard → SQL Editor → New query.

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "Citizens can upload their own report photos" on storage.objects;
drop policy if exists "Citizens and admins can read report photos" on storage.objects;
drop policy if exists "Citizens can remove their own unsubmitted photos" on storage.objects;

create policy "Citizens can upload their own report photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Citizens and admins can read report photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'report-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Citizens can remove their own unsubmitted photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
