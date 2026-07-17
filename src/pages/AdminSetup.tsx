import { useState } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Admin Setup Page - TEMPORARY, for initial admin account setup only.
 * Access at: /admin-setup
 * 
 * This page helps ostinez48@gmail.com gain admin access without needing a service role key.
 */
export default function AdminSetup() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [signInStatus, setSignInStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [signInMessage, setSignInMessage] = useState("")
  const [tryLoginStatus, setTryLoginStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [tryLoginMessage, setTryLoginMessage] = useState("")

  const ADMIN_EMAIL = "ostinez48@gmail.com"
  const ADMIN_PASSWORD = "Mbomati.may23"

  // Try direct login with the provided credentials
  const tryDirectLogin = async () => {
    setTryLoginStatus("loading")
    setTryLoginMessage("")
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      })
      if (error) {
        setTryLoginStatus("error")
        setTryLoginMessage(`❌ Login failed: ${error.message}. Use one of the options below to set up the admin account.`)
        return
      }
      if (data.user) {
        // Check profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()

        localStorage.setItem("user_id", data.user.id)
        localStorage.setItem("user_role", profile?.role || "admin")
        setTryLoginStatus("success")
        setTryLoginMessage("✅ Login successful! Redirecting to admin dashboard...")
        setTimeout(() => { window.location.href = "/admin/dashboard" }, 1500)
      }
    } catch (err: any) {
      setTryLoginStatus("error")
      setTryLoginMessage(`❌ Error: ${err.message}`)
    }
  }

  // Send magic link
  const sendMagicLink = async () => {
    setSignInStatus("loading")
    setSignInMessage("")
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: ADMIN_EMAIL,
        options: {
          emailRedirectTo: window.location.origin + "/auth/callback",
        }
      })
      if (error) throw error
      setSignInStatus("success")
      setSignInMessage(`✅ Magic link sent to ${ADMIN_EMAIL}! Check your email inbox and click the link to log in. After clicking, you'll be redirected to the admin dashboard.`)
    } catch (err: any) {
      setSignInStatus("error")
      setSignInMessage(`❌ Failed to send magic link: ${err.message}`)
    }
  }

  // Send password reset
  const sendPasswordReset = async () => {
    setStatus("loading")
    setMessage("")
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, {
        redirectTo: window.location.origin + "/reset-password",
      })
      if (error) throw error
      setStatus("success")
      setMessage(`✅ Password reset email sent to ${ADMIN_EMAIL}! Click the link in the email to set a new password.`)
    } catch (err: any) {
      setStatus("error")
      setMessage(`❌ Failed: ${err.message}`)
    }
  }

  const cardStyle = (color: string) => ({
    background: `rgba(${color}, 0.08)`,
    border: `1px solid rgba(${color}, 0.25)`,
    borderRadius: "14px",
    padding: "1.5rem",
    marginBottom: "1.25rem"
  })

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "2rem"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "2.5rem",
        maxWidth: "540px",
        width: "100%",
        backdropFilter: "blur(24px)",
        boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
      }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ color: "#f8fafc", fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>
            🔧 Ausaguide Admin Setup
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.5rem 0 0" }}>
            Setting up access for <strong style={{ color: "#94a3b8" }}>{ADMIN_EMAIL}</strong>
          </p>
        </div>

        {/* Step 1: Try Direct Login */}
        <div style={cardStyle("250,204,21")}>
          <h2 style={{ color: "#fbbf24", fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
            Step 1: Try Direct Login
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0 0 1rem" }}>
            Test if the admin account already works with password <code style={{background:"rgba(255,255,255,0.05)",padding:"1px 6px",borderRadius:"4px"}}>Mbomati.may23</code>
          </p>
          <button onClick={tryDirectLogin} disabled={tryLoginStatus === "loading"}
            style={{
              background: "#d97706", color: "white", border: "none",
              borderRadius: "8px", padding: "0.7rem 1.25rem",
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
              opacity: tryLoginStatus === "loading" ? 0.6 : 1, width: "100%"
            }}>
            {tryLoginStatus === "loading" ? "Testing login..." : "🔐 Try Login Now"}
          </button>
          {tryLoginMessage && (
            <div style={{
              marginTop: "0.75rem", padding: "0.75rem",
              borderRadius: "8px",
              background: tryLoginStatus === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
              color: tryLoginStatus === "success" ? "#4ade80" : "#f87171",
              fontSize: "0.82rem", lineHeight: 1.5
            }}>
              {tryLoginMessage}
            </div>
          )}
        </div>

        {/* Step 2: Magic Link */}
        <div style={cardStyle("59,130,246")}>
          <h2 style={{ color: "#60a5fa", fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
            Step 2: Send Magic Login Link
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0 0 1rem" }}>
            Sends a one-click login email. Open the email on your phone or computer and click the link — no password needed.
          </p>
          <button onClick={sendMagicLink} disabled={signInStatus === "loading"}
            style={{
              background: "#2563eb", color: "white", border: "none",
              borderRadius: "8px", padding: "0.7rem 1.25rem",
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
              opacity: signInStatus === "loading" ? 0.6 : 1, width: "100%"
            }}>
            {signInStatus === "loading" ? "Sending..." : "📧 Send Magic Login Link"}
          </button>
          {signInMessage && (
            <div style={{
              marginTop: "0.75rem", padding: "0.75rem",
              borderRadius: "8px",
              background: signInStatus === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
              color: signInStatus === "success" ? "#4ade80" : "#f87171",
              fontSize: "0.82rem", lineHeight: 1.5
            }}>
              {signInMessage}
            </div>
          )}
        </div>

        {/* Step 3: Password Reset */}
        <div style={cardStyle("168,85,247")}>
          <h2 style={{ color: "#a855f7", fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
            Step 3: Reset Password via Email
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0 0 1rem" }}>
            Sends a password reset email so you can set a new password for the admin account.
          </p>
          <button onClick={sendPasswordReset} disabled={status === "loading"}
            style={{
              background: "#9333ea", color: "white", border: "none",
              borderRadius: "8px", padding: "0.7rem 1.25rem",
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
              opacity: status === "loading" ? 0.6 : 1, width: "100%"
            }}>
            {status === "loading" ? "Sending..." : "🔑 Send Password Reset Email"}
          </button>
          {message && (
            <div style={{
              marginTop: "0.75rem", padding: "0.75rem",
              borderRadius: "8px",
              background: status === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
              color: status === "success" ? "#4ade80" : "#f87171",
              fontSize: "0.82rem", lineHeight: 1.5
            }}>
              {message}
            </div>
          )}
        </div>

        <p style={{ color: "#334155", fontSize: "0.72rem", marginTop: "0.5rem", textAlign: "center" }}>
          ⚠️ Remove or protect /admin-setup before production launch.
        </p>
      </div>
    </div>
  )
}
