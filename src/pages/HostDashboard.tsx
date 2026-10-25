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
        .select("role, license_status, verification_status, verified_guide, host_tier, host_type, status, is_verified, tra_number")
        .eq("id", session.user.id)
        .maybeSingle()

      const isLocalHost = Boolean(
        profile?.host_tier === "local_host" ||
        profile?.host_type === "local_host" ||
        profile?.host_type === "local"
      )

      const isCertifiedGuide = Boolean(
        profile?.host_tier === "certified_guide" ||
        profile?.host_type === "certified_guide" ||
        profile?.host_type === "guide" ||
        Boolean(profile?.tra_number) ||
        profile?.license_status === "pending" ||
        profile?.license_status === "approved"
      )

      const isVerified = Boolean(
        profile?.verified_guide ||
        profile?.license_status === "approved" ||
        (isLocalHost && profile?.license_status !== "pending" && (profile?.verification_status === "verified" || profile?.verification_status === "approved" || profile?.status === "active" || profile?.is_verified)) ||
        (profile?.role === "host" && profile?.license_status !== "pending" && (profile?.is_verified || profile?.verification_status === "verified" || profile?.verification_status === "approved" || profile?.status === "active"))
      )

      const isPending = Boolean(
        (isCertifiedGuide && (profile?.license_status === "pending" || profile?.status === "pending" || !profile?.verified_guide)) ||
        (!isVerified && (profile?.role === "host" || isCertifiedGuide))
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
