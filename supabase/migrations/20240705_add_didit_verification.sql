-- Migration: Add Didit identity verification fields to public.users table
alter table public.users 
add column if not exists id_verified boolean not null default false,
add column if not exists verification_status text not null default 'pending',
add column if not exists verification_id text,
add column if not exists verification_date timestamptz,
add column if not exists verification_details jsonb;
