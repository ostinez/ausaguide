import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, Globe, LogOut, Settings, LayoutDashboard, ChevronDown, MessageSquare } from "lucide-react"
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

export interface GlassmorphismNavbarProps extends React.ComponentProps<"nav"> {}

export function GlassmorphismNavbar({ className, ...props }: GlassmorphismNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === "/"

  const userId = localStorage.getItem("user_id")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Scroll-aware glass intensification
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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
  }, [userId, location.pathname])

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

    const interval = setInterval(fetchUnreadCount, 4000)

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

    return () => {
      clearInterval(interval)
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [userId])


  const userRole = profile?.role || localStorage.getItem("user_role") || "traveler"
  const userInitials = profile?.full_name ? getHostInitials(profile.full_name) : "U"

  function handleSignOut() {
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_role")
    window.location.href = "/"
  }

  // Links: Home, Tours, Dashboard (if logged in), About
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/tours", label: "Tours" },
    ...(userId ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    { href: "/about", label: "About" },
  ]

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-50 w-full px-4 pt-4 transition-all duration-300">
      <nav
        data-slot="glassmorphism-navbar"
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between transition-all duration-500 rounded-full border border-border shadow-2xl backdrop-blur-xl",
          scrolled || !isLanding
            ? "bg-[#16161A]/85 shadow-black/45 py-2.5 px-6"
            : "bg-[#16161A]/40 shadow-black/20 py-3.5 px-8",
          className
        )}
        {...props}
      >
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2">
          <img
            src="/logo-primary.png"
            alt="Ausaguide"
            width={140}
            height={28}
            className="h-7 w-auto block object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(127,90,240,0.6)]"
            onError={(e) => {
              console.log("Navbar logo failed to load, triggering fallback");
              e.currentTarget.style.display = "none";
              const fb = document.getElementById("navbar-brand-fallback");
              if (fb) fb.style.display = "flex";
            }}
            onLoad={() => console.log("Navbar logo loaded successfully")}
          />
          <div id="navbar-brand-fallback" className="items-center gap-2" style={{ display: "none" }}>
            <Globe className="size-6 text-[#2CB67D]" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] bg-clip-text text-transparent">
              Ausaguide
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <span
                className={cn(
                  "relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 block",
                  isActive(link.href)
                    ? "text-[#2CB67D] bg-accent/"
                    : "text-white/70 hover:text-white hover:bg-accent/"
                )}
              >
                {link.label}
                {/* Active indicator — gradient pill underline */}
                {isActive(link.href) && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D]" />
                )}
              </span>
            </Link>
          ))}
        </div>

        {/* Right side — actions */}
        <div className="flex items-center gap-3">
          {userId && <NotificationBell />}

          {/* Unread message icon (desktop) */}
          {userId && (
            <Link
              to="/messages"
              className="relative p-1.5 rounded-full hover:bg-white/5 text-white/70 hover:text-white transition-colors"
              title="Messages"
            >
              <MessageSquare className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#7F5AF0] text-[9px] text-white font-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          <div className="hidden items-center gap-3 md:flex">
            {userId ? (
              <div className="flex items-center gap-2">
                {/* Profile Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full border border-border bg-accent/ px-4 py-1.5 hover:bg-accent/ hover:border-[#7F5AF0]/40 transition-all duration-300 group cursor-pointer">
                      {/* Avatar circle */}
                      <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-[#7F5AF0] to-[#2CB67D] text-xs font-bold text-white shrink-0">
                        {userInitials}
                      </span>
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white max-w-[100px] truncate">
                        {profile?.full_name?.split(" ")[0] || "Account"}
                      </span>
                      <ChevronDown className="size-3.5 text-white/40 group-hover:text-white/70 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-56 bg-[#16161A]/95 border border-border backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 p-1.5"
                  >
                    <DropdownMenuLabel className="px-3 py-2.5">
                      <p className="text-sm font-bold text-white truncate">{profile?.full_name || "Account"}</p>
                      <p className="text-xs text-[#2CB67D] font-medium capitalize mt-0.5">{userRole}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-accent/ mx-1" />
                    <DropdownMenuItem asChild className="text-white/80 hover:text-white hover:bg-accent/ cursor-pointer rounded-xl mx-1 my-0.5">
                      <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2">
                        <LayoutDashboard className="size-4 text-[#7F5AF0]" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild className="text-white/80 hover:text-white hover:bg-accent/ cursor-pointer rounded-xl mx-1 my-0.5">
                      <Link to="/settings" className="flex items-center gap-2.5 px-3 py-2">
                        <Settings className="size-4 text-[#2CB67D]" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-accent/ mx-1" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer rounded-xl mx-1 mt-0.5 mb-1 gap-2.5 px-3 py-2"
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
                    className="text-white/80 hover:text-white hover:bg-accent/ rounded-full px-4 border border-transparent hover:border-border"
                  >
                    Log In
                  </Button>
                </Link>
                <Link to="/onboarding">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white border-0 hover:opacity-90 hover:scale-105 transition-all duration-300 font-bold shadow-md shadow-[#7F5AF0]/30 rounded-full px-5"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white/70 hover:text-white hover:bg-accent/ rounded-full"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 bg-[#16161A]/95 border-l border-border backdrop-blur-xl p-6 rounded-l-3xl flex flex-col shadow-2xl"
            >
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <img
                    src="/logo-primary.png"
                    alt="Ausaguide"
                    width={120}
                    height={24}
                    className="h-6 w-auto block object-contain"
                    onError={(e) => {
                      console.log("Mobile Navbar logo failed to load, triggering fallback");
                      e.currentTarget.style.display = "none";
                      const fb = document.getElementById("navbar-brand-fallback-mobile");
                      if (fb) fb.style.display = "flex";
                    }}
                    onLoad={() => console.log("Mobile Navbar logo loaded successfully")}
                  />
                  <div id="navbar-brand-fallback-mobile" className="items-center gap-2" style={{ display: "none" }}>
                    <Globe className="size-5 text-[#2CB67D]" />
                    <span className="font-bold bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] bg-clip-text text-transparent">Ausaguide</span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 flex flex-col gap-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span
                      className={cn(
                        "flex w-full items-center rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                        isActive(link.href)
                          ? "bg-gradient-to-r from-[#7F5AF0]/20 to-[#2CB67D]/20 text-[#2CB67D] border border-[#7F5AF0]/20"
                          : "text-white/60 hover:text-white hover:bg-accent/"
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}

                <div className="my-4 h-px bg-accent/" />

                {userId ? (
                  <div className="flex flex-col gap-3">
                    {/* Mobile profile card */}
                    {profile && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent/ border border-border">
                        <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7F5AF0] to-[#2CB67D] text-sm font-bold text-white shrink-0">
                          {userInitials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{profile.full_name}</p>
                          <p className="text-xs text-[#2CB67D] capitalize">{userRole}</p>
                        </div>
                      </div>
                    )}

                    {unreadCount > 0 && (
                      <Link to="/messages" onClick={() => setMobileOpen(false)}>
                        <div className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#2CB67D] bg-[#2CB67D]/10 border border-[#2CB67D]/20 rounded-full justify-center">
                          💬 {unreadCount} unread messages
                        </div>
                      </Link>
                    )}
                    <Link to="/settings" onClick={() => setMobileOpen(false)}>
                      <span className="flex w-full items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-accent/ transition-all duration-300">
                        <Settings className="size-4 text-[#2CB67D]" /> Settings
                      </span>
                    </Link>

                    <button
                      onClick={() => { handleSignOut(); setMobileOpen(false) }}
                      className="flex w-full items-center justify-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 mt-2"
                    >
                      <LogOut className="size-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full border-border text-white/80 hover:text-white hover:bg-accent/ rounded-full py-5">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/onboarding" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white border-0 hover:opacity-90 font-semibold rounded-full py-5">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
