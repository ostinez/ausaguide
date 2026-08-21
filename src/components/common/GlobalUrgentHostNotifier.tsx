import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { playUrgentDispatchChime } from "@/lib/audio"
import { acceptUrgentRequest } from "@/lib/api/urgent-match"
import { Zap, X, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function GlobalUrgentHostNotifier() {
  const navigate = useNavigate()
  const [activeRequest, setActiveRequest] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const seenIdsRef = useRef<Set<string>>(new Set())

  const userId = localStorage.getItem("user_id")
  const userRole = localStorage.getItem("user_role")

  const fetchActiveUrgent = async () => {
    if (!userId || userRole !== "host") {
      setActiveRequest(null)
      return
    }

    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("urgent_requests")
        .select("*")
        .eq("status", "pending")
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error || !data || data.length === 0) {
        setActiveRequest(null)
        return
      }

      const req = data[0]

      // If this is a newly discovered request
      if (!seenIdsRef.current.has(req.id)) {
        seenIdsRef.current.add(req.id)
        playUrgentDispatchChime()
      }

      // Fetch traveler profile if not loaded
      if (req.traveler_id && !req.traveler) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, email, phone")
          .eq("id", req.traveler_id)
          .maybeSingle()
        req.traveler = profile || { full_name: "Traveler" }
      }

      setActiveRequest(req)
    } catch (err) {
      console.error("[GlobalUrgentNotifier] Error polling active requests:", err)
    }
  }

  useEffect(() => {
    if (!userId || userRole !== "host") return

    // Initial check
    fetchActiveUrgent()

    // 1. WebSocket Realtime Subscription
    const channel = supabase
      .channel(`global_urgent_host_radar_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "urgent_requests" },
        (payload: any) => {
          const updated = payload.new || payload.old
          if (updated && (updated.status !== "pending" || payload.eventType === "DELETE")) {
            if (activeRequest?.id === updated.id) {
              setActiveRequest(null)
            }
          }
          fetchActiveUrgent()
        }
      )
      .subscribe()

    // 2. 4-Second Heartbeat Polling Fallback (No manual refresh needed)
    const interval = setInterval(fetchActiveUrgent, 4000)

    return () => {
      clearInterval(interval)
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [userId, userRole])

  // If host is already on the dashboard, the main dashboard cards will render it.
  // But if the host is on /messages, /settings, /map, etc., we show this high-visibility dispatch bar!
  if (!activeRequest || userRole !== "host") return null

  const handleAccept = async () => {
    if (!userId || !activeRequest) return
    setLoading(true)
    try {
      const result = await acceptUrgentRequest(activeRequest.id, userId, activeRequest.budget || 25)
      if (result.success) {
        toast.success("Match accepted! Connecting with traveler...")
        setActiveRequest(null)
        navigate("/host/dashboard?tab=bookings")
      } else {
        toast.error(result.message)
        setActiveRequest(null)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to accept match.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-[calc(100%-2rem)] sm:w-96 animate-in slide-in-from-top-4 duration-300">
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-[#0e2f2f] via-[#092222] to-[#051717] p-4 shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-xl text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 animate-pulse">
              <Zap className="size-4 fill-current" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                ⚡ New Urgent Tour Request!
              </p>
              <p className="text-sm font-bold text-white">
                {activeRequest.traveler?.full_name || "A traveler nearby"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveRequest(null)}
            className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 bg-black/30 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-white/80">
            <span className="capitalize font-semibold text-[#B7E6E5]">
              {activeRequest.experience_type?.join(", ") || "Custom Tour"}
            </span>
          </div>
          <span className="font-bold text-emerald-400">
            {activeRequest.budget ? `$${activeRequest.budget} USD/hr` : "Negotiable"}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Zap className="size-3.5 fill-current mr-1.5" />}
            Accept Tour Now
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/host/dashboard")}
            className="h-9 px-3 rounded-xl border-white/20 text-white hover:bg-white/10 text-xs font-semibold"
          >
            Details <ArrowRight className="size-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
