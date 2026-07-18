import { useState } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { 
  BarChart3, 
  Users, 
  Map, 
  Calendar, 
  List, 
  CheckSquare, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const NAV_LINKS = [
  { name: "Overview", to: "/admin2", icon: BarChart3, end: true },
  { name: "Users", to: "/admin2/users", icon: Users },
  { name: "Tours", to: "/admin2/tours", icon: Map },
  { name: "Bookings", to: "/admin2/bookings", icon: Calendar },
  { name: "Waitlist", to: "/admin2/waitlist", icon: List },
  { name: "Guide Verifications", to: "/admin2/verifications", icon: CheckSquare },
  { name: "Settings", to: "/admin2/settings", icon: Settings },
]

export default function Admin2Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_role")
    navigate("/auth")
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!isCollapsed && <span className="text-xl font-bold text-white tracking-tight">Admin<span className="text-primary">v2</span></span>}
        {isCollapsed && <span className="text-xl font-bold text-primary mx-auto">A2</span>}
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                } ${isCollapsed ? "justify-center px-0" : ""}`
              }
              title={isCollapsed ? link.name : undefined}
            >
              <Icon size={20} className={isCollapsed ? "mx-auto" : "mr-3"} />
              {!isCollapsed && <span>{link.name}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full rounded-md px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Log out" : undefined}
        >
          <LogOut size={20} className={isCollapsed ? "mx-auto" : "mr-3"} />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-gray-100 overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#111111] border-b border-white/10 z-30 flex items-center justify-between px-4">
        <span className="text-xl font-bold text-white tracking-tight">Admin<span className="text-primary">v2</span></span>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 -mr-2 text-gray-300 hover:text-white"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 bg-[#111111] border-r border-white/10 transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-16" : "w-64"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto bg-[#0A0A0A] pt-16 md:pt-0">
        <div className="mx-auto max-w-7xl p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
