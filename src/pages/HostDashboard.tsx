import { useEffect } from "react"
import DashboardPage from "@/pages/dashboard"
import { useSEO } from "@/hooks/useSEO"

export default function HostDashboardPage() {
  useSEO({
    title: "Host Dashboard | Ausaguide",
    description: "Manage your Kenya tours, booking requests, verification status, and host earnings on Ausaguide.",
  })

  useEffect(() => {
    // Ensure user_role is set to host for dashboard rendering
    if (localStorage.getItem("user_role") !== "host") {
      localStorage.setItem("user_role", "host")
    }
  }, [])

  return <DashboardPage />
}
