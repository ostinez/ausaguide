import { createClient } from "@supabase/supabase-js"
import fs from "fs"

const envFile = fs.readFileSync(".env", "utf8")
const envVars = {}
envFile.split("\n").forEach(line => {
  const parts = line.split("=")
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const val = parts.slice(1).join("=").trim()
    envVars[key] = val
  }
})

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ausaguides@gmail.com',
    password: 'ynwmelly2',
  })
  
  if (error) {
    console.error("Login failed:", error.message)
    return
  }
  
  console.log("Logged in. User ID:", data.user.id)
  
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single()
    
  if (profErr) {
    console.error("Failed to get profile:", profErr.message)
    return
  }
  
  console.log("Current Profile Role:", profile.role)
  console.log("Profile Data:", profile)
}
run()
