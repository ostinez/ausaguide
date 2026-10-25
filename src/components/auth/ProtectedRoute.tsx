import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Spinner } from "@/components/ui/spinner"
import { TermsGateModal } from "@/components/auth/TermsGateModal"

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
 const [hasAgreedToTerms, setHasAgreedToTerms] = useState(true)
 const [currentUserId, setCurrentUserId] = useState<string>("")

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
 .select("role, banned, host_tier, host_type, status, license_status, tra_number, verified_guide, verification_status, is_verified")
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

 // Check if user has applied as a Host/Guide
 const hasAppliedAsHost = Boolean(
  profile?.role === "host" ||
  profile?.host_tier !== null ||
  profile?.tra_number ||
  profile?.license_status === "pending" ||
  profile?.license_status === "unverified"
 )

 // Verified guide/host:
 // 1. Certified Guides who have verified_guide === true or license_status === 'approved'
 // 2. Local Hosts whose ID is confirmed (status === 'active', verification_status === 'verified', or is_verified)
 // 3. Host role with verified status and no pending license
 const isVerifiedHost = Boolean(
  !isAdmin &&
  (
   profile?.verified_guide === true ||
   profile?.license_status === "approved" ||
   (
    isLocalHost &&
    profile?.license_status !== "pending" &&
    (profile?.status === "active" || profile?.verification_status === "verified" || profile?.verification_status === "approved" || profile?.is_verified === true)
   ) ||
   (
    profile?.role === "host" &&
    profile?.license_status !== "pending" &&
    (profile?.status === "active" || profile?.verification_status === "verified" || profile?.verification_status === "approved" || profile?.is_verified === true)
   )
  )
 )

 // Pending Host/Guide: ONLY certified guides awaiting admin review of their license,
 // or accounts whose initial ID verification is still pending
 const isPending = Boolean(
  !isAdmin &&
  hasAppliedAsHost &&
  !isVerifiedHost &&
  (
   (isCertifiedGuide && (profile?.license_status === "pending" || profile?.status === "pending" || !profile?.verified_guide)) ||
   profile?.license_status === "pending" ||
   profile?.license_status === "unverified" ||
   profile?.verification_status === "pending" ||
   profile?.verification_status === "unverified"
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

 setCurrentUserId(session.user.id)
 const userMetadata = session.user.user_metadata || {}
 const termsInStorage =
  localStorage.getItem(`terms_agreed_${session.user.id}`) === "true" ||
  localStorage.getItem("terms_agreed") === "true" ||
  localStorage.getItem("terms_accepted") === "true"
 const termsInMeta = Boolean(userMetadata.terms_agreed || userMetadata.terms_accepted)
 const termsInProfile = Boolean((profile as any)?.terms_agreed || (profile as any)?.terms_accepted)
 const agreedToTerms = termsInStorage || termsInMeta || termsInProfile

 if (active) {
 setAuthenticated(true)
 setUserRole(role)
 setIsPendingHost(isPending)
 setHasAgreedToTerms(agreedToTerms)
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

 // TASK 4: T&C Gate strictly blocks dashboard and protected area access until user agrees
 if (!hasAgreedToTerms) {
  return (
   <TermsGateModal
    userId={currentUserId}
    onAgreed={() => {
     setHasAgreedToTerms(true)
    }}
   />
  )
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
