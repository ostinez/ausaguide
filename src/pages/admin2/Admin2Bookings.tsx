import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Filter } from "lucide-react"

export default function Admin2Bookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, 
        status, 
        total_price, 
        created_at, 
        booking_date,
        profiles!bookings_guest_id_fkey(full_name), 
        tours!inner(title, profiles!inner(full_name))
      `)
      .order("created_at", { ascending: false })
    
    if (!error && data) {
      setBookings(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const filteredBookings = bookings.filter(b => 
    statusFilter === "all" || b.status === statusFilter
  )

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bookings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and monitor all platform bookings</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#111111] border border-white/10 rounded-lg p-1">
          <Filter size={16} className="text-gray-400 ml-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm text-gray-200 border-none focus:ring-0 py-1.5 pl-2 pr-8 cursor-pointer"
          >
            <option value="all" className="bg-[#111111]">All Statuses</option>
            <option value="pending" className="bg-[#111111]">Pending</option>
            <option value="confirmed" className="bg-[#111111]">Confirmed</option>
            <option value="completed" className="bg-[#111111]">Completed</option>
            <option value="cancelled" className="bg-[#111111]">Cancelled</option>
            <option value="declined" className="bg-[#111111]">Declined</option>
          </select>
        </div>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-gray-400 bg-black/40 uppercase sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-semibold">Tour</th>
                <th className="px-6 py-4 font-semibold">Traveler</th>
                <th className="px-6 py-4 font-semibold">Host</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading bookings...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No bookings found matching the current filter
                  </td>
                </tr>
              ) : (
                filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-200 max-w-[200px] truncate" title={booking.tours?.title}>
                      {booking.tours?.title || 'Unknown Tour'}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {booking.profiles?.full_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {booking.tours?.profiles?.full_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(booking.booking_date || booking.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      KES {booking.total_price?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                        ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400' : 
                          booking.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                          booking.status === 'cancelled' ? 'bg-gray-500/10 text-gray-400' :
                          booking.status === 'declined' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
