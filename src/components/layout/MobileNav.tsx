import { useLocation, useNavigate } from "react-router-dom"
import { Home, Compass, Calendar, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  const userId = localStorage.getItem("user_id")
  const userRole = localStorage.getItem("user_role")

  const dashboardPath = userRole === "host" ? "/host/dashboard" : userRole === "admin" ? "/admin2" : "/dashboard"
  const profilePath = userId ? (userRole === "host" ? "/host-profile" : "/profile") : "/auth"

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/tours" },
    { icon: Calendar, label: "Bookings", path: dashboardPath },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: profilePath },
  ]

  // Hide on auth or full-screen video pages
  const isExcluded = path === "/auth" || path === "/onboarding" || path.startsWith("/video-call")
  if (isExcluded) return null

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/80 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? path === "/"
              : path.startsWith(item.path)

          const Icon = item.icon

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full min-w-[56px] min-h-[44px] px-1 transition-all duration-200 rounded-xl",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              {isActive && (
                <span className="absolute top-1.5 size-1 rounded-full bg-primary animate-in fade-in zoom-in" />
              )}
              <div className={cn("p-1 rounded-full transition-transform", isActive && "scale-110")}>
                <Icon className={cn("size-5 stroke-[2.2]", isActive ? "text-primary" : "text-muted-foreground")} />
              </div>
              <span className="text-[10px] tracking-tight leading-tight mt-0.5">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileNav
