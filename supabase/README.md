# Supabase Setup

## 1. Environment variables

Copy `.env.example` to `.env` and set your project credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 2. Create tables and seed data

Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new), paste the contents of `supabase/schema.sql`, and run it.

This creates:

- `profiles` — host and traveler profiles
- `hosts` — host signup applications
- `tours` — published experiences (12 seeded tours)
- `bookings` — demo booking records for the dashboard

## 3. Verify the connection

```bash
npm run verify:supabase
```

You should see a list of published tours loaded from your database.
