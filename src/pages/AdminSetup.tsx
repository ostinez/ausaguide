import { useState } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Admin Setup Page - TEMPORARY, for initial admin account setup only.
 * Access at: /admin-setup
 */
export default function AdminSetup() {
  const [signInStatus, setSignInStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [signInMessage, setSignInMessage] = useState("")
  const [tryLoginStatus, setTryLoginStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [tryLoginMessage, setTryLoginMessage] = useState("")
  const [copied, setCopied] = useState(false)

  const ADMIN_EMAIL = "ausaguides@gmail.com"
  const ADMIN_PASSWORD = "ynwmelly2"
  const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/sdbvvcjnlergsmcsorrv/sql/new"

  const FIX_SQL = `-- Fix Admin Role - Run in Supabase SQL Editor
DROP TRIGGER IF EXISTS before_profile_role_update ON public.profiles;

UPDATE public.profiles 
SET role = 'admin', username = 'ausaguide', full_name = 'Super Admin', is_verified = true
WHERE email = 'ausaguides@gmail.com';

UPDATE public.profiles 
SET role = 'admin', username = 'ausaguide', full_name = 'Super Admin', is_verified = true
WHERE email = 'ausaguides@gmail.com';

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'User role cannot be changed once set.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();

-- Verify:
SELECT id, email, role, username FROM public.profiles WHERE email = 'ausaguides@gmail.com';`

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(FIX_SQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // fallback
    }
  }

  // Try direct login
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
        setTryLoginMessage(`❌ Login failed: ${error.message}`)
        return
      }
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, id")
          .eq("id", data.user.id)
          .maybeSingle()

        if (profile?.role === "admin") {
          localStorage.setItem("user_id", data.user.id)
          localStorage.setItem("user_role", "admin")
          setTryLoginStatus("success")
          setTryLoginMessage("✅ Login successful with admin role! Redirecting...")
          setTimeout(() => { window.location.href = "/admin/dashboard" }, 1500)
        } else {
          setTryLoginStatus("error")
          setTryLoginMessage(`⚠️ Login works but profile role is '${profile?.role || "unknown"}' (not admin). Run the SQL fix below to update the role to admin.`)
        }
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
        options: { emailRedirectTo: window.location.origin + "/auth/callback" }
      })
      if (error) throw error
      setSignInStatus("success")
      setSignInMessage(`✅ Magic link sent to ${ADMIN_EMAIL}! Check your email and click the link.`)
    } catch (err: any) {
      setSignInStatus("error")
      setSignInMessage(`❌ Failed: ${err.message}`)
    }
  }

  const card = (accent: string) => ({
    background: `rgba(${accent},0.06)`,
    border: `1px solid rgba(${accent},0.2)`,
    borderRadius: "14px", padding: "1.4rem", marginBottom: "1.2rem"
  })

  const btn = (bg: string, disabled?: boolean) => ({
    background: bg, color: "white", border: "none",
    borderRadius: "8px", padding: "0.7rem 1.2rem",
    fontSize: "0.875rem", fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1, width: "100%"
  })

  const msg = (type: "success" | "error" | "idle") => ({
    marginTop: "0.75rem", padding: "0.8rem", borderRadius: "8px",
    background: type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
    color: type === "success" ? "#4ade80" : "#f87171",
    fontSize: "0.82rem", lineHeight: 1.5
  })

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
      fontFamily: "system-ui,sans-serif", padding: "2rem"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px", padding: "2.5rem",
        maxWidth: "560px", width: "100%",
        backdropFilter: "blur(24px)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
      }}>
        <h1 style={{ color: "#f1f5f9", fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.4rem" }}>
          🛠️ Admin Account Setup
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.82rem", margin: "0 0 1.8rem" }}>
          Fixing admin access for <strong style={{ color: "#94a3b8" }}>{ADMIN_EMAIL}</strong>
        </p>

        {/* Card 1: Test Login */}
        <div style={card("250,204,21")}>
          <h2 style={{ color: "#fbbf24", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 0.4rem" }}>
            1. Test Current Login
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "0 0 1rem" }}>
            Checks if credentials work and what the current profile role is.
          </p>
          <button onClick={tryDirectLogin} disabled={tryLoginStatus === "loading"} style={btn("#b45309", tryLoginStatus === "loading")}>
            {tryLoginStatus === "loading" ? "Testing..." : "🔐 Test Login"}
          </button>
          {tryLoginMessage && (
            <div style={msg(tryLoginStatus === "success" ? "success" : "error")}>{tryLoginMessage}</div>
          )}
        </div>

        {/* Card 2: SQL Fix (Primary) */}
        <div style={{ ...card("239,68,68"), border: "1px solid rgba(239,68,68,0.4)" }}>
          <h2 style={{ color: "#f87171", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 0.4rem" }}>
            2. ⭐ Fix Role via Supabase SQL Editor (Required)
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "0 0 0.8rem" }}>
            The account exists but the role is <strong style={{ color: "#fca5a5" }}>'host'</strong> not <strong style={{ color: "#86efac" }}>'admin'</strong>. 
            Copy this SQL and run it in Supabase:
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem", flexWrap: "wrap" }}>
            <button onClick={copySQL} style={{ ...btn("#dc2626"), flex: 1, minWidth: "140px" }}>
              {copied ? "✅ Copied!" : "📋 Copy SQL"}
            </button>
            <a href={SQL_EDITOR_URL} target="_blank" rel="noopener noreferrer" style={{
              ...btn("#7f1d1d"), flex: 1, minWidth: "140px",
              textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              🔗 Open SQL Editor
            </a>
          </div>
          <pre style={{
            background: "rgba(0,0,0,0.4)", borderRadius: "8px",
            padding: "0.8rem", fontSize: "0.65rem", color: "#94a3b8",
            overflow: "auto", maxHeight: "180px", lineHeight: 1.5,
            whiteSpace: "pre-wrap", wordBreak: "break-all"
          }}>
            {FIX_SQL}
          </pre>
          <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.7rem" }}>
            ↑ Copy the SQL above → Open SQL Editor → Paste → Run
          </p>
        </div>

        {/* Card 3: Magic Link */}
        <div style={card("59,130,246")}>
          <h2 style={{ color: "#60a5fa", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 0.4rem" }}>
            3. Send Magic Login Link (Alternative)
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "0 0 1rem" }}>
            After fixing the role above, you can also use a magic link to log in without password.
          </p>
          <button onClick={sendMagicLink} disabled={signInStatus === "loading"} style={btn("#1d4ed8", signInStatus === "loading")}>
            {signInStatus === "loading" ? "Sending..." : "📧 Send Magic Link"}
          </button>
          {signInMessage && (
            <div style={msg(signInStatus === "success" ? "success" : "error")}>{signInMessage}</div>
          )}
        </div>

        <div style={{
          background: "rgba(15,23,42,0.6)", borderRadius: "10px",
          padding: "1rem", marginTop: "0.5rem"
        }}>
          <p style={{ color: "#475569", fontSize: "0.75rem", margin: 0 }}>
            <strong style={{ color: "#64748b" }}>Summary of the issue:</strong><br/>
            The Supabase auth user exists with email <code>ostinez48@gmail.com</code> and password <code>Mbomati.may23</code>. 
            However, the profile in the database has <code>role='host'</code> and a trigger prevents changing it via the API. 
            Run the SQL script above in Supabase to fix it.
          </p>
        </div>
      </div>
    </div>
  )
}
