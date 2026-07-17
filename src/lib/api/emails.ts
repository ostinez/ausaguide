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
  const subject = "Welcome to Ausaguide — Confirm Your Email"
  const confirmationLink = "https://ausaguide.com/auth/callback"
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #16161A; color: #fffffe; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://ausaguide.com/logo-primary.png" alt="Ausaguide" style="height: 36px; width: auto; display: inline-block;" />
      </div>
      <p style="font-size: 16px; margin-bottom: 20px; color: #fffffe;">Hi ${userName}, thanks for signing up for Ausaguide!</p>
      <p style="font-size: 16px; margin-bottom: 24px; color: #a7a9be;">Please confirm your email address by clicking the link below:</p>
      
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${confirmationLink}" style="background-color: #7F5AF0; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 14px rgba(127, 90, 240, 0.4);">Confirm Email →</a>
      </div>
      
      <p style="font-size: 14px; margin-bottom: 32px; color: #a7a9be; font-style: italic;">If you didn't sign up, you can ignore this email.</p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0;" />
      <p style="font-size: 13px; color: #2CB67D; font-weight: 700; text-align: center; margin-bottom: 4px;">Ausaguide — Be a Local. Share Your World.</p>
      <p style="font-size: 11px; color: #5f6368; text-align: center; margin: 0;">© 2026 Ausaguide. Nairobi, Kenya.</p>
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
  const subject = "You're on the Ausaguide Waitlist! 🎉"
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #16161A; color: #fffffe; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://ausaguide.com/logo-primary.png" alt="Ausaguide" style="height: 36px; width: auto; display: inline-block;" />
      </div>
      <p style="font-size: 16px; margin-bottom: 20px; color: #fffffe;">Hi ${userName}, thanks for joining the Ausaguide waitlist!</p>
      <p style="font-size: 16px; margin-bottom: 20px; color: #a7a9be;">We'll notify you in approximately 90 days when we launch.</p>
      <p style="font-size: 16px; margin-bottom: 24px; color: #a7a9be;">In the meantime, you can share the waitlist with friends: <a href="https://ausaguide.com/waitlist" style="color: #2CB67D; text-decoration: underline; font-weight: 600;">https://ausaguide.com/waitlist</a></p>
      <p style="font-size: 16px; margin-bottom: 32px; color: #a7a9be;">If you're interested in becoming a host, reply to this email and we'll reach out.</p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0;" />
      <p style="font-size: 13px; color: #7F5AF0; font-weight: 700; text-align: center; margin-bottom: 4px;">Ausaguide — Be a Local. Share Your World.</p>
      <p style="font-size: 11px; color: #5f6368; text-align: center; margin: 0;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

export async function sendGeneralWaitlistEmail(
  to: string,
  userName: string,
  _role: string,
  confirmToken?: string
): Promise<boolean> {
  const subject = "You're on the Ausaguide Waitlist! 🎉"
  const confirmUrl = confirmToken
    ? `https://ausaguide.com/waitlist?confirmed=true&token=${confirmToken}`
    : "https://ausaguide.com/waitlist"
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid rgba(127,90,240,0.3); border-radius: 24px; background-color: #16161A; color: #fffffe; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://ausaguide.com/logo-primary.png" alt="Ausaguide" style="height: 36px; width: auto; display: inline-block;" />
      </div>
      <p style="font-size: 16px; margin-bottom: 20px; color: #fffffe;">Hi ${userName}, thanks for joining the Ausaguide waitlist!</p>
      <p style="font-size: 16px; margin-bottom: 24px; color: #a7a9be;">One last step — click below to confirm your spot and unlock your <strong style="color: #7F5AF0;">🎉 confirmed status</strong>:</p>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${confirmUrl}"
           style="background: linear-gradient(135deg, #7F5AF0, #2CB67D); color: #ffffff; padding: 14px 36px; border-radius: 9999px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 15px; box-shadow: 0 4px 20px rgba(127,90,240,0.4);">
          ✅ Confirm My Spot →
        </a>
      </div>

      <p style="font-size: 14px; margin-bottom: 20px; color: #a7a9be;">Or paste this link in your browser:<br/><a href="${confirmUrl}" style="color: #2CB67D; word-break: break-all;">${confirmUrl}</a></p>
      <p style="font-size: 14px; margin-bottom: 20px; color: #a7a9be;">We'll notify you when we launch on <strong style="color: #fffffe;">October 10, 2026</strong>.</p>
      <p style="font-size: 14px; margin-bottom: 32px; color: #a7a9be;">In the meantime, share the waitlist with friends: <a href="https://ausaguide.com/waitlist" style="color: #2CB67D; font-weight: 600;">https://ausaguide.com/waitlist</a></p>

      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0;" />
      <p style="font-size: 13px; color: #7F5AF0; font-weight: 700; text-align: center; margin-bottom: 4px;">Ausaguide — Be a Local. Share Your World.</p>
      <p style="font-size: 11px; color: #5f6368; text-align: center; margin: 0;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

export async function sendPasswordResetEmail(to: string, userName: string, resetLink: string): Promise<boolean> {
  const subject = "Reset Your Ausaguide Password"
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #16161A; color: #fffffe; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://ausaguide.com/logo-primary.png" alt="Ausaguide" style="height: 36px; width: auto; display: inline-block;" />
      </div>
      <p style="font-size: 16px; margin-bottom: 20px; color: #fffffe;">Hi ${userName}, we received a request to reset your password.</p>
      <p style="font-size: 16px; margin-bottom: 24px; color: #a7a9be;">Click the link below to set a new password:</p>
      
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${resetLink}" style="background-color: #7F5AF0; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 14px rgba(127, 90, 240, 0.4);">Reset Password →</a>
      </div>
      
      <p style="font-size: 14px; margin-bottom: 32px; color: #a7a9be; font-style: italic;">If you didn't request this, you can ignore this email.</p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0;" />
      <p style="font-size: 13px; color: #2CB67D; font-weight: 700; text-align: center; margin-bottom: 4px;">Ausaguide — Be a Local. Share Your World.</p>
      <p style="font-size: 11px; color: #5f6368; text-align: center; margin: 0;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

/**
 * sendLaunchEmail — sent to a single subscriber when Ausaguide goes live.
 * Call this in a loop over all waitlist rows on launch day.
 */
export async function sendLaunchEmail(to: string, userName: string): Promise<boolean> {
  const subject = "🚀 Ausaguide is Live!"
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #16161A; color: #fffffe; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://ausaguide.com/logo-primary.png" alt="Ausaguide" style="height: 36px; width: auto; display: inline-block;" />
      </div>
      <p style="font-size: 16px; margin-bottom: 20px; color: #fffffe;">Hi ${userName}, we have some exciting news!</p>
      <p style="font-size: 18px; font-weight: 700; margin-bottom: 24px; color: #7F5AF0;">🚀 Ausaguide is officially live!</p>
      <p style="font-size: 16px; margin-bottom: 24px; color: #a7a9be;">You've been waiting patiently — and today is the day. Discover local guides, book authentic experiences, and explore Kenya like never before.</p>
      
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="https://ausaguide.com/auth" style="background-color: #7F5AF0; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 14px rgba(127, 90, 240, 0.4);">Sign In Now →</a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0;" />
      <p style="font-size: 13px; color: #2CB67D; font-weight: 700; text-align: center; margin-bottom: 4px;">Ausaguide — Be a Local. Share Your World.</p>
      <p style="font-size: 11px; color: #5f6368; text-align: center; margin: 0;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

// ── Guide Verification Emails ─────────────────────────────────────────────────

export async function sendGuideApplicationNotification(
  adminEmail: string,
  hostName: string,
  hostEmail: string,
  traNumber: string,
  kpsga?: string | null
): Promise<boolean> {
  const subject = `🆕 New Certified Guide Application — ${hostName}`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #16161A; color: #fffffe; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://ausaguide.com/logo-primary.png" alt="Ausaguide" style="height: 36px; width: auto; display: inline-block;" />
      </div>
      <div style="background: rgba(127,90,240,0.08); border: 1px solid rgba(127,90,240,0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 18px; font-weight: 700; color: #7F5AF0; margin: 0 0 4px;">New Guide Verification Request</p>
        <p style="font-size: 13px; color: #a7a9be; margin: 0;">Action required — please verify using the TRA portal.</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #a7a9be; margin-bottom: 24px;">
        <tr><td style="padding: 8px 0; font-weight: 600; color: #fffffe;">Host Name:</td><td style="padding: 8px 0;">${hostName}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600; color: #fffffe;">Email:</td><td style="padding: 8px 0;">${hostEmail}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600; color: #fffffe;">TRA Number:</td><td style="padding: 8px 0; color: #7F5AF0; font-weight: 700;">${traNumber}</td></tr>
        ${kpsga ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #fffffe;">KPSGA Number:</td><td style="padding: 8px 0;">${kpsga}</td></tr>` : ''}
      </table>
      <div style="text-align: center; margin-bottom: 24px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="https://verify.tra.go.ke" target="_blank" style="background-color: #7F5AF0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">Verify on TRA Portal →</a>
        <a href="https://ausaguide.com/admin/dashboard?tab=guides" style="background-color: rgba(44,182,125,0.15); border: 1px solid #2CB67D; color: #2CB67D; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">Open Admin Dashboard →</a>
      </div>
      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0;" />
      <p style="font-size: 13px; color: #2CB67D; font-weight: 700; text-align: center; margin-bottom: 4px;">Ausaguide — Be a Local. Share Your World.</p>
      <p style="font-size: 11px; color: #5f6368; text-align: center; margin: 0;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to: adminEmail, subject, html })
}

export async function sendGuideApprovedEmail(
  to: string,
  hostName: string
): Promise<boolean> {
  const subject = `✅ Congratulations! You're a Verified Guide on Ausaguide`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #16161A; color: #fffffe; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://ausaguide.com/logo-primary.png" alt="Ausaguide" style="height: 36px; width: auto; display: inline-block;" />
      </div>
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 8px;">✅</div>
        <p style="font-size: 22px; font-weight: 800; color: #fffffe; margin: 0;">You're a Verified Guide!</p>
      </div>
      <p style="font-size: 16px; color: #a7a9be; margin-bottom: 20px;">Hi ${hostName}, great news! Our admin team has verified your tour guide license and you now hold the <strong style="color: #3b82f6;">Verified Guide</strong> badge on Ausaguide.</p>
      <div style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 15px; font-weight: 600; color: #3b82f6; margin: 0 0 6px;">What this means for you:</p>
        <ul style="color: #a7a9be; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>A ✅ Verified Guide blue badge appears on all your tours and your profile</li>
          <li>Increased trust and visibility with travelers</li>
          <li>Priority placement in guide search results</li>
        </ul>
      </div>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="https://ausaguide.com/host/dashboard" style="background-color: #7F5AF0; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 14px rgba(127, 90, 240, 0.4);">Go to Your Dashboard →</a>
      </div>
      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0;" />
      <p style="font-size: 13px; color: #2CB67D; font-weight: 700; text-align: center; margin-bottom: 4px;">Ausaguide — Be a Local. Share Your World.</p>
      <p style="font-size: 11px; color: #5f6368; text-align: center; margin: 0;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

export async function sendGuideRejectedEmail(
  to: string,
  hostName: string
): Promise<boolean> {
  const subject = `Your Certified Guide Application — Ausaguide`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #16161A; color: #fffffe; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://ausaguide.com/logo-primary.png" alt="Ausaguide" style="height: 36px; width: auto; display: inline-block;" />
      </div>
      <p style="font-size: 16px; margin-bottom: 20px; color: #fffffe;">Hi ${hostName},</p>
      <p style="font-size: 16px; color: #a7a9be; margin-bottom: 20px;">Thank you for applying to become a Certified Guide on Ausaguide. After reviewing your application, we were unable to verify your tour guide license through the TRA portal at this time.</p>
      <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #fca5a5; margin: 0;">This could be due to the license number not matching our records, an expired license, or a temporary issue with the verification system. Please double-check your license details and contact us if you believe this is an error.</p>
      </div>
      <p style="font-size: 16px; color: #a7a9be; margin-bottom: 24px;">You can still join Ausaguide as a <strong style="color: #2CB67D;">Local Host</strong> — sharing your knowledge of Kenya and creating authentic experiences for travelers worldwide.</p>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="https://ausaguide.com/host/dashboard" style="background-color: #2CB67D; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 14px rgba(44, 182, 125, 0.4);">Continue as Local Host →</a>
      </div>
      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 32px 0;" />
      <p style="font-size: 13px; color: #2CB67D; font-weight: 700; text-align: center; margin-bottom: 4px;">Ausaguide — Be a Local. Share Your World.</p>
      <p style="font-size: 11px; color: #5f6368; text-align: center; margin: 0;">© 2026 Ausaguide. Nairobi, Kenya.</p>
    </div>
  `
  return dispatchEmail({ to, subject, html })
}

