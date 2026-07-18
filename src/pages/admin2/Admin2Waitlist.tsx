import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Mail, CheckCircle } from "lucide-react"

export default function Admin2Waitlist() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchWaitlist = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("waitlist")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (!error && data) {
      setEntries(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchWaitlist()
  }, [])

  const handleMarkNotified = async (id: string, currentlyNotified: boolean) => {
    setUpdatingId(id)
    const newValue = !currentlyNotified
    const { error } = await supabase
      .from("waitlist")
      .update({ notified: newValue })
      .eq("id", id)

    if (!error) {
      setEntries(entries.map(e => e.id === id ? { ...e, notified: newValue } : e))
    } else {
      console.error("Failed to update waitlist:", error)
      alert("Failed to update status")
    }
    setUpdatingId(null)
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Waitlist</h1>
          <p className="text-sm text-gray-400 mt-1">Manage people waiting for platform launch features</p>
        </div>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-gray-400 bg-black/40 uppercase sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-semibold">Name & Email</th>
                <th className="px-6 py-4 font-semibold">Interests</th>
                <th className="px-6 py-4 font-semibold">Sign Up Date</th>
                <th className="px-6 py-4 font-semibold text-right">Notified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading waitlist...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No waitlist entries found
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-200">{entry.name}</div>
                      <div className="text-xs text-gray-500">{entry.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {entry.interest && Array.isArray(entry.interest) ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.interest.map((int: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-white/5 text-gray-300">
                              {int.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleMarkNotified(entry.id, entry.notified)}
                        disabled={updatingId === entry.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                          entry.notified 
                            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" 
                            : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {updatingId === entry.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : entry.notified ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Mail size={14} />
                        )}
                        {entry.notified ? "Notified" : "Mark Notified"}
                      </button>
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
