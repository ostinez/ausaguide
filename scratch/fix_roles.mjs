import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sdbvvcjnlergsmcsorrv.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnZ2Y2pubGVyZ3NtY3NvcnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ3MjU5NiwiZXhwIjoyMDk4MDQ4NTk2fQ.ocxiUpeveL3vg87rqQBhPTIGUFvHVKHVGhY8hVyHmwc";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Execute raw SQL via Supabase Management API
async function runRawSQL(sql) {
  const projectRef = "sdbvvcjnlergsmcsorrv";
  const mgmtToken = SERVICE_ROLE_KEY;

  // Use the Supabase REST API with POST to run arbitrary SQL
  // This is via the pg-meta endpoint
  const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${mgmtToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, body: text };
}

async function fixRoles() {
  console.log("Attempting to fix roles via direct approach...\n");
  
  // Approach: Temporarily drop the trigger, update roles, re-create trigger
  // We'll do this via the Supabase Management API
  
  // First let's see what the trigger function looks like on the live DB
  const checkTrigger = await runRawSQL(`
    SELECT pg_get_functiondef(oid) as def 
    FROM pg_proc 
    WHERE proname = 'prevent_profile_role_change';
  `);
  console.log("Trigger function check:", checkTrigger);

  // Try direct upsert approach
  const usersToFix = [
    { email: "ostinez48@gmail.com",  role: "host",     username: "ostinez48",  full_name: "Osti Guide" },
    { email: "ostinez23@gmail.com",  role: "traveler", username: "ostinez23",  full_name: "Osti Traveler" },
  ];
  
  for (const u of usersToFix) {
    console.log(`Fixing ${u.email} -> role=${u.role}`);
    
    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", u.email)
      .maybeSingle();
    
    console.log(`  Current profile:`, profile);

    if (profile && profile.role !== null) {
      console.log(`  Role already set to ${profile.role} - trigger will block change.`);
    } else if (profile && profile.role === null) {
      console.log(`  Role is NULL - trying to update...`);
      // Trigger should allow NULL -> role per latest migration
      const { error } = await supabase
        .from("profiles")
        .update({ role: u.role })
        .eq("email", u.email);
      
      if (error) {
        console.error(`  Error:`, error.message);
        console.log("  ⚠️ Run this SQL in Supabase Dashboard manually:");
        console.log(`  UPDATE public.profiles SET role = '${u.role}' WHERE email = '${u.email}';`);
      } else {
        console.log(`  ✅ Role updated to ${u.role}`);
      }
    } else {
      console.log(`  Profile not found - inserting...`);
    }
  }
  
  // Final state
  const { data: profiles } = await supabase
    .from("profiles")
    .select("email, role, username")
    .in("email", ["ausaguides@gmail.com", "austinmbote07@gmail.com", "ostinez48@gmail.com", "ostinez23@gmail.com"]);
  
  console.log("\n=== FINAL STATE ===");
  profiles?.forEach(p => console.log(`  ${p.email}: role=${p.role}`));
  
  console.log("\n=== SQL TO RUN MANUALLY IN SUPABASE DASHBOARD IF NEEDED ===");
  console.log(`
-- Run this in Supabase SQL Editor if roles are wrong:
UPDATE public.profiles SET role = 'host'     WHERE email = 'ostinez48@gmail.com';
UPDATE public.profiles SET role = 'traveler' WHERE email = 'ostinez23@gmail.com';
UPDATE public.profiles SET role = 'admin'    WHERE email = 'ausaguides@gmail.com';
UPDATE public.profiles SET role = 'host'     WHERE email = 'austinmbote07@gmail.com';

-- Also ensure host records exist:
INSERT INTO public.hosts (id, name, bio, location, languages)
SELECT p.id, p.full_name, '', 'Nairobi', ARRAY['English']
FROM public.profiles p
WHERE p.email IN ('austinmbote07@gmail.com', 'ostinez48@gmail.com')
  AND NOT EXISTS (SELECT 1 FROM public.hosts h WHERE h.id = p.id);
  `);
}

fixRoles();
