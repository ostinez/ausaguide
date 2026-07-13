import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { StaggeredMenu } from "@/components/ui/StaggeredMenu"
import { supabase } from "@/lib/supabase"
import { Footer } from "./footer"

export function Layout() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("user_id"))

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        localStorage.setItem("user_id", session.user.id)
        
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle()

          const role = profile?.role || "traveler"
          localStorage.setItem("user_role", role)

          if (event === "SIGNED_IN") {
            const path = window.location.pathname
            if (path === "/auth" || path === "/auth/callback") {
              if (role === "admin") {
                window.location.href = "/admin/dashboard"
              } else if (role === "host") {
                window.location.href = "/host/dashboard"
              } else {
                window.location.href = "/dashboard"
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

