import { useEffect, useState } from "react"
import { ClipboardList, Search, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface WaitlistEntry {
  id: string
  email: string
  created_at: string
}

export default function AdminWaitlist() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const loadWaitlistData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from("waitlist")
        .select("id, email, created_at")
        .order("created_at", { ascending: false })

      if (fetchErr) throw fetchErr
      setWaitlist(data || [])
    } catch (err: any) {
      console.error("Failed to load waitlist:", err)
      setError("Failed to fetch waitlist entries. Check table permissions.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Remove this email subscription from the waitlist?")) return
    try {
      const { error } = await supabase.from("waitlist").delete().eq("id", id)
      if (error) throw error
      setWaitlist((prev) => prev.filter((w) => w.id !== id))
      alert("Waitlist entry successfully deleted.")
    } catch (err: any) {
      console.error("Waitlist entry deletion failed:", err)
      alert("Failed to delete waitlist entry: " + err.message)
    }
  }

  useEffect(() => {
    loadWaitlistData()
  }, [])

  const filteredWaitlist = waitlist.filter((w) =>
    w.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <ClipboardList className="size-8 text-purple-400" />
          Waitlist Management
        </h1>
        <p className="text-xs text-white/40 font-medium">Verify launch newsletter list and landing waitlist subscribers</p>
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
            placeholder="Search waitlist by email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-white/5 bg-[#0D0D11]/60 focus:border-purple-500/30 text-white rounded-xl placeholder-white/30 text-xs h-10" 
          />
        </div>
        <div className="flex-1" />
        <Button 
          onClick={loadWaitlistData} 
          disabled={loading}
          size="sm" 
          variant="outline" 
          className="rounded-full border-white/10 hover:bg-white/5 hover:text-white transition-all text-xs h-9 px-4 shrink-0"
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-2 animate-spin text-purple-400" />
          ) : (
            "Reload Waitlist"
          )}
        </Button>
      </div>

      {loading && waitlist.length === 0 ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="border border-white/5 rounded-2xl bg-[#0D0D11]/40 overflow-hidden backdrop-blur-md max-w-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/40 font-semibold tracking-wider uppercase">
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Subscribed Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredWaitlist.map((w) => (
                  <tr key={w.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4.5 font-bold text-white font-mono">{w.email}</td>
                    <td className="px-6 py-4.5 text-white/40">
                      {new Date(w.created_at).toLocaleDateString(undefined, {
                        dateStyle: "medium"
                      })}
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEntry(w.id)}
                        className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-500/5 rounded-lg"
                        title="Delete Entry"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredWaitlist.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-white/30">
                      No waitlist entries found.
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
