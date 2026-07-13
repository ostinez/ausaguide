-- Migration: Rebuild System Reset & Seed

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Schema Modifications ──
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS physical_price numeric(10, 2);
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS virtual_price numeric(10, 2);
ALTER TABLE public.tours ALTER COLUMN price DROP NOT NULL;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_type text CHECK (booking_type IN ('physical', 'virtual'));

-- ── 2. Database Cleanup ──
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.tours CASCADE;
TRUNCATE TABLE public.hosts CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.host_settings CASCADE;
TRUNCATE TABLE public.host_availability CASCADE;
TRUNCATE TABLE public.refunds CASCADE;
TRUNCATE TABLE public.waiting_list CASCADE;
TRUNCATE TABLE public.newsletter_subscribers CASCADE;

-- Delete all profiles except the admin
DELETE FROM public.profiles WHERE role != 'admin' AND email != 'ostinez48@gmail.com';

-- Ensure admin profile ID matches the auth user ID
DELETE FROM public.profiles WHERE id = '33333333-3333-3333-3333-333333333301';
INSERT INTO public.profiles (id, email, full_name, role, bio, location, languages, is_verified)
VALUES (
  '38bde4a5-34db-42d2-95c4-d50ddad5db69',
  'ostinez48@gmail.com',
  'Super Admin',
  'admin',
  'System administrator for Ausaguide.',
  'Nairobi',
  ARRAY['English', 'Swahili'],
  true
)
ON CONFLICT (email) DO UPDATE
SET id = EXCLUDED.id, role = 'admin', is_verified = true;

-- Delete all auth users except admin
DELETE FROM auth.users WHERE email != 'ostinez48@gmail.com';


-- ── 3. Seed Host Users (auth.users) ──
-- Host 1: Grace Mwangi (Local Host) — host1@ausaguide.com
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
VALUES (
  '11111111-1111-1111-1111-111111111101',
  '00000000-0000-0000-0000-000000000000',
  'host1@ausaguide.com',
  extensions.crypt('Password123!', extensions.gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Grace Mwangi","role":"host"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Host 2: David Ochieng (Certified Guide) — host2@ausaguide.com
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
VALUES (
  '11111111-1111-1111-1111-111111111102',
  '00000000-0000-0000-0000-000000000000',
  'host2@ausaguide.com',
  extensions.crypt('Password123!', extensions.gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"David Ochieng","role":"host"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Host 3: Amina Hassan (Local Host) — host3@ausaguide.com
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
VALUES (
  '11111111-1111-1111-1111-111111111103',
  '00000000-0000-0000-0000-000000000000',
  'host3@ausaguide.com',
  extensions.crypt('Password123!', extensions.gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Amina Hassan","role":"host"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
);


-- ── 4. Seed Host Profiles & Applications ──
INSERT INTO public.profiles (id, email, full_name, role, bio, location, languages, host_type, host_tier, is_verified) VALUES
  ('11111111-1111-1111-1111-111111111101', 'host1@ausaguide.com', 'Grace Mwangi', 'host', 
   'Hi! I am Grace, a passionate home cook and storyteller based in Nairobi. I love welcoming visitors and sharing our rich culinary traditions and hidden local hangouts.', 
   'Nairobi, Kenya', ARRAY['English', 'Swahili'], 'local_host', 'local_host', true),
   
  ('11111111-1111-1111-1111-111111111102', 'host2@ausaguide.com', 'David Ochieng', 'host', 
   'Hello! I''m David, a certified wildlife and nature guide with over 8 years of experience. I specialize in showing Kenya''s majestic wildlife and guiding treks in the Rift Valley.', 
   'Nairobi, Kenya', ARRAY['English', 'Swahili', 'German'], 'certified_guide', 'certified_guide', true),
   
  ('11111111-1111-1111-1111-111111111103', 'host3@ausaguide.com', 'Amina Hassan', 'host', 
   'Habari! I am Amina, born and raised in Nairobi. I''m a cultural historian and street-culture enthusiast. I love guiding visitors through our vibrant street markets, historical architecture, and evening venues.', 
   'Nairobi, Kenya', ARRAY['English', 'Swahili', 'Arabic'], 'local_host', 'local_host', true)
ON CONFLICT (id) DO UPDATE SET
  bio = EXCLUDED.bio,
  location = EXCLUDED.location,
  languages = EXCLUDED.languages,
  host_type = EXCLUDED.host_type,
  host_tier = EXCLUDED.host_tier,
  is_verified = EXCLUDED.is_verified;

INSERT INTO public.hosts (id, user_id, full_name, email, city, host_type, bio, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '11111111-1111-1111-1111-111111111101', 
   'Grace Mwangi', 'host1@ausaguide.com', 'Nairobi, Kenya', 'local_host', 
   'Hi! I am Grace, a passionate home cook and storyteller based in Nairobi. I love welcoming visitors and sharing our rich culinary traditions and hidden local hangouts.', 
   'approved'),
   
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '11111111-1111-1111-1111-111111111102', 
   'David Ochieng', 'host2@ausaguide.com', 'Nairobi, Kenya', 'certified_guide', 
   'Hello! I''m David, a certified wildlife and nature guide with over 8 years of experience. I specialize in showing Kenya''s majestic wildlife and guiding treks in the Rift Valley.', 
   'approved'),
   
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', '11111111-1111-1111-1111-111111111103', 
   'Amina Hassan', 'host3@ausaguide.com', 'Nairobi, Kenya', 'local_host', 
   'Habari! I am Amina, born and raised in Nairobi. I''m a cultural historian and street-culture enthusiast. I love guiding visitors through our vibrant street markets, historical architecture, and evening venues.', 
   'approved')
ON CONFLICT (id) DO NOTHING;


-- ── 5. Seed 6 Tours (2 per Host) with physical and virtual prices ──
INSERT INTO public.tours (
  id, host_id, title, description, short_description, price, physical_price, virtual_price, duration_hours, max_guests,
  location_name, latitude, longitude, category, tour_type, highlights, is_published, rating, review_count, status
) VALUES
  -- Grace Mwangi's Tours
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '11111111-1111-1111-1111-111111111101',
   'Traditional Swahili Cooking Class',
   'Learn to cook authentic Swahili dishes like Pilau, Biryani, and Chapati from scratch in a local family home. We will visit the local market first to buy fresh spices and ingredients, then cook and enjoy a feast together.',
   'Cook authentic Swahili dishes in a local home.',
   3500, 3500, 1500, 3.5, 8, 'Nairobi, Kenya', -1.2921, 36.8219, 'food', 'in_person',
   ARRAY['Visit a local spice market', 'Hands-on cooking lesson from scratch', 'Traditional Swahili lunch or dinner', 'Full recipe card included'],
   true, 5.0, 0, 'published'),
   
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '11111111-1111-1111-1111-111111111101',
   'Nairobi Art & Craft Workshops Walk',
   'Discover Nairobi''s local artisans. We will visit workshops where women create beautiful beadwork, pottery, and fabrics using recycled materials. Get a chance to meet the creators and try making a souvenir yourself.',
   'Explore local artisan craft workshops in Nairobi.',
   2500, 2500, 1000, 2.5, 10, 'Nairobi, Kenya', -1.2864, 36.8172, 'culture', 'in_person',
   ARRAY['Visit 3 local community workshops', 'Meet local women artisans', 'Try beadwork and pottery yourself', 'Support sustainable community tourism'],
   true, 5.0, 0, 'published'),

  -- David Ochieng's Tours
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', '11111111-1111-1111-1111-111111111102',
   'Nairobi National Park Wildlife Safari',
   'A comprehensive half-day game drive in Nairobi National Park. Witness lions, black rhinos, giraffes, leopards, and diverse bird species roaming in their natural habitat, with the unique city skyline framing the background.',
   'Experience wildlife safari with a city skyline backdrop.',
   6500, 6500, 2500, 4.5, 6, 'Nairobi National Park', -1.3721, 36.8584, 'nature', 'in_person',
   ARRAY['Spot lions, rhinos, and giraffes', 'Professional wildlife guiding', 'Unique city skyline safari photos', 'Binoculars and guide book provided'],
   true, 5.0, 0, 'published'),
   
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', '11111111-1111-1111-1111-111111111102',
   'Ngong Hills Trek & Scenic Sunset Tour',
   'Hike along the scenic ridges of Ngong Hills. Enjoy panoramic views of the Great Rift Valley on one side and Nairobi city on the other. We will watch a magnificent African sunset from the Ngong hills peak.',
   'Hike Ngong Hills and watch a Rift Valley sunset.',
   4000, 4000, 1500, 4.0, 12, 'Ngong Hills, Kenya', -1.3933, 36.6880, 'adventure', 'in_person',
   ARRAY['Scenic ridge hike with Rift Valley views', 'Visit the wind farm turbines', 'Spectacular sunset picnic', 'A certified guide leading the trail'],
   true, 5.0, 0, 'published'),

  -- Amina Hassan's Tours
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05', '11111111-1111-1111-1111-111111111103',
   'Nairobi Street Art & Historical Downtown Tour',
   'Explore the rich history and modern street culture of Nairobi''s downtown. See colonial-era landmarks, bustling local bazaars, and beautiful graffiti murals telling the stories of Kenya''s youth and independence.',
   'Discover downtown history and graffiti street art.',
   2200, 2200, 900, 2.5, 10, 'Nairobi, Kenya', -1.2921, 36.8219, 'city', 'in_person',
   ARRAY['Walk historical landmarks like the Parliament', 'Explore local design and graffiti murals', 'Tastings at a traditional tea house', 'Photography guidance in vibrant zones'],
   true, 5.0, 0, 'published'),
   
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb06', '11111111-1111-1111-1111-111111111103',
   'Nightlife & Local Music Scene Showcase',
   'Experience Nairobi''s electric nightlife. We will visit local jazz clubs, live Benga music venues, and vibrant rooftop lounges. Enjoy local drinks, dance, and meet local musicians.',
   'Immerse in Nairobi''s live music and nightlife.',
   4800, 4800, 2000, 3.5, 8, 'Westlands, Nairobi', -1.2644, 36.8072, 'nightlife', 'in_person',
   ARRAY['Visit 3 curated live music venues', 'Meet local artists and bands', 'Includes 2 complimentary local beverages', 'Safe, accompanied group experience'],
   true, 5.0, 0, 'published')
ON CONFLICT (id) DO NOTHING;
