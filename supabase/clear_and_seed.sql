-- Clear all dummy data from Supabase tables
truncate table public.reviews cascade;
truncate table public.bookings cascade;
truncate table public.tours cascade;
truncate table public.hosts cascade;
truncate table public.profiles cascade;

-- Seed Admin, Traveler, and Host Profiles
insert into public.profiles (id, email, full_name, role, bio, location, languages, host_type, is_verified) values
  -- Admin profile
  ('33333333-3333-3333-3333-333333333301', 'ostinez48@gmail.com', 'Super Admin', 'admin', 
   'System administrator for Ausaguide.', 'Nairobi', array['English', 'Swahili'], null, true),
  
  -- Test Traveler 1
  ('22222222-2222-2222-2222-222222222201', 'james.traveler@example.com', 'James Mwangi', 'traveler', 
   'Avid explorer.', 'Nairobi', array['English', 'Swahili'], null, false),
  
  -- Test Traveler 2
  ('22222222-2222-2222-2222-222222222202', 'traveler@ausaguide.com', 'Test Traveler', 'traveler', 
   'Adventure seeker looking to explore Nairobi.', 'Nairobi', array['English'], null, false),
  
  -- Host 1: Austin Murithi (Certified Guide)
  ('11111111-1111-1111-1111-111111111105', 'austin@ausaguide.com', 'Austin Murithi', 'host', 
   'I''m a certified tour guide with 5 years of experience in Nairobi. I love showing travelers the hidden gems of Kenya.', 
   'Nairobi, Kenya', array['English', 'Swahili'], 'certified_guide', true),
  
  -- Host 2: Amina Osei (Local Host)
  ('11111111-1111-1111-1111-111111111101', 'amina@ausaguide.com', 'Amina Osei', 'host', 
   'Born and raised in Nairobi, I''ve spent 12 years exploring the city''s food scene. I''d love to share it with you.', 
   'Nairobi, Kenya', array['English', 'Swahili'], 'local_host', true);

-- Seed Host Applications (Hosts Table)
insert into public.hosts (id, user_id, full_name, email, city, host_type, bio, status) values
  -- Host 1: Austin
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05', '11111111-1111-1111-1111-111111111105', 
   'Austin Murithi', 'austin@ausaguide.com', 'Nairobi, Kenya', 'certified_guide', 
   'I''m a certified tour guide with 5 years of experience in Nairobi. I love showing travelers the hidden gems of Kenya.', 
   'approved'),
  
  -- Host 2: Amina
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '11111111-1111-1111-1111-111111111101', 
   'Amina Osei', 'amina@ausaguide.com', 'Nairobi, Kenya', 'local_host', 
   'Born and raised in Nairobi, I''ve spent 12 years exploring the city''s food scene. I''d love to share it with you.', 
   'approved');

-- Seed Tours for both Hosts
insert into public.tours (
  id, host_id, title, description, short_description, price, duration_hours, max_guests,
  location_name, latitude, longitude, category, tour_type, highlights, is_published, rating, review_count
) values
  -- Austin's Tour 1
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '11111111-1111-1111-1111-111111111105',
   'Nairobi Street Food Safari',
   'Taste authentic Kenyan street food while exploring the bustling streets of Nairobi.',
   'Taste authentic Kenyan street food across Nairobi.',
   3500, 3, 8, 'Nairobi, Kenya', -1.2921, 36.8219, 'food', 'in_person',
   array['12 food tastings across 5 neighbourhoods', 'Behind-the-scenes vendor introductions', 'Small group experience'],
   true, 0.0, 0),
  
  -- Austin's Tour 2
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '11111111-1111-1111-1111-111111111105',
   'Nairobi National Park Safari',
   'See lions, giraffes, and rhinos with the city skyline in the background.',
   'See wildlife with the city skyline backdrop.',
   6500, 4, 6, 'Nairobi National Park', -1.3721, 36.8584, 'nature', 'in_person',
   array['See lions, giraffes, and rhinos', 'City skyline view'],
   true, 0.0, 0),

  -- Amina's Tour 1
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', '11111111-1111-1111-1111-111111111101',
   'Kibera Community Walk',
   'Walk through Kibera, learn about the community, meet local artisans.',
   'Walk through Kibera and meet local artisans.',
   2500, 2, 10, 'Kibera, Nairobi', -1.3133, 36.7880, 'culture', 'in_person',
   array['Meet local artisans', 'Learn about the community'],
   true, 0.0, 0),
  
  -- Amina's Tour 2
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', '11111111-1111-1111-1111-111111111101',
   'Nairobi Night Food Tour',
   'Explore Nairobi''s vibrant night markets and taste the city''s best evening street food.',
   'Explore night markets and evening street food.',
   4200, 3.5, 8, 'Nairobi Night Markets', -1.2864, 36.8172, 'food', 'in_person',
   array['Taste night market delicacies', 'Explore vibrant evening spots'],
   true, 0.0, 0);

-- Enable permissive RLS policies to allow CRUD operations by authenticated and anonymous client app actions
-- profiles
drop policy if exists "Public read host profiles" on public.profiles;
drop policy if exists "Public read traveler profiles" on public.profiles;
create policy "Allow read access to profiles for anyone" on public.profiles for select using (true);
create policy "Allow update access to profiles for anyone" on public.profiles for update using (true) with check (true);
create policy "Allow insert access to profiles for anyone" on public.profiles for insert with check (true);
create policy "Allow delete access to profiles for anyone" on public.profiles for delete using (true);

-- tours
drop policy if exists "Public read published tours" on public.tours;
create policy "Allow read access to tours for anyone" on public.tours for select using (true);
create policy "Allow update access to tours for anyone" on public.tours for update using (true) with check (true);
create policy "Allow insert access to tours for anyone" on public.tours for insert with check (true);
create policy "Allow delete access to tours for anyone" on public.tours for delete using (true);

-- hosts
drop policy if exists "Users can insert their own host application" on public.hosts;
drop policy if exists "Public read approved hosts" on public.hosts;
drop policy if exists "Public read pending own applications" on public.hosts;
drop policy if exists "Admin read all hosts" on public.hosts;
drop policy if exists "Admin update hosts" on public.hosts;

create policy "Allow read access to hosts for anyone" on public.hosts for select using (true);
create policy "Allow update access to hosts for anyone" on public.hosts for update using (true) with check (true);
create policy "Allow insert access to hosts for anyone" on public.hosts for insert with check (true);
create policy "Allow delete access to hosts for anyone" on public.hosts for delete using (true);

-- bookings
drop policy if exists "Public read bookings" on public.bookings;
drop policy if exists "Public insert bookings" on public.bookings;
drop policy if exists "Public update bookings" on public.bookings;

create policy "Allow read access to bookings for anyone" on public.bookings for select using (true);
create policy "Allow update access to bookings for anyone" on public.bookings for update using (true) with check (true);
create policy "Allow insert access to bookings for anyone" on public.bookings for insert with check (true);
create policy "Allow delete access to bookings for anyone" on public.bookings for delete using (true);

-- reviews
drop policy if exists "public read visible reviews" on public.reviews;
drop policy if exists "Users can insert their own reviews" on public.reviews;
drop policy if exists "public update likes complaints" on public.reviews;
drop policy if exists "Allow read access to reviews for anyone" on public.reviews;
drop policy if exists "Allow update access to reviews for anyone" on public.reviews;
drop policy if exists "Allow insert access to reviews for anyone" on public.reviews;
drop policy if exists "Allow delete access to reviews for anyone" on public.reviews;

create policy "Allow read access to reviews for anyone" on public.reviews for select using (true);
create policy "Allow update access to reviews for anyone" on public.reviews for update using (true) with check (true);
create policy "Users can insert their own reviews" on public.reviews for insert with check (true);
create policy "Allow delete access to reviews for anyone" on public.reviews for delete using (true);

-- notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete cascade,
  message text not null,
  type text not null default 'booking_request',
  read boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.notifications enable row level security;

create policy "Allow read access to notifications for anyone" on public.notifications for select using (true);
create policy "Allow update access to notifications for anyone" on public.notifications for update using (true) with check (true);
create policy "Allow insert access to notifications for anyone" on public.notifications for insert with check (true);
create policy "Allow delete access to notifications for anyone" on public.notifications for delete using (true);

-- Grant full schema permissions to anon and authenticated users
alter table public.bookings add column if not exists decline_reason text;
alter table public.bookings add column if not exists currency text default 'KES';
alter table public.tours add column if not exists availability jsonb default '{}'::jsonb;
alter table public.tours add column if not exists status text default 'draft' check (status in ('draft', 'published'));
alter table public.tours add column if not exists tags text[] default '{}';

grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.tours to anon, authenticated;
grant select, insert, update, delete on public.hosts to anon, authenticated;
grant select, insert, update, delete on public.bookings to anon, authenticated;
grant select, insert, update, delete on public.reviews to anon, authenticated;
grant select, insert, update, delete on public.notifications to anon, authenticated;

-- messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.messages enable row level security;

create policy "Allow read access to messages for anyone" on public.messages for select using (true);
create policy "Allow update access to messages for anyone" on public.messages for update using (true) with check (true);
create policy "Allow insert access to messages for anyone" on public.messages for insert with check (true);
create policy "Allow delete access to messages for anyone" on public.messages for delete using (true);

grant select, insert, update, delete on public.messages to anon, authenticated;

-- host_settings: fix RLS to allow anon writes (app uses localStorage auth, not Supabase Auth)
drop policy if exists "Public read host settings" on public.host_settings;
drop policy if exists "Host manage settings" on public.host_settings;
create policy "Allow read access to host_settings for anyone" on public.host_settings for select using (true);
create policy "Allow insert access to host_settings for anyone" on public.host_settings for insert with check (true);
create policy "Allow update access to host_settings for anyone" on public.host_settings for update using (true) with check (true);
create policy "Allow delete access to host_settings for anyone" on public.host_settings for delete using (true);
grant select, insert, update, delete on public.host_settings to anon, authenticated;

-- host_availability: fix RLS to allow anon writes
drop policy if exists "Public read host availability" on public.host_availability;
drop policy if exists "Host manage availability" on public.host_availability;
create policy "Allow read access to host_availability for anyone" on public.host_availability for select using (true);
create policy "Allow insert access to host_availability for anyone" on public.host_availability for insert with check (true);
create policy "Allow update access to host_availability for anyone" on public.host_availability for update using (true) with check (true);
create policy "Allow delete access to host_availability for anyone" on public.host_availability for delete using (true);
grant select, insert, update, delete on public.host_availability to anon, authenticated;

-- Enable Realtime replication for dynamic updates
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.messages;
