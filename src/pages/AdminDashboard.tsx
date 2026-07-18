import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom"
import { format, parseISO, subDays } from "date-fns"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts"
import {
  Shield, Users, Calendar, DollarSign, Search, ArrowLeft,
  XCircle, CheckCircle2, MapPin,
  Eye, Trash2, Ban, UserCheck, Download, RefreshCw,
  ClipboardList, Settings, Terminal, BadgeCheck, ExternalLink, FileText, StickyNote, Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { approveHost, rejectHost } from "@/lib/api/hosts"
import type { HostRecord } from "@/lib/api/hosts"
import type { Profile } from "@/lib/types"
import { sendTourApprovalEmail, sendGuideApprovedEmail, sendGuideRejectedEmail } from "@/lib/api/emails"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface TourRow {
  id: string
  host_id: string
  title: string
  price: number
  currency: string
  is_published: boolean
  rating: number
  review_count: number
  created_at: string
  host_name?: string
  booking_count?: number
  physical_price?: number
  virtual_price?: number
  location?: string
  capacity?: number
}

interface BookingRow {
  id: string
  tour_id: string
  guest_id: string
  host_id: string
  booking_date: string
  status: string
  total_price: number
  guest_name: string
  guest_email: string
  tour_title?: string
  host_name?: string
}

interface DailyRevenue { date: string; amount: number }

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function fmt(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE")}`
}

function downloadCSV(rows: any[], filename: string) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(",")),
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, sub,
}: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <Card className="border-border/60 bg-linear-to-br from-card to-card/60 transition-all hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="flex items-start gap-4 pt-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: color + "15" }}>
          <Icon className="size-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function RejectModal({
  hostName, onConfirm, onCancel, loading,
}: { hostName: string; onConfirm: (r: string) => void; onCancel: () => void; loading: boolean }) {
  const [reason, setReason] = useState("")
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/15">
            <XCircle className="size-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Reject Application</h3>
            <p className="text-xs text-muted-foreground">{hostName}</p>
          </div>
        </div>
        <Textarea placeholder="Reason for rejection..." rows={3} value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="resize-none bg-muted/20 border-border/70 text-foreground" />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading} className="rounded-full">Cancel</Button>
          <Button variant="destructive" size="sm" disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())} className="rounded-full">
            {loading ? <Spinner className="size-3.5 mr-1 animate-spin" /> : null}
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-background/95 p-3 shadow-xl backdrop-blur-sm text-xs">
      <p className="font-semibold text-muted-foreground mb-1">
        {label ? (() => { try { return format(parseISO(label), "MMM d, yyyy") } catch { return label } })() : ""}
      </p>
      <p className="text-base font-bold text-primary">{fmt(payload[0].value)}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "tours" | "bookings" | "waitlist" | "moderation" | "guides" | "system" | "logs">("overview")

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (
      tab === "overview" ||
      tab === "users" ||
      tab === "tours" ||
      tab === "bookings" ||
      tab === "waitlist" ||
      tab === "moderation" ||
      tab === "guides" ||
      tab === "system" ||
      tab === "logs"
    ) {
      setActiveTab(tab as any)
    }
  }, [searchParams])

  // Data
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [hosts, setHosts] = useState<HostRecord[]>([])
  const [tours, setTours] = useState<TourRow[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([])
  const [waitlists, setWaitlists] = useState<any[]>([])
  const [liveVisitors, setLiveVisitors] = useState<number>(0)

  // Moderation state
  const [journals, setJournals] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])

  // System Configurations (Persistent in Local Storage for Mocking)
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    return localStorage.getItem("system_maintenance_mode") === "true"
  })
  const [commissionRate, setCommissionRate] = useState<number>(() => {
    return Number(localStorage.getItem("system_commission_rate") || "10")
  })
  const [stripeMode, setStripeMode] = useState<string>(() => {
    return localStorage.getItem("system_stripe_mode") || "test"
  })
  const [diditAddress, setDiditAddress] = useState<string>(() => {
    return localStorage.getItem("system_didit_address") || "0x44Fe8507be060C9e84C1C4a4237dFeBE6FA8a83f"
  })

  // Developer Logs (Sentry and Edge Functions Mock logs)
  const [logs, setLogs] = useState<any[]>([
    { id: 1, type: "info", source: "Auth", message: "Edge Function session synchronized successfully", time: "19:02:15" },
    { id: 2, type: "warning", source: "Rate Limit", message: "IP 198.51.100.42 reached warning threshold (4/5)", time: "19:02:33" },
    { id: 3, type: "info", source: "Stripe", message: "Webhook invoice.paid received for customer customer_stripe_ausaguide_02", time: "19:03:01" },
    { id: 4, type: "error", source: "Sentry", message: "PGRST116: maybeSingle() returned no rows for key 'id'", time: "19:04:11" },
    { id: 5, type: "info", source: "Realtime", message: "Subscribed to postgres_changes public.tours", time: "19:05:00" },
  ])

  // Admin System Notifications
  const [adminNotifications, setAdminNotifications] = useState<any[]>([])

  // UI
  const [search, setSearch] = useState("")
  const adminId = localStorage.getItem("user_id")
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "traveler" | "host" | "admin" | "suspended">("all")
  const [hostFilter, setHostFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [bookingFilter, setBookingFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [guideNotes, setGuideNotes] = useState<Record<string, string>>({})
  const [rejectingGuideHost, setRejectingGuideHost] = useState<{ id: string; email: string; name: string } | null>(null)
  const [guideRejectionReason, setGuideRejectionReason] = useState("")
  const [rejectGuideLoading, setRejectGuideLoading] = useState(false)

  const handleApproveGuide = async (userId: string, hostEmail: string, hostName: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          host_tier: "certified_guide",
          verified_guide: true,
          verification_date: new Date().toISOString(),
          rejected_as_guide: false,
          license_status: "approved",
        } as any)
        .eq("id", userId)
      if (error) throw error
      sendGuideApprovedEmail(hostEmail, hostName).catch(console.error)
      await logAdminAction("Approve Guide", "profile", userId, { email: hostEmail, name: hostName })
      showToast("Guide application approved! Email sent to host.", "success")
      load()
    } catch (err: any) {
      showToast(err.message || "Failed to approve guide", "error")
    }
  }

  const handleRejectGuide = (userId: string, hostEmail: string, hostName: string) => {
    setRejectingGuideHost({ id: userId, email: hostEmail, name: hostName })
    setGuideRejectionReason("")
  }

  const submitGuideRejection = async () => {
    if (!rejectingGuideHost) return
    setRejectGuideLoading(true)
    const reasonToSend = guideRejectionReason.trim() || "Your Certified Guide application was not approved. You can continue as a Local Host."
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          host_tier: "local_host",
          rejected_as_guide: true,
          verified_guide: false,
          license_status: "rejected",
          verification_notes: reasonToSend,
        } as any)
        .eq("id", rejectingGuideHost.id)
      if (error) throw error

      sendGuideRejectedEmail(rejectingGuideHost.email, rejectingGuideHost.name, reasonToSend).catch(console.error)
      await logAdminAction("Reject Guide", "profile", rejectingGuideHost.id, { 
        email: rejectingGuideHost.email, 
        name: rejectingGuideHost.name, 
        reason: reasonToSend 
      })
      showToast("Guide application rejected. Email sent to host.", "success")
      setRejectingGuideHost(null)
      setGuideRejectionReason("")
      load()
    } catch (err: any) {
      showToast(err.message || "Failed to reject guide", "error")
    } finally {
      setRejectGuideLoading(false)
    }
  }

  const handleSaveGuideNote = async (userId: string, note: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_notes: note } as any)
        .eq("id", userId)
      if (error) throw error
      showToast("Note saved.", "success")
      load()
    } catch (err: any) {
      showToast("Failed to save note", "error")
    }
  }

  const handleViewLicense = async (licenseUrl: string) => {
    if (!licenseUrl) return
    try {
      let path = licenseUrl
      if (licenseUrl.includes("/object/public/licenses/")) {
        path = licenseUrl.split("/object/public/licenses/")[1]
      } else if (licenseUrl.includes("/object/sign/licenses/")) {
        path = licenseUrl.split("/object/sign/licenses/")[1]?.split("?")[0]
      }
      
      const { data, error } = await supabase.storage.from("licenses").createSignedUrl(path, 3600)
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank")
      }
    } catch (err: any) {
      window.open(licenseUrl, "_blank")
    }
  }

  // Auth check
  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          navigate("/auth")
          return
        }

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()

        if (profileErr || !profile || profile?.role !== "admin") {
          navigate("/dashboard")
          return
        }

        setIsAdmin(true)
      } catch (err) {
        console.error("Auth check failed:", err)
        navigate("/dashboard")
      }
    }
    checkAdminAuth()
  }, [navigate])

  // Initial Load once admin authenticated & 60s auto-refresh polling
  useEffect(() => {
    if (!isAdmin) return

    load()

    const interval = setInterval(() => {
      load()
    }, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [isAdmin])

  // Synchronize live visitors count from the layout's presence tracking
  useEffect(() => {
    if (!isAdmin) return

    if ((window as any).__liveVisitors) {
      setLiveVisitors((window as any).__liveVisitors)
    }

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent
      setLiveVisitors(customEvent.detail || 0)
    }

    window.addEventListener("presence-sync", handleSync)
    return () => {
      window.removeEventListener("presence-sync", handleSync)
    }
  }, [isAdmin])

  // Impersonate
  const handleImpersonate = (targetUser: Profile) => {
    const adminId = localStorage.getItem("user_id")
    const adminRole = localStorage.getItem("user_role")
    if (adminId && adminRole) {
      localStorage.setItem("admin_impersonator_id", adminId)
      localStorage.setItem("admin_impersonator_role", adminRole)
      localStorage.setItem("user_id", targetUser.id)
      localStorage.setItem("user_role", targetUser.role || "traveler")
      window.location.href = targetUser.role === "host" ? "/host/dashboard" : "/dashboard"
    }
  }

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type })

  async function load() {
    setLoading(true)
    let profs: any[] = []
    let hostApps: any[] = []
    let rawTours: any[] = []
    let rawBks: any[] = []
    let rawWaitlists: any[] = []
    let rawJournals: any[] = []
    let rawPosts: any[] = []
    let rawNotifs: any[] = []

    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
      if (error) console.error("Error fetching profiles:", error)
      else profs = data ?? []
    } catch (e) {
      console.error("Exception fetching profiles:", e)
    }

    try {
      const { data, error } = await supabase.from("hosts").select("*").order("created_at", { ascending: false })
      if (error) console.error("Error fetching hosts:", error)
      else hostApps = data ?? []
    } catch (e) {
      console.error("Exception fetching hosts:", e)
    }

    try {
      const { data, error } = await supabase.from("tours").select("*").order("created_at", { ascending: false })
      if (error) console.error("Error fetching tours:", error)
      else rawTours = data ?? []
    } catch (e) {
      console.error("Exception fetching tours:", e)
    }

    try {
      const { data, error } = await supabase.from("bookings").select("*").order("booking_date", { ascending: false })
      if (error) console.error("Error fetching bookings:", error)
      else rawBks = data ?? []
    } catch (e) {
      console.error("Exception fetching bookings:", e)
    }

    try {
      const { data, error } = await supabase.from("waitlist").select("*").order("created_at", { ascending: false })
      if (error) console.error("Error fetching waitlist:", error)
      else rawWaitlists = data ?? []
    } catch (e) {
      console.error("Exception fetching waitlist:", e)
    }

    try {
      const { data, error } = await supabase.from("journals").select("*").order("created_at", { ascending: false })
      if (error) console.error("Error fetching journals:", error)
      else rawJournals = data ?? []
    } catch (e) {
      console.error("Exception fetching journals:", e)
    }

    try {
      const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false })
      if (error) console.error("Error fetching posts:", error)
      else rawPosts = data ?? []
    } catch (e) {
      console.error("Exception fetching posts:", e)
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("type", "guide_application")
        .order("created_at", { ascending: false })
      if (error) console.error("Error fetching notifications:", error)
      else rawNotifs = data ?? []
    } catch (e) {
      console.error("Exception fetching notifications:", e)
    }

    try {
      // Stitch host names onto tours and bookings
      const stitchedTours: TourRow[] = rawTours.map((t: any) => {
        const hostProf = profs.find((p: any) => p.id === t.host_id)
        const bkCount = rawBks.filter((b: any) => b.tour_id === t.id).length
        return { ...t, host_name: hostProf?.full_name ?? "Unknown Host", booking_count: bkCount }
      })

      const stitchedBks: BookingRow[] = rawBks.map((b: any) => {
        const tour = rawTours.find((t: any) => t.id === b.tour_id)
        const hostProf = profs.find((p: any) => p.id === b.host_id)
        return { ...b, tour_title: tour?.title ?? "Unknown Tour", host_name: hostProf?.full_name ?? "Host" }
      })

      // Build 30-day revenue map
      const dayMap: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const d = subDays(new Date(), i)
        dayMap[format(d, "yyyy-MM-dd")] = 0
      }
      for (const b of stitchedBks) {
        if (b.status === "confirmed" || b.status === "completed") {
          const key = b.booking_date?.slice(0, 10)
          if (key && key in dayMap) dayMap[key] += Number(b.total_price)
        }
      }
      const daily = Object.entries(dayMap).map(([date, amount]) => ({ date, amount }))

      // Stitch profiles onto journals and posts
      const stitchedJournals = rawJournals.map((j: any) => {
        const author = profs.find((p: any) => p.id === j.user_id)
        return { ...j, author_name: author?.full_name ?? author?.email ?? "Unknown User" }
      })

      const stitchedPosts = rawPosts.map((p: any) => {
        const author = profs.find((p: any) => p.id === p.user_id)
        return { ...p, author_name: author?.full_name ?? author?.email ?? "Unknown User" }
      })

      setProfiles(profs)
      setHosts(hostApps)
      setTours(stitchedTours)
      setBookings(stitchedBks)
      setDailyRevenue(daily)
      setWaitlists(rawWaitlists)
      setJournals(stitchedJournals)
      setPosts(stitchedPosts)
      setAdminNotifications(rawNotifs)
    } catch (e: any) {
      console.error("[AdminDashboard] Error stitching/processing data:", e?.message)
    } finally {
      setCheckingAuth(false)
      setLoading(false)
    }
  }

  // ── Computed stats ──────────────────────────────────────────────────────────
  const totalRevenue = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((s, b) => s + Number(b.total_price), 0)

  // ── Host actions ────────────────────────────────────────────────────────────
  // Helper for audit logging admin actions
  async function logAdminAction(action: string, targetType: string, targetId: string | null, details: any = {}) {
    try {
      const adminId = localStorage.getItem("user_id")
      await supabase.from("audit_logs").insert({
        admin_id: adminId || null,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        ip_address: "127.0.0.1",
      })
    } catch (err) {
      console.error("Failed to write audit log:", err)
    }
  }

  // ── Host actions ────────────────────────────────────────────────────────────
  async function handleApprove(hostId: string) {
    try {
      await approveHost(hostId)
      const matched = hosts.find((h) => h.id === hostId)
      if (matched?.user_id) {
        await supabase.from("profiles").update({ role: "host" }).eq("id", matched.user_id)
        setProfiles((prev) => prev.map((p) => p.id === matched.user_id ? { ...p, role: "host" } : p))
      }
      setHosts((prev) => prev.map((h) => h.id === hostId ? { ...h, status: "approved", reviewed_at: new Date().toISOString() } : h))
      showToast("Host approved — role upgraded to Host", "success")
      await logAdminAction("Approve Host", "host", hostId, { host_name: matched?.full_name, user_id: matched?.user_id })
    } catch { showToast("Failed to approve host", "error") }
  }

  async function handleReject(reason: string) {
    if (!rejectingId) return
    setRejectLoading(true)
    try {
      await rejectHost(rejectingId, reason)
      const matched = hosts.find((h) => h.id === rejectingId)
      setHosts((prev) => prev.map((h) => h.id === rejectingId ? { ...h, status: "rejected", rejection_reason: reason, reviewed_at: new Date().toISOString() } : h))
      showToast("Host application rejected", "success")
      await logAdminAction("Reject Host", "host", rejectingId, { reason, host_name: matched?.full_name })
      setRejectingId(null)
    } catch { showToast("Failed to reject host", "error") }
    finally { setRejectLoading(false) }
  }

  // ── Tour actions ────────────────────────────────────────────────────────────
  async function handleTourUpdate(tourId: string, update: any, successMsg: string) {
    try {
      const { error } = await supabase.from("tours").update(update).eq("id", tourId)
      if (error) throw error
      setTours((prev) => prev.map((t) => t.id === tourId ? { ...t, ...update } : t))
      showToast(successMsg, "success")

      if (update.is_published === true) {
        const matched = tours.find(t => t.id === tourId)
        if (matched) {
          const { data: host } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", matched.host_id)
            .maybeSingle()
          if (host?.email) {
            sendTourApprovalEmail(host.email, host.full_name, matched.title)
              .catch(err => console.error("Failed to send tour approval email:", err))
          }
        }
      }
    } catch { showToast("Action failed", "error") }
  }

  async function handleDeleteTour(tourId: string) {
    if (!confirm("Permanently delete this tour?")) return
    try {
      const matchedTour = tours.find(t => t.id === tourId)
      const { error } = await supabase.from("tours").delete().eq("id", tourId)
      if (error) throw error
      setTours((prev) => prev.filter((t) => t.id !== tourId))
      showToast("Tour deleted", "success")
      await logAdminAction("Delete Tour", "tour", tourId, { title: matchedTour?.title })
    } catch { showToast("Failed to delete tour", "error") }
  }

  // ── User actions ────────────────────────────────────────────────────────────
  async function handleUserUpdate(userId: string, update: any, successMsg: string) {
    try {
      const { error } = await supabase.from("profiles").update(update).eq("id", userId)
      if (error) throw error
      setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, ...update } : p))
      showToast(successMsg, "success")
    } catch { showToast("Action failed", "error") }
  }

  async function handleDeleteUser(userIdToDelete: string) {
    if (!confirm("Permanently delete this user profile?")) return
    try {
      const matchedUser = profiles.find(p => p.id === userIdToDelete)
      const { error } = await supabase.from("profiles").delete().eq("id", userIdToDelete)
      if (error) throw error
      setProfiles((prev) => prev.filter((p) => p.id !== userIdToDelete))
      showToast("User deleted", "success")
      await logAdminAction("Delete User", "user", userIdToDelete, { name: matchedUser?.full_name, email: matchedUser?.email })
    } catch { showToast("Failed to delete user", "error") }
  }


  // ── Filtered datasets ───────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────────
  // Auth gate
  // ─────────────────────────────────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main Layout
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background px-4 py-24">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-teal/4 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-3.5" />
            </Link>
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Ausaguide Admin</h1>
                {liveVisitors > 0 && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {liveVisitors} online
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Platform management console</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { throw new Error('Sentry test error from Ausaguide'); }}
              className="bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-700 text-xs font-semibold transition-colors"
            >
              Test Sentry
            </button>
            <Button size="sm" variant="outline" className="rounded-full border-border/60 text-muted-foreground"
              onClick={load}>
              <RefreshCw className="size-3.5 mr-1.5" />
              Refresh
            </Button>
            <Badge variant="secondary" className="rounded-full border-primary/30 bg-primary/10 text-primary text-xs px-3">
              Admin
            </Badge>
          </div>
        </div>

        {/* Global search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search across all tabs…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-border/70 bg-card/40" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as any)
          setSearchParams({ tab: v })
          setSearch("")
        }}>
          <TabsList className="grid w-full grid-cols-9 h-auto bg-card/60 backdrop-blur-md border border-border/40">
            <TabsTrigger value="overview" className="text-xs py-2.5">Overview</TabsTrigger>
            <TabsTrigger value="users" className="text-xs py-2.5">Users</TabsTrigger>
            <TabsTrigger value="tours" className="text-xs py-2.5">Tours</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs py-2.5">Bookings</TabsTrigger>
            <TabsTrigger value="waitlist" className="text-xs py-2.5">Waitlist</TabsTrigger>
            <TabsTrigger value="moderation" className="text-xs py-2.5">Moderation</TabsTrigger>
            <TabsTrigger value="guides" className="text-xs py-2.5 relative">
              Guide Verif.
              {profiles.filter((p: any) => p.tra_number && !p.verified_guide && !p.rejected_as_guide).length > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {profiles.filter((p: any) => p.tra_number && !p.verified_guide && !p.rejected_as_guide).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs py-2.5">System</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs py-2.5">Logs</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Error banner removed — individual sections show empty states instead */}

        {loading ? (
          <div className="flex justify-center py-24"><Spinner className="size-8 text-primary" /></div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                  <StatCard label="Total Revenue" value={fmt(totalRevenue)} icon={DollarSign}
                    color="oklch(0.541 0.217 292)" sub={`${bookings.filter(b => b.status === "confirmed").length} Confirmed`} />
                  <StatCard label="Total Bookings" value={bookings.length} icon={Calendar}
                    color="oklch(0.696 0.17 162)" sub={`${bookings.filter(b => b.status === "completed").length} Completed`} />
                  <StatCard label="Platform Users" value={profiles.length} icon={Users}
                    color="oklch(0.828 0.189 84.429)" sub={`${profiles.filter(p => p.role === "traveler").length} Travelers | ${profiles.filter(p => p.role === "host").length} Hosts | ${liveVisitors} Online`} />
                  <StatCard label="Active Hosts" value={profiles.filter(p => p.role === "host").length} icon={UserCheck}
                    color="oklch(0.627 0.265 303.9)" sub="Approved guides" />
                  <StatCard label="Total Tours" value={tours.length} icon={MapPin}
                    color="oklch(0.696 0.17 162)" sub={`${tours.filter(t => t.is_published).length} Published`} />
                  <StatCard label="Waitlist" value={waitlists.length} icon={ClipboardList}
                    color="oklch(0.645 0.246 16.439)" sub="Launch signups" />
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue chart */}
                  <Card className="border-border/60 bg-card/20 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base text-white">
                        <span className="size-2 rounded-full bg-[#7F5AF0] inline-block" />
                        Revenue Trend — Last 30 Days
                      </CardTitle>
                      <CardDescription>Daily income tracking from confirmed bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id="rev30" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="oklch(0.541 0.217 292)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="oklch(0.541 0.217 292)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 285)" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.7 0.02 260)" }}
                            tickFormatter={(v) => { try { return format(parseISO(v), "d MMM") } catch { return v } }}
                            axisLine={false} tickLine={false} interval={4} />
                          <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.02 260)" }}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            axisLine={false} tickLine={false} width={36} />
                          <Tooltip content={<ChartTooltip />}
                            cursor={{ stroke: "oklch(0.541 0.217 292)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                          <Area type="monotone" dataKey="amount" stroke="oklch(0.541 0.217 292)"
                            strokeWidth={2.5} fill="url(#rev30)" dot={false}
                            activeDot={{ r: 5, fill: "oklch(0.541 0.217 292)", stroke: "#fff", strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Daily Signups Chart */}
                  <Card className="border-border/60 bg-card/20 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base text-white">
                        <span className="size-2 rounded-full bg-[#2CB67D] inline-block" />
                        User Signup Trends
                      </CardTitle>
                      <CardDescription>Daily registration volume for travelers and hosts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={
                          (() => {
                            const daysMap: Record<string, number> = {}
                            for (let i = 14; i >= 0; i--) {
                              const d = subDays(new Date(), i)
                              daysMap[format(d, "yyyy-MM-dd")] = 0
                            }
                            for (const p of profiles) {
                              const key = p.created_at?.slice(0, 10)
                              if (key && key in daysMap) daysMap[key]++
                            }
                            return Object.entries(daysMap).map(([date, count]) => ({ date, amount: count }))
                          })()
                        } margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id="userGrowth" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2CB67D" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#2CB67D" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 285)" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.7 0.02 260)" }}
                            tickFormatter={(v) => { try { return format(parseISO(v), "d MMM") } catch { return v } }}
                            axisLine={false} tickLine={false} interval={2} />
                          <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.02 260)" }}
                            axisLine={false} tickLine={false} width={24} />
                          <Tooltip content={<ChartTooltip />}
                            cursor={{ stroke: "#2CB67D", strokeWidth: 1, strokeDasharray: "4 4" }} />
                          <Area type="monotone" dataKey="amount" stroke="#2CB67D"
                            strokeWidth={2.5} fill="url(#userGrowth)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bookings trends */}
                  <Card className="border-border/60 bg-card/20 backdrop-blur-md lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base text-white">Daily Booking Activity</CardTitle>
                      <CardDescription>Number of transactions initialized per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={
                          (() => {
                            const daysMap: Record<string, number> = {}
                            for (let i = 14; i >= 0; i--) {
                              const d = subDays(new Date(), i)
                              daysMap[format(d, "yyyy-MM-dd")] = 0
                            }
                            for (const b of bookings) {
                              const key = b.booking_date?.slice(0, 10)
                              if (key && key in daysMap) daysMap[key]++
                            }
                            return Object.entries(daysMap).map(([date, count]) => ({ date, count }))
                          })()
                        }>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 285)" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "oklch(0.7 0.02 260)" }}
                            tickFormatter={(v) => { try { return format(parseISO(v), "d MMM") } catch { return v } }}
                            axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: "oklch(0.7 0.02 260)" }} axisLine={false} tickLine={false} width={20} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="count" fill="oklch(0.828 0.189 84.429)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Host Approvals stats */}
                  <Card className="border-border/60 bg-card/20 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-base text-white">Host Registration Status</CardTitle>
                      <CardDescription>Distribution of applicant approvals</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: "Approved Guides", count: hosts.filter(h => h.status === "approved").length, color: "bg-emerald-500" },
                        { label: "Pending Verification", count: hosts.filter(h => h.status === "pending").length, color: "bg-amber-500" },
                        { label: "Rejected Candidates", count: hosts.filter(h => h.status === "rejected").length, color: "bg-red-500" },
                      ].map((h, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-border/10 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`size-2.5 rounded-full ${h.color}`} />
                            <span className="text-xs text-muted-foreground">{h.label}</span>
                          </div>
                          <span className="text-sm font-bold text-white">{h.count}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Signups, Waitlist and Notifications side-by-side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Signups */}
                  <Card className="border-border/60 bg-linear-to-br from-card to-card/40">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                        <Users className="size-4 text-primary" />
                        Recent Signups
                      </CardTitle>
                      <CardDescription>Latest users to register accounts</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border/40 bg-muted/20">
                              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">User</th>
                              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Role</th>
                              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Joined</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/10">
                            {profiles.slice(0, 5).map((p) => (
                              <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">
                                  {p.full_name}
                                  <div className="text-[10px] text-white/40">{p.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                                    p.role === "admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                    p.role === "host" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                                    "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                  }`}>
                                    {p.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-white/60">
                                  {p.created_at ? format(parseISO(p.created_at), "MMM d, yyyy") : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {profiles.length === 0 && (
                        <div className="py-8 text-center text-xs text-muted-foreground">No users yet</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Waitlist */}
                  <Card className="border-border/60 bg-linear-to-br from-card to-card/40">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                        <ClipboardList className="size-4 text-[#2CB67D]" />
                        Recent Waitlist Signups
                      </CardTitle>
                      <CardDescription>Latest users to join the launch waiting list</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border/40 bg-muted/20">
                              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Name</th>
                              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Role</th>
                              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Joined</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/10">
                            {waitlists.slice(0, 5).map((w) => (
                              <tr key={w.id} className="hover:bg-muted/5 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">
                                  {w.name}
                                  <div className="text-[10px] text-white/40">{w.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-[#2CB67D]/10 text-[#2CB67D] border border-[#2CB67D]/20">
                                    {w.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-white/60">
                                  {w.created_at ? format(parseISO(w.created_at), "MMM d, yyyy") : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {waitlists.length === 0 && (
                        <div className="py-8 text-center text-xs text-muted-foreground">No waitlist entries</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* System Notifications */}
                  <Card className="border-border/60 bg-linear-to-br from-card to-card/40">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                        <Bell className="size-4 text-amber-500" />
                        In-App Admin Notifications
                      </CardTitle>
                      <CardDescription>Alerts and updates from guide submissions</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                      {adminNotifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-10">No notifications yet.</p>
                      ) : (
                        adminNotifications.map((notif) => (
                          <div key={notif.id} className="p-3 rounded-xl bg-muted/10 border border-border/30 flex items-start gap-2.5 justify-between">
                            <div>
                              <p className="text-xs text-white/90 font-medium leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1.5">
                                {format(new Date(notif.created_at), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="size-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── USERS ───────────────────────────────────────────────────── */}
            {activeTab === "users" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Sub-tabs for profiles vs host applications */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {(["all", "traveler", "host", "admin", "suspended"] as const).map((r) => (
                      <button key={r} onClick={() => setUserRoleFilter(r)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                          userRoleFilter === r
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "border-border/50 text-muted-foreground hover:bg-muted/30"
                        }`}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                        {r === "suspended" ? ` (${profiles.filter((p: any) => p.is_suspended || p.banned).length})` : r !== "all" ? ` (${profiles.filter((p) => p.role === r).length})` : ""}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full border-border/60"
                    onClick={() => downloadCSV(profiles.map((p) => ({
                      name: p.full_name, email: p.email, role: p.role, joined: p.created_at,
                    })), "users-export.csv")}>
                    <Download className="size-3.5 mr-1.5" />Export CSV
                  </Button>
                </div>

                {/* Profiles table */}
                <Card className="border-border/60 bg-[#121214]/30">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            {["User", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {profiles
                            .filter((p) => {
                              if (userRoleFilter === "suspended") return (p as any).is_suspended || (p as any).banned
                              if (userRoleFilter !== "all" && p.role !== userRoleFilter) return false
                              return (
                                p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                                p.email?.toLowerCase().includes(search.toLowerCase())
                              )
                            })
                            .map((p) => (
                              <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="size-7">
                                      <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                                        {getInitials(p.full_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium text-foreground">{p.full_name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{p.email}</td>
                                <td className="px-4 py-3">
                                  <Badge variant={p.role === "admin" ? "destructive" : p.role === "host" ? "default" : "secondary"}
                                    className="text-[10px] capitalize">{p.role}</Badge>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {(p as any).is_suspended || (p as any).banned ? (
                                    <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/5">Suspended</Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">Active</Badge>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                  {p.created_at ? format(new Date(p.created_at), "MMM d, yyyy") : "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    {p.id !== adminId && (
                                      <Button size="icon" variant="ghost"
                                        className="size-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                                        title="Impersonate User"
                                        onClick={() => handleImpersonate(p)}>
                                        <Eye className="size-3.5 text-primary" />
                                      </Button>
                                    )}
                                    {(p as any).is_suspended || (p as any).banned ? (
                                      <Button size="icon" variant="ghost"
                                        className="size-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400"
                                        title="Activate user"
                                        onClick={() => handleUserUpdate(p.id, { is_suspended: false, banned: false }, "User activated")}>
                                        <UserCheck className="size-3.5 text-emerald-400" />
                                      </Button>
                                    ) : (
                                      <Button size="icon" variant="ghost"
                                        className="size-7 rounded-lg hover:bg-amber-500/10 hover:text-amber-400"
                                        title="Suspend user"
                                        onClick={() => handleUserUpdate(p.id, { is_suspended: true, banned: true }, "User suspended")}>
                                        <Ban className="size-3.5 text-amber-400" />
                                      </Button>
                                    )}
                                    {p.id !== adminId && (
                                      <Button size="icon" variant="ghost"
                                        className="size-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                        title="Delete user"
                                        onClick={() => handleDeleteUser(p.id)}>
                                        <Trash2 className="size-3.5 text-destructive" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {profiles.length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">No users yet</div>
                    ) : profiles.filter((p) => {
                      if (userRoleFilter === "suspended") return (p as any).is_suspended || (p as any).banned
                      if (userRoleFilter !== "all" && p.role !== userRoleFilter) return false
                      return (
                        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.email?.toLowerCase().includes(search.toLowerCase())
                      )
                    }).length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">No users found.</div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Host applications section */}
                <div className="space-y-4 mt-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Shield className="size-4 text-amber-400" />
                      Host Applications
                    </h2>
                    <div className="flex gap-1.5">
                      {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                        <button key={f} onClick={() => setHostFilter(f)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors border ${
                            hostFilter === f
                              ? "bg-primary/15 text-primary border-primary/30"
                              : "border-border/40 text-muted-foreground hover:bg-muted/20"
                          }`}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Card className="border-border/60 bg-[#121214]/30">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border/40 bg-muted/20">
                              {["Host Details", "City", "Document Info", "Type", "Status", "Review"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/10">
                            {hosts
                              .filter((h) => {
                                if (hostFilter !== "all" && h.status !== hostFilter) return false
                                return (
                                  h.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                                  h.email?.toLowerCase().includes(search.toLowerCase())
                                )
                              })
                              .map((h) => (
                                <tr key={h.id} className="hover:bg-muted/10 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-white">{h.full_name}</div>
                                    <div className="text-[10px] text-white/50">{h.email}</div>
                                  </td>
                                  <td className="px-4 py-3 text-white/80">{h.city}</td>
                                  <td className="px-4 py-3 text-xs">
                                    {h.license_upload_url ? (
                                      <a href={h.license_upload_url} target="_blank" rel="noreferrer" className="text-[#7F5AF0] underline hover:text-[#7F5AF0]/80">
                                        View License Document
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground/50">No Document</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 capitalize text-white/70">{h.host_type?.replace("_", " ")}</td>
                                  <td className="px-4 py-3">
                                    <Badge className={`text-[9px] font-bold uppercase tracking-wider ${
                                      h.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                      h.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                      "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`} variant="outline">
                                      {h.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    {h.status === "pending" ? (
                                      <div className="flex items-center gap-1.5">
                                        <Button size="icon" variant="ghost" title="Approve"
                                          className="size-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400"
                                          onClick={() => handleApprove(h.id)}>
                                          <CheckCircle2 className="size-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" title="Reject"
                                          className="size-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                          onClick={() => setRejectingId(h.id)}>
                                          <XCircle className="size-3.5" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground font-semibold">Reviewed</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      {hosts.filter((h) => {
                        if (hostFilter !== "all" && h.status !== hostFilter) return false
                        return (
                          h.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                          h.email?.toLowerCase().includes(search.toLowerCase())
                        )
                      }).length === 0 && (
                        <div className="py-8 text-center text-xs text-muted-foreground">No applications found.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── TOURS ───────────────────────────────────────────────────── */}
            {activeTab === "tours" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Tours Listings Directory</h2>
                  <Button size="sm" variant="outline" className="rounded-full border-border/60"
                    onClick={() => downloadCSV(tours.map((t) => ({
                      title: t.title, host: t.host_name, price: t.physical_price, status: t.is_published ? "published" : "hidden", created: t.created_at
                    })), "tours-export.csv")}>
                    <Download className="size-3.5 mr-1.5" />Export CSV
                  </Button>
                </div>

                <Card className="border-border/60 bg-[#121214]/30">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            {["Tour Details", "Host", "Price", "Capacity", "Status", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {tours
                            .filter((t) =>
                              t.title?.toLowerCase().includes(search.toLowerCase()) ||
                              t.host_name?.toLowerCase().includes(search.toLowerCase())
                            )
                            .map((t) => (
                              <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="text-xs font-semibold text-white">{t.title}</div>
                                  <div className="text-[10px] text-white/50">{t.location}</div>
                                </td>
                                <td className="px-4 py-3 text-xs text-white/80">{t.host_name}</td>
                                <td className="px-4 py-3 text-xs font-medium text-white whitespace-nowrap">
                                  KES {t.physical_price} / KES {t.virtual_price} (V)
                                </td>
                                <td className="px-4 py-3 text-xs text-white/70">{t.capacity || "Unlimited"}</td>
                                <td className="px-4 py-3">
                                  <Badge className={`text-[9px] font-bold tracking-wide uppercase ${
                                    t.is_published
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  }`} variant="outline">
                                    {t.is_published ? "Published" : "Hidden"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost"
                                      title={t.is_published ? "Hide tour" : "Publish tour"}
                                      className="size-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                                      onClick={() => handleTourUpdate(t.id, { is_published: !t.is_published }, `Tour status updated`)}>
                                      {t.is_published ? <Ban className="size-3.5 text-amber-400" /> : <CheckCircle2 className="size-3.5 text-emerald-400" />}
                                    </Button>
                                    <Button size="icon" variant="ghost"
                                      className="size-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                      title="Delete tour" onClick={() => handleDeleteTour(t.id)}>
                                      <Trash2 className="size-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {tours.length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">No tours available</div>
                    ) : tours.filter((t) =>
                      t.title?.toLowerCase().includes(search.toLowerCase()) ||
                      t.host_name?.toLowerCase().includes(search.toLowerCase())
                    ).length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">No tours found.</div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── BOOKINGS ─────────────────────────────────────────────────── */}
            {activeTab === "bookings" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
                      <button key={f} onClick={() => setBookingFilter(f)}
                        className={`rounded-full px-3 py-1 text-[10px] font-medium transition-colors border ${
                          bookingFilter === f
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "border-border/40 text-muted-foreground hover:bg-muted/20"
                        }`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f !== "all" && ` (${bookings.filter((b) => b.status === f).length})`}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full border-border/60"
                    onClick={() => downloadCSV(bookings.map((b) => ({
                      id: b.id, guest: b.guest_name, email: b.guest_email, amount: b.total_price, status: b.status, date: b.booking_date
                    })), "bookings-export.csv")}>
                    <Download className="size-3.5 mr-1.5" />Export CSV
                  </Button>
                </div>

                <Card className="border-border/60 bg-[#121214]/30">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            {["Booking ID", "Date", "Guest", "Tour", "Host", "Amount", "Status", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {bookings
                            .filter((b) => {
                              if (bookingFilter !== "all" && b.status !== bookingFilter) return false
                              return (
                                b.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
                                b.tour_title?.toLowerCase().includes(search.toLowerCase()) ||
                                b.host_name?.toLowerCase().includes(search.toLowerCase())
                              )
                            })
                            .map((b) => (
                              <tr key={b.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-4 py-3 font-mono text-[10px] text-primary font-semibold">
                                  BK-{b.id.slice(0, 8).toUpperCase()}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                  {format(parseISO(b.booking_date), "MMM d, yyyy")}
                                </td>
                                <td className="px-4 py-3 text-xs text-foreground">{b.guest_name}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[130px] truncate">{b.tour_title}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{b.host_name}</td>
                                <td className="px-4 py-3 text-xs font-semibold text-foreground whitespace-nowrap">
                                  KES {Number(b.total_price).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className={`text-[10px] ${
                                    b.status === "confirmed" || b.status === "completed"
                                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                                      : b.status === "cancelled"
                                      ? "bg-destructive/15 text-destructive border-destructive/20"
                                      : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                                  }`} variant="outline">
                                    {b.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    {b.status !== "cancelled" && (
                                      <Button size="icon" variant="ghost" title="Cancel booking"
                                        className="size-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                        onClick={async () => {
                                          try {
                                            const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", b.id)
                                            if (error) throw error
                                            setBookings((prev) => prev.map((bk) => bk.id === b.id ? { ...bk, status: "cancelled" } : bk))
                                            showToast("Booking cancelled", "success")
                                          } catch (err: any) {
                                            console.error("Failed to cancel booking:", err)
                                            showToast(err.message || "Failed to cancel booking", "error")
                                          }
                                        }}>
                                        <XCircle className="size-3.5 text-destructive" />
                                      </Button>
                                    )}
                                    <Button size="icon" variant="ghost" title="Refund (placeholder)"
                                      className="size-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                                      onClick={() => showToast("Refund initiated (placeholder)", "success")}>
                                      <RefreshCw className="size-3.5 text-primary" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {bookings.length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">No bookings yet</div>
                    ) : bookings.filter((b) => {
                      if (bookingFilter !== "all" && b.status !== bookingFilter) return false
                      return (
                        b.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
                        b.tour_title?.toLowerCase().includes(search.toLowerCase()) ||
                        b.host_name?.toLowerCase().includes(search.toLowerCase())
                      )
                    }).length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">No bookings found.</div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── WAITLIST ───────────────────────────────────────────────── */}
            {activeTab === "waitlist" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Waitlist Directory</h2>
                    <p className="text-xs text-muted-foreground">All launch waiting list submissions ({waitlists.length})</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full border-border/60 text-muted-foreground hover:text-white"
                    onClick={() => downloadCSV(waitlists.map((w) => ({
                      name: w.name, email: w.email, role: w.role, location: w.location, reason: w.reason, joined: w.created_at,
                    })), "waitlist-export.csv")}>
                    <Download className="size-3.5 mr-1.5" />Export CSV
                  </Button>
                </div>

                <Card className="border-border/60 bg-[#121214]/30">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            {["User Details", "Role Interest", "Location", "Reason", "Signed Up"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {waitlists.map((w) => (
                            <tr key={w.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-3 text-xs font-semibold text-white">
                                {w.name}
                                <div className="text-[10px] text-white/40">{w.email}</div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className="text-[9px] font-bold tracking-wide uppercase bg-primary/10 text-primary border-primary/20" variant="outline">
                                  {w.role}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-xs text-white/80">{w.location || "N/A"}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate" title={w.reason}>{w.reason || "N/A"}</td>
                              <td className="px-4 py-3 text-xs text-white/60">
                                {w.created_at ? format(parseISO(w.created_at), "MMM d, yyyy") : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {waitlists.length === 0 && (
                      <div className="py-12 text-center text-sm text-muted-foreground">No waitlist entries</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── MODERATION ──────────────────────────────────────────────── */}
            {activeTab === "moderation" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Guide Verification Applications */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base text-white">Pending Guide Credentials Reviews</CardTitle>
                    <CardDescription>Verify guide licenses and documentation to grant the Certified Guide badge</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                            <th className="pb-3 px-4">Applicant</th>
                            <th className="pb-3 px-4">Email</th>
                            <th className="pb-3 px-4">Uploaded Date</th>
                            <th className="pb-3 px-4">Document Link</th>
                            <th className="pb-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {profiles
                            .filter(
                              (p) =>
                                p.license_status === "pending" &&
                                (p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                                  p.email?.toLowerCase().includes(search.toLowerCase()))
                            )
                            .map((p) => (
                              <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                                <td className="py-3.5 px-4 font-medium text-foreground">{p.full_name}</td>
                                <td className="py-3.5 px-4 text-muted-foreground">{p.email}</td>
                                <td className="py-3.5 px-4 text-muted-foreground">
                                  {p.created_at ? format(parseISO(p.created_at), "yyyy-MM-dd") : "N/A"}
                                </td>
                                <td className="py-3.5 px-4">
                                  {p.license_url ? (
                                    <button onClick={() => handleViewLicense(p.license_url!)}
                                      className="text-[#7F5AF0] underline hover:text-[#7F5AF0]/80 font-medium text-xs">
                                      View License Document
                                    </button>
                                  ) : (
                                    <span className="text-muted-foreground/50 text-xs">No Document</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right space-x-2">
                                  <Button size="sm" onClick={() => handleApproveGuide(p.id, p.email, p.full_name)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-3 py-1 text-xs">
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleRejectGuide(p.id, p.email, p.full_name)}
                                    className="rounded-full px-3 py-1 text-xs">
                                    Reject
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {profiles.filter((p) => p.license_status === "pending").length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground">No pending guide verification requests.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Content journals review */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base text-white">Platform Journal Feed Moderation</CardTitle>
                    <CardDescription>Screen or delete community travel journal entries</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                            <th className="pb-3 px-4">Author</th>
                            <th className="pb-3 px-4">Title</th>
                            <th className="pb-3 px-4">Preview</th>
                            <th className="pb-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {journals
                            .filter(j => j.title?.toLowerCase().includes(search.toLowerCase()) || j.author_name?.toLowerCase().includes(search.toLowerCase()))
                            .map((j) => (
                              <tr key={j.id} className="hover:bg-muted/10 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-foreground text-xs">{j.author_name}</td>
                                <td className="py-3.5 px-4 text-white text-xs">{j.title}</td>
                                <td className="py-3.5 px-4 text-muted-foreground max-w-sm truncate text-xs">{j.content}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <Button size="sm" variant="ghost"
                                    onClick={async () => {
                                      if (confirm("Delete this journal entry?")) {
                                        try {
                                          const { error } = await supabase.from("journals").delete().eq("id", j.id)
                                          if (error) throw error
                                          setJournals(prev => prev.filter(item => item.id !== j.id))
                                          showToast("Journal entry deleted", "success")
                                        } catch (e: any) {
                                          showToast(e.message || "Failed to delete journal", "error")
                                        }
                                      }
                                    }}
                                    className="text-red-500 hover:bg-red-500/10 rounded-full px-3 py-1 text-xs">
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {journals.length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground">No platform journal entries to show.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Content posts review */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base text-white">Platform Community Posts Moderation</CardTitle>
                    <CardDescription>Screen or delete traveler community posts</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                            <th className="pb-3 px-4">Author</th>
                            <th className="pb-3 px-4">Content Preview</th>
                            <th className="pb-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {posts
                            .filter(p => p.content?.toLowerCase().includes(search.toLowerCase()) || p.author_name?.toLowerCase().includes(search.toLowerCase()))
                            .map((p) => (
                              <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-foreground text-xs">{p.author_name}</td>
                                <td className="py-3.5 px-4 text-white text-xs">{p.content}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <Button size="sm" variant="ghost"
                                    onClick={async () => {
                                      if (confirm("Delete this community post?")) {
                                        try {
                                          const { error } = await supabase.from("posts").delete().eq("id", p.id)
                                          if (error) throw error
                                          setPosts(prev => prev.filter(item => item.id !== p.id))
                                          showToast("Post deleted", "success")
                                        } catch (e: any) {
                                          showToast(e.message || "Failed to delete post", "error")
                                        }
                                      }
                                    }}
                                    className="text-red-500 hover:bg-red-500/10 rounded-full px-3 py-1 text-xs">
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {posts.length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground">No community posts to show.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── GUIDE VERIFICATIONS ──────────────────────────────────────── */}
            {activeTab === "guides" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Pending reviews */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <BadgeCheck className="size-5 text-[#7F5AF0]" />
                      Pending Guide Verification Applications
                    </CardTitle>
                    <CardDescription>
                      Verify host guide licenses manually using the official databases and TRA portal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                            <th className="pb-3 px-4">Applicant</th>
                            <th className="pb-3 px-4">License Details</th>
                            <th className="pb-3 px-4">Certificate</th>
                            <th className="pb-3 px-4">Verification Notes</th>
                            <th className="pb-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {profiles
                            .filter(
                              (p) =>
                                p.tra_number &&
                                !p.verified_guide &&
                                !p.rejected_as_guide &&
                                (p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                                  p.email?.toLowerCase().includes(search.toLowerCase()))
                            )
                            .map((p) => (
                              <tr key={p.id} className="hover:bg-muted/10 transition-colors align-top">
                                <td className="py-4 px-4">
                                  <div className="font-semibold text-foreground">{p.full_name}</div>
                                  <div className="text-xs text-muted-foreground">{p.email}</div>
                                  <div className="text-[10px] text-muted-foreground/60 mt-1">
                                    Joined: {p.created_at ? format(parseISO(p.created_at), "MMM d, yyyy") : "N/A"}
                                  </div>
                                </td>
                                <td className="py-4 px-4 space-y-1 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">TRA: </span>
                                    <code className="text-[#7F5AF0] font-mono font-semibold">{p.tra_number}</code>
                                  </div>
                                  {p.kpsga_number && (
                                    <div>
                                      <span className="text-muted-foreground">KPSGA: </span>
                                      <code className="text-[#2CB67D] font-mono font-semibold">{p.kpsga_number}</code>
                                    </div>
                                  )}
                                  {p.license_expiry && (
                                    <div className="text-[10px] text-muted-foreground/80">
                                      Expiry: {format(parseISO(p.license_expiry), "MMM d, yyyy")}
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                  {p.certificate_url ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewLicense(p.certificate_url!)}
                                      className="rounded-full border-border/80 text-xs flex items-center gap-1.5"
                                    >
                                      <FileText className="size-3.5" />
                                      View Certificate
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/50 italic">No upload</span>
                                  )}
                                </td>
                                <td className="py-4 px-4 space-y-2">
                                  <textarea
                                    placeholder="Add notes (e.g. verified on portal, issue with certificate...)"
                                    value={guideNotes[p.id] ?? p.verification_notes ?? ""}
                                    onChange={(e) =>
                                      setGuideNotes((prev) => ({ ...prev, [p.id]: e.target.value }))
                                    }
                                    className="w-full min-w-[200px] max-w-xs text-xs rounded-xl bg-card border border-border/60 p-2 text-foreground focus:outline-none focus:border-primary/50 resize-none h-16"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveGuideNote(p.id, guideNotes[p.id] ?? "")}
                                    className="text-[10px] text-[#7F5AF0] hover:bg-[#7F5AF0]/10 h-7 px-2.5 rounded-full flex items-center gap-1"
                                  >
                                    <StickyNote className="size-3" />
                                    Save Note
                                  </Button>
                                </td>
                                <td className="py-4 px-4 text-right space-y-2">
                                  <div className="flex flex-col gap-1.5 items-end">
                                    <Button
                                      size="sm"
                                      onClick={() => window.open("https://verify.tra.go.ke", "_blank")}
                                      className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-full px-3 text-xs flex items-center gap-1"
                                    >
                                      <ExternalLink className="size-3" />
                                      Verify on TRA Portal
                                    </Button>
                                    <div className="flex gap-1.5">
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveGuide(p.id, p.email, p.full_name)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-3 py-1 text-xs"
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleRejectGuide(p.id, p.email, p.full_name)}
                                        className="rounded-full px-3 py-1 text-xs"
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {profiles.filter((p) => p.tra_number && !p.verified_guide && !p.rejected_as_guide).length === 0 && (
                      <div className="py-12 text-center text-sm text-muted-foreground">
                        No pending guide verification applications.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* History panel */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base text-white">Verification History</CardTitle>
                    <CardDescription>Records of past approvals and rejections.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                            <th className="pb-3 px-4">Host</th>
                            <th className="pb-3 px-4">TRA License</th>
                            <th className="pb-3 px-4">Verification Outcome</th>
                            <th className="pb-3 px-4">Date Reviewed</th>
                            <th className="pb-3 px-4">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {profiles
                            .filter(
                              (p) =>
                                p.tra_number &&
                                (p.verified_guide || p.rejected_as_guide) &&
                                (p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                                  p.email?.toLowerCase().includes(search.toLowerCase()))
                            )
                            .map((p) => (
                              <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-foreground text-xs">{p.full_name}</div>
                                  <div className="text-[10px] text-muted-foreground">{p.email}</div>
                                </td>
                                <td className="py-3 px-4 text-xs">
                                  <code className="text-[#7F5AF0] font-mono font-semibold">{p.tra_number}</code>
                                </td>
                                <td className="py-3 px-4">
                                  {p.verified_guide ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider">
                                      Approved (Verified Guide)
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] uppercase font-bold tracking-wider">
                                      Rejected (Local Host)
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-xs text-muted-foreground">
                                  {p.verification_date ? format(parseISO(p.verification_date), "MMM d, yyyy HH:mm") : "—"}
                                </td>
                                <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate" title={p.verification_notes ?? ""}>
                                  {p.verification_notes || <span className="text-muted-foreground/30 italic">No notes</span>}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {profiles.filter((p) => p.tra_number && (p.verified_guide || p.rejected_as_guide)).length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No verification records found.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── SYSTEM SETTINGS ─────────────────────────────────────────── */}
            {activeTab === "system" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Configs */}
                  <Card className="border-border/60 bg-[#121214]/30">
                    <CardHeader>
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <Settings className="size-4 text-primary" />
                        Platform Control Center
                      </CardTitle>
                      <CardDescription>Adjust commission levels and operational status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between border-b border-border/10 pb-4">
                        <div>
                          <label className="text-sm font-semibold text-white">Maintenance Mode</label>
                          <p className="text-xs text-muted-foreground">Blocks public access to the platform feed</p>
                        </div>
                        <input type="checkbox" checked={maintenanceMode}
                          onChange={(e) => {
                            const val = e.target.checked
                            setMaintenanceMode(val)
                            localStorage.setItem("system_maintenance_mode", String(val))
                            showToast(`Maintenance mode ${val ? "enabled" : "disabled"}`, "success")
                          }}
                          className="size-5 accent-primary cursor-pointer" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <label className="font-semibold text-white">Platform Commission Rate</label>
                          <span className="text-primary font-bold">{commissionRate}%</span>
                        </div>
                        <input type="range" min="0" max="30" value={commissionRate}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setCommissionRate(val)
                            localStorage.setItem("system_commission_rate", String(val))
                          }}
                          className="w-full accent-primary cursor-pointer" />
                        <p className="text-[10px] text-muted-foreground">Cut taken from confirmed booking checkouts</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Integrations settings */}
                  <Card className="border-border/60 bg-[#121214]/30">
                    <CardHeader>
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <Shield className="size-4 text-emerald-400" />
                        3rd Party Integrations Credentials
                      </CardTitle>
                      <CardDescription>Setup contract hashes and client gateway configurations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stripe Integration Gateway Mode</label>
                        <select value={stripeMode}
                          onChange={(e) => {
                            setStripeMode(e.target.value)
                            localStorage.setItem("system_stripe_mode", e.target.value)
                            showToast("Stripe environment updated", "success")
                          }}
                          className="w-full bg-card/60 border border-border/60 rounded-xl px-3 py-2 text-xs text-white">
                          <option value="test">Test Gateway (Simulated Payments)</option>
                          <option value="production">Production Environment</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Didit Smart Contract Hash</label>
                        <Input value={diditAddress}
                          onChange={(e) => {
                            setDiditAddress(e.target.value)
                            localStorage.setItem("system_didit_address", e.target.value)
                          }}
                          className="font-mono text-xs border-border/70 bg-card/40 text-white" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── DEVELOPER LOGS ─────────────────────────────────────────── */}
            {activeTab === "logs" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Terminal className="size-4 text-emerald-400" />
                      Dev Console & Error Monitoring
                    </h2>
                    <p className="text-xs text-muted-foreground">Real-time Sentry and Edge Function log simulator</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full border-border/60"
                    onClick={() => {
                      setLogs([])
                      showToast("Developer console logs cleared", "success")
                    }}>
                    Clear logs console
                  </Button>
                </div>

                <Card className="border-border/60 bg-black/80 font-mono">
                  <CardContent className="p-4 space-y-2.5 max-h-[420px] overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="text-xs flex items-start gap-2 border-b border-border/5 pb-2">
                        <span className="text-muted-foreground/60">[{log.time}]</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide ${
                          log.type === "error" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                          log.type === "warning" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                          "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}>{log.source}</span>
                        <span className={log.type === "error" ? "text-red-400 font-semibold" : "text-white/80"}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="py-12 text-center text-xs text-muted-foreground">Logs empty. Try triggering a Sentry warning.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Sentry error simulation */}
                <div className="flex gap-3">
                  <Button size="sm" variant="outline" className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => {
                      const newErr = {
                        id: Date.now(),
                        type: "error",
                        source: "Sentry",
                        message: "Error: Stripe Payment Intent transaction rejected. Code: 4002",
                        time: new Date().toLocaleTimeString()
                      }
                      setLogs(prev => [newErr, ...prev])
                      showToast("Test error dispatched to Sentry console simulation", "error")
                    }}>
                    Dispatch Mock Sentry Error
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => {
                      const newLog = {
                        id: Date.now(),
                        type: "info",
                        source: "Edge",
                        message: "Edge Function 'send-welcome-emails' successfully processed queues.",
                        time: new Date().toLocaleTimeString()
                      }
                      setLogs(prev => [newLog, ...prev])
                      showToast("Edge function mock log added", "success")
                    }}>
                    Trigger Edge Function Log
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject modal */}
      {rejectingId && (
        <RejectModal
          hostName={hosts.find((h) => h.id === rejectingId)?.full_name ?? ""}
          onConfirm={handleReject}
          onCancel={() => setRejectingId(null)}
          loading={rejectLoading}
        />
      )}

      {/* Reject Certified Guide Application Modal */}
      {rejectingGuideHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#16161A] border border-border/80 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Reject Certified Guide Application</h3>
              <button 
                onClick={() => { setRejectingGuideHost(null); setGuideRejectionReason(""); }}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <XCircle className="size-5" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">
                Reason for rejection (optional) — this will be sent to the host.
              </label>
              <textarea
                placeholder="e.g. TRA number not found, license expired..."
                value={guideRejectionReason}
                onChange={(e) => setGuideRejectionReason(e.target.value)}
                className="w-full text-sm rounded-xl bg-card border border-border/60 p-3 text-white focus:outline-none focus:border-primary/50 min-h-[100px] resize-y"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setRejectingGuideHost(null); setGuideRejectionReason(""); }}
                disabled={rejectGuideLoading}
                className="rounded-full px-5 text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={rejectGuideLoading}
                onClick={submitGuideRejection}
                className="rounded-full px-5 text-sm flex items-center gap-1.5"
              >
                {rejectGuideLoading && <Spinner className="size-3.5 animate-spin" />}
                Send Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 rounded-xl border px-5 py-3 shadow-2xl ${
          toast.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-destructive/30 bg-destructive/10 text-destructive"
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {toast.type === "success" ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
