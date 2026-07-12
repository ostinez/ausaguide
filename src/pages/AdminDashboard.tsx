import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { format, parseISO, subDays } from "date-fns"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts"
import {
  Shield, Users, Calendar, DollarSign, Search, ArrowLeft,
  XCircle, CheckCircle2, BadgeAlert, TrendingUp, MapPin,
  Eye, Trash2, Ban, UserCheck, Download, RefreshCw,
  Star, ClipboardList,
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
import { sendTourApprovalEmail } from "@/lib/api/emails"

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
    <Card className="border-border/60 bg-gradient-to-br from-card to-card/60 transition-all hover:shadow-lg hover:shadow-primary/5">
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
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "tours" | "bookings" | "analytics" | "waitlist">("overview")

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "overview" || tab === "users" || tab === "tours" || tab === "bookings" || tab === "analytics" || tab === "waitlist") {
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

  // UI
  const [search, setSearch] = useState("")
  const adminId = localStorage.getItem("user_id")
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "traveler" | "host" | "admin">("all")
  const [hostFilter, setHostFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [bookingFilter, setBookingFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

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
          .single()

        if (profileErr || profile?.role !== "admin") {
          navigate("/dashboard")
          return
        }

        setIsAdmin(true)
        load()
      } catch (err) {
        console.error("Auth check failed:", err)
        navigate("/dashboard")
      }
    }
    checkAdminAuth()
  }, [])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type })

  async function load() {
    setLoading(true)
    try {
      const [profRes, hostRes, tourRes, bkRes, waitlistRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("hosts").select("*").order("created_at", { ascending: false }),
        supabase.from("tours").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").order("booking_date", { ascending: false }),
        supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
      ])
      if (profRes.error) throw profRes.error
      if (hostRes.error) throw hostRes.error
      if (tourRes.error) throw tourRes.error
      if (bkRes.error) throw bkRes.error
      if (waitlistRes.error) throw waitlistRes.error

      const profs: Profile[] = profRes.data ?? []
      const hostApps: HostRecord[] = hostRes.data ?? []
      const rawTours: any[] = tourRes.data ?? []
      const rawBks: any[] = bkRes.data ?? []
      const rawWaitlists: any[] = waitlistRes.data ?? []

      // Stitch host names onto tours and bookings
      const stitchedTours: TourRow[] = rawTours.map((t) => {
        const hostProf = profs.find((p) => p.id === t.host_id)
        const bkCount = rawBks.filter((b) => b.tour_id === t.id).length
        return { ...t, host_name: hostProf?.full_name ?? "Unknown Host", booking_count: bkCount }
      })

      const stitchedBks: BookingRow[] = rawBks.map((b) => {
        const tour = rawTours.find((t) => t.id === b.tour_id)
        const hostProf = profs.find((p) => p.id === b.host_id)
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
          const key = b.booking_date.slice(0, 10)
          if (key in dayMap) dayMap[key] += Number(b.total_price)
        }
      }
      const daily = Object.entries(dayMap).map(([date, amount]) => ({ date, amount }))

      setProfiles(profs)
      setHosts(hostApps)
      setTours(stitchedTours)
      setBookings(stitchedBks)
      setDailyRevenue(daily)
      setWaitlists(rawWaitlists)
      setError(null)
    } catch (e: any) {
      setError(e.message ?? "Failed to load admin data")
    } finally {
      setCheckingAuth(false)
      setLoading(false)
    }
  }

  // ── Computed stats ──────────────────────────────────────────────────────────
  const totalRevenue = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((s, b) => s + Number(b.total_price), 0)
  const pendingHostsCount = hosts.filter((h) => h.status === "pending").length
  const topTours = [...tours]
    .sort((a, b) => (b.booking_count ?? 0) - (a.booking_count ?? 0))
    .slice(0, 5)
  const CHART_COLORS = [
    "oklch(0.541 0.217 292)", "oklch(0.696 0.17 162)", "oklch(0.828 0.189 84.429)",
    "oklch(0.627 0.265 303.9)", "oklch(0.645 0.246 16.439)",
  ]

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
  const q = search.toLowerCase()
  const filteredUsers = profiles
    .filter((p) => userRoleFilter === "all" || p.role === userRoleFilter)
    .filter((p) => !q || p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))

  const filteredHosts = hosts
    .filter((h) => hostFilter === "all" || h.status === hostFilter)
    .filter((h) => !q || h.full_name.toLowerCase().includes(q) || h.email.toLowerCase().includes(q))

  const filteredTours = tours
    .filter((t) => !q || t.title.toLowerCase().includes(q) || (t.host_name ?? "").toLowerCase().includes(q))

  const filteredBookings = bookings
    .filter((b) => bookingFilter === "all" || b.status === bookingFilter)
    .filter((b) => !q || b.guest_name.toLowerCase().includes(q) || (b.tour_title ?? "").toLowerCase().includes(q))

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        </div>
        <Card className="relative z-10 w-full max-w-md border-border/60">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <Shield className="size-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold">Access Denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This console is restricted to admin users only. Use the admin login flow with your credentials.
            </p>
            <div className="mt-6 flex flex-col gap-2 w-full">
              <Button onClick={() => { localStorage.setItem("user_role", "admin"); setIsAdmin(true); load() }}
                className="w-full rounded-full bg-primary">
                Simulate Admin Login
              </Button>
              <Link to="/auth" className="w-full">
                <Button variant="outline" className="w-full rounded-full">Go to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main Layout
  // ─────────────────────────────────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="size-8 text-primary animate-spin" />
      </div>
    )
  }

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
              <h1 className="text-2xl font-bold tracking-tight">Ausaguide Admin</h1>
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
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="overview" className="text-xs py-2.5">Overview</TabsTrigger>
            <TabsTrigger value="users" className="text-xs py-2.5">Users</TabsTrigger>
            <TabsTrigger value="tours" className="text-xs py-2.5">Tours</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs py-2.5">Bookings</TabsTrigger>
            <TabsTrigger value="waitlist" className="text-xs py-2.5">Waitlist</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs py-2.5">Analytics</TabsTrigger>
          </TabsList>
        </Tabs>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-24"><Spinner className="size-8 text-primary" /></div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                  <StatCard label="Total Revenue" value={fmt(totalRevenue)} icon={DollarSign}
                    color="oklch(0.541 0.217 292)" sub="Confirmed + Completed" />
                  <StatCard label="Total Bookings" value={bookings.length} icon={Calendar}
                    color="oklch(0.696 0.17 162)" sub="All time" />
                  <StatCard label="Platform Users" value={profiles.length} icon={Users}
                    color="oklch(0.828 0.189 84.429)" sub="All roles" />
                  <StatCard label="Active Hosts" value={profiles.filter(p => p.role === "host").length} icon={UserCheck}
                    color="oklch(0.627 0.265 303.9)" sub="Approved guides" />
                  <StatCard label="Total Tours" value={tours.length} icon={MapPin}
                    color="oklch(0.696 0.17 162)" sub="All listings" />
                  <StatCard label="Waitlist" value={waitlists.length} icon={ClipboardList}
                    color="oklch(0.645 0.246 16.439)" sub="Launch signups" />
                </div>

                {/* Revenue chart */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="size-2 rounded-full bg-primary inline-block" />
                      Revenue — Last 30 Days
                    </CardTitle>
                    <CardDescription>Daily income from confirmed bookings</CardDescription>
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

                {/* Pending host approvals */}
                {pendingHostsCount > 0 && (
                  <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-400 text-base">
                        <BadgeAlert className="size-4" />
                        {pendingHostsCount} Pending Host Application{pendingHostsCount !== 1 ? "s" : ""}
                      </CardTitle>
                      <CardDescription>These applications need your review</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" variant="outline"
                        onClick={() => setActiveTab("users")}
                        className="rounded-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                        Review Applications →
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Signups and Waitlist side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Signups */}
                  <Card className="border-border/60 bg-gradient-to-br from-card to-card/40">
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
                        <div className="py-8 text-center text-xs text-muted-foreground">No users registered yet.</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Waitlist */}
                  <Card className="border-border/60 bg-gradient-to-br from-card to-card/40">
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
                        <div className="py-8 text-center text-xs text-muted-foreground">No waitlist entries yet.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── USERS ───────────────────────────────────────────────────── */}
            {activeTab === "users" && (
              <div className="space-y-6">
                {/* Sub-tabs for profiles vs host applications */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {(["all", "traveler", "host", "admin"] as const).map((r) => (
                      <button key={r} onClick={() => setUserRoleFilter(r)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                          userRoleFilter === r
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "border-border/50 text-muted-foreground hover:bg-muted/30"
                        }`}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                        {r !== "all" && ` (${profiles.filter((p) => p.role === r).length})`}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full border-border/60"
                    onClick={() => downloadCSV(filteredUsers.map((p) => ({
                      name: p.full_name, email: p.email, role: p.role, joined: p.created_at,
                    })), "users-export.csv")}>
                    <Download className="size-3.5 mr-1.5" />Export CSV
                  </Button>
                </div>

                {/* Profiles table */}
                <Card className="border-border/60">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            {["User", "Email", "Role", "Joined", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {filteredUsers.map((p) => (
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
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {p.created_at ? format(new Date(p.created_at), "MMM d, yyyy") : "—"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {(p as any).is_suspended ? (
                                    <Button size="icon" variant="ghost"
                                      className="size-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400"
                                      title="Activate user"
                                      onClick={() => handleUserUpdate(p.id, { is_suspended: false }, "User activated")}>
                                      <UserCheck className="size-3.5" />
                                    </Button>
                                  ) : (
                                    <Button size="icon" variant="ghost"
                                      className="size-7 rounded-lg hover:bg-amber-500/10 hover:text-amber-400"
                                      title="Suspend user"
                                      onClick={() => handleUserUpdate(p.id, { is_suspended: true }, "User suspended")}>
                                      <Ban className="size-3.5" />
                                    </Button>
                                  )}
                                  {p.id !== adminId && (
                                    <Button size="icon" variant="ghost"
                                      className="size-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                      title="Delete user"
                                      onClick={() => handleDeleteUser(p.id)}>
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredUsers.length === 0 && (
                      <div className="py-12 text-center text-sm text-muted-foreground">No users found.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Host applications section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <BadgeAlert className="size-4 text-amber-400" />
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
                  {filteredHosts.length === 0 ? (
                    <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                      No applications in this filter.
                    </CardContent></Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredHosts.map((h) => (
                        <Card key={h.id} className="border-border/60 hover:border-border/80 transition-colors">
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <Avatar className="size-9 shrink-0">
                                  <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                                    {getInitials(h.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-foreground">{h.full_name}</span>
                                    <Badge variant={h.status === "approved" ? "default" : h.status === "rejected" ? "destructive" : "secondary"}
                                      className="text-[10px]">{h.status}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{h.email} · {h.city}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                                    {h.host_type === "certified_guide" ? "Certified Guide" : "Local Host"} · Applied {format(new Date(h.created_at), "MMM d, yyyy")}
                                  </p>
                                </div>
                              </div>
                              {h.status === "pending" && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button size="sm" variant="outline" onClick={() => setRejectingId(h.id)}
                                    className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 text-xs">
                                    Reject
                                  </Button>
                                  <Button size="sm" onClick={() => handleApprove(h.id)}
                                    className="rounded-full bg-teal text-white hover:bg-teal/90 text-xs">
                                    Approve
                                  </Button>
                                </div>
                              )}
                            </div>
                            {h.status === "rejected" && h.rejection_reason && (
                              <div className="mt-3 rounded-lg bg-destructive/5 border border-destructive/20 p-2.5 text-xs text-destructive">
                                <strong>Rejection: </strong>{h.rejection_reason}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TOURS ───────────────────────────────────────────────────── */}
            {activeTab === "tours" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{filteredTours.length} tours total</p>
                  <Button size="sm" variant="outline" className="rounded-full border-border/60"
                    onClick={() => downloadCSV(filteredTours.map((t) => ({
                      title: t.title, host: t.host_name, price: t.price,
                      currency: t.currency, published: t.is_published, bookings: t.booking_count,
                    })), "tours-export.csv")}>
                    <Download className="size-3.5 mr-1.5" />Export CSV
                  </Button>
                </div>
                <Card className="border-border/60">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            {["Tour", "Host", "Price", "Bookings", "Rating", "Status", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {filteredTours.map((t) => (
                            <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                    <MapPin className="size-3.5 text-primary" />
                                  </div>
                                  <span className="text-xs font-medium text-foreground max-w-[160px] truncate">{t.title}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{t.host_name}</td>
                              <td className="px-4 py-3 text-xs font-semibold text-foreground whitespace-nowrap">
                                {t.currency ?? "KES"} {Number(t.price).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{t.booking_count ?? 0}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-xs text-amber-400">
                                  <Star className="size-3 fill-current" />
                                  {Number(t.rating).toFixed(1)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={t.is_published ? "default" : "secondary"} className="text-[10px]">
                                  {t.is_published ? "Published" : "Draft"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Button size="icon" variant="ghost" className="size-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                                    title={t.is_published ? "Hide tour" : "Publish tour"}
                                    onClick={() => handleTourUpdate(t.id, { is_published: !t.is_published },
                                      t.is_published ? "Tour hidden" : "Tour published")}>
                                    <Eye className="size-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="size-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                    title="Delete tour" onClick={() => handleDeleteTour(t.id)}>
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredTours.length === 0 && (
                      <div className="py-12 text-center text-sm text-muted-foreground">No tours found.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── BOOKINGS ─────────────────────────────────────────────────── */}
            {activeTab === "bookings" && (
              <div className="space-y-4">
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
                    onClick={() => downloadCSV(filteredBookings.map((b) => ({
                      id: b.id, guest: b.guest_name, email: b.guest_email,
                      tour: b.tour_title, host: b.host_name, date: b.booking_date,
                      status: b.status, amount: b.total_price,
                    })), "bookings-export.csv")}>
                    <Download className="size-3.5 mr-1.5" />Export CSV
                  </Button>
                </div>
                <Card className="border-border/60">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            {["Ref", "Date", "Traveller", "Tour", "Host", "Amount", "Status", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {filteredBookings.map((b) => (
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
                                        await supabase.from("bookings").update({ status: "cancelled" }).eq("id", b.id)
                                        setBookings((prev) => prev.map((bk) => bk.id === b.id ? { ...bk, status: "cancelled" } : bk))
                                        showToast("Booking cancelled", "success")
                                      }}>
                                      <XCircle className="size-3.5" />
                                    </Button>
                                  )}
                                  <Button size="icon" variant="ghost" title="Refund (placeholder)"
                                    className="size-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                                    onClick={() => showToast("Refund initiated (placeholder)", "success")}>
                                    <RefreshCw className="size-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredBookings.length === 0 && (
                      <div className="py-12 text-center text-sm text-muted-foreground">No bookings found.</div>
                    )}
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
                      <div className="py-12 text-center text-sm text-muted-foreground">No waitlist signups found.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── ANALYTICS ───────────────────────────────────────────────── */}
            {activeTab === "analytics" && (
              <div className="space-y-8">
                {/* Summary row */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard label="Gross Revenue" value={fmt(totalRevenue)} icon={TrendingUp} color="oklch(0.541 0.217 292)" />
                  <StatCard label="Total Bookings" value={bookings.length} icon={Calendar} color="oklch(0.696 0.17 162)" />
                  <StatCard label="Total Tours" value={tours.length} icon={MapPin} color="oklch(0.828 0.189 84.429)" />
                  <StatCard label="Platform Users" value={profiles.length} icon={Users} color="oklch(0.645 0.246 16.439)" />
                </div>

                {/* 30-day revenue chart */}
                <Card className="border-border/60">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span className="size-2 rounded-full bg-primary inline-block" />
                          Revenue — Last 30 Days
                        </CardTitle>
                        <CardDescription>Daily income from paid bookings</CardDescription>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-full border-border/60"
                        onClick={() => downloadCSV(dailyRevenue, "revenue-30d.csv")}>
                        <Download className="size-3.5 mr-1.5" />Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="analGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.696 0.17 162)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.696 0.17 162)" stopOpacity={0} />
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
                          cursor={{ stroke: "oklch(0.696 0.17 162)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                        <Area type="monotone" dataKey="amount" stroke="oklch(0.696 0.17 162)"
                          strokeWidth={2.5} fill="url(#analGrad)" dot={false}
                          activeDot={{ r: 5, fill: "oklch(0.696 0.17 162)", stroke: "#fff", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top tours by bookings */}
                <Card className="border-border/60">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Top Tours by Bookings</CardTitle>
                        <CardDescription>Most booked experiences on the platform</CardDescription>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-full border-border/60"
                        onClick={() => downloadCSV(topTours.map((t) => ({
                          title: t.title, host: t.host_name, bookings: t.booking_count,
                          rating: t.rating, price: t.price,
                        })), "top-tours.csv")}>
                        <Download className="size-3.5 mr-1.5" />Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {topTours.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No tour data yet.</p>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={topTours} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 285)" vertical={false} />
                            <XAxis dataKey="title" tick={{ fontSize: 9, fill: "oklch(0.7 0.02 260)" }}
                              axisLine={false} tickLine={false}
                              tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                              angle={-20} textAnchor="end" />
                            <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.02 260)" }} axisLine={false} tickLine={false} width={28} />
                            <Tooltip contentStyle={{ background: "oklch(0.195 0.005 285)", border: "1px solid oklch(0.3 0.01 285)", borderRadius: "8px", fontSize: "11px" }} />
                            <Bar dataKey="booking_count" radius={[4, 4, 0, 0]}>
                              {topTours.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                          {topTours.map((t, i) => (
                            <div key={t.id} className="flex items-center gap-3">
                              <div className="flex size-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
                                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}>
                                {i + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-foreground truncate">{t.title}</p>
                                <p className="text-[10px] text-muted-foreground">{t.host_name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-foreground">{t.booking_count ?? 0}</p>
                                <p className="text-[10px] text-muted-foreground">bookings</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Booking status distribution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Card className="border-border/60">
                    <CardHeader>
                      <CardTitle className="text-base">Booking Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(["confirmed", "completed", "pending", "cancelled"] as const).map((s) => {
                        const count = bookings.filter((b) => b.status === s).length
                        const pct = bookings.length ? Math.round((count / bookings.length) * 100) : 0
                        const colors: Record<string, string> = {
                          confirmed: "oklch(0.696 0.17 162)", completed: "oklch(0.541 0.217 292)",
                          pending: "oklch(0.828 0.189 84.429)", cancelled: "oklch(0.645 0.246 16.439)",
                        }
                        return (
                          <div key={s}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="capitalize text-foreground">{s}</span>
                              <span className="text-muted-foreground">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted/40">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[s] }} />
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardHeader>
                      <CardTitle className="text-base">User Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(["traveler", "host", "admin"] as const).map((r) => {
                        const count = profiles.filter((p) => p.role === r).length
                        const pct = profiles.length ? Math.round((count / profiles.length) * 100) : 0
                        const colors: Record<string, string> = {
                          traveler: "oklch(0.541 0.217 292)", host: "oklch(0.696 0.17 162)", admin: "oklch(0.645 0.246 16.439)",
                        }
                        return (
                          <div key={r}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="capitalize text-foreground">{r}s</span>
                              <span className="text-muted-foreground">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted/40">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[r] }} />
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Full CSV export row */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button variant="outline" className="rounded-full border-border/60"
                    onClick={() => downloadCSV(bookings.map((b) => ({
                      id: b.id, guest: b.guest_name, email: b.guest_email, tour: b.tour_title,
                      host: b.host_name, date: b.booking_date, status: b.status, amount: b.total_price,
                    })), "all-bookings.csv")}>
                    <Download className="size-3.5 mr-1.5" />All Bookings CSV
                  </Button>
                  <Button variant="outline" className="rounded-full border-border/60"
                    onClick={() => downloadCSV(profiles.map((p) => ({
                      name: p.full_name, email: p.email, role: p.role, joined: p.created_at,
                    })), "all-users.csv")}>
                    <Download className="size-3.5 mr-1.5" />All Users CSV
                  </Button>
                  <Button variant="outline" className="rounded-full border-border/60"
                    onClick={() => downloadCSV(tours.map((t) => ({
                      title: t.title, host: t.host_name, price: t.price, bookings: t.booking_count, rating: t.rating,
                    })), "all-tours.csv")}>
                    <Download className="size-3.5 mr-1.5" />All Tours CSV
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
