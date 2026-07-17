import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdbvvcjnlergsmcsorrv.supabase.co';
const supabaseAnonKey = 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const emails = ['ausaguide@gmail.com', 'ausaguides@gmail.com', 'admin@ausaguide.com', 'ostinez48@gmail.com', 'testadmin@gmail.com'];
  for (const email of emails) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'Mbomati.may23'
    });
    
    if (error) {
      console.log(`Failed for ${email}:`, error.message);
    } else {
      console.log(`SUCCESS for ${email}!`);
      return;
    }
  }
}

run();
