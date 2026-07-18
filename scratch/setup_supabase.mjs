import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sdbvvcjnlergsmcsorrv.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnZ2Y2pubGVyZ3NtY3NvcnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ3MjU5NiwiZXhwIjoyMDk4MDQ4NTk2fQ.ocxiUpeveL3vg87rqQBhPTIGUFvHVKHVGhY8hVyHmwc";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("Fetching users...");
  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error("Error fetching users:", usersErr);
    return;
  }

  // Handle Admin User
  let adminUser = users.find(u => u.email === "ausaguides@gmail.com");
  if (!adminUser) {
    console.log("Admin user not found, creating...");
    const { data: newAdmin, error: createErr } = await supabase.auth.admin.createUser({
      email: "ausaguides@gmail.com",
      password: "ynwmelly2",
      email_confirm: true,
    });
    if (createErr) {
      console.error("Failed to create admin:", createErr);
    } else {
      adminUser = newAdmin.user;
      console.log("Admin created with ID:", adminUser.id);
    }
  } else {
    console.log("Admin user found. Updating password and confirmation status...");
    const { data: updatedAdmin, error: updateErr } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: "ynwmelly2",
      email_confirm: true,
    });
    if (updateErr) {
      console.error("Failed to update admin:", updateErr);
    } else {
      console.log("Admin user updated successfully.");
    }
  }

  // Force Admin Role in Profiles
  if (adminUser) {
    console.log("Updating profile for admin...");
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        role: "admin",
        username: "ausaguide",
        full_name: "Super Admin",
        is_verified: true
      })
      .eq("id", adminUser.id);
      
    if (profileErr) {
      console.error("Failed to update profile:", profileErr);
    } else {
      console.log("Admin profile forced to role='admin'.");
    }
  }

  // Handle Host User
  const hostUser = users.find(u => u.email === "austinmbote07@gmail.com");
  if (hostUser) {
    console.log("Host user found. Updating confirmation status...");
    const { error: hostUpdateErr } = await supabase.auth.admin.updateUserById(hostUser.id, {
      password: "Test123!",
      email_confirm: true,
    });
    if (hostUpdateErr) {
      console.error("Failed to update host:", hostUpdateErr);
    } else {
      console.log("Host user updated successfully.");
    }
  } else {
    console.log("Host user not found.");
  }
}

main();
