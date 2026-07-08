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
  console.log("Checking location_updates table...")
  const { data, error } = await supabase.from("location_updates").select("*").limit(1)
  if (error) {
    console.error("Query failed:", error.message, error)
  } else {
    console.log("Query succeeded! Table exists. Data:", data)
  }
}

run()
