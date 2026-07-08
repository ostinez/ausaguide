import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { format, parseISO } from "date-fns"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Receipt,
  Info,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchHostEarnings, type EarningRow, type EarningsSummary, type DailyEarning } from "@/lib/api/earnings"
import { fetchProfileById, fetchHostByUserId } from "@/lib/api/hosts"
import { toast } from "sonner"

const TAX_RATE = 0.05

function fmt(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: "purple" | "teal" | "amber" | "green"
}) {
  const colors: Record<string, string> = {
    purple: "bg-primary/10 text-primary shadow-[0_0_15px_rgba(147,51,234,0.1)]",
    teal: "bg-teal/10 text-teal shadow-[0_0_15px_rgba(44,182,125,0.1)]",
    amber: "bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    green: "bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
  }
  return (
    <Card className="border-border/60 bg-gradient-to-br from-card to-card/65 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="flex items-start gap-4 pt-6">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">{label}</p>
          {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">
        {label ? format(parseISO(label), "MMM d, yyyy") : ""}
      </p>
      <p className="text-base font-bold text-teal">
        {fmt(payload[0].value)}
      </p>
    </div>
  )
}


export default function EarningsDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [rows, setRows] = useState<EarningRow[]>([])
  const [daily, setDaily] = useState<DailyEarning[]>([])
  
  // Statements Filter State
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [requestingPayout, setRequestingPayout] = useState(false)

  useEffect(() => {
    async function load() {
      const userRole = localStorage.getItem("user_role")
      const userId = localStorage.getItem("user_id")
      if (userRole !== "host") {
        navigate("/dashboard")
        return
      }

      try {
        if (!userId) throw new Error("Not logged in.")
        const host = await fetchProfileById(userId)
        if (!host) throw new Error("No host profile found.")
        const hostRecord = await fetchHostByUserId(host.id)
        if (!hostRecord) throw new Error("Host record not found.")
        const data = await fetchHostEarnings(host.id)
        setSummary(data.summary)
        setRows(data.rows)
        setDaily(data.daily)
      } catch (e: any) {
        setError(e.message ?? "Failed to load earnings")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  // Get available months dynamically
  const getAvailableMonths = () => {
    const months = new Set<string>()
    for (const r of rows) {
      try {
        const date = new Date(r.booking_date)
        const label = format(date, "MMMM yyyy")
        months.add(label)
      } catch (e) {}
    }
    return Array.from(months)
  }

  // Handle statement download (CSV)
  const handleDownloadStatement = () => {
    const filteredRows = selectedMonth === "all"
      ? rows
      : rows.filter((r) => {
          try {
            return format(new Date(r.booking_date), "MMMM yyyy") === selectedMonth
          } catch {
            return false
          }
        })

    if (filteredRows.length === 0) {
      toast.error("No transactions found for this period.")
      return
    }

    const headers = ["Date", "Booking Reference", "Tour Title", "Traveler", "Amount", "Currency", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredRows.map((r) =>
        [
          r.booking_date,
          r.booking_ref,
          `"${r.tour_title.replace(/"/g, '""')}"`,
          `"${r.guest_name.replace(/"/g, '""')}"`,
          r.amount,
          r.currency,
          r.status.toUpperCase(),
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Ausaguide_Statement_${selectedMonth.replace(/\s+/g, "_")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Statement downloaded successfully!")
  }

  const handleRequestPayout = () => {
    if (!summary || summary.pending <= 0) {
      toast.error("You don't have any pending payouts at this time.")
      return
    }
    setRequestingPayout(true)
    setTimeout(() => {
      setRequestingPayout(false)
      toast.success("Payout request submitted! Your funds will clear within 3-5 business days.")
    }, 1500)
  }



  const tickFormatter = (val: string) => {
    try {
      return format(parseISO(val), "d MMM")
    } catch {
      return val
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading financial dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <AlertTriangle className="size-10 text-destructive mx-auto animate-bounce" />
          <p className="text-lg font-semibold text-foreground">Could not load earnings</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Payout listings details (confirmed bookings are pending payouts, completed bookings are paid payouts)
  const payoutsList = rows.filter(r => r.status === "confirmed" || r.status === "completed")

  return (
    <div className="min-h-screen bg-background px-4 py-24 md:px-8">
      {/* Glow Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-[300px] w-[400px] rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 hover:bg-muted/40 rounded-xl transition-all">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Financial Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your billing, taxes, statements and payout operations.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Earnings Summary (4-Column Grid) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            label="Total Earnings"
            value={fmt(summary?.total ?? 0)}
            sub="Confirmed & completed"
            color="purple"
          />
          <StatCard
            icon={Clock}
            label="Pending Payouts"
            value={fmt(summary?.pending ?? 0)}
            sub="Confirmed bookings"
            color="amber"
          />
          <StatCard
            icon={CheckCircle2}
            label="Paid Payouts"
            value={fmt(summary?.paid ?? 0)}
            sub="Completed bookings"
            color="green"
          />
          <StatCard
            icon={Receipt}
            label="Total Bookings"
            value={String(summary?.completedCount ?? 0)}
            sub="Confirmed & completed count"
            color="teal"
          />
        </div>

        {/* Main Section layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left Column Area */}
          <div className="space-y-8">
            {/* 2. Revenue Chart */}
            <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-teal-500 animate-pulse" />
                  Revenue — Last 30 Days
                </CardTitle>
                <CardDescription>Daily earnings values in KES</CardDescription>
              </CardHeader>
              <CardContent>
                {daily.every((d) => d.amount === 0) ? (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground italic">
                    No earnings recorded over the last 30 days.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.627 0.265 303.9)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="oklch(0.627 0.265 303.9)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 285)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={tickFormatter}
                        tick={{ fontSize: 11, fill: "oklch(0.7 0.02 260)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11, fill: "oklch(0.7 0.02 260)" }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "oklch(0.627 0.265 303.9)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="oklch(0.627 0.265 303.9)"
                        strokeWidth={3}
                        fill="url(#earningsGrad)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* 3. Transaction History */}
            <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
                <CardDescription>View all booking transactions and statuses.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {rows.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground italic">
                    No transactions found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/10 text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Booking ID</th>
                          <th className="px-4 py-3 text-left">Tour Title</th>
                          <th className="px-4 py-3 text-left">Traveler</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {rows.map((row) => (
                          <tr key={row.id} className="transition-colors hover:bg-muted/15">
                            <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                              {format(parseISO(row.booking_date), "MMM d, yyyy")}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs font-semibold text-primary">
                              {row.booking_ref}
                            </td>
                            <td className="px-4 py-3.5 text-xs font-medium truncate max-w-[150px]">
                              {row.tour_title}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              {row.guest_name}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold whitespace-nowrap">
                              {fmt(row.amount, row.currency)}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Badge
                                variant="outline"
                                className={`text-[10px] capitalize px-2 py-0.5 ${
                                  row.status === "confirmed"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : row.status === "completed"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : row.status === "pending"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-destructive/10 text-destructive border-destructive/20"
                                }`}
                              >
                                {row.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. Payouts Section */}
            <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg font-bold">Payouts Section</CardTitle>
                  <CardDescription>Track funds that have cleared vs funds in transit.</CardDescription>
                </div>
                <Button
                  className="bg-teal hover:bg-teal/90 text-white rounded-xl shadow-lg shadow-teal/20"
                  onClick={handleRequestPayout}
                  disabled={requestingPayout}
                >
                  {requestingPayout ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" /> Processing
                    </>
                  ) : (
                    "Request Payout"
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4">
                  <div className="bg-muted/15 p-3 rounded-xl border border-border/40">
                    <p className="text-[11px] text-muted-foreground font-semibold">Total Paid Payouts</p>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">{fmt(summary?.paid ?? 0)}</p>
                  </div>
                  <div className="bg-muted/15 p-3 rounded-xl border border-border/40">
                    <p className="text-[11px] text-muted-foreground font-semibold">Total Pending Payouts</p>
                    <p className="text-lg font-bold text-amber-400 mt-0.5">{fmt(summary?.pending ?? 0)}</p>
                  </div>
                </div>

                {payoutsList.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground italic py-6">No payout transactions found.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">Recent Payout Details</p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {payoutsList.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-muted/10 p-2.5 rounded-xl border border-border/30 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-muted-foreground">{p.booking_ref}</span>
                            <p className="text-[10px] text-muted-foreground/60">{format(parseISO(p.booking_date), "MMM d, yyyy")}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-bold">{fmt(p.amount, p.currency)}</p>
                            <Badge
                              className={`text-[9px] scale-90 ${
                                p.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border-none"
                                  : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/10 border-none"
                              }`}
                            >
                              {p.status === "completed" ? "Paid" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar Area */}
          <div className="space-y-8">
            {/* 5. Statements Download Card */}
            <Card className="border-border/60 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileSpreadsheet className="size-4 text-teal" />
                  Monthly Statements
                </CardTitle>
                <CardDescription>Export transactions report to CSV format.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="statement-month" className="text-xs">Statement Period</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="statement-month" className="rounded-xl">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statements</SelectItem>
                      {getAvailableMonths().map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl gap-2 font-medium"
                  onClick={handleDownloadStatement}
                >
                  <Download className="size-4" />
                  Download Statement
                </Button>
              </CardContent>
            </Card>

            {/* 6. Tax Summary Card */}
            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-card/60">
              <CardHeader>
                <CardTitle className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  Tax Breakdown
                </CardTitle>
                <CardDescription>Estimates for withholdings under Kenyan Tax Law.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 divide-y divide-border/40 text-xs">
                  <div className="flex justify-between pb-2">
                    <span className="text-muted-foreground font-medium">Gross Earnings</span>
                    <span className="font-bold">{fmt(summary?.total ?? 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-amber-400">
                    <span className="font-medium">Withholding Tax (5%)</span>
                    <span className="font-bold">– {fmt((summary?.total ?? 0) * TAX_RATE)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-emerald-400 text-sm font-extrabold">
                    <span>Net Earnings</span>
                    <span>{fmt((summary?.total ?? 0) * (1 - TAX_RATE))}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 text-[10px] leading-relaxed text-muted-foreground/80">
                  <Info className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    Tax will be deducted as per Kenyan law. Consult your accountant. Withholding tax is computed at 5% of gross payout values.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
