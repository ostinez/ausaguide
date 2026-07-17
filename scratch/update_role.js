import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdbvvcjnlergsmcsorrv.supabase.co';
const supabaseAnonKey = 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', 'ostinez48@gmail.com')
    .select();
  
  if (error) {
    console.error('Error updating role:', error.message);
  } else {
    console.log('Update result:', data);
  }
}

run();
