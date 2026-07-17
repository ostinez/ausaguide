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

        // Fetch user role and banned status from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, banned, host_tier")
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
        const ADMIN_EMAIL = 'ostinez48@gmail.com'

        let role = profile?.role ?? null
        if (session.user.email === ADMIN_EMAIL) {
          role = 'admin'
        } else if (role === "host" && profile?.host_tier === null) {
          role = null
        }

        if (active) {
          setAuthenticated(true)
          setUserRole(role)
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
    if (!allowedRoles.includes(role)) {
      // Redirect to appropriate dashboard based on role
      if (role === "admin") {
        return <Navigate to="/admin/dashboard" replace />
      } else if (role === "host") {
        return <Navigate to="/host/dashboard" replace />
      } else if (role === "traveler") {
        return <Navigate to="/dashboard" replace />
      } else {
        return <Navigate to="/onboarding" replace />
      }
    }
  }

  return children ? <>{children}</> : <Outlet />
}
