import { useEffect, useState, useMemo, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { format, subWeeks, startOfWeek, endOfWeek, parseISO } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Wallet,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Headphones,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  RefreshCw,
  PhoneCall,
  Mail,
  ShieldCheck,
  Check,
  ChevronRight,
  Video,
  MapPin,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/Skeleton"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/lib/types"
import { toast } from "sonner"

// Brand Theme Constants
const BRAND_TEAL = "#0D6F73"
const BRAND_ORANGE = "#F97316"

interface WeeklyEarning {
  week_num: number
  week_label: string
  date_range?: string
  earnings: number
}

interface TourTypeSplit {
  name: string
  value: number
  color?: string
}

interface CompletedTransaction {
  id: string
  guest_name: string
  booking_date: string
  tour_title: string
  tour_type: "virtual" | "in_person" | string
  payout_amount: number
  currency: string
  host_paid: boolean
  status: string
}

function fmtKES(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString()}`
}

function getGreeting(name?: string): string {
  const hour = new Date().getHours()
  const title = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  return `${title}, ${name ? name.split(" ")[0] : "Host"}`
}

export default function HostEarningsDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hostProfile, setHostProfile] = useState<Profile | null>(null)

  // Metrics Data State
  const [totalEarnings, setTotalEarnings] = useState<number>(0)
  const [availableForPayout, setAvailableForPayout] = useState<number>(0)
  const [weeklyEarnings, setWeeklyEarnings] = useState<WeeklyEarning[]>([])
  const [tourTypeSplit, setTourTypeSplit] = useState<TourTypeSplit[]>([])
  const [recentTransactions, setRecentTransactions] = useState<CompletedTransaction[]>([])

  // Modal Dialogs
  const [statementOpen, setStatementOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUid = session?.user?.id || localStorage.getItem("user_id")

      if (!currentUid) {
        navigate("/auth")
        return
      }

      // 1. Fetch Host Profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, verification_status, is_verified, phone")
        .eq("id", currentUid)
        .maybeSingle()

      if (prof) {
        setHostProfile(prof as Profile)
      }

      // 2. Optimized Fetch: Attempt Supabase Server-Side RPC First
      let rpcSucceeded = false
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc("get_host_earnings_metrics", { p_host_id: currentUid })

        if (!rpcError && rpcData) {
          rpcSucceeded = true
          setTotalEarnings(Number(rpcData.total_earnings || 0))
          setAvailableForPayout(Number(rpcData.available_for_payout || 0))
          setWeeklyEarnings(rpcData.weekly_earnings || [])
          setTourTypeSplit(
            (rpcData.tour_type_split || []).filter((t: any) => t.value > 0)
          )
          setRecentTransactions(rpcData.recent_transactions || [])
        }
      } catch (err) {
        // Non-fatal: fallback to resilient direct query
        console.warn("Server RPC not available, using client-side resilient query:", err)
      }

      // 3. Resilient Fallback: Query bookings table directly if RPC was missing
      if (!rpcSucceeded) {
        const { data: bookingsData, error: bError } = await supabase
          .from("bookings")
          .select(`
            id,
            guest_name,
            booking_date,
            created_at,
            total_price,
            payment_amount,
            host_payout_amount,
            host_paid,
            currency,
            status,
            booking_type,
            tour:tours (
              id,
              title,
              tour_type
            )
          `)
          .eq("host_id", currentUid)
          .eq("status", "completed")
          .order("booking_date", { ascending: false })

        if (bError) throw bError

        const bookings = bookingsData || []

        // Total Earnings
        const total = bookings.reduce((sum, b: any) => {
          const amt = Number(b.host_payout_amount ?? b.payment_amount ?? b.total_price ?? 0)
          return sum + amt
        }, 0)
        setTotalEarnings(total)

        // Available for Payout (sum of host_payout_amount where host_paid is true)
        const payoutSum = bookings.reduce((sum, b: any) => {
          const isEligible = b.host_paid === true || b.status === "completed"
          if (isEligible) {
            const amt = Number(b.host_payout_amount ?? b.payment_amount ?? b.total_price ?? 0)
            return sum + amt
          }
          return sum
        }, 0)
        setAvailableForPayout(payoutSum)

        // 4-Week Rolling Bucket calculation
        const now = new Date()
        const weeksData: WeeklyEarning[] = []
        for (let i = 3; i >= 0; i--) {
          const wStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
          const wEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
          const weekLabel = `Week ${4 - i}`
          const dateRange = `${format(wStart, "MMM d")} - ${format(wEnd, "MMM d")}`

          const sumInWeek = bookings.reduce((sum, b: any) => {
            const bDate = new Date(b.booking_date || b.created_at)
            if (bDate >= wStart && bDate <= wEnd) {
              return sum + Number(b.host_payout_amount ?? b.payment_amount ?? b.total_price ?? 0)
            }
            return sum
          }, 0)

          weeksData.push({
            week_num: 4 - i,
            week_label: weekLabel,
            date_range: dateRange,
            earnings: sumInWeek,
          })
        }
        setWeeklyEarnings(weeksData)

        // Split between Virtual and Physical Tours
        let physicalSum = 0
        let virtualSum = 0
        bookings.forEach((b: any) => {
          const amt = Number(b.host_payout_amount ?? b.payment_amount ?? b.total_price ?? 0)
          const type = b.tour?.tour_type || b.booking_type || "in_person"
          if (type === "virtual") {
            virtualSum += amt
          } else {
            physicalSum += amt
          }
        })

        const split: TourTypeSplit[] = []
        if (physicalSum > 0) split.push({ name: "Physical Tours", value: physicalSum, color: BRAND_TEAL })
        if (virtualSum > 0) split.push({ name: "Virtual Tours", value: virtualSum, color: BRAND_ORANGE })
        setTourTypeSplit(split)

        // Last 10 completed bookings
        const txList: CompletedTransaction[] = bookings.slice(0, 10).map((b: any) => ({
          id: b.id,
          guest_name: b.guest_name || "Guest Traveler",
          booking_date: b.booking_date || b.created_at,
          tour_title: b.tour?.title || "Kenya Experience Tour",
          tour_type: b.tour?.tour_type || b.booking_type || "in_person",
          payout_amount: Number(b.host_payout_amount ?? b.payment_amount ?? b.total_price ?? 0),
          currency: b.currency || "KES",
          host_paid: Boolean(b.host_paid ?? true),
          status: b.status || "completed",
        }))
        setRecentTransactions(txList)
      }
    } catch (err: any) {
      console.error("Failed to load host earnings:", err)
      toast.error(err.message || "Failed to load host earnings")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    toast.success("Earnings refreshed")
  }

  // Export Statement CSV
  const handleExportCSV = () => {
    if (recentTransactions.length === 0) {
      toast.info("No transaction history available to export.")
      return
    }

    const headers = ["Booking ID", "Guest Name", "Date", "Tour Experience", "Type", "Payout Amount (KES)", "M-Pesa Payout Status"]
    const rows = recentTransactions.map((tx) => [
      `"${tx.id}"`,
      `"${tx.guest_name}"`,
      `"${format(parseISO(tx.booking_date), "yyyy-MM-dd")}"`,
      `"${tx.tour_title}"`,
      `"${tx.tour_type}"`,
      tx.payout_amount,
      `"${tx.host_paid ? "Paid out to M-Pesa" : "Pending Settlement"}"`,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Ausaguide_Earnings_Statement_${format(new Date(), "yyyy_MM_dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Statement CSV downloaded successfully")
    setStatementOpen(false)
  }

  // Fallback pie data if no completed tours yet
  const chartPieData = useMemo(() => {
    if (tourTypeSplit.length > 0) return tourTypeSplit
    return [
      { name: "Physical Tours", value: 1, color: BRAND_TEAL },
      { name: "Virtual Tours", value: 1, color: BRAND_ORANGE },
    ]
  }, [tourTypeSplit])

  return (
    <div className="min-h-screen bg-background pb-20 pt-20 sm:pt-24 animate-in fade-in duration-300">
      {/* Background Ambience Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[550px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-[350px] w-[350px] rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 space-y-8">
        {/* Top Navigation & Host Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-card text-foreground hover:bg-muted shadow-sm transition-all active:scale-95"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="size-5" />
            </button>

            {loading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  {getGreeting(hostProfile?.full_name)}
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="size-3 text-amber-500" />
                  Host Earnings & Payout Analytics
                </p>
              </div>
            )}
          </div>

          {/* Right Header Avatar & Refresh */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="h-10 rounded-2xl border-border/80 bg-card hover:bg-muted text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            {!loading && hostProfile && (
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-1.5 pl-3 shadow-sm">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-tight text-foreground">{hostProfile.full_name}</p>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">Active Host</p>
                </div>
                <Avatar className="size-8 rounded-xl border border-border">
                  <AvatarImage src={hostProfile.avatar_url || ""} alt={hostProfile.full_name} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {hostProfile.full_name?.slice(0, 2).toUpperCase() || "HO"}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>

        {/* ── Prominent Balance Card (Fintech Gradient) ── */}
        {loading ? (
          <Skeleton className="h-56 w-full rounded-3xl" />
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-zinc-950 p-6 sm:p-8 text-white shadow-xl border border-teal-500/30">
            {/* Subtle decorative circles */}
            <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-teal-500/10 blur-2xl" />
            <div className="pointer-events-none absolute right-24 -bottom-20 size-48 rounded-full bg-orange-500/10 blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Left Balance Metric */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/20">
                    <Wallet className="size-5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-200/80">
                    Total Lifetime Earnings
                  </span>
                </div>

                <div>
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                    {fmtKES(totalEarnings)}
                  </h2>
                  <p className="text-xs text-teal-200/70 mt-1">
                    Gross revenue from all completed Kenyan experiences
                  </p>
                </div>
              </div>

              {/* Right Available for Payout Box */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 md:min-w-[280px] backdrop-blur-md space-y-2">
                <span className="text-xs font-medium text-teal-200/80 uppercase tracking-wider">
                  Available for Payout
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {fmtKES(availableForPayout)}
                </div>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-teal-100/70 border-t border-white/10">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>M-Pesa Direct Settlement Active</span>
                </div>
              </div>
            </div>

            {/* Bottom Status Row */}
            <div className="relative z-10 mt-6 pt-4 border-t border-teal-800/40 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-200/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-teal-400" />
                <span>Ausaguide Automated Host Guarantee</span>
              </div>
              <span className="text-[11px] text-teal-300/70">
                Settlements dispatched automatically every Friday
              </span>
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => setStatementOpen(true)}
            variant="outline"
            className="h-14 rounded-2xl border-border/80 bg-card hover:bg-accent/60 font-bold text-sm shadow-sm flex items-center justify-between px-5 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <FileSpreadsheet className="size-5" />
              </div>
              <div className="text-left">
                <div className="text-foreground">View Statement</div>
                <div className="text-[11px] font-normal text-muted-foreground">Download transactions report</div>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Button>

          <Button
            onClick={() => setSupportOpen(true)}
            variant="outline"
            className="h-14 rounded-2xl border-border/80 bg-card hover:bg-accent/60 font-bold text-sm shadow-sm flex items-center justify-between px-5 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Headphones className="size-5" />
              </div>
              <div className="text-left">
                <div className="text-foreground">Contact Support</div>
                <div className="text-[11px] font-normal text-muted-foreground">Payout disputes & billing queries</div>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Button>
        </div>

        {/* ── Charts Grid (Recharts) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart: Last 4 Weeks (2 Columns) */}
          <Card className="rounded-3xl border border-border/70 shadow-modern lg:col-span-2 overflow-hidden bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <TrendingUp className="size-4 text-teal-600 dark:text-teal-400" />
                    Earnings Trend (Last 4 Weeks)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Weekly completed bookings performance
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs rounded-full px-2.5 py-0.5 border-teal-500/40 text-teal-600 dark:text-teal-400">
                  Weekly
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
              ) : weeklyEarnings.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                  <Calendar className="size-8 opacity-40" />
                  <span>No completed bookings over the last 4 weeks.</span>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyEarnings} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <XAxis
                        dataKey="week_label"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val > 0 ? (val / 1000).toFixed(0) + "k" : "0"}`}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "rgba(13, 111, 115, 0.08)" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const item = payload[0].payload as WeeklyEarning
                          return (
                            <div className="rounded-2xl border border-border bg-card p-3 shadow-xl text-xs space-y-1">
                              <p className="font-bold text-foreground">{item.week_label}</p>
                              {item.date_range && (
                                <p className="text-[11px] text-muted-foreground">{item.date_range}</p>
                              )}
                              <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                                {fmtKES(item.earnings)}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar
                        dataKey="earnings"
                        fill={BRAND_TEAL}
                        radius={[8, 8, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart: Virtual vs Physical Split (1 Column) */}
          <Card className="rounded-3xl border border-border/70 shadow-modern overflow-hidden bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-foreground">
                Revenue by Tour Type
              </CardTitle>
              <CardDescription className="text-xs">
                Split between Virtual & Physical Experiences
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
              ) : tourTypeSplit.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2 text-center px-4">
                  <div className="size-12 rounded-2xl bg-muted/40 flex items-center justify-center">
                    <PieChart className="size-6 text-muted-foreground/40" />
                  </div>
                  <span>Tour type split will appear once completed bookings are recorded.</span>
                </div>
              ) : (
                <div className="h-64 w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={chartPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.name === "Virtual Tours" ? BRAND_ORANGE : BRAND_TEAL}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const entry = payload[0].payload
                          return (
                            <div className="rounded-xl border border-border bg-card p-2.5 shadow-lg text-xs space-y-0.5">
                              <p className="font-bold text-foreground">{entry.name}</p>
                              <p className="text-sm font-black text-primary">{fmtKES(entry.value)}</p>
                            </div>
                          )
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Clean custom legend */}
                  <div className="w-full grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-[#0D6F73] shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-foreground">Physical</span>
                        <p className="text-[11px] text-muted-foreground">
                          {fmtKES(tourTypeSplit.find((s) => s.name === "Physical Tours")?.value || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-[#F97316] shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-foreground">Virtual</span>
                        <p className="text-[11px] text-muted-foreground">
                          {fmtKES(tourTypeSplit.find((s) => s.name === "Virtual Tours")?.value || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Transactions List (Last 10 Completed Bookings) ── */}
        <Card className="rounded-3xl border border-border/70 shadow-modern overflow-hidden bg-card">
          <CardHeader className="py-5 px-6 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Recent Completed Payouts</CardTitle>
                <CardDescription className="text-xs">
                  Last 10 completed bookings settled or scheduled to M-Pesa
                </CardDescription>
              </div>
              <Badge variant="outline" className="rounded-full text-xs font-semibold">
                {recentTransactions.length} {recentTransactions.length === 1 ? "booking" : "bookings"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
                <p>No completed tour transactions found yet.</p>
                <p className="text-xs text-muted-foreground/70">
                  When guests complete tours with you, earnings appear here immediately.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 max-h-[460px] overflow-y-auto">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 sm:px-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    {/* Left: Guest & Tour details */}
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                        {tx.guest_name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-foreground truncate">{tx.guest_name}</h4>
                          <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-full capitalize">
                            {tx.tour_type === "virtual" ? (
                              <span className="flex items-center gap-1 text-orange-500">
                                <Video className="size-2.5" /> Virtual
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-teal-600">
                                <MapPin className="size-2.5" /> Physical
                              </span>
                            )}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{tx.tour_title}</p>
                        <p className="text-[11px] text-muted-foreground/70">
                          {format(parseISO(tx.booking_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    {/* Right: Payout Amount & M-Pesa status */}
                    <div className="text-left sm:text-right space-y-1 sm:self-center pl-13 sm:pl-0">
                      <div className="text-base font-extrabold text-emerald-500 dark:text-emerald-400">
                        + {fmtKES(tx.payout_amount)}
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3" />
                        <span>Paid out to M-Pesa</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Dialog: View Statement ── */}
      <Dialog open={statementOpen} onOpenChange={setStatementOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-teal-600" />
              Download Host Statement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate an official accounting statement in CSV format for tax filings and record-keeping.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="rounded-2xl border border-border/70 p-4 bg-muted/20 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Host:</span>
                <span className="font-bold text-foreground">{hostProfile?.full_name || "Host"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-bold text-foreground">Kenyan Shillings (KES)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions:</span>
                <span className="font-bold text-foreground">{recentTransactions.length} records</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Total Settled:</span>
                <span className="font-black text-emerald-500">{fmtKES(totalEarnings)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setStatementOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleExportCSV}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold gap-2"
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Contact Support ── */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Headphones className="size-5 text-orange-500" />
              Host Support & Payout Help
            </DialogTitle>
            <DialogDescription className="text-xs">
              Need assistance with M-Pesa disbursements, custom rates, or accounting queries?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-2xl border border-border p-4 bg-muted/15 space-y-3">
              <a
                href="mailto:support@ausaguide.com?subject=Host%20Payout%20Inquiry"
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="size-4 text-primary" />
                  <span className="font-semibold text-foreground">Email Support Team</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>

              <a
                href="tel:+254700000000"
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="size-4 text-emerald-500" />
                  <span className="font-semibold text-foreground">Call Host Line (+254)</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>

              <Link
                to="/help"
                onClick={() => setSupportOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 text-teal-600" />
                  <span className="font-semibold text-foreground">Help Center & FAQs</span>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSupportOpen(false)} className="rounded-xl text-xs w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
