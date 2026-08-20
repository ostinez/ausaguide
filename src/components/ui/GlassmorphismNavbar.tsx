import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, Globe, LogOut, Settings, LayoutDashboard, ChevronDown, MessageSquare, Users } from "lucide-react"
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
import { useUnreadCount } from "@/hooks/useUnreadCount"

export interface GlassmorphismNavbarProps extends React.ComponentProps<"nav"> {}

export function GlassmorphismNavbar({ className, ...props }: GlassmorphismNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === "/"

  const userId = localStorage.getItem("user_id")
  const [profile, setProfile] = useState<Profile | null>(null)

  // Scroll-aware glass intensification
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
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

  const { unreadCount } = useUnreadCount(userId)

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
          "mx-auto flex max-w-7xl items-center justify-between transition-all duration-500 rounded-full border border-border shadow-modern",
          scrolled || !isLanding
            ? "bg-card py-2.5 px-6"
            : "bg-card py-3.5 px-8",
          className
        )}
        {...props}
      >
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5">
          <img
            src="/logo-primary.png"
            alt="Ausaguide"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg block object-contain transition-all duration-300 group-hover:scale-105"
            onError={(e) => {
              console.log("Navbar logo failed to load, triggering fallback");
              e.currentTarget.style.display = "none";
              const fb = document.getElementById("navbar-brand-fallback");
              if (fb) fb.style.display = "flex";
            }}
            onLoad={() => console.log("Navbar logo loaded successfully")}
          />
          <span className="text-lg font-black tracking-tight text-white group-hover:text-primary transition-colors">
            Ausaguide
          </span>
          <div id="navbar-brand-fallback" className="items-center gap-2" style={{ display: "none" }}>
            <Globe className="size-6 text-primary" />
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
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
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-foreground hover:text-primary hover:bg-muted/60"
                )}
              >
                {link.label}
                {/* Active indicator — gradient pill underline */}
                {isActive(link.href) && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-primary" />
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
              className="relative p-1.5 rounded-full hover:bg-muted text-foreground hover:text-primary transition-colors"
              title="Messages"
            >
              <MessageSquare className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-black animate-pulse shadow-sm">
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
                    <button className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 hover:bg-muted hover:border-primary/40 transition-all duration-300 group cursor-pointer">
                      {/* Avatar circle */}
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">
                        {userInitials}
                      </span>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary max-w-[100px] truncate">
                        {profile?.full_name?.split(" ")[0] || "Account"}
                      </span>
                      <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-56 bg-card border border-border rounded-2xl shadow-modern p-1.5 text-foreground"
                  >
                    <DropdownMenuLabel className="px-3 py-2.5">
                      <p className="text-sm font-bold text-foreground truncate">{profile?.full_name || "Account"}</p>
                      <p className="text-xs text-primary font-semibold capitalize mt-0.5">{userRole}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/60 mx-1" />
                    <DropdownMenuItem asChild className="text-foreground hover:text-primary hover:bg-muted cursor-pointer rounded-xl mx-1 my-0.5">
                      <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2">
                        <LayoutDashboard className="size-4 text-primary" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-foreground hover:text-primary hover:bg-muted cursor-pointer rounded-xl mx-1 my-0.5">
                      <Link to="/follow-requests" className="flex items-center gap-2.5 px-3 py-2">
                        <Users className="size-4 text-primary" />
                        Connections & Requests
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-foreground hover:text-primary hover:bg-muted cursor-pointer rounded-xl mx-1 my-0.5">
                      <Link to="/settings" className="flex items-center gap-2.5 px-3 py-2">
                        <Settings className="size-4 text-primary" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/60 mx-1" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl mx-1 mt-0.5 mb-1 gap-2.5 px-3 py-2 font-medium"
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
                    className="text-foreground hover:text-primary hover:bg-muted rounded-full px-4 border border-border/80"
                  >
                    Log In
                  </Button>
                </Link>
                <Link to="/onboarding">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground border-0 hover:bg-primary/90 hover:scale-105 transition-all duration-300 font-bold shadow-md rounded-full px-5"
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
                className="md:hidden text-foreground hover:text-primary hover:bg-muted rounded-full"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 bg-card border-l border-border p-6 rounded-l-3xl flex flex-col shadow-modern text-foreground"
            >
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2.5">
                  <img
                    src="/logo-primary.png"
                    alt="Ausaguide"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-lg block object-contain"
                    onError={(e) => {
                      console.log("Mobile Navbar logo failed to load, triggering fallback");
                      e.currentTarget.style.display = "none";
                      const fb = document.getElementById("navbar-brand-fallback-mobile");
                      if (fb) fb.style.display = "flex";
                    }}
                    onLoad={() => console.log("Mobile Navbar logo loaded successfully")}
                  />
                  <span className="text-lg font-black tracking-tight text-white">Ausaguide</span>
                  <div id="navbar-brand-fallback-mobile" className="items-center gap-2" style={{ display: "none" }}>
                    <Globe className="size-5 text-primary" />
                    <span className="font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">Ausaguide</span>
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
                          ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                          : "text-foreground hover:text-primary hover:bg-muted"
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}

                <div className="my-4 h-px bg-border" />

                {userId ? (
                  <div className="flex flex-col gap-3">
                    {/* Mobile profile card */}
                    {profile && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 border border-border">
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shrink-0">
                          {userInitials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{profile.full_name}</p>
                          <p className="text-xs text-primary font-semibold capitalize">{userRole}</p>
                        </div>
                      </div>
                    )}

                    {unreadCount > 0 && (
                      <Link to="/messages" onClick={() => setMobileOpen(false)}>
                        <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary bg-primary/10 border border-primary/20 rounded-full justify-center">
                          <MessageSquare className="size-4" />
                          <span>{unreadCount} unread messages</span>
                        </div>
                      </Link>
                    )}
                    <Link to="/settings" onClick={() => setMobileOpen(false)}>
                      <span className="flex w-full items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted transition-all duration-300">
                        <Settings className="size-4 text-primary" /> Settings
                      </span>
                    </Link>

                    <button
                      onClick={() => { handleSignOut(); setMobileOpen(false) }}
                      className="flex w-full items-center justify-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-300 mt-2"
                    >
                      <LogOut className="size-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted rounded-full py-5 font-semibold">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/onboarding" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-primary text-primary-foreground border-0 hover:bg-primary/90 font-bold rounded-full py-5 shadow-md">
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
