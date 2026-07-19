import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n" +
    "NEVER hardcode API keys — use environment variables only."
  )
}

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey)

// Disable real-time globally (temporary)
if ((supabase as any).realtime?.setConfig) {
  ;(supabase as any).realtime.setConfig({
    subscriptions: { enable: false }
  })
}

if (typeof window !== "undefined") {
  ;(window as any).supabase = supabase
}
