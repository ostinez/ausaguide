import { useEffect, useState } from "react"
import { 
  Users, Compass, Calendar, ClipboardList, 
  BadgeCheck, RefreshCw, Loader2, AlertCircle, ArrowRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

interface DashboardStats {
  totalUsers: number
  totalTours: number
  totalBookings: number
  totalWaitlist: number
  pendingVerifications: number
}

interface RecentUser {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        { count: userCount, error: userErr },
        { count: tourCount, error: tourErr },
        { count: bookingCount, error: bookingErr },
        { count: waitlistCount, error: waitlistErr },
        { count: verificationCount, error: verificationErr },
        { data: usersData, error: recentErr }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("tours").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("waitlist").select("*", { count: "exact", head: true }),
        supabase.from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("license_status", "pending"),
        supabase.from("profiles")
          .select("id, full_name, email, role, created_at")
          .order("created_at", { ascending: false })
          .limit(5)
      ])

      if (userErr || tourErr || bookingErr || waitlistErr || verificationErr || recentErr) {
        throw new Error("One or more queries failed to execute correctly.")
      }

      setStats({
        totalUsers: userCount || 0,
        totalTours: tourCount || 0,
        totalBookings: bookingCount || 0,
        totalWaitlist: waitlistCount || 0,
        pendingVerifications: verificationCount || 0
      })
      setRecentUsers(usersData || [])
    } catch (err: any) {
      console.error("Dashboard data load failed:", err)
      setError("Failed to sync system statistics. Please verify database connection.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">System Overview</h1>
          <p className="text-xs text-white/40 font-medium">Real-time status metrics of the Ausaguide network</p>
        </div>
        <Button 
          onClick={fetchStats} 
          disabled={loading}
          size="sm" 
          variant="outline" 
          className="rounded-full border-white/10 hover:bg-white/5 hover:text-white transition-all text-xs h-9 px-4 shrink-0"
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-2 animate-spin text-purple-400" />
          ) : (
            <RefreshCw className="size-3.5 mr-2" />
          )}
          Refresh Console
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && !stats ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-white/5 bg-[#0D0D11]/60 backdrop-blur-md rounded-2xl hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 border">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-white">{stats?.totalUsers}</p>
                  <p className="text-xs text-white/50 font-semibold tracking-wider uppercase mt-0.5">Total Users</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-[#0D0D11]/60 backdrop-blur-md rounded-2xl hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 border">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                  <Compass className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-white">{stats?.totalTours}</p>
                  <p className="text-xs text-white/50 font-semibold tracking-wider uppercase mt-0.5">Total Tours</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-[#0D0D11]/60 backdrop-blur-md rounded-2xl hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 border">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Calendar className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-white">{stats?.totalBookings}</p>
                  <p className="text-xs text-white/50 font-semibold tracking-wider uppercase mt-0.5">Total Bookings</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-[#0D0D11]/60 backdrop-blur-md rounded-2xl hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 border">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <ClipboardList className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-white">{stats?.totalWaitlist}</p>
                  <p className="text-xs text-white/50 font-semibold tracking-wider uppercase mt-0.5">Total Waitlist</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-[#0D0D11]/60 backdrop-blur-md rounded-2xl hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 border">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <BadgeCheck className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-white">{stats?.pendingVerifications}</p>
                  <p className="text-xs text-white/50 font-semibold tracking-wider uppercase mt-0.5">Pending Guides</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom content: Recent Users Table */}
          <div className="border border-white/5 rounded-2xl bg-[#0D0D11]/40 overflow-hidden backdrop-blur-md">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-white tracking-wide">Recent Signups</h3>
                <p className="text-[10px] text-white/30 font-medium">Lately created user profiles in the database</p>
              </div>
              <Link to="/admin/users" className="text-xs font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1.5 hover:underline">
                View All Users
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 font-semibold tracking-wider uppercase">
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Joined At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4.5 font-bold text-white">{user.full_name || "Anonymous User"}</td>
                      <td className="px-6 py-4.5 font-mono text-white/60">{user.email || "No Email"}</td>
                      <td className="px-6 py-4.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider border
                          ${user.role === "admin" ? "bg-red-500/10 border-red-500/20 text-red-400" : ""}
                          ${user.role === "host" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : ""}
                          ${user.role === "traveler" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ""}
                          ${!user.role ? "bg-white/5 border-white/10 text-white/40" : ""}
                        `}>
                          {user.role || "traveler"}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-white/40">
                        {new Date(user.created_at).toLocaleDateString(undefined, {
                          dateStyle: "medium"
                        })}
                      </td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-white/30">
                        No recent signups found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
