import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdbvvcjnlergsmcsorrv.supabase.co';
const supabaseAnonKey = 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ausaguides@gmail.com',
    password: 'Mbomati.may23'
  });
  
  if (error) {
    console.error('Login error:', error.message);
  } else {
    console.log('Login successful! Session user:', data.user.email);
    console.log('User ID:', data.user.id);
  }
}

run();
