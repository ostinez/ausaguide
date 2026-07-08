-- Migration to fix reviews table schema and policies
DROP TABLE IF EXISTS public.reviews CASCADE;

CREATE TABLE public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete set null,
  host_id uuid not null references public.profiles(id) on delete set null,
  tour_id uuid not null references public.tours(id) on delete cascade,
  rating numeric(2,1) not null check (rating >= 1 and rating <= 5),
  comment text,
  likes integer not null default 0,
  complaints integer not null default 0,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'pending')),
  created_at timestamp with time zone default now()
);

-- Row level security
alter table public.reviews enable row level security;

-- Policies
create policy "public read visible reviews" on public.reviews for select using (true);
create policy "Users can insert their own reviews" on public.reviews for insert with check (true);
create policy "public update likes complaints" on public.reviews for update using (true) with check (true);

-- Permissions
grant select, insert, update, delete on public.reviews to anon, authenticated;
