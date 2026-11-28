import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Filter, Loader2, Zap } from "lucide-react"
import { SkeletonTable } from "@/components/ui/Skeleton"
import { toast } from "sonner"

export default function Admin2Bookings() {
 const [bookings, setBookings] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [statusFilter, setStatusFilter] = useState("all")
 const [forcingId, setForcingId] = useState<string | null>(null)

 const fetchBookings = async () => {
 setLoading(true)
 const { data, error } = await supabase
 .from("bookings")
 .select(`
 id, 
 status, 
 host_id,
 host_paid,
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

 const handleForceCompleteAndPayout = async (booking: any) => {
 if (!confirm(`Force complete booking ${booking.id.slice(0, 8)} and trigger M-Pesa B2C payout?`)) return
 setForcingId(booking.id)
 try {
 const { data, error } = await supabase.functions.invoke("mpesa-b2c-payout", {
 body: {
 booking_id: booking.id,
 host_id: booking.host_id,
 },
 })
 if (error) throw new Error(error.message || "Edge Function failed")
 if (data?.error || data?.errorMessage) throw new Error(data.error || data.errorMessage)
 toast.success("Booking force-completed and M-Pesa B2C payout triggered!")
 fetchBookings()
 } catch (err: any) {
 console.error("Force complete & payout failed:", err)
 toast.error(err?.message || "Failed to force complete & payout")
 } finally {
 setForcingId(null)
 }
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

 {loading ? (
 <div className="animate-in fade-in duration-300">
 <SkeletonTable rows={5} cols={6} />
 </div>
 ) : (
 <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
 <div className="overflow-y-auto flex-1">
 <table className="w-full text-sm text-left relative">
 <thead className="text-xs text-gray-400 bg-black/40 uppercase sticky top-0 z-10 ">
 <tr>
 <th className="px-6 py-4 font-semibold">Tour</th>
 <th className="px-6 py-4 font-semibold">Traveler</th>
 <th className="px-6 py-4 font-semibold">Host</th>
 <th className="px-6 py-4 font-semibold">Date</th>
 <th className="px-6 py-4 font-semibold">Amount</th>
 <th className="px-6 py-4 font-semibold">Status</th>
 <th className="px-6 py-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {filteredBookings.length === 0 ? (
 <tr>
 <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
 No bookings found matching the current filter
 </td>
 </tr>
 ) : (
 filteredBookings.map(booking => (
 <tr key={booking.id} className="hover:bg-card shadow-modern transition-colors">
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
 {booking.total_price ? `KSh ${booking.total_price.toLocaleString()}` : 'KSh 0'}
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
 <td className="px-6 py-4 text-right">
 {!(booking.status === 'completed' && booking.host_paid) ? (
 <button
 type="button"
 onClick={() => handleForceCompleteAndPayout(booking)}
 disabled={forcingId === booking.id}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
 >
 {forcingId === booking.id ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
 <span>Force Complete & Payout</span>
 </button>
 ) : (
 <span className="text-xs text-emerald-400 font-medium">Paid</span>
 )}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )
}
