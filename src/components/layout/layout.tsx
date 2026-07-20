import { useEffect, useState } from "react"
import { Outlet, useLocation, Link } from "react-router-dom"
import { StaggeredMenu } from "@/components/ui/StaggeredMenu"
import { supabase } from "@/lib/supabase"
import { Footer } from "./footer"
import { ProfileCompletionBanner } from "@/components/ui/ProfileCompletionBanner"

export function Layout() {
  const location = useLocation()
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("user_id"))
  const impersonatorId = localStorage.getItem("admin_impersonator_id")
  const impersonatedUserId = localStorage.getItem("user_id")
  const [impersonatedName, setImpersonatedName] = useState<string | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])


  useEffect(() => {
    async function fetchImpersonated() {
      if (impersonatorId && impersonatedUserId) {
        try {
          const { data } = await supabase.from("profiles").select("full_name").eq("id", impersonatedUserId).maybeSingle()
          if (data?.full_name) setImpersonatedName(data.full_name)
        } catch (e) {
          console.error("Error reading impersonated profile:", e)
        }
      } else {
        setImpersonatedName(null)
      }
    }
    fetchImpersonated()
  }, [impersonatorId, impersonatedUserId])

  function handleStopImpersonation() {
    const originalId = localStorage.getItem("admin_impersonator_id")
    const originalRole = localStorage.getItem("admin_impersonator_role")
    if (originalId && originalRole) {
      localStorage.setItem("user_id", originalId)
      localStorage.setItem("user_role", originalRole)
      localStorage.removeItem("admin_impersonator_id")
      localStorage.removeItem("admin_impersonator_role")
      window.location.href = "/admin2"
    }
  }

  // 1. Redirect already logged-in users away from auth/landing using fast sync localStorage variables
  useEffect(() => {
    if (!authInitialized) return

    const path = location.pathname
    const cachedUserId = localStorage.getItem("user_id")
    const cachedRole = localStorage.getItem("user_role")
    
    if (cachedUserId && (path === "/auth" || path === "/auth/callback")) {
      if (cachedRole === "admin") {
        window.location.href = "/admin2"
      } else if (cachedRole === "host") {
        window.location.href = "/host/dashboard"
      } else if (cachedRole === "traveler") {
        window.location.href = "/dashboard"
      } else {
        window.location.href = "/onboarding"
      }
    }
  }, [location.pathname, authInitialized])

  // 2. Setup auth state and storage synchronization listeners ONCE on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setUserId(session.user.id)
          localStorage.setItem("user_id", session.user.id)
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle()

          if (profile?.banned) {
            await supabase.auth.signOut()
            localStorage.removeItem("user_id")
            localStorage.removeItem("user_role")
            window.location.href = "/auth?error=banned"
            return
          }

          const role = profile?.role
          if (role) {
            localStorage.setItem("user_role", role)
          } else {
            localStorage.removeItem("user_role")
          }

          if (event === "SIGNED_IN") {
            const path = window.location.pathname
            if (path === "/auth" || path === "/auth/callback" || path === "/") {
              if (role === "admin") {
                window.location.href = "/admin2"
              } else if (role === "host") {
                window.location.href = "/host/dashboard"
              } else if (role === "traveler") {
                window.location.href = "/dashboard"
              } else {
                window.location.href = "/onboarding"
              }
            }
          }
        } else {
          setUserId(null)
          localStorage.removeItem("user_id")
          localStorage.removeItem("user_role")
        }
      } catch (err) {
        console.error("Error checking profile on auth change:", err)
      } finally {
        setAuthInitialized(true)
      }
    })

    const handleStorage = () => {
      setUserId(localStorage.getItem("user_id"))
    }
    window.addEventListener("storage", handleStorage)
    const interval = setInterval(handleStorage, 1000)

    // Track active presence on site
    const anonId = "anon-" + Math.random().toString(36).substring(2, 9)
    
    try {
      const existing = supabase.getChannels()
      const existingPresence = existing.find((ch) => ch.topic === "realtime:site-presence")
      if (existingPresence) {
        supabase.removeChannel(existingPresence)
      }
    } catch (e) {
      console.warn("Error cleaning up existing realtime channel:", e)
    }

    const presenceChannel = supabase.channel("site-presence", {
      config: {
        presence: {
          key: localStorage.getItem("user_id") || anonId,
        },
      },
    })

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState()
        const count = Object.keys(state).length
        ;(window as any).__liveVisitors = count
        window.dispatchEvent(new CustomEvent("presence-sync", { detail: count }))
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            role: localStorage.getItem("user_role") || "traveler",
          })
        }
      })

    return () => {
      subscription.unsubscribe()
      presenceChannel.unsubscribe()
      supabase.removeChannel(presenceChannel)
      window.removeEventListener("storage", handleStorage)
      clearInterval(interval)
    }
  }, [])

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn("SignOut failed or session already cleared:", e)
    }
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_role")
    window.location.href = "/"
  }

  const menuItems = [
    { label: "Home", ariaLabel: "Go to home", link: "/" },
    { label: "Tours", ariaLabel: "Browse tours", link: "/tours" },
    { label: "Tree Planting", ariaLabel: "Plant trees and offset carbon", link: "/tree-planting" },
    { label: "Mental Health", ariaLabel: "Sponsor mental health therapy", link: "/mental-health" },
    { label: "About", ariaLabel: "Learn about us", link: "/about" },
    ...(userId
      ? [
          { label: "Dashboard", ariaLabel: "Your dashboard", link: "/dashboard" },
          { label: "Logout", ariaLabel: "Logout from your account", onClick: handleSignOut },
        ]
      : [
          { label: "Login", ariaLabel: "Login to your account", link: "/auth" },
          { label: "Sign Up", ariaLabel: "Create a new account", link: "/auth?tab=signup" },
        ]),
  ]

  const socialItems = [
    { label: "Instagram", link: "https://instagram.com/ausaguide" },
    { label: "Twitter", link: "https://twitter.com/ausaguide" },
    { label: "YouTube", link: "https://youtube.com/@ausaguide" },
    { label: "TikTok", link: "https://tiktok.com/@ausaguide" },
  ]

  const isAuthOrOnboarding = location.pathname === "/auth" || location.pathname === "/onboarding"

  return (
    <div className="flex min-h-svh flex-col bg-[#16161A]">
      {/* Beta Banner (hidden on Auth/Onboarding) */}
      {!isAuthOrOnboarding && (
        <div className="w-full bg-[#7F5AF0] text-white text-xs sm:text-sm font-semibold py-2.5 px-4 text-center z-50 relative flex flex-wrap items-center justify-center gap-1.5 shadow-md">
          <span>🚀 Early Access — We're testing with real users.</span>
          <Link to="/waitlist" className="underline hover:text-white/80 font-bold transition duration-200">
            Join the waitlist for launch.
          </Link>
        </div>
      )}
      {impersonatedName && (
        <div className="w-full bg-amber-500 text-black text-xs font-bold py-2.5 px-4 text-center z-50 relative flex items-center justify-center gap-2 shadow-md">
          <span>⚠️ Impersonating user: <strong>{impersonatedName}</strong> (actions will save as this user).</span>
          <button onClick={handleStopImpersonation} className="underline hover:text-black/80 font-black ml-2 transition duration-200">
            Stop Impersonation
          </button>
        </div>
      )}
      <StaggeredMenu
        position="right"
        colors={["#000000", "#0A0A0A"]}
        accentColor="#FFFFFF"
        menuButtonColor="#FFFFFF"
        openMenuButtonColor="#2CB67D"
        displayItemNumbering={true}
        displaySocials={true}
        closeOnClickAway={true}
        isFixed={true}
        items={menuItems}
        socialItems={socialItems}
        logoUrl="/logo-primary.png"
        className={`${!isAuthOrOnboarding ? "has-beta-banner" : ""} ${impersonatedName ? "has-impersonation-banner" : ""}`.trim()}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isAuthOrOnboarding && <Footer />}
      {!isAuthOrOnboarding && <ProfileCompletionBanner />}
      {isOffline && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-sm w-[90%] bg-red-950/95 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 text-xs font-semibold leading-tight">
            You're offline. Some features may not be available.
          </div>
        </div>
      )}
    </div>
  )
}


