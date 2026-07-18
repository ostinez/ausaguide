import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = "https://sdbvvcjnlergsmcsorrv.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnZ2Y2pubGVyZ3NtY3NvcnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ3MjU5NiwiZXhwIjoyMDk4MDQ4NTk2fQ.ocxiUpeveL3vg87rqQBhPTIGUFvHVKHVGhY8hVyHmwc";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Call the Supabase pg-meta SQL endpoint
async function execSQL(sql) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    return { ok: false, error: text };
  }
  return { ok: true };
}

async function main() {
  // Step 1: Fix the trigger function first using the Vercel API token approach
  // We'll use a Supabase Edge function to execute the SQL
  
  // Alternative: Use the Supabase admin REST API with the correct endpoint
  const projectRef = "sdbvvcjnlergsmcsorrv";
  
  // The correct Supabase Management API endpoint for running SQL
  const sql = fs.readFileSync("supabase/migrations/20260718100000_fix_role_trigger_and_test_accounts.sql", "utf8");
  
  console.log("Executing migration SQL...\n");
  
  // Try via the pg-meta HTTP endpoint (requires service role)
  const resp = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  
  console.log("Response status:", resp.status);
  const body = await resp.text();
  console.log("Response body:", body.slice(0, 500));
  
  // Alternative: Execute each statement separately via Supabase client
  console.log("\nTrying direct Supabase client approach...");
  
  const statements = [
    // Fix trigger
    `CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.role IS NOT NULL AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set.';
  END IF;
  RETURN NEW;
END;$$;`,
    
    // Fix roles
    `UPDATE public.profiles SET role = 'host'     WHERE email = 'ostinez48@gmail.com'     AND role IS NULL`,
    `UPDATE public.profiles SET role = 'traveler' WHERE email = 'ostinez23@gmail.com'     AND role IS NULL`,
    
    // Ensure host records
    `INSERT INTO public.hosts (id, name, bio, location, languages)
SELECT p.id, p.full_name, 'Local guide and tour host in Kenya.', 'Nairobi', ARRAY['English', 'Swahili']
FROM public.profiles p
WHERE p.role = 'host' AND p.email IN ('austinmbote07@gmail.com', 'ostinez48@gmail.com')
  AND NOT EXISTS (SELECT 1 FROM public.hosts h WHERE h.id = p.id)`,
  ];
  
  // Try calling a custom RPC we can check
  for (const stmt of statements) {
    console.log(`\nExecuting: ${stmt.slice(0, 80)}...`);
    
    // Attempt: use supabase.rpc if there's a generic SQL executor
    const result = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });
    break; // Just test connection
  }
  
  console.log("\n=== CURRENT STATE ===");
  const { data: profiles } = await supabase
    .from("profiles")
    .select("email, role")
    .in("email", ["ausaguides@gmail.com", "austinmbote07@gmail.com", "ostinez48@gmail.com", "ostinez23@gmail.com"]);
  
  profiles?.forEach(p => console.log(`  ${p.email}: role=${p.role}`));
  
  console.log("\n=== ACTION REQUIRED ===");
  console.log("Please run this SQL in your Supabase Dashboard → SQL Editor:");
  console.log("(The migration file has already been created locally)");
  console.log(`
URL: https://supabase.com/dashboard/project/sdbvvcjnlergsmcsorrv/sql/new

-- STEP 1: Fix the role change trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.role IS NOT NULL AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set.';
  END IF;
  RETURN NEW;
END;
$$;

-- STEP 2: Set roles for test accounts
UPDATE public.profiles SET role = 'host'     WHERE email = 'ostinez48@gmail.com';
UPDATE public.profiles SET role = 'traveler' WHERE email = 'ostinez23@gmail.com';
UPDATE public.profiles SET role = 'admin'    WHERE email = 'ausaguides@gmail.com';

-- STEP 3: Create host records for host users
INSERT INTO public.hosts (id, name, bio, location, languages)
SELECT p.id, p.full_name, 'Local guide and tour host.', 'Nairobi', ARRAY['English', 'Swahili']
FROM public.profiles p
WHERE p.role = 'host' AND p.email IN ('austinmbote07@gmail.com', 'ostinez48@gmail.com')
  AND NOT EXISTS (SELECT 1 FROM public.hosts h WHERE h.id = p.id)
ON CONFLICT (id) DO NOTHING;
  `);
}

main();
