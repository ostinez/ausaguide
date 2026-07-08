import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env")
    const contents = readFileSync(envPath, "utf8")
    for (const line of contents.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const [key, ...rest] = trimmed.split("=")
      if (key && rest.length) process.env[key] = rest.join("=")
    }
  } catch {
    // .env optional when vars are already exported
  }
}

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env")
  process.exit(1)
}

const supabase = createClient(url, key)

const { data: tours, error } = await supabase
  .from("tours")
  .select("id, title")
  .eq("is_published", true)
  .limit(5)

if (error) {
  console.error("Supabase connection failed:", error.message)
  console.error("\nRun supabase/schema.sql in your Supabase SQL Editor first.")
  process.exit(1)
}

console.log(`Connected to Supabase. Found ${tours?.length ?? 0} published tour(s):`)
for (const tour of tours ?? []) {
  console.log(`  - ${tour.title}`)
}
