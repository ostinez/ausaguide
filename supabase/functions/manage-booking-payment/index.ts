// @ts-nocheck -- Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno"

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
    const { bookingId, action, declineReason } = await req.json()

    if (!bookingId || !action || !['confirm', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: "Missing or invalid required fields: bookingId, action ('confirm' or 'reject')" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || ""
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment")
      return new Response(JSON.stringify({ error: "Stripe configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })

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

    const paymentIntentId = booking.stripe_payment_intent_id

    if (!paymentIntentId) {
      console.warn(`Booking ${bookingId} has no Stripe Payment Intent ID associated. Simulating action in database.`)
      // Fallback for test bookings without real Stripe transactions
      const newStatus = action === 'confirm' ? 'confirmed' : 'declined'
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

      return new Response(JSON.stringify({ success: true, booking: updatedBooking, simulated: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let stripeResult;
    const newStatus = action === 'confirm' ? 'confirmed' : 'declined'

    if (action === 'confirm') {
      console.log(`Capturing PaymentIntent ${paymentIntentId} for booking ${bookingId}`)
      stripeResult = await stripe.paymentIntents.capture(paymentIntentId)
    } else {
      console.log(`Canceling PaymentIntent ${paymentIntentId} for booking ${bookingId}`)
      stripeResult = await stripe.paymentIntents.cancel(paymentIntentId)
    }

    // Update database immediately
    const { data: updatedBooking, error: updateErr } = await supabase
      .from("bookings")
      .update({
        status: newStatus,
        decline_reason: action === 'reject' ? (declineReason || "Rejected by host") : null,
      })
      .eq("id", bookingId)
      .select()
      .single()

    if (updateErr) {
      console.error("Database update failed after Stripe operation:", updateErr)
    }

    // Create notification
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
    }

    return new Response(JSON.stringify({ success: true, booking: updatedBooking, stripeResult }), {
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
