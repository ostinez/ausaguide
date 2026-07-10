import { useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Map,
  Calendar,
  DollarSign,
  Star,
  Settings,
  Heart,
  BookOpen,
  User,
  LogOut,
  ChevronRight,
  TrendingUp,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"
import { getHostInitials } from "@/lib/tour-utils"

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: number
  href?: string
}

interface GlassmorphismSidebarProps {
  isOpen: boolean
  onClose: () => void
  view: string
  onViewChange: (view: string) => void
  profile: Profile | null
  userRole: string
  pendingCount?: number
  unreadNotifications?: number
}

// ────────────────────────────────────────────────────────────
// Nav item definitions — role-aware
// ────────────────────────────────────────────────────────────

function getNavItems(
  userRole: string,
  pendingCount: number,
  unreadNotifications: number
): NavItem[] {
  if (userRole === "host") {
    return [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "messages", label: "Messages", icon: MessageSquare, href: "/messages", badge: unreadNotifications > 0 ? unreadNotifications : undefined },
      { id: "tours", label: "My Tours", icon: Map },
      { id: "bookings", label: "Bookings", icon: Calendar, badge: pendingCount > 0 ? pendingCount : undefined },
      { id: "earnings", label: "Earnings", icon: DollarSign, href: "/dashboard/earnings" },
      { id: "reviews", label: "Reviews", icon: Star },
      { id: "settings", label: "Settings", icon: Settings },
    ]
  }
  return [
    { id: "traveler", label: "Dashboard", icon: LayoutDashboard },
    { id: "messages", label: "Messages", icon: MessageSquare, href: "/messages" },
    { id: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist" },
    { id: "journal", label: "Journal", icon: BookOpen, href: "/journal" },
    { id: "profile", label: "Profile", icon: User, href: "/profile/edit" },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "explore", label: "Explore Tours", icon: TrendingUp, href: "/tours" },
  ]
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export function GlassmorphismSidebar({
  isOpen,
  onClose,
  view,
  onViewChange,
  profile,
  userRole,
  pendingCount = 0,
  unreadNotifications = 0,
}: GlassmorphismSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const drawerRef = useRef<HTMLElement>(null)

  const navItems = getNavItems(userRole, pendingCount, unreadNotifications)
  const userInitials = profile?.full_name ? getHostInitials(profile.full_name) : "U"

  // Escape key closes sidebar
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  // Focus drawer when it opens
  useEffect(() => {
    if (isOpen) drawerRef.current?.focus()
  }, [isOpen])

  function handleSignOut() {
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_role")
    window.location.href = "/"
  }

  function handleItemClick(item: NavItem) {
    if (item.href) {
      navigate(item.href)
    } else {
      onViewChange(item.id)
    }
    onClose()
  }

  const isItemActive = (item: NavItem) => {
    if (item.href) return location.pathname === item.href
    return view === item.id
  }

  return (
    <>
      {/* ── Overlay ── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 49,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* ── Drawer ── */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation sidebar"
        tabIndex={-1}
        data-slot="glassmorphism-sidebar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "280px",
          zIndex: 50,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          background: "rgba(22, 22, 26, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRight: "1px solid rgba(127, 90, 240, 0.15)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          outline: "none",
        }}
      >
        <div className="flex h-full flex-col">
          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col justify-start min-h-0" aria-label="Main navigation">
            <div className="my-auto w-full space-y-4">
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                Navigation
              </p>
              {navItems.map((item) => {
                const active = isItemActive(item)
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "relative group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left font-accent",
                      active
                        ? "bg-gradient-to-r from-[#7F5AF0]/25 to-[#2CB67D]/10 text-white border border-[#7F5AF0]/25 shadow-sm shadow-[#7F5AF0]/10"
                        : "text-white/55 hover:text-white hover:bg-white/6 border border-transparent"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-[#7F5AF0] to-[#2CB67D] transition-all duration-200",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <item.icon
                      className={cn(
                        "size-4 shrink-0 transition-colors duration-200",
                        active ? "text-[#7F5AF0]" : "text-white/40 group-hover:text-white/70"
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shrink-0 animate-pulse">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                    {!active && (
                      <ChevronRight className="size-3.5 text-white/20 group-hover:text-white/50 transition-all duration-200 group-hover:translate-x-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Divider */}
          <div className="mx-4 h-px bg-white/8" />

          {/* User card + sign out */}
          <div className="p-4 space-y-2">
            {profile && (
              <div 
                onClick={() => {
                  onClose();
                  navigate("/profile/edit");
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent/ border border-white/8 cursor-pointer hover:bg-accent/ hover:border-white/15 transition-all duration-200"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="size-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7F5AF0] to-[#2CB67D] text-xs font-bold text-white">
                    {userInitials}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white leading-none">
                    {profile.full_name}
                  </p>
                  <p className="text-[11px] text-[#2CB67D] font-medium mt-0.5 truncate">
                    {profile.email}
                  </p>
                </div>
              </div>
            )}


            <Link
              to="/profile/edit"
              onClick={onClose}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-accent/ transition-all duration-200"
            >
              <Settings className="size-4 text-[#2CB67D]" />
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}