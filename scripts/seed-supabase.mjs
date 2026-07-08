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

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const profiles = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    email: "amina@ausaguide.com",
    full_name: "Amina Osei",
    role: "host",
    bio: "Born and raised in Nairobi, Amina documents the city's street food scene.",
    location: "Nairobi",
    languages: ["English", "Swahili"],
    phone: null,
    avatar_url: null,
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    email: "david@ausaguide.com",
    full_name: "David Kimani",
    role: "host",
    bio: "Certified wildlife guide with 15 years in the Mara ecosystem.",
    location: "Narok",
    languages: ["English", "Swahili"],
    phone: null,
    avatar_url: null,
  },
  {
    id: "22222222-2222-2222-2222-222222222201",
    email: "james.traveler@example.com",
    full_name: "James Mwangi",
    role: "traveler",
    bio: null,
    location: "London",
    languages: ["English"],
    phone: null,
    avatar_url: null,
  },
]

const hosts = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01",
    user_id: "11111111-1111-1111-1111-111111111101",
    host_type: "local_host",
    bio: "Passionate food guide based in Nairobi.",
    status: "approved",
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02",
    user_id: "11111111-1111-1111-1111-111111111102",
    host_type: "certified_guide",
    bio: "Wildlife guide streaming live from the Maasai Mara.",
    status: "approved",
  },
]

const tours = [
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01",
    host_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01",
    title: "Nairobi Street Food Safari",
    description:
      "Dive deep into Nairobi's electric street food culture with a guide who's eaten everything this city has to offer.",
    price: 3500,
    category: "food",
    location: "Nairobi, Kenya",
    duration: 3,
    type: "in_person",
    highlights: ["12 food tastings", "Vendor introductions", "Small group experience"],
    images: [],
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02",
    host_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02",
    title: "Maasai Mara Wildlife Virtual Tour",
    description:
      "Join David live from the heart of the Maasai Mara for an immersive 90-minute virtual safari.",
    price: 1500,
    category: "nature",
    location: "Maasai Mara, Kenya",
    duration: 1.5,
    type: "virtual",
    highlights: ["Live HD stream", "Real-time Q&A", "Recording for 48 hours"],
    images: [],
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03",
    host_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01",
    title: "Lamu Old Town Heritage Walk",
    description:
      "Walk the labyrinthine alleys of Lamu Old Town, a UNESCO World Heritage Site.",
    price: 4000,
    category: "culture",
    location: "Lamu, Kenya",
    duration: 2.5,
    type: "in_person",
    highlights: ["UNESCO site access", "Swahili refreshments", "Maximum 6 guests"],
    images: [],
  },
]

const bookings = [
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccc01",
    tour_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01",
    host_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01",
    title: "Nairobi Street Food Safari",
    date: "2026-07-05",
    status: "confirmed",
    price: 7000,
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccc02",
    tour_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02",
    host_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02",
    title: "Maasai Mara Wildlife Virtual Tour",
    date: "2026-07-12",
    status: "pending",
    price: 3000,
  },
]

async function upsert(table, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" })
  if (error) throw new Error(`${table}: ${error.message}`)
  console.log(`Seeded ${rows.length} row(s) into ${table}`)
}

try {
  await upsert("profiles", profiles)
  await upsert("hosts", hosts)
  await upsert("tours", tours)
  await upsert("bookings", bookings)
  console.log("Seed complete.")
} catch (err) {
  console.error("Seed failed:", err.message)
  process.exit(1)
}
