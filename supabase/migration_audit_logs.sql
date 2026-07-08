-- Create audit_logs table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Public read audit_logs" on public.audit_logs for select using (true);
create policy "Public insert audit_logs" on public.audit_logs for insert with check (true);

grant select, insert on public.audit_logs to anon, authenticated;
alter publication supabase_realtime add table public.audit_logs;
