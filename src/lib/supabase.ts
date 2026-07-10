import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://mock.supabase.co'
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://sdbvvcjnlergsmcsorrv.supabase.co'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'mock-anon-key'
  ? import.meta.env.VITE_SUPABASE_ANON_KEY 
  : 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  )
}

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey)
