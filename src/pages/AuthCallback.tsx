import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Wait for session to be established by Supabase Client
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session || !session.user) {
          // No session found, redirect back to login page
          navigate("/auth", { replace: true })
          return
        }

        const user = session.user

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
          // Existing profile, store role & id
          const role = profile.role ?? "traveler"
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
          // New user, redirect to onboarding page
          navigate("/onboarding", { replace: true })
        }
      } catch (err: any) {
        console.error("Auth callback handler failed:", err)
        setError(err?.message ?? "An error occurred during authentication.")
      }
    }

    handleAuthCallback()
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
