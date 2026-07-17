import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

/**
 * /logout — Clears ALL cached session data and redirects to /auth
 * Visit this page to fully reset your session.
 */
export default function LogoutPage() {
  const navigate = useNavigate()

  useEffect(() => {
    async function doLogout() {
      // 1. Sign out from Supabase (clears auth cookie/token)
      await supabase.auth.signOut()

      // 2. Clear ALL localStorage keys related to auth
      localStorage.removeItem("user_id")
      localStorage.removeItem("user_role")
      localStorage.removeItem("supabase.auth.token")

      // 3. Clear all Supabase-related localStorage keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          localStorage.removeItem(key)
        }
      })

      // 4. Clear sessionStorage too
      sessionStorage.clear()

      // 5. Redirect to /auth after a short delay
      setTimeout(() => {
        navigate("/auth", { replace: true })
      }, 500)
    }

    doLogout()
  }, [navigate])

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      fontFamily: "system-ui, sans-serif",
      color: "#94a3b8"
    }}>
      <div style={{
        width: "48px", height: "48px",
        border: "3px solid rgba(255,255,255,0.1)",
        borderTop: "3px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        marginBottom: "1.5rem"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: "1rem", margin: 0 }}>Signing out and clearing session…</p>
      <p style={{ fontSize: "0.8rem", marginTop: "0.5rem", color: "#475569" }}>
        Redirecting to login page...
      </p>
    </div>
  )
}
