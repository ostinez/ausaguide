import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function handleAuthCallback() {
      try {
        let session = null
        
        // Wait for session to be parsed (up to 5 attempts, 200ms apart)
        for (let i = 0; i < 5; i++) {
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) throw sessionError
          if (currentSession) {
            session = currentSession
            break
          }
          if (!active) return
          await new Promise((r) => setTimeout(r, 200))
        }

        if (!session || !session.user) {
          // Fallback check: listen to onAuthStateChange for SIGNED_IN event
          session = await new Promise<any>((resolve) => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
              if (event === "SIGNED_IN" && currentSession) {
                subscription.unsubscribe()
                resolve(currentSession)
              }
            })
            setTimeout(() => {
              subscription.unsubscribe()
              resolve(null)
            }, 2500)
          })
        }

        if (!active) return

        if (!session || !session.user) {
          // No session found, redirect back to login page
          navigate("/auth", { replace: true })
          return
        }

        const user = session.user
        localStorage.setItem("user_id", user.id)

        // Check if profile exists for user.id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, role")
          .eq("id", user.id)
          .maybeSingle()

        if (profileError) {
          console.error("Error fetching user profile:", profileError)
          // Non-fatal, assume new traveler and proceed to onboarding
          navigate("/onboarding", { replace: true })
          return
        }

        if (profile) {
          // ADMIN BYPASS: ostinez48@gmail.com user ID - force admin role
          const ADMIN_USER_ID = 'f5db8b1b-8380-49dc-850e-1d2048cc05b1'
          const role = user.id === ADMIN_USER_ID ? 'admin' : (profile.role ?? "traveler")
          localStorage.setItem("user_role", role)
          localStorage.setItem("user_id", profile.id)

          // Redirect to appropriate dashboard based on role
          if (role === "admin") {
            navigate("/admin/dashboard", { replace: true })
          } else if (role === "host") {
            navigate("/host/dashboard", { replace: true })
          } else {
            navigate("/dashboard", { replace: true })
          }
        } else {
          // New user, store user_id so they are authenticated, and redirect to onboarding page
          localStorage.setItem("user_id", user.id)
          navigate("/onboarding", { replace: true })
        }
      } catch (err: any) {
        console.error("Auth callback handler failed:", err)
        setError(err?.message ?? "An error occurred during authentication.")
      }
    }

    handleAuthCallback()
    return () => {
      active = false
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d12] px-4">
      <div className="relative z-10 w-full max-w-md text-center space-y-6">
        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 space-y-4">
            <div className="flex justify-center text-destructive">
              <AlertCircle className="size-12" />
            </div>
            <h2 className="text-xl font-bold text-white">Authentication Failed</h2>
            <p className="text-sm text-gray-400">{error}</p>
            <button
              onClick={() => navigate("/auth", { replace: true })}
              className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-xs font-bold shadow-lg"
            >
              Back to Log In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Spinner className="size-8 text-[#7F5AF0] animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white">Completing Authentication</h2>
            <p className="text-sm text-gray-400">Please wait while we log you in...</p>
          </div>
        )}
      </div>
    </div>
  )
}
