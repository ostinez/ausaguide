import { useEffect, useState } from "react"
import { Calendar, Search, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BookingRow {
  id: string
  tour_id: string
  guest_id: string
  host_id: string
  booking_date: string
  status: string
  total_price: number
  guest_name?: string
  guest_email?: string
  tour_title?: string
  host_name?: string
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [tours, setTours] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const loadBookingsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [bookingsRes, toursRes, profilesRes] = await Promise.all([
        supabase.from("bookings").select("*").order("booking_date", { ascending: false }),
        supabase.from("tours").select("id, title"),
        supabase.from("profiles").select("id, full_name, email")
      ])

      if (bookingsRes.error) throw bookingsRes.error
      if (toursRes.error) throw toursRes.error
      if (profilesRes.error) throw profilesRes.error

      setBookings(bookingsRes.data || [])
      setTours(toursRes.data || [])
      setProfiles(profilesRes.data || [])
    } catch (err: any) {
      console.error("Failed to load bookings:", err)
      setError("Failed to fetch bookings details. Please check table permissions.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId)

      if (error) throw error
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      )
      alert("Booking status successfully updated.")
    } catch (err: any) {
      console.error("Status update failed:", err)
      alert("Failed to update status: " + err.message)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Permanently delete this booking record?")) return
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", bookingId)
      if (error) throw error
      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
      alert("Booking record deleted successfully.")
    } catch (err: any) {
      console.error("Booking deletion failed:", err)
      alert("Failed to delete booking: " + err.message)
    }
  }

  useEffect(() => {
    loadBookingsData()
  }, [])

  // Stitch details onto bookings
  const stitchedBookings = bookings.map((b) => {
    const tour = tours.find((t) => t.id === b.tour_id)
    const guest = profiles.find((p) => p.id === b.guest_id)
    const host = profiles.find((p) => p.id === b.host_id)
    return {
      ...b,
      tour_title: tour?.title ?? "Unknown Tour",
      guest_name: guest?.full_name ?? "Anonymous Traveler",
      guest_email: guest?.email ?? "No Email",
      host_name: host?.full_name ?? "Unknown Host",
    }
  })

  const filteredBookings = stitchedBookings.filter((b) =>
    b.tour_title.toLowerCase().includes(search.toLowerCase()) ||
    b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
    b.host_name.toLowerCase().includes(search.toLowerCase()) ||
    b.status.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Calendar className="size-8 text-purple-400" />
          Bookings Management
        </h1>
        <p className="text-xs text-white/40 font-medium">Verify platform transactions, itinerary logs, and tour reservations</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <Input 
            placeholder="Search by tour, traveler, host or status..." 
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-10 border-white/5 bg-[#0D0D11]/60 focus:border-purple-500/30 text-white rounded-xl placeholder-white/30 text-xs h-10" 
          />
        </div>
        <div className="flex-1" />
        <Button 
          onClick={loadBookingsData} 
          disabled={loading}
          size="sm" 
          variant="outline" 
          className="rounded-full border-white/10 hover:bg-white/5 hover:text-white transition-all text-xs h-9 px-4 shrink-0"
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-2 animate-spin text-purple-400" />
          ) : (
            "Reload Bookings"
          )}
        </Button>
      </div>

      {loading && bookings.length === 0 ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="border border-white/5 rounded-2xl bg-[#0D0D11]/40 overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/40 font-semibold tracking-wider uppercase">
                  <th className="px-6 py-3.5">Tour Reservation</th>
                  <th className="px-6 py-3.5">Traveler</th>
                  <th className="px-6 py-3.5">Local Host</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Total Price</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-white max-w-xs truncate">{b.tour_title}</div>
                      <div className="text-[9px] text-white/30 font-mono mt-0.5">ID: {b.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="font-semibold text-white/80">{b.guest_name}</div>
                      <div className="text-[10px] text-white/40 font-mono">{b.guest_email}</div>
                    </td>
                    <td className="px-6 py-4.5 font-semibold text-white/70">{b.host_name}</td>
                    <td className="px-6 py-4.5 text-white/60">
                      {new Date(b.booking_date).toLocaleDateString(undefined, {
                        dateStyle: "medium"
                      })}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-emerald-400 font-bold">
                      USD {Number(b.total_price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4.5">
                      <select
                        value={b.status}
                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                        className={`bg-transparent border border-white/10 text-xs px-2 py-0.5 rounded-lg focus:border-purple-500/40 bg-[#0F0F12] font-bold uppercase tracking-wider
                          ${b.status === "confirmed" ? "text-emerald-400 border-emerald-500/20" : ""}
                          ${b.status === "pending" ? "text-amber-400 border-amber-500/20" : ""}
                          ${b.status === "cancelled" ? "text-red-400 border-red-500/20" : ""}
                          ${b.status === "completed" ? "text-blue-400 border-blue-500/20" : ""}
                        `}
                      >
                        <option value="pending" className="text-amber-400">Pending</option>
                        <option value="confirmed" className="text-emerald-400">Confirmed</option>
                        <option value="completed" className="text-blue-400">Completed</option>
                        <option value="cancelled" className="text-red-400">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBooking(b.id)}
                        className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-500/5 rounded-lg"
                        title="Delete Booking Record"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/30">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
