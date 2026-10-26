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
    const brevoApiKey = Deno.env.get("BREVO_API_KEY") || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const results = { unreadEmailsSent: 0, pendingBookingEmailsSent: 0 }

    // 1. Fetch unread messages older than 30 minutes that haven't been emailed yet
    const { data: unreadMessages, error: msgErr } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        created_at,
        sender:profiles!messages_sender_id_fkey(id, full_name, role),
        receiver:profiles!messages_receiver_id_fkey(id, full_name, email)
      `)
      .eq("read", false)
      .eq("fallback_emailed", false)
      .lt("created_at", thirtyMinutesAgo)
      .limit(50)

    if (msgErr) {
      console.warn("Error fetching unread messages for fallback email:", msgErr)
    } else if (unreadMessages && unreadMessages.length > 0 && brevoApiKey) {
      // Group unread messages by receiver
      const byReceiver: Record<string, { receiver: any; senders: Set<string>; msgCount: number; ids: string[] }> = {}
      for (const msg of unreadMessages) {
        const r = msg.receiver
        if (!r?.email) continue
        if (!byReceiver[r.email]) {
          byReceiver[r.email] = {
            receiver: r,
            senders: new Set(),
            msgCount: 0,
            ids: [],
          }
        }
        byReceiver[r.email].msgCount++
        byReceiver[r.email].ids.push(msg.id)
        if (msg.sender?.full_name) {
          byReceiver[r.email].senders.add(msg.sender.full_name)
        }
      }

      for (const [email, info] of Object.entries(byReceiver)) {
        const senderList = Array.from(info.senders).join(", ") || "A traveler/host"
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0D6F73; margin: 0;">Ausaguide</h2>
              <p style="color: #666; font-size: 14px; margin-top: 4px;">Kenya Authentic Travel Experience</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; color: #0f172a;">You have unread messages waiting</h3>
              <p style="font-size: 15px; line-height: 1.5; color: #334155;">
                Hello <strong>${info.receiver.full_name || "there"}</strong>,<br/><br/>
                You received ${info.msgCount} new message(s) from <strong>${senderList}</strong> on Ausaguide over 30 minutes ago that you haven't seen yet.
              </p>
              <div style="text-align: center; margin: 28px 0 10px;">
                <a href="https://ausaguide.com/messages" style="background-color: #0D6F73; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                  View & Reply to Messages
                </a>
              </div>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              You received this email because you have unread notifications on Ausaguide.
            </p>
          </div>
        `

        try {
          const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "api-key": brevoApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: { name: "Ausaguide", email: "support@ausaguide.com" },
              to: [{ email, name: info.receiver.full_name || "Ausaguide Member" }],
              subject: `You have unread messages from ${senderList} on Ausaguide`,
              htmlContent: html,
            }),
          })

          if (emailRes.ok) {
            results.unreadEmailsSent++
            // Mark messages as fallback_emailed
            await supabase
              .from("messages")
              .update({ fallback_emailed: true })
              .in("id", info.ids)
          } else {
            console.error("Brevo email send failure:", await emailRes.text())
          }
        } catch (emailErr) {
          console.error("Error sending message notification email:", emailErr)
        }
      }
    }

    // 2. Fetch pending bookings older than 30 minutes without host confirmation
    const { data: pendingBookings, error: bErr } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_date,
        total_price,
        currency,
        guest_name,
        created_at,
        tour:tours(title, location),
        host:profiles!bookings_host_id_fkey(id, full_name, email)
      `)
      .eq("status", "pending")
      .eq("fallback_emailed", false)
      .lt("created_at", thirtyMinutesAgo)
      .limit(30)

    if (bErr) {
      console.warn("Error fetching pending bookings:", bErr)
    } else if (pendingBookings && pendingBookings.length > 0 && brevoApiKey) {
      for (const b of pendingBookings) {
        const host = b.host
        if (!host?.email) continue

        const tourTitle = (b.tour as any)?.title || "Tour"
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0D6F73; margin: 0;">Ausaguide</h2>
              <p style="color: #666; font-size: 14px; margin-top: 4px;">Host Booking Alert</p>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; color: #92400e;">Booking awaiting your confirmation</h3>
              <p style="font-size: 15px; line-height: 1.5; color: #78350f;">
                Hello <strong>${host.full_name || "Host"}</strong>,<br/><br/>
                Guest <strong>${b.guest_name || "A traveler"}</strong> requested a booking for <strong>${tourTitle}</strong> on <strong>${b.booking_date}</strong>. This request has been waiting for your response for over 30 minutes.
              </p>
              <div style="text-align: center; margin: 28px 0 10px;">
                <a href="https://ausaguide.com/host/dashboard?tab=bookings" style="background-color: #0D6F73; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                  Confirm or Decline Booking
                </a>
              </div>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              Responding promptly increases your Host rating and ranking on Ausaguide.
            </p>
          </div>
        `

        try {
          const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "api-key": brevoApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: { name: "Ausaguide Bookings", email: "bookings@ausaguide.com" },
              to: [{ email: host.email, name: host.full_name || "Host" }],
              subject: `Action Required: Pending booking for "${tourTitle}" on Ausaguide`,
              htmlContent: html,
            }),
          })

          if (emailRes.ok) {
            results.pendingBookingEmailsSent++
            await supabase
              .from("bookings")
              .update({ fallback_emailed: true })
              .eq("id", b.id)
          }
        } catch (e) {
          console.error("Failed to send host confirmation alert email:", e)
        }
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
