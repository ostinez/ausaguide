import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://sdbvvcjnlergsmcsorrv.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnZ2Y2pubGVyZ3NtY3NvcnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ3MjU5NiwiZXhwIjoyMDk4MDQ4NTk2fQ.ocxiUpeveL3vg87rqQBhPTIGUFvHVKHVGhY8hVyHmwc";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data: cols, error: colsErr } = await supabase.from("messages").select().limit(0).csv();
  console.log("Cols via csv:", cols);
}
main();
