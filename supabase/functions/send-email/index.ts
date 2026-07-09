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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = (await req.json()) as EmailPayload;

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const brevoKey = Deno.env.get("BREVO_API_KEY");

    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
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
      return new Response(JSON.stringify({ success: true, provider: "resend" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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
      return new Response(JSON.stringify({ success: true, provider: "brevo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Sandbox / Console logging mode when keys are not available
      console.log(`[Sandbox Email] To: ${to}, Subject: ${subject}`);
      return new Response(JSON.stringify({ success: true, sandbox: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Error sending email:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
