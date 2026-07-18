import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, Globe, LogOut, Settings, LayoutDashboard, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { fetchProfileById } from "@/lib/api/hosts"
import type { Profile } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import NotificationBell from "@/components/ui/NotificationBell"
import { getHostInitials } from "@/lib/tour-utils"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const userId = localStorage.getItem("user_id")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    async function loadProfile() {
      try {
        const p = await fetchProfileById(userId!)
        setProfile(p)
        if (p) {
          localStorage.setItem("user_role", p.role)
        }
      } catch (err) {
        console.error("Failed to load profile in navbar", err)
      }
    }
    loadProfile()
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0)
      return
    }

    async function fetchUnreadCount() {
      try {
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", userId)
          .eq("read", false)

        if (!error) {
          setUnreadCount(count || 0)
        }
      } catch (err) {
        console.error("Failed to fetch unread count:", err)
      }
    }

    fetchUnreadCount()

    const interval = setInterval(fetchUnreadCount, 30000)

    /*
    const channelName = `navbar-messages-unread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()
    */

    return () => {
      clearInterval(interval)
      // channel.unsubscribe()
      // supabase.removeChannel(channel)
    }
  }, [userId])

  const userRole = profile?.role || localStorage.getItem("user_role") || "traveler"
  const userInitials = profile?.full_name ? getHostInitials(profile.full_name) : "U"


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

  let navLinks: { href: string; label: string }[] = []

  if (!userId) {
    navLinks = [
      { href: "/tours", label: "Explore Tours" },
      { href: "/map", label: "Map" },
      { href: "/help", label: "Help" },
    ]
  } else if (userRole === "admin") {
    navLinks = [
      { href: "/admin2", label: "Dashboard" },
      { href: "/admin2?tab=users", label: "Users" },
      { href: "/admin2?tab=tours", label: "Tours" },
      { href: "/admin2?tab=bookings", label: "Bookings" },
      { href: "/admin2?tab=settings", label: "Settings" },
    ]
  } else if (userRole === "host") {
    navLinks = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard?tab=tours", label: "Tours" },
      { href: "/dashboard?tab=bookings", label: "Bookings" },
      { href: "/dashboard/earnings", label: "Earnings" },
      { href: "/dashboard?tab=reviews", label: "Reviews" },
    ]
  } else {
    // Traveler
    navLinks = [
      { href: "/tours", label: "Tours" },
      { href: "/wishlist", label: "Wishlist" },
      { href: "/journal", label: "Journal" },
      { href: "/feed", label: "Feed" },
      { href: "/dashboard", label: "Dashboard" },
    ]
  }

  const isActive = (href: string) =>
    location.pathname === href ||
    (href.includes("?") && location.pathname + location.search === href)

  return (
    <header
      className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50 transition-all duration-300"
    >
      <nav className="mx-auto flex h-14 items-center justify-between px-6 bg-[#16161A]/55 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl shadow-black/35">

        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2">
          <img
            src="/logo-primary.png"
            alt="Ausaguide"
            width={160}
            height={32}
            className="h-8 w-auto block object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(127,90,240,0.6)]"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = document.getElementById("navbar-brand-fallback");
              if (fb) fb.style.display = "flex";
            }}
          />
          <div id="navbar-brand-fallback" className="items-center gap-2" style={{ display: "none" }}>
            <Globe className="size-6 text-[#2CB67D]" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] bg-clip-text text-transparent">
              Ausaguide
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <span
                className={cn(
                  "relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 block",
                  isActive(link.href)
                    ? "text-white"
                    : "text-white/60 hover:text-white hover:bg-accent/"
                )}
              >
                {link.label}
                {/* Active indicator — gradient underline pill */}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D]" />
                )}
              </span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {userId && <NotificationBell />}
          {userId && unreadCount > 0 && (
            <div className="hidden md:flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-[#2CB67D]/10 border border-[#2CB67D]/20 text-[#2CB67D] animate-pulse">
              💬 {unreadCount}
            </div>
          )}

          <div className="hidden items-center gap-2 md:flex">
            {userId ? (
              <div className="flex items-center gap-2">

                {/* Profile Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-xl border border-border bg-accent/ px-3 py-1.5 hover:bg-accent/ hover:border-[#7F5AF0]/40 transition-all duration-200 group">
                      {/* Avatar circle */}
                      <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-[#7F5AF0] to-[#2CB67D] text-xs font-bold text-white shrink-0">
                        {userInitials}
                      </span>
                      <span className="text-sm font-medium text-white/80 group-hover:text-white max-w-[100px] truncate">
                        {profile?.full_name?.split(" ")[0] || "Account"}
                      </span>
                      <ChevronDown className="size-3.5 text-white/40 group-hover:text-white/70 transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-52 bg-[#16161A]/95 border-border backdrop-blur-xl rounded-xl shadow-xl shadow-black/30"
                  >
                    <DropdownMenuLabel className="px-3 py-2.5">
                      <p className="text-sm font-semibold text-white truncate">{profile?.full_name || "Account"}</p>
                      <p className="text-xs text-white/40 capitalize mt-0.5">{userRole}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-accent/" />
                    <DropdownMenuItem asChild className="text-white/70 hover:text-white hover:bg-accent/ cursor-pointer rounded-lg mx-1">
                      <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-2">
                        <LayoutDashboard className="size-4 text-[#7F5AF0]" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-white/70 hover:text-white hover:bg-accent/ cursor-pointer rounded-lg mx-1">
                      <Link to="/settings" className="flex items-center gap-2.5 px-2 py-2">
                        <Settings className="size-4 text-[#2CB67D]" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-accent/" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer rounded-lg mx-1 mb-1 gap-2.5"
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/auth">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white border border-border hover:border-border hover:bg-accent/"
                  >
                    Log In
                  </Button>
                </Link>
                <Link to="/onboarding">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white border-0 hover:opacity-90 hover:shadow-md hover:shadow-[#7F5AF0]/30 transition-all duration-200 font-semibold"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-white/70 hover:text-white hover:bg-accent/">
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background/95 border-border backdrop-blur-xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <img
                  src="/logo-primary.png"
                  alt="Ausaguide"
                  width={140}
                  height={28}
                  className="h-7 w-auto block object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fb = document.getElementById("navbar-brand-fallback-mobile");
                    if (fb) fb.style.display = "flex";
                  }}
                />
                <div id="navbar-brand-fallback-mobile" className="items-center gap-2" style={{ display: "none" }}>
                  <Globe className="size-5 text-[#2CB67D]" />
                  <span className="font-bold bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] bg-clip-text text-transparent">Ausaguide</span>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 flex flex-col gap-1 px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <span
                    className={cn(
                      "flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive(link.href)
                        ? "bg-gradient-to-r from-[#7F5AF0]/20 to-[#2CB67D]/20 text-white border border-[#7F5AF0]/20"
                        : "text-white/60 hover:text-white hover:bg-accent/"
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}

              <div className="my-3 h-px bg-border" />

              {userId ? (
                <>
                  {/* Mobile profile card */}
                  {profile && (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent/ border border-border mb-2">
                      <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7F5AF0] to-[#2CB67D] text-sm font-bold text-white shrink-0">
                        {userInitials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{profile.full_name}</p>
                        <p className="text-xs text-white/40 capitalize">{userRole}</p>
                      </div>
                    </div>
                  )}

                  {unreadCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#2CB67D] bg-[#2CB67D]/10 border border-[#2CB67D]/20 rounded-xl mb-2">
                      💬 {unreadCount} unread messages
                    </div>
                  )}

                  <Link to="/settings" onClick={() => setMobileOpen(false)}>
                    <span className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-accent/ transition-all">
                      <Settings className="size-4 text-[#2CB67D]" /> Settings
                    </span>
                  </Link>

                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false) }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all mt-1"
                  >
                    <LogOut className="size-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full mt-1 border-border text-white/70 hover:text-white hover:bg-accent/">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/onboarding" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full mt-2 bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white border-0 hover:opacity-90 font-semibold">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
