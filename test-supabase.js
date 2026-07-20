const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env
const envPath = path.resolve(__dirname, '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const parts = line.split('=')
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts[1].trim()
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'ostinez23@gmail.com')
  
  console.log('DATA:', data)
  console.log('ERROR:', error)
}

test()
