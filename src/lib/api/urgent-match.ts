import { supabase } from "@/lib/supabase"

export interface UrgentRequest {
  id: string
  traveler_id: string
  location: {
    coordinates: [number, number] // [lng, lat]
  } | string
  budget: number
  experience_type: string[]
  status: "pending" | "accepted" | "declined" | "expired"
  matched_host_id: string | null
  created_at: string
  expires_at: string
}

// 1. Traveler triggers proximity search edge function
export async function requestUrgentHost(
  latitude: number,
  longitude: number,
  budget: number,
  experienceType: string
): Promise<{ success: boolean; request: UrgentRequest; hostsFound: number }> {
  const { data, error } = await supabase.functions.invoke("find-urgent-host", {
    body: { latitude, longitude, budget, experienceType },
  })

  if (error) throw error
  return data
}

// 2. Host accepts an urgent request (concurrency-safe first-accept-wins check)
export async function acceptUrgentRequest(
  requestId: string,
  hostId: string
): Promise<{ success: boolean; bookingId?: string; message: string }> {
  // Step 2a. Optimistically update request status to 'accepted' ONLY if it is currently 'pending'
  const { data: request, error: updateErr } = await supabase
    .from("urgent_requests")
    .update({ status: "accepted", matched_host_id: hostId })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("*, traveler:profiles!urgent_requests_traveler_id_fkey(*)")
    .maybeSingle()

  if (updateErr) throw updateErr

  if (!request) {
    return {
      success: false,
      message: "This request has already been accepted by another host or has expired.",
    }
  }

  try {
    // Step 2b. Retrieve host's name and details
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", hostId)
      .single()

    // Step 2c. Find a published tour belonging to the host to satisfy database foreign keys
    let { data: tour } = await supabase
      .from("tours")
      .select("id, price")
      .eq("host_id", hostId)
      .eq("is_published", true)
      .limit(1)
      .maybeSingle()

    // Step 2d. If no tour exists, create a dummy tour on the fly
    if (!tour) {
      const { data: newTour, error: tourError } = await supabase
        .from("tours")
        .insert({
          host_id: hostId,
          title: `Direct Urgent Tour - ${hostProfile?.full_name || "Host"}`,
          description: "This is a direct, urgent match tour created automatically to connect traveler and host.",
          short_description: "Real-time direct host match booking.",
          price: request.budget,
          duration_hours: 2,
          max_guests: 4,
          location_name: "Current Location",
          latitude: 0,
          longitude: 0,
          category: "adventure",
          tour_type: "in_person",
          is_published: true,
          status: "published",
        })
        .select("id, price")
        .single()

      if (tourError) throw tourError
      tour = newTour
    }

    // Step 2e. Insert a booking record
    const traveler = (request as any).traveler
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        tour_id: tour.id,
        guest_id: request.traveler_id,
        host_id: hostId,
        booking_date: new Date().toISOString().split("T")[0],
        guest_count: 1,
        total_price: tour.price || request.budget,
        guest_name: traveler?.full_name || "Traveler",
        guest_email: traveler?.email || "traveler@example.com",
        guest_phone: traveler?.phone || "N/A",
        status: "confirmed",
      })
      .select("id")
      .single()

    if (bookingErr) throw bookingErr

    // Step 2f. Increment stats for accepted requests and calculate ranking
    const { data: currentStats } = await supabase
      .from("profiles")
      .select("urgent_requests_accepted")
      .eq("id", hostId)
      .single()

    const newAcceptedCount = (currentStats?.urgent_requests_accepted || 0) + 1
    await supabase
      .from("profiles")
      .update({ urgent_requests_accepted: newAcceptedCount })
      .eq("id", hostId)

    // Step 2g. Insert traveler notification
    await supabase.from("notifications").insert({
      user_id: request.traveler_id,
      booking_id: booking.id,
      message: `🎉 Host ${hostProfile?.full_name || "Guide"} has accepted your urgent request! Your booking is confirmed.`,
      type: "booking_accepted",
    })

    return {
      success: true,
      bookingId: booking.id,
      message: "Urgent request accepted successfully!",
    }
  } catch (err: any) {
    console.error("Failure while booking accepted request:", err.message)
    // Rollback status to pending if booking insertion fails
    await supabase
      .from("urgent_requests")
      .update({ status: "pending", matched_host_id: null })
      .eq("id", requestId)

    throw err
  }
}

// 3. Host declines an urgent request locally (marks status for self)
export async function declineUrgentRequest(
  requestId: string,
  hostId: string
): Promise<void> {
  // Just logs response or updates host setting tracking if required
  console.log(`Host ${hostId} declined urgent request ${requestId}`)
}
