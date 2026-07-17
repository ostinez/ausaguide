import { Outlet, NavLink, Link, useNavigate } from "react-router-dom"
import { 
  Shield, LayoutDashboard, Users, Compass, 
  Calendar, ClipboardList, BadgeCheck, Settings, 
  LogOut, ArrowLeft, Menu, X 
} from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export function AdminLayout() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminName, setAdminName] = useState("Admin")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.full_name) {
              setAdminName(profile.full_name)
            }
          })
      }
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_role")
    navigate("/auth")
  }

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/tours", label: "Tours", icon: Compass },
    { to: "/admin/bookings", label: "Bookings", icon: Calendar },
    { to: "/admin/waitlist", label: "Waitlist", icon: ClipboardList },
    { to: "/admin/verifications", label: "Verifications", icon: BadgeCheck },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col md:flex-row relative">
      {/* Glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[120px]" />
      </div>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0D0D11]/80 backdrop-blur-md sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
            <Shield className="size-4.5" />
          </div>
          <span className="font-black tracking-tight text-sm">Ausaguide Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-white/70 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 border-r border-white/5 bg-[#0D0D11]/90 backdrop-blur-lg transform md:transform-none transition-transform duration-300 ease-in-out flex flex-col pt-16 md:pt-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo area */}
        <div className="hidden md:flex items-center gap-3 px-6 py-8">
          <div className="flex size-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Shield className="size-5.5" />
          </div>
          <div>
            <h2 className="font-black tracking-tight text-sm">Ausaguide Admin</h2>
            <p className="text-[10px] text-white/40 font-mono">V1.2.0 (STABLE)</p>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-white/5 bg-white/2 mb-4 mx-3 rounded-xl flex items-center gap-3">
          <div className="size-8.5 rounded-full bg-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-300 uppercase">
            {adminName.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{adminName}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wider font-mono">System Owner</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all border border-transparent
                  ${isActive 
                    ? "bg-purple-500/10 text-purple-300 border-purple-500/20 font-bold" 
                    : "text-white/60 hover:text-white hover:bg-white/3 hover:border-white/5"}
                `}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/5 space-y-2.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-white/40 hover:text-white/70 transition-colors font-medium"
          >
            <ArrowLeft className="size-4" />
            Exit Console
          </Link>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-2.5 rounded-xl text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/10 font-semibold"
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 md:pl-64 flex flex-col min-w-0 z-10">
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
          <Outlet />
        </div>
      </main>

      {/* Backdrop for mobile navigation */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </div>
  )
}
