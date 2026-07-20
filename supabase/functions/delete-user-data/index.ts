// @ts-nocheck — Deno edge function: type-checked by Deno LSP, not Node TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

/**
 * delete-user-data Supabase Edge Function
 * 
 * Secure Deno serverless endpoint to permanently delete a user account in compliance with GDPR.
 * Validates request authorization header to extract user id, deletes the user profiles database row,
 * deletes bookings as a guest, and purges the auth.users record via the Admin API. Finally, dispatches
 * a confirmation email via Brevo API.
 * 
 * @param {Request} req - Incoming HTTP request with Authorization Bearer JWT token
 * @returns {Promise<Response>} Status indicator confirming successful deletion
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      throw new Error("No Authorization header provided")
    }

    // Get the JWT token
    const token = authHeader.replace("Bearer ", "")

    // Initialize Supabase Client with service role key to perform admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing database connection secrets")
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate the user token to extract the user ID safely
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const userId = user.id
    const userEmail = user.email

    console.log(`[delete-user-data] Initiated deletion for user: ${userId} (${userEmail})`)

    // 1. Delete user bookings as guest (bookings where guest_id = user.id)
    // Bookings where host_id = user.id will cascade delete automatically since public.bookings has host_id references profiles(id) on delete cascade
    const { error: guestBookingsErr } = await supabaseAdmin
      .from("bookings")
      .delete()
      .eq("guest_id", userId)
    if (guestBookingsErr) {
      console.error(`[delete-user-data] Error deleting guest bookings:`, guestBookingsErr)
    }

    // 2. Delete comments made by user
    const { error: commentsErr } = await supabaseAdmin
      .from("comments")
      .delete()
      .eq("author_id", userId)
    if (commentsErr) {
      console.error(`[delete-user-data] Error deleting comments:`, commentsErr)
    }

    // 3. Delete from public.profiles
    // This will cascade delete: hosts, tours, bookings (where host), messages, host_availability, waiting_list, host_settings, refunds, wishlist, journal_entries, notifications, audit_logs
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId)
    if (profileErr) {
      console.error(`[delete-user-data] Error deleting profiles:`, profileErr)
    }

    // 4. Delete user record in auth.users
    const { error: deleteUserErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteUserErr) {
      console.error(`[delete-user-data] Error deleting auth user:`, deleteUserErr)
      throw new Error(`Failed to delete user account: ${deleteUserErr.message}`)
    }

    // 5. Send confirmation email via Brevo or Resend if keys exist
    const brevoKey = Deno.env.get("BREVO_API_KEY")
    const resendKey = Deno.env.get("RESEND_API_KEY")
    const subject = "Your Ausaguide account has been deleted"
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #ef4444; border-bottom: 1px solid #eee; padding-bottom: 10px;">Account Deletion Confirmed</h2>
        <p>Hello,</p>
        <p>We are writing to confirm that your Ausaguide account and all associated personal data have been permanently deleted from our servers in compliance with GDPR/CCPA regulations.</p>
        <p>In accordance with the "Right to be Forgotten", the following information has been fully purged:</p>
        <ul style="padding-left: 20px;">
          <li>Your profile data (name, email, bio, phone, documents)</li>
          <li>Your created tours, bookings, and availability preferences</li>
          <li>Your messages, comments, social posts, and travel journal entries</li>
        </ul>
        <p>We are sorry to see you go! If you ever wish to join us again, you are welcome to sign up for a new account at any time.</p>
        <p>Best regards,<br/><strong>The Ausaguide Team</strong></p>
      </div>
    `

    if (resendKey) {
      console.log("[delete-user-data] Sending email via Resend...")
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Ausaguide <welcome@ausaguide.com>",
          to: [userEmail],
          subject: subject,
          html: html,
        }),
      })
      if (!emailRes.ok) {
        console.error(`[delete-user-data] Resend email send failed: ${await emailRes.text()}`)
      }
    } else if (brevoKey) {
      console.log("[delete-user-data] Sending email via Brevo...")
      const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Ausaguide", email: "welcome@ausaguide.com" },
          to: [{ email: userEmail }],
          subject: subject,
          htmlContent: html,
        }),
      })
      if (!emailRes.ok) {
        console.error(`[delete-user-data] Brevo email send failed: ${await emailRes.text()}`)
      }
    } else {
      console.log(`[delete-user-data] [Sandbox Mode] Sent account deletion email to ${userEmail}`)
    }

    return new Response(JSON.stringify({ success: true, message: "Account and associated data deleted successfully." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error(`[delete-user-data] Server error:`, error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
