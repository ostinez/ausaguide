import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdbvvcjnlergsmcsorrv.supabase.co';
const supabaseAnonKey = 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or('role.eq.admin,email.ilike.%ausaguide%');
  
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Profiles found:', data);
  }
}

run();
