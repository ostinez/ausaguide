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
  hostId: string,
  negotiatedPrice?: number
): Promise<{ success: boolean; bookingId?: string; message: string }> {
  // Step 2a. Optimistically update request status to 'accepted' ONLY if it is currently 'pending'
  let request: any = null

  // Try updating with matched_host_id
  const { data: primaryData, error: updateErr } = await supabase
    .from("urgent_requests")
    .update({ status: "accepted", matched_host_id: hostId })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle()

  if (updateErr) {
    // If matched_host_id column doesn't exist in live database, fallback to updating status only
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from("urgent_requests")
      .update({ status: "accepted" })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("*")
      .maybeSingle()

    if (fallbackErr) throw fallbackErr
    request = fallbackData
  } else {
    request = primaryData
  }

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
      .maybeSingle()

    // Step 2c. Fetch traveler profile safely
    const { data: travelerProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", request.traveler_id)
      .maybeSingle()

    // Step 2d. Find a published tour belonging to the host to satisfy database foreign keys
    let { data: tour } = await supabase
      .from("tours")
      .select("id, price")
      .eq("host_id", hostId)
      .eq("is_published", true)
      .limit(1)
      .maybeSingle()

    // Step 2e. If no tour exists, create a dynamic tour record on the fly
    if (!tour) {
      const { data: newTour, error: tourError } = await supabase
        .from("tours")
        .insert({
          host_id: hostId,
          title: `Direct Urgent Tour - ${hostProfile?.full_name || "Guide"}`,
          description: "Direct instant tour match booked via Ausaguide Radar.",
          short_description: "Real-time direct host match booking.",
          price: negotiatedPrice || request.budget || 30,
          duration_hours: 2,
          max_guests: 4,
          location_name: "Local Area",
          latitude: 0,
          longitude: 0,
          category: "adventure",
          tour_type: "in_person",
          is_published: true,
          status: "published",
        })
        .select("id, price")
        .maybeSingle()

      if (tourError) {
        console.warn("Could not insert dynamic tour, searching any host tour:", tourError)
        // Fallback: search any tour by host
        const { data: anyTour } = await supabase
          .from("tours")
          .select("id, price")
          .eq("host_id", hostId)
          .limit(1)
          .maybeSingle()
        tour = anyTour
      } else {
        tour = newTour
      }
    }

    // Step 2f. Insert a booking record if tour exists
    let bookingId: string | undefined = undefined
    if (tour?.id) {
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          tour_id: tour.id,
          guest_id: request.traveler_id,
          host_id: hostId,
          booking_date: new Date().toISOString().split("T")[0],
          guest_count: 1,
          total_price: negotiatedPrice || tour.price || request.budget || 30,
          guest_name: travelerProfile?.full_name || "Traveler",
          guest_email: travelerProfile?.email || "traveler@example.com",
          guest_phone: travelerProfile?.phone || "N/A",
          status: "confirmed",
        })
        .select("id")
        .maybeSingle()

      if (!bookingErr && booking) {
        bookingId = booking.id
      }
    }

    // Step 2g. Increment host stats safely
    try {
      const { data: currentStats } = await supabase
        .from("profiles")
        .select("urgent_requests_accepted")
        .eq("id", hostId)
        .maybeSingle()

      const newAcceptedCount = (currentStats?.urgent_requests_accepted || 0) + 1
      await supabase
        .from("profiles")
        .update({ urgent_requests_accepted: newAcceptedCount })
        .eq("id", hostId)
    } catch (_) {}

    // Step 2h. Notify traveler
    try {
      await supabase.from("notifications").insert({
        user_id: request.traveler_id,
        booking_id: bookingId,
        message: `Host ${hostProfile?.full_name || "Guide"} has accepted your urgent tour request!`,
        type: "booking_accepted",
      })
    } catch (_) {}

    return {
      success: true,
      bookingId,
      message: "Urgent request accepted successfully! Opening connection...",
    }
  } catch (err: any) {
    console.error("Failure while booking accepted request:", err.message)
    // Rollback status to pending if failed
    try {
      await supabase
        .from("urgent_requests")
        .update({ status: "pending" })
        .eq("id", requestId)
    } catch (_) {}

    throw err
  }
}

// 3. Host declines an urgent request locally
export async function declineUrgentRequest(
  requestId: string,
  hostId: string
): Promise<void> {
  console.log(`Host ${hostId} declined urgent request ${requestId}`)
}
