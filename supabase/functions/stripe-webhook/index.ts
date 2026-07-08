import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get("Stripe-Signature")
    if (!signature) {
      console.error("Missing Stripe-Signature header")
      return new Response("Missing signature", { status: 400, headers: corsHeaders })
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || ""
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment")
      return new Response("Configuration Error", { status: 500, headers: corsHeaders })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders })
    }

    console.log(`🔔 Stripe Webhook Received: Event ID=${event.id}, Type=${event.type}`)

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables not set")
      return new Response("Configuration Error", { status: 500, headers: corsHeaders })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle succeeded and failed payment intent events
    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const piId = paymentIntent.id
      const bookingId = paymentIntent.metadata?.booking_id

      console.log(`Processing ${event.type} for PaymentIntent: ${piId}, Booking ID: ${bookingId}`)

      // Retrieve the booking
      let bookingQuery = supabase.from("bookings").select("*, tour:tours(title)")
      if (bookingId) {
        bookingQuery = bookingQuery.eq("id", bookingId)
      } else {
        bookingQuery = bookingQuery.eq("stripe_payment_intent_id", piId)
      }

      const { data: booking, error: fetchErr } = await bookingQuery.maybeSingle()
      if (fetchErr) {
        console.error(`Error querying database for booking:`, fetchErr)
        return new Response("Database Error", { status: 500, headers: corsHeaders })
      }

      if (!booking) {
        console.warn(`No booking found matching PaymentIntent ${piId} / Booking ID ${bookingId}`)
        return new Response(JSON.stringify({ received: true, warning: "no_booking_found" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const isSuccess = event.type === "payment_intent.succeeded"
      const newStatus = isSuccess ? "confirmed" : "failed"

      // Append to status history
      let statusHistory = booking.status_history || []
      if (!Array.isArray(statusHistory)) {
        statusHistory = [
          { status: "pending", timestamp: booking.created_at || new Date().toISOString() }
        ]
      }
      statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        reason: isSuccess ? "Payment succeeded via Stripe webhook" : `Payment failed: ${paymentIntent.last_payment_error?.message || "unknown failure"}`
      })

      // Update booking status
      const { data: updatedBooking, error: updateErr } = await supabase
        .from("bookings")
        .update({
          status: newStatus,
          stripe_payment_intent_id: piId,
          status_history: statusHistory,
        })
        .eq("id", booking.id)
        .select()
        .single()

      if (updateErr) {
        console.error(`Failed to update booking status for ID ${booking.id}:`, updateErr)
        return new Response("Update Error", { status: 500, headers: corsHeaders })
      }

      console.log(`Successfully updated booking ${booking.id} status to ${newStatus}`)

      // Prepare notifications to insert
      const notifications = []
      const tourTitle = booking.tour?.title || "your tour"

      if (isSuccess) {
        if (booking.guest_id) {
          notifications.push({
            user_id: booking.guest_id,
            booking_id: booking.id,
            message: `Your booking for '${tourTitle}' has been paid and confirmed!`,
            type: "booking_accepted",
            read: false,
          })
        }
        notifications.push({
          user_id: booking.host_id,
          booking_id: booking.id,
          message: `Payment received! Booking request from ${booking.guest_name} is confirmed.`,
          type: "booking_request",
          read: false,
        })
      } else {
        if (booking.guest_id) {
          notifications.push({
            user_id: booking.guest_id,
            booking_id: booking.id,
            message: `Payment failed for your booking of '${tourTitle}'. Please try again.`,
            type: "booking_declined",
            read: false,
          })
        }
      }

      if (notifications.length > 0) {
        const { error: notifErr } = await supabase.from("notifications").insert(notifications)
        if (notifErr) {
          console.error(`Failed to insert notifications for booking ${booking.id}:`, notifErr)
        } else {
          console.log(`Inserted ${notifications.length} notification(s) for booking ${booking.id}`)
        }
      }
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const sessionId = session.id
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null

      console.log(`Processing checkout.session.completed for Session ID: ${sessionId}`)

      // Update donation status
      const { data: donation, error: donationErr } = await supabase
        .from("donations")
        .update({
          status: "completed",
          stripe_payment_intent: paymentIntentId,
          completed_at: new Date().toISOString(),
        })
        .eq("stripe_session_id", sessionId)
        .select()
        .maybeSingle()

      if (donationErr) {
        console.error(`Error updating donation for session ${sessionId}:`, donationErr)
      } else if (!donation) {
        console.warn(`No donation record found matching Stripe Session ID ${sessionId}`)
      } else {
        console.log(`Successfully completed donation ID ${donation.id} of type ${donation.type} for ${donation.amount} cents`)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err: any) {
    console.error(`Unhandled webhook error: ${err.message}`)
    return new Response(`Server Error: ${err.message}`, { status: 500, headers: corsHeaders })
  }
})
