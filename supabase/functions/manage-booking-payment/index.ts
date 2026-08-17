// @ts-nocheck -- Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const bookingId = body.bookingId || body.booking_id
    let action = body.action || (body.status === "confirmed" ? "confirm" : body.status === "declined" ? "reject" : null)
    const declineReason = body.declineReason || body.decline_reason || body.reason

    if (!bookingId || !action || !['confirm', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: "Missing or invalid required fields: bookingId (or booking_id), action ('confirm' or 'reject')" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables not set")
      return new Response(JSON.stringify({ error: "Database configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch booking details
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*, tour:tours(title)")
      .eq("id", bookingId)
      .single()

    if (bookingErr || !booking) {
      console.error("Failed to fetch booking details:", bookingErr)
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'declined'

    // Update status in database
    const { data: updatedBooking, error: updateErr } = await supabase
      .from("bookings")
      .update({
        status: newStatus,
        decline_reason: action === 'reject' ? (declineReason || "Rejected by host") : null,
      })
      .eq("id", bookingId)
      .select()
      .single()

    if (updateErr) throw updateErr

    // Send notifications and ensure conversation thread
    const travelerId = booking.guest_id
    if (travelerId) {
      const msg = action === 'confirm' 
        ? `Your booking for '${booking.tour?.title || 'your tour'}' has been confirmed!` 
        : `Your booking for '${booking.tour?.title || 'your tour'}' has been declined.`
      
      await supabase.from("notifications").insert({
        user_id: travelerId,
        booking_id: bookingId,
        message: msg,
        type: action === 'confirm' ? 'booking_accepted' : 'booking_declined',
        read: false,
      })

      if (action === 'confirm' && booking.host_id) {
        try {
          const [pA, pB] = [booking.host_id, travelerId].sort()
          const { data: existingConv } = await supabase
            .from("conversations")
            .select("id")
            .or(`and(participant_a.eq.${pA},participant_b.eq.${pB}),and(participant_a.eq.${pB},participant_b.eq.${pA})`)
            .maybeSingle()

          if (!existingConv) {
            await supabase.from("conversations").insert({
              participant_a: pA,
              participant_b: pB,
              last_message: `Booking confirmed for ${booking.tour?.title || 'tour'}`,
              last_message_at: new Date().toISOString(),
            })
            console.log(`Created new chat conversation thread between host ${booking.host_id} and guest ${travelerId}`)
          }
        } catch (convErr: any) {
          console.warn("Failed to auto-create conversation thread:", convErr)
        }
      }
    }

    return new Response(JSON.stringify({ success: true, booking: updatedBooking }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err: any) {
    console.error(`Unhandled edge function error: ${err.message}`)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
