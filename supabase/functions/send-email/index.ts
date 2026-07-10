// @ts-nocheck -- Deno edge function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  subscribeNewsletter?: boolean;
  name?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, subject, html, subscribeNewsletter, name } = body as EmailPayload;

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const brevoKey = Deno.env.get("BREVO_API_KEY");

    let newsletterStatus = "skipped";
    let newsletterError = null;

    // Handle newsletter subscription if requested
    if (subscribeNewsletter) {
      if (brevoKey) {
        try {
          const names = (name || "").trim().split(" ");
          const firstName = names[0] || "";
          const lastName = names.slice(1).join(" ") || "";

          const brevoContactRes = await fetch("https://api.brevo.com/v3/contacts", {
            method: "POST",
            headers: {
              "api-key": brevoKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: to,
              attributes: {
                FIRSTNAME: firstName,
                LASTNAME: lastName,
              },
              updateEnabled: true,
            }),
          });

          if (!brevoContactRes.ok) {
            const errText = await brevoContactRes.text();
            console.error(`Brevo contacts registration failed: ${errText}`);
            newsletterStatus = "failed";
            newsletterError = errText;
          } else {
            newsletterStatus = "subscribed";
          }
        } catch (e) {
          console.error("Error creating Brevo contact:", e);
          newsletterStatus = "error";
          newsletterError = e.message;
        }
      } else {
        newsletterStatus = "sandbox";
        console.log(`[Sandbox Newsletter] Subscribing email: ${to}, Name: ${name}`);
      }
    }

    // Send the email
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Ausaguide <welcome@ausaguide.com>",
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Resend API error: ${errorText}`);
      }
      return new Response(
        JSON.stringify({
          success: true,
          provider: "resend",
          newsletter: newsletterStatus,
          newsletterError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (brevoKey) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Ausaguide", email: "welcome@ausaguide.com" },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Brevo API error: ${errorText}`);
      }
      return new Response(
        JSON.stringify({
          success: true,
          provider: "brevo",
          newsletter: newsletterStatus,
          newsletterError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Sandbox / Console logging mode when keys are not available
      console.log(`[Sandbox Email] To: ${to}, Subject: ${subject}`);
      return new Response(
        JSON.stringify({
          success: true,
          sandbox: true,
          newsletter: newsletterStatus,
          newsletterError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Error in send-email function:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Check Supabase project settings & Brevo API Key status.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
