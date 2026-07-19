import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Search, Loader2, Trash2, Eye, EyeOff } from "lucide-react"

export default function Admin2Tours() {
  const [tours, setTours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchTours = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("tours")
      .select("id, title, price, is_published, created_at, profiles!inner(full_name, email)")
      .order("created_at", { ascending: false })
    
    if (!error && data) {
      setTours(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTours()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tour? This cannot be undone.")) return

    setDeletingId(id)
    const { error } = await supabase
      .from("tours")
      .delete()
      .eq("id", id)

    if (!error) {
      setTours(tours.filter(t => t.id !== id))
    } else {
      console.error("Failed to delete tour:", error)
      alert("Failed to delete tour")
    }
    setDeletingId(null)
  }

  const handleTogglePublish = async (tour: any) => {
    setTogglingId(tour.id)
    const newValue = !tour.is_published
    const { error } = await supabase
      .from("tours")
      .update({ is_published: newValue })
      .eq("id", tour.id)

    if (!error) {
      setTours(tours.map(t => t.id === tour.id ? { ...t, is_published: newValue } : t))
    } else {
      console.error("Failed to toggle publish:", error)
      alert("Failed to update tour status")
    }
    setTogglingId(null)
  }

  const filteredTours = tours.filter(t => 
    (t.title?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (t.profiles?.full_name?.toLowerCase() || "").includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tours</h1>
          <p className="text-sm text-gray-400 mt-1">Manage platform tours and experiences</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search tours or hosts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[#111111] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-gray-400 bg-black/40 uppercase sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Host</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && tours.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading tours...
                  </td>
                </tr>
              ) : filteredTours.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No tours found matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredTours.map(tour => (
                  <tr key={tour.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-200 max-w-[200px]">
                      <div className="truncate" title={tour.title}>{tour.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">{tour.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{tour.profiles?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      KES {tour.price?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tour.is_published ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {tour.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(tour.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleTogglePublish(tour)}
                          disabled={togglingId === tour.id}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            tour.is_published
                              ? 'text-gray-400 hover:text-orange-400 hover:bg-orange-400/10'
                              : 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                          }`}
                          title={tour.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {togglingId === tour.id ? <Loader2 size={16} className="animate-spin" /> : tour.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(tour.id)}
                          disabled={deletingId === tour.id}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Tour"
                        >
                          {deletingId === tour.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
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
