import { useEffect, useState } from "react"
import { Compass, Trash2, Search, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TourRow {
  id: string
  title: string
  price: number
  currency: string
  is_published: boolean
  rating: number
  review_count: number
  created_at: string
  host_id: string
  host_name?: string
  location?: string
}

export default function AdminTours() {
  const [tours, setTours] = useState<TourRow[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const loadToursData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [toursRes, profilesRes] = await Promise.all([
        supabase.from("tours").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name")
      ])

      if (toursRes.error) throw toursRes.error
      if (profilesRes.error) throw profilesRes.error

      setTours(toursRes.data || [])
      setProfiles(profilesRes.data || [])
    } catch (err: any) {
      console.error("Failed to load tours:", err)
      setError("Failed to fetch tours. Please check database permissions.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm("Permanently delete this tour? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("tours").delete().eq("id", tourId)
      if (error) throw error
      setTours((prev) => prev.filter((t) => t.id !== tourId))
      alert("Tour successfully deleted.")
    } catch (err: any) {
      console.error("Delete failed:", err)
      alert("Failed to delete tour: " + err.message)
    }
  }

  useEffect(() => {
    loadToursData()
  }, [])

  // Stitch host names onto tours
  const stitchedTours = tours.map((t) => {
    const hostProf = profiles.find((p) => p.id === t.host_id)
    return {
      ...t,
      host_name: hostProf?.full_name ?? "Unknown Host",
    }
  })

  // Filter tours by search query
  const filteredTours = stitchedTours.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.host_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.location && t.location.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Compass className="size-8 text-purple-400" />
          Tours Management
        </h1>
        <p className="text-xs text-white/40 font-medium">Verify or delete tour listings on the platform</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <Input 
            placeholder="Search tours, hosts or location..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-white/5 bg-[#0D0D11]/60 focus:border-purple-500/30 text-white rounded-xl placeholder-white/30 text-xs h-10" 
          />
        </div>
        <div className="flex-1" />
        <Button 
          onClick={loadToursData} 
          disabled={loading}
          size="sm" 
          variant="outline" 
          className="rounded-full border-white/10 hover:bg-white/5 hover:text-white transition-all text-xs h-9 px-4 shrink-0"
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-2 animate-spin text-purple-400" />
          ) : (
            "Reload Tours"
          )}
        </Button>
      </div>

      {loading && tours.length === 0 ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="border border-white/5 rounded-2xl bg-[#0D0D11]/40 overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/40 font-semibold tracking-wider uppercase">
                  <th className="px-6 py-3.5">Tour Details</th>
                  <th className="px-6 py-3.5">Host</th>
                  <th className="px-6 py-3.5">Pricing</th>
                  <th className="px-6 py-3.5">Rating</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredTours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-white max-w-sm truncate">{tour.title}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{tour.location || "Location unlisted"}</div>
                    </td>
                    <td className="px-6 py-4.5 font-semibold text-white/70">{tour.host_name}</td>
                    <td className="px-6 py-4.5 font-mono text-emerald-400 font-bold">
                      {tour.currency} {tour.price}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="font-bold text-amber-400">★ {tour.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-white/30 text-[10px] ml-1">({tour.review_count || 0})</span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider border
                        ${tour.is_published 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-white/5 border-white/10 text-white/40"
                        }
                      `}>
                        {tour.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`/tours/${tour.id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 text-white/40 hover:text-white transition-colors"
                          title="View Tour Page"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTour(tour.id)}
                          className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-500/5 rounded-lg"
                          title="Delete Tour"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTours.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/30">
                      No tours found matching the criteria.
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
