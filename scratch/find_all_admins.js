import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdbvvcjnlergsmcsorrv.supabase.co';
const supabaseAnonKey = 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, role, full_name');
  
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('All profiles:', data);
  }
}

run();
