import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

function loadEnv() {
  const contents = readFileSync(resolve(process.cwd(), ".env"), "utf8")
  for (const line of contents.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const [key, ...rest] = trimmed.split("=")
    if (key && rest.length) process.env[key] = rest.join("=")
  }
}

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(url, key)

const TOUR_SELECT = `
  *,
  host:profiles (
    id, full_name, role, location, bio
  )
`

console.log(`Testing Supabase project: ${url}\n`)

const tests = [
  {
    name: "Tours with host + profile join",
    run: () => supabase.from("tours").select(TOUR_SELECT).limit(5),
  },
  {
    name: "Host profiles",
    run: () =>
      supabase.from("profiles").select("id, full_name, role").eq("role", "host").limit(5),
  },
  {
    name: "Bookings with tours",
    run: () =>
      supabase.from("bookings").select("id, booking_date, status, total_price, tour:tours(title)").limit(5),
  },
]

let passed = 0

for (const test of tests) {
  const { data, error } = await test.run()
  if (error) {
    console.log(`FAIL  ${test.name}`)
    console.log(`      ${error.message}\n`)
    continue
  }

  passed++
  console.log(`OK    ${test.name} (${data?.length ?? 0} rows)`)
  for (const row of data ?? []) {
    if (row.title) console.log(`      - ${row.title}`)
    else if (row.full_name) console.log(`      - ${row.full_name} (${row.role})`)
    else if (row.tour) console.log(`      - ${row.tour.title} [${row.status}]`)
    else if (row.status) console.log(`      - booking ${row.status} KES ${row.total_price}`)
  }
  console.log()
}

if (passed === tests.length && (await supabase.from("tours").select("id").limit(1)).data?.length) {
  console.log("All checks passed with data. App ready at http://localhost:5173")
  process.exit(0)
}

if (passed === tests.length) {
  console.log("API works but tables are empty.")
  console.log("Run supabase/seed.sql in the SQL Editor to load sample data.")
  process.exit(0)
}

console.log("Some checks failed. Run supabase/seed.sql if tables are empty or RLS is blocking reads.")
process.exit(1)
