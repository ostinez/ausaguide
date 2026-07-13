-- Ausaguide Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

-- Drop existing tables in correct dependency order to allow schema recreation
drop table if exists public.bookings cascade;
drop table if exists public.tours cascade;
drop table if exists public.hosts cascade;
drop table if exists public.profiles cascade;

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  avatar_url text,
  role text not null default 'traveler'
    check (role in ('traveler', 'host', 'admin')),
  bio text,
  location text,
  phone text,
  languages text[] not null default '{}',
  host_type text check (host_type is null or host_type in ('local_host', 'certified_guide')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Host applications ───────────────────────────────────────────────────────
create table if not exists public.hosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  city text not null,
  host_type text not null check (host_type in ('local_host', 'certified_guide')),
  bio text not null,
  video_url text,
  id_upload_url text,
  license_upload_url text,
  rejection_reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ── Tours ───────────────────────────────────────────────────────────────────
create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  short_description text not null,
  price numeric(10, 2) not null,
  currency text not null default 'KES',
  duration_hours numeric(4, 1) not null,
  max_guests integer not null,
  location_name text not null,
  latitude numeric(10, 6) not null,
  longitude numeric(10, 6) not null,
  category text not null
    check (category in ('culture', 'food', 'adventure', 'nature', 'city', 'nightlife')),
  tour_type text not null check (tour_type in ('virtual', 'in_person')),
  images text[] not null default '{}',
  highlights text[] not null default '{}',
  is_published boolean not null default false,
  rating numeric(2, 1) not null default 0,
  review_count integer not null default 0,
  availability jsonb default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Bookings ────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  guest_id uuid references public.profiles(id) on delete set null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  booking_date date not null,
  check_in_date date,
  check_out_date date,
  guest_count integer not null default 1,
  total_price numeric(10, 2) not null,
  currency text not null default 'KES',
  stripe_payment_intent_id text,
  daily_room_url text,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  notes text,
  booking_time time,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Updated-at trigger ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists hosts_updated_at on public.hosts;
create trigger hosts_updated_at
  before update on public.hosts
  for each row execute function public.set_updated_at();

drop trigger if exists tours_updated_at on public.tours;
create trigger tours_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.hosts enable row level security;
alter table public.tours enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Public read host profiles" on public.profiles;
create policy "Public read host profiles"
  on public.profiles for select
  using (role = 'host');

drop policy if exists "Public read traveler profiles" on public.profiles;
create policy "Public read traveler profiles"
  on public.profiles for select
  using (role = 'traveler');

drop policy if exists "Users can update own profiles" on public.profiles;
create policy "Users can update own profiles"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Anyone can submit host application" on public.hosts;
drop policy if exists "Users can insert their own host application" on public.hosts;
create policy "Users can insert their own host application"
  on public.hosts for insert
  with check (true);

drop policy if exists "Public read approved hosts" on public.hosts;
create policy "Public read approved hosts"
  on public.hosts for select
  using (true);

drop policy if exists "Public read pending own applications" on public.hosts;
create policy "Public read pending own applications"
  on public.hosts for select
  using (true);

drop policy if exists "Admin read all hosts" on public.hosts;
create policy "Admin read all hosts"
  on public.hosts for select
  using (true);

drop policy if exists "Admin update hosts" on public.hosts;
create policy "Admin update hosts"
  on public.hosts for update
  using (true)
  with check (true);

drop policy if exists "Public read published tours" on public.tours;
create policy "Public read published tours"
  on public.tours for select
  using (is_published = true);

drop policy if exists "Hosts can insert tours" on public.tours;
create policy "Hosts can insert tours"
  on public.tours for insert
  with check (auth.uid() = host_id);

drop policy if exists "Hosts can update own tours" on public.tours;
create policy "Hosts can update own tours"
  on public.tours for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

drop policy if exists "Public read bookings" on public.bookings;
create policy "Public read bookings"
  on public.bookings for select
  using (auth.uid() = guest_id OR auth.uid() = host_id);

drop policy if exists "Public insert bookings" on public.bookings;
create policy "Public insert bookings"
  on public.bookings for insert
  with check (auth.uid() = guest_id);

drop policy if exists "Public update bookings" on public.bookings;
create policy "Public update bookings"
  on public.bookings for update
  using (auth.uid() = guest_id OR auth.uid() = host_id)
  with check (auth.uid() = guest_id OR auth.uid() = host_id);

-- ── Seed profiles ───────────────────────────────────────────────────────────
insert into public.profiles (id, email, full_name, role, bio, location, languages, host_type, host_tier, is_verified) values
  ('11111111-1111-1111-1111-111111111101', 'amina@ausaguide.com', 'Amina Osei', 'host',
   'Born and raised in Nairobi, Amina has spent 12 years documenting the city''s street food scene.',
   'Nairobi', array['English', 'Swahili'], 'local_host', 'local_host', true),
  ('11111111-1111-1111-1111-111111111102', 'david@ausaguide.com', 'David Kimani', 'host',
   'Certified wildlife guide with 15 years in the Mara ecosystem.',
   'Narok', array['English', 'Swahili'], 'certified_guide', 'certified_guide', true),
  ('11111111-1111-1111-1111-111111111103', 'fatima@ausaguide.com', 'Fatima Hassan', 'host',
   'Seventh-generation Lamu resident and trained archaeologist.',
   'Lamu', array['English', 'Swahili', 'Arabic'], 'certified_guide', 'certified_guide', true),
  ('11111111-1111-1111-1111-111111111104', 'james@ausaguide.com', 'James Mwangi', 'host',
   'Certified mountain rescue technician with 200+ summits of Point Lenana.',
   'Nyeri', array['English', 'Swahili'], 'certified_guide', 'certified_guide', false),
  ('11111111-1111-1111-1111-111111111105', 'hassan@ausaguide.com', 'Hassan Ali', 'host',
   'Cultural walks illuminating Mombasa''s layered heritage.',
   'Mombasa', array['English', 'Swahili'], 'local_host', 'local_host', true),
  ('11111111-1111-1111-1111-111111111106', 'grace@ausaguide.com', 'Grace Otieno', 'host',
   'Home cook and cookbook author preserving Luo culinary traditions.',
   'Kisumu', array['English', 'Luo'], 'local_host', 'local_host', true),
  ('11111111-1111-1111-1111-111111111107', 'peter@ausaguide.com', 'Peter Nderitu', 'host',
   'Wildlife conservationist with the Amboseli Elephant Research Project.',
   'Amboseli', array['English', 'Swahili'], 'certified_guide', 'certified_guide', true),
  ('11111111-1111-1111-1111-111111111108', 'shiro@ausaguide.com', 'Shiro Kamau', 'host',
   'Muralist and urban art curator celebrating Nairobi''s street artists.',
   'Nairobi', array['English', 'Swahili'], 'local_host', 'local_host', false),
  ('11111111-1111-1111-1111-111111111109', 'ole@ausaguide.com', 'Ole Senteu', 'host',
   'Maasai cultural ambassador sharing traditions with audiences worldwide.',
   'Kajiado', array['English', 'Maa', 'Swahili'], 'local_host', 'local_host', true),
  ('11111111-1111-1111-1111-111111111110', 'aisha@ausaguide.com', 'Aisha Mwangi', 'host',
   'Marine biologist running Diani''s beloved boat-to-table experiences.',
   'Diani', array['English', 'Swahili'], 'local_host', 'local_host', true),
  ('11111111-1111-1111-1111-111111111111', 'lucy@ausaguide.com', 'Lucy Njeri', 'host',
   'Historian and certified coffee sommelier based in Karen.',
   'Nairobi', array['English', 'Swahili'], 'certified_guide', 'certified_guide', true),
  ('11111111-1111-1111-1111-111111111112', 'michael@ausaguide.com', 'Michael Kioko', 'host',
   'Tsavo East ranger turned wildlife communicator.',
   'Tsavo', array['English', 'Swahili'], 'certified_guide', 'certified_guide', false),
  ('22222222-2222-2222-2222-222222222201', 'james.traveler@example.com', 'James Mwangi', 'traveler',
   null, 'London', array['English'], null, null, false),
  ('33333333-3333-3333-3333-333333333301', 'admin@ausaguide.com', 'Super Admin', 'admin',
   null, 'Nairobi', array['English', 'Swahili'], null, null, true)
on conflict (id) do nothing;

-- ── Seed tours ───────────────────────────────────────────────────────────────
insert into public.tours (
  id, host_id, title, description, short_description, price, duration_hours, max_guests,
  location_name, latitude, longitude, category, tour_type, highlights, is_published, rating, review_count
) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '11111111-1111-1111-1111-111111111101',
   'Nairobi Street Food Safari',
   'Dive deep into Nairobi''s electric street food culture with a guide who''s eaten everything this city has to offer.',
   'Taste authentic Kenyan street food across Nairobi''s best spots.',
   3500, 3, 8, 'Nairobi, Kenya', -1.2921, 36.8219, 'food', 'in_person',
   array['12 food tastings across 5 neighbourhoods', 'Behind-the-scenes vendor introductions', 'Small group — maximum 8 guests'],
   true, 4.9, 47),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '11111111-1111-1111-1111-111111111102',
   'Maasai Mara Wildlife Virtual Tour',
   'Join David live from the heart of the Maasai Mara for an immersive 90-minute virtual safari.',
   'Virtual safari through the Maasai Mara with a certified guide.',
   1500, 1.5, 20, 'Maasai Mara, Kenya', -1.4061, 35.0111, 'nature', 'virtual',
   array['Live HD stream from inside the Mara', 'Real-time Q&A with your guide', 'Recording available for 48 hours'],
   true, 4.8, 112),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', '11111111-1111-1111-1111-111111111103',
   'Lamu Old Town Heritage Walk',
   'Walk the labyrinthine alleys of Lamu Old Town, a UNESCO World Heritage Site.',
   'Walk through centuries of Swahili culture in Lamu Old Town.',
   4000, 2.5, 6, 'Lamu, Kenya', -2.2717, 40.9020, 'culture', 'in_person',
   array['UNESCO World Heritage Site access', 'Traditional Swahili refreshments included', 'Maximum 6 guests'],
   true, 5.0, 28),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04', '11111111-1111-1111-1111-111111111104',
   'Mount Kenya Sunrise Hike',
   'Reach Point Lenana just in time to watch the sun rise over the African plains below.',
   'Guided sunrise hike on Mount Kenya with an experienced mountaineer.',
   8500, 8, 4, 'Mount Kenya, Kenya', -0.1521, 37.3084, 'adventure', 'in_person',
   array['Summit at Point Lenana (4,985 m)', 'All safety equipment provided', 'Maximum 4 guests for safety'],
   true, 4.7, 19),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05', '11111111-1111-1111-1111-111111111105',
   'Mombasa Old Town Night Walk',
   'Explore Mombasa''s Old Town as the sun sets over the Indian Ocean.',
   'Lantern-lit heritage walk through historic Mombasa.',
   2800, 2, 10, 'Mombasa, Kenya', -4.0435, 39.6682, 'culture', 'in_person',
   array['Fort Jesus exterior with expert narration', 'Spiced chai and coconut rice tasting', 'Small group — maximum 10 guests'],
   true, 4.6, 34),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06', '11111111-1111-1111-1111-111111111106',
   'Virtual Kenyan Home Cooking Class',
   'Cook alongside Grace as she walks you through a full Kenyan lakeside meal from Kisumu.',
   'Live virtual cooking class with a Kenyan home cook.',
   2300, 2, 15, 'Kisumu, Kenya', -0.0917, 34.7680, 'food', 'virtual',
   array['Cook 3-course Kenyan lakeside meal', 'Recipe PDF and video recording included', 'Live Q&A throughout'],
   true, 4.9, 63),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07', '11111111-1111-1111-1111-111111111107',
   'Amboseli Elephant Sanctuary Tour',
   'Four-hour guided experience focused on Kenya''s largest elephant herds.',
   'Elephant tracking with a conservation researcher in Amboseli.',
   7000, 4, 6, 'Amboseli, Kenya', -2.6527, 37.2606, 'nature', 'in_person',
   array['Guided elephant tracking with researcher', 'Kilimanjaro backdrop photography', 'Maximum 6 guests'],
   true, 4.8, 41),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08', '11111111-1111-1111-1111-111111111108',
   'Nairobi CBD Street Art Walk',
   'Discover Nairobi''s open-air gallery with a muralist who knows every brushstroke.',
   'Street art walk through Nairobi''s creative districts.',
   1900, 2, 12, 'Nairobi, Kenya', -1.2864, 36.8172, 'city', 'in_person',
   array['15+ murals by named Kenyan artists', 'Photography tips for street art shots', 'Complimentary art print'],
   true, 4.5, 22),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09', '11111111-1111-1111-1111-111111111109',
   'Virtual Maasai Culture Immersion',
   'Join Ole Senteu live from a traditional Maasai homestead in Kajiado.',
   'Live cultural immersion with a Maasai ambassador.',
   1800, 1.5, 25, 'Kajiado, Kenya', -1.8510, 36.7820, 'culture', 'virtual',
   array['Live morning blessing ceremony', 'Maasai beadwork colour-code lesson', 'Cultural Q&A'],
   true, 4.7, 89),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10', '11111111-1111-1111-1111-111111111110',
   'Diani Beach Seafood & Snorkelling',
   'Sail to Diani Marine National Reserve then enjoy a fresh seafood feast on shore.',
   'Dhow sailing, snorkelling, and beachside seafood feast.',
   9500, 5, 6, 'Diani Beach, Kenya', -4.2797, 39.5940, 'food', 'in_person',
   array['Traditional dhow sunrise sailing', 'Guided snorkelling in marine reserve', 'All snorkelling gear provided'],
   true, 4.9, 56),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11', '11111111-1111-1111-1111-111111111111',
   'Karen Blixen Museum & Coffee Tour',
   'Explore Out of Africa''s legacy then taste single-origin Kenyan coffee on the Ngong Hills.',
   'Literary history and specialty coffee tasting in Karen.',
   4500, 3, 8, 'Karen, Nairobi', -1.3197, 36.7083, 'food', 'in_person',
   array['Karen Blixen Museum guided tour', 'Single-origin coffee tasting on farm', '250g specialty coffee bag included'],
   true, 4.6, 30),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12', '11111111-1111-1111-1111-111111111112',
   'Virtual Tsavo Wildlife Safari',
   'One-hour live broadcast from Tsavo East''s famous red elephant herds.',
   'Affordable live safari from Kenya''s largest national park.',
   1300, 1, 30, 'Tsavo, Kenya', -2.7726, 38.8160, 'nature', 'virtual',
   array['Live waterhole multi-camera broadcast', 'Expert ranger commentary', 'On-demand replay for 24 hours'],
   true, 4.5, 77)
on conflict (id) do nothing;

-- ── Seed bookings (dashboard demo data) ─────────────────────────────────────
insert into public.bookings (
  id, tour_id, guest_id, host_id, booking_date, guest_count, total_price,
  guest_name, guest_email, guest_phone
) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
   '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101',
   '2026-07-05', 2, 7000, 'Sarah Chen', 'sarah.chen@email.com', '+254700000001'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11',
   null, '11111111-1111-1111-1111-111111111111',
   '2026-07-08', 1, 4500, 'John Smith', 'john.smith@email.com', '+254700000002'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
   null, '11111111-1111-1111-1111-111111111102',
   '2026-07-02', 3, 4500, 'Maria Garcia', 'maria.garcia@email.com', '+254700000003'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
   '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101',
   '2026-07-12', 1, 3500, 'James Mwangi', 'james.traveler@example.com', '+447700000000'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06',
   '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111106',
   '2026-07-18', 2, 4600, 'James Mwangi', 'james.traveler@example.com', '+447700000000')
on conflict (id) do nothing;

-- ── Seed host applications (admin dashboard demo data) ──────────────────────
insert into public.hosts (
  id, full_name, email, city, host_type, bio, video_url, id_upload_url, license_upload_url, created_at
) values
  ('cccccccc-cccc-cccc-cccc-cccccccccc01',
   'Samuel Kipchoge', 'samuel.kipchoge@gmail.com', 'Eldoret',
   'certified_guide',
   'Professional marathon pacer and certified athletics guide. I lead running tours through the training grounds of Iten and Eldoret where world champions are made. 10+ years of guiding international athletes and journalists through Kenya''s legendary running trails.',
   'https://example.com/videos/samuel-intro.mp4',
   'https://example.com/docs/samuel-id.pdf',
   'https://example.com/docs/samuel-license.pdf',
   '2026-06-25T10:30:00Z'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02',
   'Wanjiku Ngugi', 'wanjiku.ngugi@yahoo.com', 'Nairobi',
   'local_host',
   'Born in Kibera, I offer authentic walking tours of Africa''s largest urban settlement. My tours show visitors the real, vibrant community beyond the stereotypes — local art galleries, music studios, and the entrepreneurs driving change.',
   null,
   'https://example.com/docs/wanjiku-id.pdf',
   null,
   '2026-06-26T14:15:00Z'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03',
   'Osman Abdullahi', 'osman.abdullahi@hotmail.com', 'Malindi',
   'certified_guide',
   'Marine biologist and PADI-certified dive instructor. I run snorkelling and diving tours at Malindi Marine National Park, teaching visitors about coral reef conservation and the Indian Ocean ecosystem. Published researcher on reef restoration.',
   'https://example.com/videos/osman-intro.mp4',
   'https://example.com/docs/osman-id.pdf',
   'https://example.com/docs/osman-padi.pdf',
   '2026-06-27T09:45:00Z')
on conflict (id) do nothing;

-- ── Grants for anon/authenticated roles ─────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.tours to anon, authenticated;
grant select, insert, update on public.bookings to anon, authenticated;
grant select, insert, update on public.hosts to anon, authenticated;

-- ── Messages ────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies
drop policy if exists "Public read messages" on public.messages;
create policy "Public read messages"
  on public.messages for select
  using (true);

drop policy if exists "Public insert messages" on public.messages;
create policy "Public insert messages"
  on public.messages for insert
  with check (true);

-- Grants
grant select, insert on public.messages to anon, authenticated;

-- ── Reviews ────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
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
-- Everyone can read only visible reviews
create policy "public read visible reviews" on public.reviews for select using (true);
-- Travelers can insert reviews
create policy "Users can insert their own reviews" on public.reviews for insert with check (true);
-- Allow everyone to like/complain (updates) but restrict to own review for status change
create policy "public update likes complaints" on public.reviews for update using (true) with check (true);

-- ── Host Availability ───────────────────────────────────────────────────────
create table if not exists public.host_availability (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  guest_limit integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.host_availability enable row level security;
create policy "Public read host availability" on public.host_availability for select using (true);
create policy "Host manage availability" on public.host_availability for all using (auth.uid() = host_id);
grant select, insert, update, delete on public.host_availability to anon, authenticated;

-- ── Waiting List ────────────────────────────────────────────────────────────
create table if not exists public.waiting_list (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.profiles(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  preferred_date date not null,
  auto_book boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.waiting_list enable row level security;
create policy "Public read waiting list" on public.waiting_list for select using (true);
create policy "Public insert waiting list" on public.waiting_list for insert with check (true);
create policy "Public update waiting list" on public.waiting_list for update using (true);
grant select, insert, update on public.waiting_list to anon, authenticated;

-- ── Host Settings ───────────────────────────────────────────────────────────
create table if not exists public.host_settings (
  host_id uuid primary key references public.profiles(id) on delete cascade,
  reminder_time integer not null default 30,
  notification_preferences text[] not null default '{"in_app", "email"}',
  is_busy boolean not null default false,
  busy_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.host_settings enable row level security;
create policy "Public read host settings" on public.host_settings for select using (true);
create policy "Host manage settings" on public.host_settings for all using (auth.uid() = host_id);
grant select, insert, update on public.host_settings to anon, authenticated;

-- ── Refunds ─────────────────────────────────────────────────────────────────
create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  guest_id uuid not null references public.profiles(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.refunds enable row level security;
create policy "Public read refunds" on public.refunds for select using (true);
create policy "Public insert refunds" on public.refunds for insert with check (true);
create policy "Public update refunds" on public.refunds for update using (true);
grant select, insert, update on public.refunds to anon, authenticated;

-- ── Wishlist ─────────────────────────────────────────────────────────────────
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, tour_id)
);

alter table public.wishlist enable row level security;
drop policy if exists "Users can manage their own wishlist" on public.wishlist;
create policy "Users can manage their own wishlist"
  on public.wishlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "Anon can manage wishlist" on public.wishlist;
create policy "Anon can manage wishlist" on public.wishlist for all using (true) with check (true);
grant select, insert, delete on public.wishlist to anon, authenticated;

-- ── Messages ─────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;
drop policy if exists "Users can send and read their own messages" on public.messages;
create policy "Users can send and read their own messages"
  on public.messages for all
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id);
drop policy if exists "Anon can manage messages" on public.messages;
create policy "Anon can manage messages" on public.messages for all using (true) with check (true);
grant select, insert on public.messages to anon, authenticated;

-- ── Journal Entries ───────────────────────────────────────────────────────────
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  location text,
  description text,
  image_urls text[] not null default '{}',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;
drop policy if exists "Users can manage their own journal" on public.journal_entries;
create policy "Users can manage their own journal"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "Public can read public journal entries" on public.journal_entries;
create policy "Public can read public journal entries"
  on public.journal_entries for select
  using (is_public = true);
drop policy if exists "Anon can manage journal" on public.journal_entries;
create policy "Anon can manage journal" on public.journal_entries for all using (true) with check (true);
grant select, insert, update, delete on public.journal_entries to anon, authenticated;

-- ── Impact Metrics ────────────────────────────────────────────────────────────
create table if not exists public.impact_metrics (
  id uuid primary key default gen_random_uuid(),
  families_supported integer not null default 0,
  trees_planted integer not null default 0,
  mental_health_trips integer not null default 0,
  co2_offset_kg numeric(10,2) not null default 0,
  hosts_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.impact_metrics enable row level security;
drop policy if exists "Public read impact metrics" on public.impact_metrics;
create policy "Public read impact metrics" on public.impact_metrics for select using (true);
drop policy if exists "Anon can read impact metrics" on public.impact_metrics;
create policy "Anon can read impact metrics" on public.impact_metrics for select using (true);
grant select on public.impact_metrics to anon, authenticated;

-- Seed initial impact metrics
insert into public.impact_metrics (families_supported, trees_planted, mental_health_trips, co2_offset_kg, hosts_count)
values (247, 1820, 36, 4500, 89)
on conflict do nothing;

-- ── Notifications ───────────────────────────────────────────────────────────
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

grant select, insert, update, delete on public.notifications to anon, authenticated;

-- Enable Realtime replication for dynamic updates
alter publication supabase_realtime add table public.notifications;

-- Create indexes to optimize query search performance
create index if not exists tours_location_name_idx on public.tours(location_name);
create index if not exists tours_price_idx on public.tours(price);
create index if not exists bookings_host_id_idx on public.bookings(host_id);
create index if not exists bookings_status_idx on public.bookings(status);
create unique index if not exists profiles_email_idx on public.profiles(email);

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

-- Add 2FA columns to profiles table
alter table public.profiles add column if not exists two_factor_enabled boolean not null default false;
alter table public.profiles add column if not exists two_factor_secret text;
alter table public.profiles add column if not exists two_factor_backup_codes text[] default '{}'::text[];


