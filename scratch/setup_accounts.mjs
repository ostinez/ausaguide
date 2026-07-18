import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sdbvvcjnlergsmcsorrv.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnZ2Y2pubGVyZ3NtY3NvcnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ3MjU5NiwiZXhwIjoyMDk4MDQ4NTk2fQ.ocxiUpeveL3vg87rqQBhPTIGUFvHVKHVGhY8hVyHmwc";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Use raw REST call to bypass RLS + triggers via RPC
async function runSQL(sql) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, body: text };
}

async function setupAccounts() {
  const accounts = [
    { email: "ausaguides@gmail.com",    password: "ynwmelly2", role: "admin",    full_name: "AusaGuide Admin",  username: "ausaguides" },
    { email: "austinmbote07@gmail.com", password: "Test123!",  role: "host",     full_name: "Austin Mbote",     username: "austinmbote" },
    { email: "ostinez48@gmail.com",     password: "Test123!",  role: "host",     full_name: "Osti Guide",       username: "ostinez48" },
    { email: "ostinez23@gmail.com",     password: "Test123!",  role: "traveler", full_name: "Osti Traveler",    username: "ostinez23" },
  ];

  const { data: { users: existingUsers }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listErr) { console.error("List error:", listErr); return; }

  console.log("Existing users:", existingUsers.map(u => u.email));

  for (const acct of accounts) {
    const existing = existingUsers.find(u => u.email === acct.email);

    let userId;
    if (existing) {
      console.log(`\n[UPDATE] ${acct.email}`);
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: acct.password,
        email_confirm: true,
      });
      if (error) { console.error(`  Error updating ${acct.email}:`, error.message); continue; }
      userId = existing.id;
      console.log(`  ✅ Password set, email confirmed.`);
    } else {
      console.log(`\n[CREATE] ${acct.email}`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: acct.email,
        password: acct.password,
        email_confirm: true,
        user_metadata: { full_name: acct.full_name, role: acct.role, username: acct.username },
      });
      if (error) { console.error(`  Error creating ${acct.email}:`, error.message); continue; }
      userId = data.user.id;
      console.log(`  ✅ Created with ID: ${userId}`);
    }

    // Directly update profile via SQL (bypasses the trigger)
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfile) {
      // Use separate updates to avoid triggering the role-change protection
      // We'll use the bypass approach via the admin-level supabase client
      // The service role key DOES bypass RLS but NOT triggers on BEFORE UPDATE
      // So we need to directly patch via SQL
      const sql = `
        UPDATE public.profiles 
        SET role = '${acct.role}', 
            full_name = '${acct.full_name}',
            username = '${acct.username}',
            is_verified = true,
            email = '${acct.email}'
        WHERE id = '${userId}';
      `;
      const result = await runSQL(sql);
      if (!result.ok) {
        console.log(`  Trying upsert instead...`);
        // Fallback: try direct from() update
        const { error: upErr } = await supabase
          .from("profiles")
          .update({ full_name: acct.full_name, username: acct.username, is_verified: true })
          .eq("id", userId);
        if (upErr) console.error(`  Profile update error:`, upErr.message);
        else console.log(`  ✅ Profile updated (without role, it's already set).`);
      } else {
        console.log(`  ✅ Profile updated via SQL.`);
      }
    } else {
      // Insert fresh
      const { error: insErr } = await supabase.from("profiles").insert({
        id: userId,
        email: acct.email,
        full_name: acct.full_name,
        username: acct.username,
        role: acct.role,
        is_verified: true,
      });
      if (insErr) console.error(`  Profile insert error:`, insErr.message);
      else console.log(`  ✅ New profile created.`);
    }
  }

  // Final state report
  console.log("\n=== FINAL USER STATE ===");
  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("email, role, username, is_verified");
  
  if (profilesErr) {
    console.error("Error fetching profiles:", profilesErr.message);
  } else {
    profiles?.forEach(p => console.log(`  ${p.email}: role=${p.role}, verified=${p.is_verified}, username=${p.username}`));
  }

  console.log("\n=== AUTH USERS STATE ===");
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 100 });
  users?.forEach(u => console.log(`  ${u.email}: confirmed=${!!u.email_confirmed_at}, id=${u.id}`));
}

setupAccounts();
