import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { StaggeredMenu } from "@/components/ui/StaggeredMenu"
import { supabase } from "@/lib/supabase"
import { Footer } from "./footer"

export function Layout() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("user_id"))
  const impersonatorId = localStorage.getItem("admin_impersonator_id")
  const impersonatedUserId = localStorage.getItem("user_id")
  const [impersonatedName, setImpersonatedName] = useState<string | null>(null)

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
      window.location.href = "/admin/dashboard"
    }
  }

  useEffect(() => {
    // 1. Initial check: bounce already authenticated users away from / or /auth
    async function checkRedirect() {
      const path = window.location.pathname
      if (path === "/" || path === "/auth" || path === "/auth/callback") {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const { data: profile, error: profileErr } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle()

            console.log("[Layout checkRedirect] result:", { profile, error: profileErr })

            let role = profile?.role
            if (!profile && !profileErr) {
              console.log("[Layout checkRedirect] Auto-creating missing profile for user...")
              const { data: newProfile, error: createErr } = await supabase
                .from("profiles")
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || "New Traveler",
                  role: "traveler",
                  languages: ["English"],
                })
                .select("*")
                .maybeSingle()
              if (!createErr && newProfile) {
                role = newProfile.role
              }
            }

            if (role === "admin") {
              window.location.href = "/admin/dashboard"
            } else if (role === "host") {
              window.location.href = "/host/dashboard"
            } else if (role === "traveler") {
              window.location.href = "/dashboard"
            } else {
              window.location.href = "/onboarding"
            }
          }
        } catch (e) {
          console.error("Layout mount checkRedirect error:", e)
        }
      }
    }
    checkRedirect()

    // 2. Listen to active session modifications
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        localStorage.setItem("user_id", session.user.id)
        
        try {
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle()

          console.log("[Layout onAuthStateChange] SIGNED_IN/CHANGE result:", { profile, error: profileErr })

          let role = profile?.role
          if (!profile && !profileErr) {
            console.log("[Layout onAuthStateChange] Auto-creating missing profile for user...")
            const { data: newProfile, error: createErr } = await supabase
              .from("profiles")
              .insert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || "New Traveler",
                role: "traveler",
                languages: ["English"],
              })
              .select("*")
              .maybeSingle()
            if (!createErr && newProfile) {
              role = newProfile.role
            }
          }

          if (role) {
            localStorage.setItem("user_role", role)
          } else {
            localStorage.removeItem("user_role")
          }

          if (event === "SIGNED_IN") {
            const path = window.location.pathname
            if (path === "/auth" || path === "/auth/callback") {
              if (role === "admin") {
                window.location.href = "/admin/dashboard"
              } else if (role === "host") {
                window.location.href = "/host/dashboard"
              } else if (role === "traveler") {
                window.location.href = "/dashboard"
              } else {
                window.location.href = "/onboarding"
              }
            }
          }
        } catch (err) {
          console.error("Error checking profile on auth change:", err)
        }
      } else {
        setUserId(null)
        localStorage.removeItem("user_id")
        localStorage.removeItem("user_role")
      }
    })

    const handleStorage = () => {
      setUserId(localStorage.getItem("user_id"))
    }
    window.addEventListener("storage", handleStorage)
    const interval = setInterval(handleStorage, 1000)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("storage", handleStorage)
      clearInterval(interval)
    }
  }, [])

  function handleSignOut() {
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_role")
    supabase.auth.signOut()
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
          { label: "Sign Up", ariaLabel: "Create a new account", link: "/onboarding" },
        ]),
  ]

  const socialItems = [
    { label: "Instagram", link: "https://instagram.com/ausaguide" },
    { label: "Twitter", link: "https://twitter.com/ausaguide" },
    { label: "YouTube", link: "https://youtube.com/@ausaguide" },
    { label: "TikTok", link: "https://tiktok.com/@ausaguide" },
  ]

  return (
    <div className="flex min-h-svh flex-col bg-[#16161A]">
      {/* Beta Banner */}
      <div className="w-full bg-[#7F5AF0] text-white text-xs sm:text-sm font-semibold py-2.5 px-4 text-center z-50 relative flex flex-wrap items-center justify-center gap-1.5 shadow-md">
        <span>🚀 Early Access — We're testing with real users.</span>
        <a href="/waitlist" className="underline hover:text-white/80 font-bold transition duration-200">
          Join the waitlist for launch.
        </a>
      </div>
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
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

