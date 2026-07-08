-- Add 2FA columns to profiles table
alter table public.profiles add column if not exists two_factor_enabled boolean not null default false;
alter table public.profiles add column if not exists two_factor_secret text;
alter table public.profiles add column if not exists two_factor_backup_codes text[] default '{}'::text[];
