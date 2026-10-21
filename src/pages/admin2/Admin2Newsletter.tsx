import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Mail, Download, Search, Users, ShieldCheck, Compass, CheckCircle2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SkeletonTable } from "@/components/ui/Skeleton"
import { toast } from "sonner"

interface Subscriber {
  id: string
  email: string
  full_name?: string | null
  username?: string | null
  role?: string | null
  created_at: string
  newsletter_opt_in: boolean
}

export default function Admin2Newsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchSubscribers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, username, role, created_at, newsletter_opt_in")
        .eq("newsletter_opt_in", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSubscribers((data as Subscriber[]) || [])
    } catch (err: any) {
      console.error("Failed to fetch newsletter subscribers:", err)
      toast.error("Failed to load newsletter subscribers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const filteredSubscribers = subscribers.filter((sub) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (sub.email && sub.email.toLowerCase().includes(q)) ||
      (sub.full_name && sub.full_name.toLowerCase().includes(q)) ||
      (sub.username && sub.username.toLowerCase().includes(q)) ||
      (sub.role && sub.role.toLowerCase().includes(q))
    )
  })

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.error("No subscribers to export.")
      return
    }

    const headers = ["Email", "Full Name", "Username", "Role", "Subscribed Date"]
    const rows = subscribers.map((sub) => [
      `"${sub.email || ""}"`,
      `"${(sub.full_name || "").replace(/"/g, '""')}"`,
      `"${(sub.username || "").replace(/"/g, '""')}"`,
      `"${sub.role || "traveler"}"`,
      `"${sub.created_at ? new Date(sub.created_at).toISOString() : ""}"`,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const timestamp = new Date().toISOString().split("T")[0]
    link.href = url
    link.setAttribute("download", `ausaguide-newsletter-subscribers-${timestamp}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${subscribers.length} subscribers to CSV!`)
  }

  const hostsCount = subscribers.filter((s) => s.role === "host").length
  const travelersCount = subscribers.filter((s) => s.role !== "host" && s.role !== "admin").length

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="size-6 text-primary" />
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage users opted in to updates, promotions, and Kenya travel announcements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubscribers}
            disabled={loading}
            className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExportCSV}
            disabled={loading || subscribers.length === 0}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-2 shadow-lg shadow-primary/20"
          >
            <Download className="size-4" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Opt-In</p>
            <p className="text-xl font-bold text-white mt-0.5">{subscribers.length}</p>
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Compass className="size-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Travelers</p>
            <p className="text-xl font-bold text-white mt-0.5">{travelersCount}</p>
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Hosts & Guides</p>
            <p className="text-xl font-bold text-white mt-0.5">{hostsCount}</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative shrink-0 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Filter by email, name, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 border-white/10 bg-[#111] text-xs text-white placeholder:text-gray-500 rounded-xl"
        />
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="animate-in fade-in duration-300">
          <SkeletonTable rows={6} cols={4} />
        </div>
      ) : (
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm text-left relative">
              <thead className="text-xs text-gray-400 bg-black/40 uppercase sticky top-0 z-10 backdrop-blur-sm border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold">Subscriber Email</th>
                  <th className="px-6 py-4 font-semibold">Name / Username</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Opted In</th>
                  <th className="px-6 py-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery
                        ? "No subscribers match your search filter."
                        : "No newsletter subscribers found."}
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <Mail className="size-3.5 text-primary" />
                          <span>{sub.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-200 font-medium">
                          {sub.full_name || <span className="text-gray-600 italic">Not set</span>}
                        </div>
                        {sub.username && (
                          <div className="text-xs text-gray-500">@{sub.username}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.role === "host"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : sub.role === "admin"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {sub.role || "traveler"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {sub.created_at
                          ? new Date(sub.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          Subscribed
                        </span>
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
