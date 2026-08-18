import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/lib/types"

export interface UserState {
  user: Profile | null
  role: "traveler" | "host" | "admin" | null
  loading: boolean
  isHost: boolean
  isTraveler: boolean
  isAdmin: boolean
  refreshUser: () => Promise<void>
}

/**
 * useUser Hook
 * 
 * Central hook for retrieving current authenticated user profile and role.
 * Automatically synchronizes with Supabase auth and localStorage caches.
 */
export function useUser(): UserState {
  const [user, setUser] = useState<Profile | null>(null)
  const [role, setRole] = useState<"traveler" | "host" | "admin" | null>(() => {
    return (localStorage.getItem("user_role") as any) || null
  })
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setUser(null)
        setRole(null)
        localStorage.removeItem("user_id")
        localStorage.removeItem("user_role")
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()

      if (!error && profile) {
        setUser(profile as Profile)
        const resolvedRole = (profile.role as "traveler" | "host" | "admin") || "traveler"
        setRole(resolvedRole)
        localStorage.setItem("user_id", authUser.id)
        localStorage.setItem("user_role", resolvedRole)
      } else {
        // Fallback with minimal info
        setUser({
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          role: "traveler",
        } as Profile)
        setRole("traveler")
      }
    } catch (err) {
      console.warn("[useUser] Error fetching user profile:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile()
      } else {
        setUser(null)
        setRole(null)
        localStorage.removeItem("user_id")
        localStorage.removeItem("user_role")
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  return {
    user,
    role,
    loading,
    isHost: role === "host",
    isTraveler: role === "traveler" || (!role && !!user),
    isAdmin: role === "admin",
    refreshUser: fetchUserProfile,
  }
}

export default useUser
