import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sdbvvcjnlergsmcsorrv.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnZ2Y2pubGVyZ3NtY3NvcnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ3MjU5NiwiZXhwIjoyMDk4MDQ4NTk2fQ.ocxiUpeveL3vg87rqQBhPTIGUFvHVKHVGhY8hVyHmwc";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function confirmUser() {
  const email = process.argv[2];
  if (!email) {
    console.error("Please provide an email.");
    process.exit(1);
  }

  const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("Error listing users:", listErr);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error(`User ${email} not found.`);
    process.exit(1);
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true
  });

  if (error) {
    console.error("Error confirming user:", error);
    process.exit(1);
  }

  console.log(`User ${email} confirmed successfully.`);
}

confirmUser();
