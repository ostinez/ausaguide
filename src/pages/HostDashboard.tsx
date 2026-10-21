import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import DashboardPage from "@/pages/dashboard"
import { useSEO } from "@/hooks/useSEO"
import { supabase } from "@/lib/supabase"

export default function HostDashboardPage() {
  const navigate = useNavigate()
  useSEO({
    title: "Host Dashboard | Ausaguide",
    description: "Manage your Kenya tours, booking requests, verification status, and host earnings on Ausaguide.",
  })

  useEffect(() => {
    async function checkHostVerification() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, license_status, verification_status, verified_guide")
        .eq("id", session.user.id)
        .maybeSingle()

      const isVerified = Boolean(profile?.verified_guide || profile?.license_status === "approved")
      const isPending = Boolean(
        profile?.license_status === "pending" ||
        profile?.license_status === "unverified" ||
        profile?.verification_status === "pending" ||
        profile?.verification_status === "unverified" ||
        (!isVerified && profile?.role === "host")
      )

      if (isPending) {
        navigate("/pending-verification", { replace: true })
        return
      }

      // Ensure user_role is set to host for verified host dashboard rendering
      if (localStorage.getItem("user_role") !== "host") {
        localStorage.setItem("user_role", "host")
      }
    }

    checkHostVerification()
  }, [navigate])

  return <DashboardPage />
}
