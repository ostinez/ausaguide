// @ts-nocheck -- Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables")
      return new Response(JSON.stringify({ error: "Configuration Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch confirmed bookings where reminder has not been sent yet
    const { data: bookings, error: fetchErr } = await supabase
      .from("bookings")
      .select("*, tour:tours(*)")
      .eq("status", "confirmed")
      .or("reminder_sent.is.null,reminder_sent.eq.false")

    if (fetchErr) {
      console.error("Error fetching bookings for tour reminders:", fetchErr)
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const now = new Date()
    const processedBookings: string[] = []

    for (const booking of bookings || []) {
      try {
        const tour = booking.tour
        if (!tour) continue

        // Construct booking start timestamp
        const dateStr = booking.booking_date
        const timeStr = booking.booking_time || "10:00 AM"
        
        // Parse booking date & time into Date object
        const startTime = new Date(`${dateStr} ${timeStr}`)
        const isValidDate = !isNaN(startTime.getTime())

        // Calculate time difference in minutes
        // Send reminder if tour starts within 15 minutes or if scheduled start time has arrived
        const timeDiffMs = isValidDate ? startTime.getTime() - now.getTime() : 0
        const minutesUntilStart = timeDiffMs / (1000 * 60)

        // Check if reminder is due (starts in <= 15 mins or past due up to 60 mins)
        const isDue = !isValidDate || (minutesUntilStart <= 15 && minutesUntilStart >= -60)

        if (!isDue) {
          continue
        }

        console.log(`Sending reminder for booking ${booking.id} (${tour.title})`)

        const isVirtual = booking.booking_type === "virtual" || tour.is_virtual || tour.daily_room_url
        const dailyRoomUrl = tour.daily_room_url || `https://ausaguide.daily.co/tour-${booking.id.slice(0, 8)}`
        const locationName = tour.location_name || "Designated Tour Location"

        const travelerEmail = booking.guest_email
        const travelerName = booking.guest_name || "Traveler"
        const tourTitle = tour.title || "Your Experience"
        const formattedDate = dateStr
        const formattedTime = timeStr

        let emailContent = ""
        let emailSubject = `Upcoming Tour Reminder: ${tourTitle}`
        let joinLink = ""

        if (isVirtual) {
          joinLink = dailyRoomUrl
          emailContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
              <h2 style="color: #0d9488;">Your Virtual Tour is About to Start!</h2>
              <p>Hi <strong>${travelerName}</strong>,</p>
              <p>Your upcoming virtual tour <strong>"${tourTitle}"</strong> starts shortly!</p>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
                <p style="margin: 5px 0;"><strong>Format:</strong> Live Virtual Tour (Daily.co)</p>
              </div>
              <p style="font-size: 16px; font-weight: bold; color: #0f766e;">Your tour is about to start! Click the link below to join:</p>
              <p style="margin: 25px 0;">
                <a href="${joinLink}" target="_blank" style="background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">Join Virtual Tour Room</a>
              </p>
              <p style="font-size: 12px; color: #64748b;">Direct Link: <a href="${joinLink}">${joinLink}</a></p>
            </div>
          `
        } else {
          emailContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
              <h2 style="color: #0d9488;">Upcoming Tour Reminder!</h2>
              <p>Hi <strong>${travelerName}</strong>,</p>
              <p>Your upcoming physical tour <strong>"${tourTitle}"</strong> is starting soon!</p>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
                <p style="margin: 5px 0;"><strong>Meeting Location:</strong> ${locationName}</p>
              </div>
              <p style="font-size: 16px; font-weight: bold; color: #0f766e;">Your tour is about to start! Please head to the meeting location.</p>
            </div>
          `
        }

        // 1. Dispatch email via send-email edge function
        if (travelerEmail) {
          try {
            await supabase.functions.invoke("send-email", {
              body: {
                to: travelerEmail,
                subject: emailSubject,
                html: emailContent,
              }
            })
          } catch (emailErr) {
            console.warn(`Failed to dispatch reminder email to ${travelerEmail}:`, emailErr)
          }
        }

        // 2. Insert in-app notification
        if (booking.guest_id) {
          const notifMsg = isVirtual 
            ? `Reminder: Your virtual tour '${tourTitle}' starts in 5 minutes! Click to join: ${joinLink}`
            : `Reminder: Your tour '${tourTitle}' starts in 5 minutes at ${locationName}!`

          await supabase.from("notifications").insert({
            user_id: booking.guest_id,
            booking_id: booking.id,
            message: notifMsg,
            type: "tour_reminder",
            read: false,
          })
        }

        // 3. Mark reminder_sent in database
        await supabase
          .from("bookings")
          .update({
            reminder_sent: true,
            reminder_scheduled_at: new Date().toISOString(),
          })
          .eq("id", booking.id)

        processedBookings.push(booking.id)

      } catch (singleErr: any) {
        console.error(`Error processing reminder for booking ${booking.id}:`, singleErr)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: processedBookings.length,
        bookingIds: processedBookings,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )

  } catch (err: any) {
    console.error(`Unhandled edge function error in send-tour-reminders: ${err.message}`)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
