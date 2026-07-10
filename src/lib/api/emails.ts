import { toast } from "sonner"
import { supabase } from "../supabase"

interface EmailPayload {
  to: string
  subject: string
  html: string
  subscribeNewsletter?: boolean
  name?: string
}

async function dispatchEmail({ to, subject, html, subscribeNewsletter, name }: EmailPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html, subscribeNewsletter, name },
    })

    if (error) {
      console.error("Failed to invoke send-email edge function:", error)
      return false
    }

    if (data?.sandbox) {
      // Sandbox mode
      console.log(`%c[SIMULATED EMAIL] To: ${to}\nSubject: ${subject}\nContent:\n${html.replace(/<[^>]*>/g, "")}`, "color: #7f5af0; font-weight: bold;")
      toast.info(`Simulated Email Sent: "${subject}" to ${to}`, {
        duration: 5000,
        description: "Sandbox mode (No API keys provided in Edge Function). Details logged to DevTools console.",
      })
    } else {
      console.log(`[Email Sent via Edge Function] To: ${to} | Subject: ${subject}`)
    }
    
    return true
  } catch (e) {
    console.error("Failed to connect to send-email Edge Function", e)
    return false
  }
}

export async function sendWelcomeEmail(to: string, userName: string, subscribeNewsletter?: boolean): Promise<boolean> {
  const subject = `Welcome to Ausaguide, ${userName}!`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c; line-height: 1.6;">
      <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>
      <p style="font-size: 16px; margin-bottom: 20px;">Welcome to Ausaguide! 🎉</p>
      <p style="font-size: 16px; margin-bottom: 25px;">You're now part of a community that connects travelers with authentic local experiences in Kenya.</p>
      
      <div style="background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #edf2f7;">
        <h3 style="margin-top: 0; margin-bottom: 12px; color: #2d3748; font-size: 16px; font-weight: bold;">What's next?</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #4a5568; list-style-type: disc;">
          <li style="margin-bottom: 8px;">Browse tours and discover unique experiences</li>
          <li style="margin-bottom: 8px;">Connect with local hosts</li>
          <li style="margin-bottom: 0;">Start your adventure</li>
        </ul>
      </div>

      <p style="font-size: 15px; margin-bottom: 20px;">If you're interested in becoming a host, visit our <a href="https://ausaguide.com/host/signup" style="color: #7f5af0; text-decoration: underline; font-weight: bold;">host page</a> to learn more.</p>
      
      <p style="font-size: 15px; margin-bottom: 20px;">Questions? Reach out at <a href="mailto:welcome@ausaguide.com" style="color: #7f5af0; text-decoration: none; font-weight: bold;">welcome@ausaguide.com</a></p>
      
      <p style="font-size: 15px; margin-bottom: 0; font-weight: bold;">Cheers,<br/>The Ausaguide Team</p>
      
      <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html, subscribeNewsletter, name: userName })
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

export async function sendHostWaitlistEmail(to: string, userName: string): Promise<boolean> {
  const subject = "Welcome to the Ausaguide Host Waiting List!"
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;">
      <h1 style="color: #7f5af0; margin-bottom: 20px;">Welcome to the Host Waiting List, ${userName}!</h1>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">Thank you for your interest in becoming a local host on Ausaguide. We are building a platform to connect curious global travelers with passionate local guides like you.</p>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">We have successfully received your registration details. Our team is review applications for host onboarding, and we'll contact you when locations open up in your area!</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

export async function sendGeneralWaitlistEmail(to: string, userName: string, role: string): Promise<boolean> {
  const roleName = role === "both" ? "Traveler & Host" : role.charAt(0).toUpperCase() + role.slice(1)
  const subject = "You're on the Ausaguide Launch Waiting List!"
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;">
      <h1 style="color: #7f5af0; margin-bottom: 20px;">Welcome to the Waitlist, ${userName}!</h1>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">Thank you for joining the waiting list for Ausaguide. We are launching early access soon and we're excited to have you onboard as a <strong>${roleName}</strong>.</p>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">We will send you updates as we approach our launch day (90 days from now). Stay tuned for early sneak peeks, feature updates, and special pioneer bonuses!</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

