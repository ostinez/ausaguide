import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Users, Map, Calendar, List, CheckSquare, RefreshCw } from "lucide-react"
import { SkeletonStatGrid, SkeletonTable } from "@/components/ui/SkeletonCard"

export default function Admin2Overview() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    travelers: 0,
    hosts: 0,
    admins: 0,
    totalTours: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    totalWaitlist: 0,
    pendingVerifications: 0,
  })
  
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentBookings, setRecentBookings] = useState<any[]>([])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Run queries in parallel
      const [
        usersRes,
        toursRes,
        bookingsRes,
        waitlistRes,
        verificationsRes
      ] = await Promise.all([
        supabase.from("profiles").select("id, role, full_name, email, created_at").order('created_at', { ascending: false }),
        supabase.from("tours").select("id, title, host_id, price, created_at, profiles!inner(full_name)").order('created_at', { ascending: false }),
        supabase.from("bookings").select("id, status, total_price, created_at, profiles!bookings_guest_id_fkey(full_name), tours!inner(title, profiles!inner(full_name))").order('created_at', { ascending: false }),
        supabase.from("waitlist").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }).not("certificate_url", "is", null).eq("verified_guide", false)
      ])

      const users = usersRes.data || []
      const tours = toursRes.data || []
      const bookings = bookingsRes.data || []

      setStats({
        totalUsers: users.length,
        travelers: users.filter(u => u.role === "traveler").length,
        hosts: users.filter(u => u.role === "host").length,
        admins: users.filter(u => u.role === "admin").length,
        
        totalTours: tours.length,
        
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === "pending").length,
        confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
        completedBookings: bookings.filter(b => b.status === "completed").length,
        
        totalWaitlist: waitlistRes.count || 0,
        pendingVerifications: verificationsRes.count || 0,
      })

      setRecentUsers(users.slice(0, 5))
      setRecentBookings(bookings.slice(0, 5))
      
    } catch (error) {
      console.error("Error fetching overview data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-sm text-gray-400 mt-1">Key metrics and recent activity</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <SkeletonStatGrid count={5} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers.toString()} 
            icon={<Users className="text-blue-400" size={24} />}
            subtext={`${stats.travelers} T · ${stats.hosts} H · ${stats.admins} A`}
          />
          <StatCard 
            title="Total Tours" 
            value={stats.totalTours.toString()} 
            icon={<Map className="text-green-400" size={24} />}
          />
          <StatCard 
            title="Total Bookings" 
            value={stats.totalBookings.toString()} 
            icon={<Calendar className="text-purple-400" size={24} />}
            subtext={`${stats.pendingBookings} P · ${stats.confirmedBookings} C`}
          />
          <StatCard 
            title="Waitlist" 
            value={stats.totalWaitlist.toString()} 
            icon={<List className="text-yellow-400" size={24} />}
          />
          <StatCard 
            title="Verifications" 
            value={stats.pendingVerifications.toString()} 
            icon={<CheckSquare className="text-orange-400" size={24} />}
            subtext="Pending review"
          />
        </div>
      )}

      {/* Recent Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-sm">Recent Users</h3>
            <SkeletonTable rows={5} cols={3} />
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-sm">Recent Bookings</h3>
            <SkeletonTable rows={5} cols={4} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Users */}
          <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-semibold text-white">Recent Users</h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 bg-black/20 uppercase">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentUsers.map(user => (
                    <tr key={user.id} className="hover:bg-white/2">
                      <td className="px-4 py-3 text-gray-200">
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white/10 ${user.role === 'admin' ? 'text-primary' : 'text-gray-300'}`}>
                          {user.role || 'none'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && !loading && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-semibold text-white">Recent Bookings</h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 bg-black/20 uppercase">
                  <tr>
                    <th className="px-4 py-3">Tour</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentBookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-white/2">
                      <td className="px-4 py-3 text-gray-200 font-medium truncate max-w-[150px]">
                        {booking.tours?.title || 'Unknown Tour'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {booking.profiles?.full_name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300 capitalize">
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {booking.total_price ? `$${booking.total_price.toLocaleString()} USD` : '$0 USD'}
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && !loading && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No bookings found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, subtext }: { title: string, value: string, icon: React.ReactNode, subtext?: string }) {
  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl p-5 flex flex-col relative overflow-hidden group hover:border-white/20 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
          {icon}
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-2 font-medium">{subtext}</p>}
      </div>
      <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/0 to-white/2 pointer-events-none" />
    </div>
  )
}
