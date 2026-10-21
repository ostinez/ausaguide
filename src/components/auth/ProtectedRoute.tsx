import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Spinner } from "@/components/ui/spinner"

interface ProtectedRouteProps {
 allowedRoles?: ("admin" | "host" | "traveler")[]
 children?: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
 const location = useLocation()
 const [loading, setLoading] = useState(true)
 const [authenticated, setAuthenticated] = useState(false)
 const [userRole, setUserRole] = useState<string | null>(null)
 const [isPendingHost, setIsPendingHost] = useState(false)

 useEffect(() => {
 let active = true

 async function checkAuth() {
 try {
 const { data: { session } } = await supabase.auth.getSession()
 if (!session?.user) {
 if (active) {
 setAuthenticated(false)
 setLoading(false)
 }
 return
 }

 // Fetch user role, banned status, and verification credentials
 const { data: profile } = await supabase
 .from("profiles")
 .select("role, banned, host_tier, license_status, tra_number, verified_guide, verification_status, is_verified")
 .eq("id", session.user.id)
 .maybeSingle()

 if (profile?.banned) {
 await supabase.auth.signOut()
 localStorage.removeItem("user_id")
 localStorage.removeItem("user_role")
 if (active) {
 setAuthenticated(false)
 setLoading(false)
 }
 return
 }

 // ADMIN BYPASS: check by email (UUID differs between email/password and Google OAuth)
 const ADMIN_EMAIL = 'ausaguides@gmail.com'
 const isAdmin = session.user.email === ADMIN_EMAIL || profile?.role === 'admin'

 // Check if user has applied as a Host/Guide
 const hasAppliedAsHost = Boolean(
  profile?.role === "host" ||
  profile?.host_tier !== null ||
  profile?.tra_number ||
  profile?.license_status === "pending" ||
  profile?.license_status === "unverified"
 )

 // Verified guide/host
 const isVerifiedHost = Boolean(
  !isAdmin &&
  (
   profile?.verified_guide === true ||
   profile?.license_status === "approved" ||
   (profile?.role === "host" && (profile?.is_verified === true || profile?.verification_status === "approved") && profile?.license_status !== "pending")
  )
 )

 // Pending Host/Guide: applied, but awaiting admin approval or license verification
 const isPending = Boolean(
  !isAdmin &&
  hasAppliedAsHost &&
  !isVerifiedHost &&
  (
   profile?.license_status === "pending" ||
   profile?.license_status === "unverified" ||
   profile?.verification_status === "pending" ||
   profile?.verification_status === "unverified" ||
   !profile?.verified_guide
  )
 )

 let role: "admin" | "host" | "traveler" = "traveler"
 if (isAdmin) {
  role = 'admin'
 } else if (isVerifiedHost) {
  role = 'host'
 } else {
  // Normal travelers AND pending hosts while awaiting verification retain the standard traveler role
  role = 'traveler'
 }

 if (active) {
 setAuthenticated(true)
 setUserRole(role)
 setIsPendingHost(isPending)
 setLoading(false)
 }
 } catch (err) {
 console.error("ProtectedRoute checkAuth error:", err)
 if (active) {
 setAuthenticated(false)
 setLoading(false)
 }
 }
 }

 checkAuth()
 return () => {
 active = false
 }
 }, [location.pathname])

 if (loading) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-background">
 <Spinner className="size-8 text-primary animate-spin" />
 </div>
 )
 }

 if (!authenticated) {
 return <Navigate to="/auth" replace />
 }

 // Check roles if allowedRoles is defined
 if (allowedRoles && allowedRoles.length > 0) {
 const role = userRole as any

 // TASK 1: Block pending hosts from accessing host-only features / host dashboard
 if (isPendingHost && allowedRoles.includes("host") && !allowedRoles.includes("traveler")) {
  return <Navigate to="/pending-verification" replace />
 }

 if (!allowedRoles.includes(role)) {
 // If a pending host tried to access a host route, send to pending verification
 if (isPendingHost && allowedRoles.includes("host")) {
  return <Navigate to="/pending-verification" replace />
 }

 // Redirect to appropriate dashboard based on role
 if (role === "admin") {
 return <Navigate to="/admin2" replace />
 } else if (role === "host") {
 return <Navigate to="/host-dashboard" replace />
 } else if (role === "traveler") {
 return <Navigate to="/dashboard" replace />
 } else {
 return <Navigate to="/onboarding" replace />
 }
 }
 }

 return children ? <>{children}</> : <Outlet />
}
