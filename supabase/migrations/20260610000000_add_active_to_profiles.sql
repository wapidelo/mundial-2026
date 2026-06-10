-- Add active column to profiles (default true = all existing users remain active)
alter table profiles
  add column if not exists active boolean not null default true;

-- Allow admin service role to update any profile's active status
-- (service_role bypasses RLS by default, so no extra policy needed)
