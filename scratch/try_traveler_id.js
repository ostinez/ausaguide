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
  const userId = "22222222-2222-2222-2222-222222222202"
  const email = "traveler@ausaguide.com"
  
  // Get a tour and host to book
  const { data: tours } = await supabase.from("tours").select("id, host_id").limit(1)
  const tour = tours[0]

  // Create a booking
  const { data: booking, error: bookingError } = await supabase.from("bookings").insert({
    tour_id: tour.id,
    guest_id: userId,
    host_id: tour.host_id,
    guest_name: "Test User",
    guest_email: email,
    guest_phone: "1234567890",
    booking_date: new Date().toISOString().split("T")[0],
    booking_time: "10:00",
    guest_count: 1,
    total_price: 100,
    status: "completed"
  }).select().single()

  if (bookingError) {
    console.error("Booking error:", bookingError)
    return
  }

  console.log("Trying user_id...")
  const res1 = await supabase.from("reviews").insert({
    booking_id: booking.id,
    user_id: userId,
    host_id: tour.host_id,
    tour_id: tour.id,
    rating: 5,
    comment: "This is a test",
    status: "visible"
  })
  console.log("user_id result error:", res1.error)

  console.log("Trying traveler_id...")
  const res2 = await supabase.from("reviews").insert({
    booking_id: booking.id,
    traveler_id: userId,
    host_id: tour.host_id,
    tour_id: tour.id,
    rating: 5,
    comment: "This is a test",
    status: "visible"
  })
  console.log("traveler_id result error:", res2.error)

  // Cleanup booking
  await supabase.from("bookings").delete().eq("id", booking.id)
}
run()
