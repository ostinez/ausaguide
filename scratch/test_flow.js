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
  console.log("Signing up a new user...")
  const email = "flowtest" + Date.now() + "@gmail.com"
  const password = "password123"
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })

  if (authError) {
    console.error("SignUp failed:", authError)
    return
  }

  const userId = authData.user.id
  console.log("Signed up user:", userId)

  console.log("Inserting profile...")
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    email: email,
    full_name: "Flow Test User",
    role: "traveler",
    languages: ["English"]
  })

  if (profileError) {
    console.error("Profile insertion failed:", profileError)
    return
  }
  console.log("Profile created")

  // Get a tour and host
  const { data: tours } = await supabase.from("tours").select("id, host_id").limit(1)
  const tour = tours[0]

  console.log("Creating a booking...")
  const { data: booking, error: bookingError } = await supabase.from("bookings").insert({
    tour_id: tour.id,
    guest_id: userId,
    host_id: tour.host_id,
    guest_name: "Flow Test User",
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
  console.log("Booking created:", booking.id)

  console.log("Creating a review using traveler_id...")
  const { data: review, error: reviewError } = await supabase.from("reviews").insert({
    booking_id: booking.id,
    traveler_id: userId,
    host_id: tour.host_id,
    tour_id: tour.id,
    rating: 5,
    comment: "This is a test review using traveler_id",
    status: "visible"
  }).select().single()

  if (reviewError) {
    console.error("Review creation failed:", reviewError)
  } else {
    console.log("Review created successfully!", review)
  }

  // Cleanup
  console.log("Cleaning up...")
  if (review) await supabase.from("reviews").delete().eq("id", review.id)
  if (booking) await supabase.from("bookings").delete().eq("id", booking.id)
  await supabase.from("profiles").delete().eq("id", userId)
}
run()
