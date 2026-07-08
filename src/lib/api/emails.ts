import { toast } from "sonner"

// Retrieve config keys from env or local storage
const getResendKey = () => localStorage.getItem("RESEND_API_KEY") || (import.meta.env.VITE_RESEND_API_KEY as string) || ""
const getBrevoKey = () => localStorage.getItem("BREVO_API_KEY") || (import.meta.env.VITE_BREVO_API_KEY as string) || ""

interface EmailPayload {
  to: string
  subject: string
  html: string
}

async function dispatchEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  const resendKey = getResendKey()
  const brevoKey = getBrevoKey()

  if (resendKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Ausaguide <onboarding@resend.dev>",
          to: [to],
          subject: subject,
          html: html,
        }),
      })

      if (response.ok) {
        console.log(`[Email Sent via Resend] To: ${to} | Subject: ${subject}`)
        return true
      } else {
        const errData = await response.json()
        console.error("Resend error:", errData)
      }
    } catch (e) {
      console.error("Failed to connect to Resend API", e)
    }
  } else if (brevoKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
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
      })

      if (response.ok) {
        console.log(`[Email Sent via Brevo] To: ${to} | Subject: ${subject}`)
        return true
      } else {
        const errData = await response.json()
        console.error("Brevo error:", errData)
      }
    } catch (e) {
      console.error("Failed to connect to Brevo API", e)
    }
  }

  // Fallback / Sandbox mode
  console.log(`%c[SIMULATED EMAIL] To: ${to}\nSubject: ${subject}\nContent:\n${html.replace(/<[^>]*>/g, "")}`, "color: #7f5af0; font-weight: bold;")
  toast.info(`Simulated Email Sent: "${subject}" to ${to}`, {
    duration: 5000,
    description: "Sandbox mode (No API keys provided). Details logged to DevTools console.",
  })
  return true
}

export async function sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
  const subject = "Welcome to Ausaguide - Explore Kenya!"
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h1 style="color: #7f5af0; margin-bottom: 20px;">Welcome to Ausaguide, ${userName}!</h1>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">We're thrilled to have you join our community. Ausaguide helps you discover authentic Kenyan experiences led by passionate local hosts.</p>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">You can now browse and book street food tours, nature safaris, photography walks, and cultural journeys.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="https://ausaguide.com/tours" style="background-color: #7f5af0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block;">Explore Tours</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

export async function sendBookingConfirmationEmail(
  to: string,
  guestName: string,
  tourTitle: string,
  date: string,
  price: string
): Promise<boolean> {
  const subject = `Booking Confirmed: ${tourTitle}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h1 style="color: #10b981; margin-bottom: 20px;">Your Booking is Confirmed!</h1>
      <p style="font-size: 16px; color: #4a5568;">Hi ${guestName},</p>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">Get ready for an incredible experience. Your booking for <strong>${tourTitle}</strong> has been confirmed.</p>
      
      <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2d3748;">Trip Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4a5568;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Date:</td>
            <td style="padding: 6px 0;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Total Paid:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: bold;">${price}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 14px; color: #718096; line-height: 1.6;">If you have any questions, you can message your host directly from your dashboard.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="https://ausaguide.com/dashboard" style="background-color: #7f5af0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block;">Go to Dashboard</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

export async function sendBookingRequestEmail(
  hostEmail: string,
  hostName: string,
  guestName: string,
  tourTitle: string,
  date: string
): Promise<boolean> {
  const subject = `New Booking Request: ${tourTitle}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h1 style="color: #d97706; margin-bottom: 20px;">New Booking Request Received!</h1>
      <p style="font-size: 16px; color: #4a5568;">Hi ${hostName},</p>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">You have received a new booking request from <strong>${guestName}</strong> for your tour <strong>${tourTitle}</strong> on <strong>${date}</strong>.</p>
      <p style="font-size: 16px; color: #4a5568;">Please review this booking request in your host dashboard to confirm or decline the booking.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="https://ausaguide.com/dashboard" style="background-color: #7f5af0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block;">Review Request</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to: hostEmail, subject, html })
}

export async function sendTourApprovalEmail(
  hostEmail: string,
  hostName: string,
  tourTitle: string
): Promise<boolean> {
  const subject = `Tour Listing Approved: ${tourTitle}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h1 style="color: #10b981; margin-bottom: 20px;">Your Tour Has Been Approved!</h1>
      <p style="font-size: 16px; color: #4a5568;">Congratulations ${hostName},</p>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">Our admin team has reviewed and approved your tour listing <strong>${tourTitle}</strong>. It is now live and bookable on the Ausaguide platform!</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="https://ausaguide.com/tours" style="background-color: #7f5af0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block;">View Listing</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to: hostEmail, subject, html })
}
