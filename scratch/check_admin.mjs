import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://sdbvvcjnlergsmcsorrv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnZ2Y2pubGVyZ3NtY3NvcnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ3MjU5NiwiZXhwIjoyMDk4MDQ4NTk2fQ.ocxiUpeveL3vg87rqQBhPTIGUFvHVKHVGhY8hVyHmwc', {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data: authData } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from('profiles').select('id, email, role');
  
  console.log('Comparing IDs (Auth vs Profile):');
  for (const u of authData?.users ?? []) {
    const prof = profiles?.find(p => p.email === u.email);
    console.log(`Email: ${u.email}`);
    console.log(`  Auth ID:    ${u.id}`);
    console.log(`  Profile ID: ${prof ? prof.id : 'NO PROFILE'}`);
    console.log(`  Match:      ${prof && prof.id === u.id ? 'YES' : 'NO'}`);
  }
}

main().catch(console.error);
