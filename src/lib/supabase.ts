import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key"

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.\n" +
    "Please configure them in your Vercel Project Settings -> Environment Variables."
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
