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

    let stripeResult: any = null;
    const newStatus = action === 'confirm' ? 'confirmed' : 'declined'

    // Perform Stripe actions gracefully
    try {
      if (action === 'confirm') {
        console.log(`Processing confirmation for PaymentIntent ${paymentIntentId} for booking ${bookingId}`)
        // Fetch current intent status first
        try {
          const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
          if (intent.status === 'requires_capture') {
            stripeResult = await stripe.paymentIntents.capture(paymentIntentId)
            console.log(`Successfully captured PaymentIntent ${paymentIntentId}`)
          } else {
            console.log(`PaymentIntent ${paymentIntentId} status is '${intent.status}'. No capture needed or already captured.`)
            stripeResult = intent
          }

          // Check for host Stripe Connect transfer if host has account
          const { data: hostData } = await supabase
            .from("hosts")
            .select("stripe_account_id, stripe_connect_id")
            .eq("user_id", booking.host_id)
            .maybeSingle()

          const hostStripeId = hostData?.stripe_account_id || hostData?.stripe_connect_id

          if (hostStripeId && booking.total_price) {
            try {
              console.log(`Attempting Stripe Connect transfer to host ${hostStripeId}...`)
              // Transfer 85% of total price to host (15% platform fee)
              const amountInCents = Math.round(booking.total_price * 100 * 0.85)
              if (amountInCents > 0) {
                const transfer = await stripe.transfers.create({
                  amount: amountInCents,
                  currency: booking.currency ? booking.currency.toLowerCase() : "usd",
                  destination: hostStripeId,
                  description: `Host payout for booking ${bookingId}`,
                })
                console.log(`Stripe Connect transfer successful: ${transfer.id}`)
              }
            } catch (transferErr: any) {
              console.warn(`Stripe Connect transfer warning for host ${hostStripeId}: ${transferErr.message}`)
            }
          }

        } catch (retrieveErr: any) {
          console.warn(`Stripe PaymentIntent operation failed for ${paymentIntentId}: ${retrieveErr.message}. Proceeding with DB update.`)
          stripeResult = { error: retrieveErr.message }
        }
      } else {
        console.log(`Canceling PaymentIntent ${paymentIntentId} for booking ${bookingId}`)
        try {
          stripeResult = await stripe.paymentIntents.cancel(paymentIntentId)
        } catch (cancelErr: any) {
          console.warn(`Stripe cancel failed for ${paymentIntentId}: ${cancelErr.message}. Proceeding with DB update.`)
          stripeResult = { error: cancelErr.message }
        }
      }
    } catch (stripeErr: any) {
      console.warn(`Stripe operation outer warning for booking ${bookingId}: ${stripeErr.message}`)
    }

    // Update database status to 'confirmed' or 'declined'
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
      return new Response(JSON.stringify({ error: "Failed to update booking status in database", details: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(`Successfully updated booking ${bookingId} status to '${newStatus}'`)

    // Create notification & ensure conversation thread for traveler and host
    const travelerId = booking.guest_id
    if (travelerId) {
      const msg = action === 'confirm' 
        ? `Your booking for '${booking.tour?.title || 'your tour'}' has been confirmed!` 
        : `Your booking for '${booking.tour?.title || 'your tour'}' has been declined.`
      
      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: travelerId,
        booking_id: bookingId,
        message: msg,
        type: action === 'confirm' ? 'booking_accepted' : 'booking_declined',
        read: false,
      })

      if (notifErr) {
        console.warn("Failed to insert notification for traveler:", notifErr)
      }

      if (action === 'confirm' && booking.host_id) {
        try {
          // Check if conversation already exists between host and guest
          const { data: existingConv } = await supabase
            .from("conversations")
            .select("id")
            .or(`and(participant1_id.eq.${booking.host_id},participant2_id.eq.${travelerId}),and(participant1_id.eq.${travelerId},participant2_id.eq.${booking.host_id})`)
            .maybeSingle()

          if (!existingConv) {
            await supabase.from("conversations").insert({
              participant1_id: booking.host_id,
              participant2_id: travelerId,
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
