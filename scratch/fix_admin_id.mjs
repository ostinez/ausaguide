import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://sdbvvcjnlergsmcsorrv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnZ2Y2pubGVyZ3NtY3NvcnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ3MjU5NiwiZXhwIjoyMDk4MDQ4NTk2fQ.ocxiUpeveL3vg87rqQBhPTIGUFvHVKHVGhY8hVyHmwc', {
  auth: { autoRefreshToken: false, persistSession: false }
});

const WRONG_ID = 'a43906f9-8f4d-4c00-854c-736415c96083';
const CORRECT_ID = '0c1e93ad-2fe2-4e32-9d1f-9f6b01273082';

async function main() {
  console.log('Fetching old profile...');
  const { data: oldProfile, error: getErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', WRONG_ID)
    .maybeSingle();
    
  if (!oldProfile) {
    console.log('Old profile not found. Checking if correct profile already exists...');
    const { data: correctProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', CORRECT_ID)
      .maybeSingle();
      
    if (correctProfile) {
      console.log('Correct profile already exists:', correctProfile);
    } else {
      console.log('Neither profile exists. Inserting fresh profile...');
      const { error: insErr } = await supabase.from('profiles').insert({
        id: CORRECT_ID,
        email: 'ausaguides@gmail.com',
        username: 'ausaguide',
        role: 'admin',
        full_name: 'Ausaguide Admin',
        is_verified: true
      });
      if (insErr) console.error('Insert error:', insErr.message);
      else console.log('Successfully inserted correct profile.');
    }
    return;
  }
  
  console.log('Old profile found:', oldProfile);
  
  // Let's delete the old profile and insert the correct one
  console.log('Deleting old profile...');
  const { error: delErr } = await supabase
    .from('profiles')
    .delete()
    .eq('id', WRONG_ID);
    
  if (delErr) {
    console.error('Delete error:', delErr.message);
    return;
  }
  
  console.log('Inserting correct profile...');
  const { error: insErr } = await supabase.from('profiles').insert({
    ...oldProfile,
    id: CORRECT_ID
  });
  
  if (insErr) {
    console.error('Insert error:', insErr.message);
  } else {
    console.log('Successfully corrected admin profile ID!');
  }
}

main().catch(console.error);
