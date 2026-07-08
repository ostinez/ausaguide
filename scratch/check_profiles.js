import { readFileSync } from "fs"
import { createClient } from "@supabase/supabase-js"

const envFile = readFileSync(".env", "utf8")
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
  const { data, error } = await supabase.from("profiles").select("id, email, full_name, role")
  if (error) {
    console.error("Error fetching profiles:", error)
  } else {
    console.log("Profiles in database:", data)
  }
}
run()
