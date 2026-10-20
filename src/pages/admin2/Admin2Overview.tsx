import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(1)}K`
  return `KSh ${n.toLocaleString()}`
}

function statusStyle(s: string) {
  switch (s) {
    case "confirmed": return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
    case "completed": return "bg-sky-500/15 text-sky-400 border border-sky-500/30"
    case "cancelled": return "bg-gray-500/15 text-gray-400 border border-gray-500/30"
    case "declined":  return "bg-red-500/15 text-red-400 border border-red-500/30"
    default:          return "bg-amber-500/15 text-amber-400 border border-amber-500/30"
  }
}

function statusIcon(s: string) {
  switch (s) {
    case "confirmed":
    case "completed": return <CheckCircle2 size={11} />
    case "cancelled":
    case "declined":  return <XCircle size={11} />
    default:          return <Clock size={11} />
  }
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 shadow-xl text-sm">
      <p className="text-gray-400 mb-2">{label}</p>
      <p className="text-white font-semibold">
        Gross: <span className="text-[#4DB6B5]">{fmt(payload[0]?.value ?? 0)}</span>
      </p>
      <p className="text-white font-semibold">
        Ausaguide (20%): <span className="text-[#F97316]">{fmt((payload[0]?.value ?? 0) * 0.2)}</span>
      </p>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function Admin2Overview() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<any[]>([])
  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, totalTours: 0 })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [usersRes, toursRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("tours").select("id", { count: "exact", head: true }),
        supabase
          .from("bookings")
          .select(`
            id, status, payment_status, total_price,
            host_payout_amount, host_paid, created_at, booking_date,
            profiles!bookings_guest_id_fkey(full_name),
            tours!inner(title, profiles!inner(full_name))
          `)
          .order("created_at", { ascending: false }),
      ])
      setBookings(bookingsRes.data ?? [])
      setPlatformStats({
        totalUsers: usersRes.count ?? 0,
        totalTours: toursRes.count ?? 0,
      })
    } catch (e) {
      console.error("Dashboard fetch error:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // ── derived financial metrics ──────────────────────────────────────────────
  const paidBookings = useMemo(
    () => bookings.filter((b) => b.payment_status === "paid"),
    [bookings]
  )
  const totalGross = useMemo(
    () => paidBookings.reduce((sum, b) => sum + (b.total_price ?? 0), 0),
    [paidBookings]
  )
  const ausaguideRevenue = totalGross * 0.2
  const pendingPayouts = useMemo(
    () =>
      bookings
        .filter((b) => b.host_paid === false && b.payment_status === "paid")
        .reduce((sum, b) => sum + (b.host_payout_amount ?? 0), 0),
    [bookings]
  )
  const completedCount = useMemo(
    () => bookings.filter((b) => b.status === "completed").length,
    [bookings]
  )

  // ── 7-day revenue chart ────────────────────────────────────────────────────
  const revenueChart = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      const label = d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric" })
      const dayStr = d.toISOString().slice(0, 10)
      const dayTotal = paidBookings
        .filter((b) => (b.created_at ?? "").startsWith(dayStr))
        .reduce((sum, b) => sum + (b.total_price ?? 0), 0)
      return { label, revenue: dayTotal }
    })
  }, [paidBookings])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Revenue Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time financial overview & transactions</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-white/10 text-white rounded-lg text-sm hover:border-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          <MetricCard
            title="Total Gross Revenue"
            value={fmt(totalGross)}
            subtext="All paid bookings"
            icon={<TrendingUp className="text-[#4DB6B5]" size={22} />}
            accent="teal"
          />
          <MetricCard
            title="Ausaguide Revenue"
            value={fmt(ausaguideRevenue)}
            subtext="20% platform cut"
            icon={<DollarSign className="text-[#F97316]" size={22} />}
            accent="orange"
          />
          <MetricCard
            title="Pending Host Payouts"
            value={fmt(pendingPayouts)}
            subtext="Awaiting disbursement"
            icon={<Wallet className="text-amber-400" size={22} />}
            accent="amber"
          />
          <MetricCard
            title="Completed Tours"
            value={completedCount.toString()}
            subtext={`of ${bookings.length} total bookings`}
            icon={<Calendar className="text-sky-400" size={22} />}
            accent="sky"
          />
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
          <TrendingUp size={18} className="text-[#4DB6B5]" />
          <h2 className="font-semibold text-white">Revenue — Last 7 Days</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="h-56 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChart} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : `${v}`)}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="revenue" fill="#4DB6B5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Platform Mini Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
          <MiniStat label="Total Users" value={platformStats.totalUsers} icon={<Users size={16} className="text-blue-400" />} />
          <MiniStat label="Total Tours" value={platformStats.totalTours} icon={<Calendar size={16} className="text-green-400" />} />
          <MiniStat label="Paid Bookings" value={paidBookings.length} icon={<CheckCircle2 size={16} className="text-emerald-400" />} />
          <MiniStat
            label="Pending Payouts"
            value={bookings.filter((b) => !b.host_paid && b.payment_status === "paid").length}
            icon={<AlertCircle size={16} className="text-amber-400" />}
          />
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
          <DollarSign size={18} className="text-[#F97316]" />
          <h2 className="font-semibold text-white">All Transactions</h2>
          <span className="ml-auto text-xs text-gray-500">{bookings.length} records</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 bg-black/30 uppercase border-b border-white/5">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Guest</th>
                  <th className="px-5 py-3 font-semibold">Tour</th>
                  <th className="px-5 py-3 font-semibold">Host</th>
                  <th className="px-5 py-3 font-semibold text-right">Amount</th>
                  <th className="px-5 py-3 font-semibold text-center">Payment</th>
                  <th className="px-5 py-3 font-semibold text-center">Host Paid?</th>
                  <th className="px-5 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                        {new Date(b.booking_date || b.created_at).toLocaleDateString("en-KE", {
                          day: "2-digit", month: "short", year: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-gray-200 font-medium whitespace-nowrap">
                        {b.profiles?.full_name || <span className="text-gray-500 italic">Unknown</span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-300 max-w-[180px] truncate" title={b.tours?.title}>
                        {b.tours?.title || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                        {b.tours?.profiles?.full_name || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white whitespace-nowrap">
                        {b.total_price ? `KSh ${b.total_price.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                          b.payment_status === "paid"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : b.payment_status === "failed"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                        )}>
                          {b.payment_status === "paid" ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          {b.payment_status || "pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {b.payment_status !== "paid" ? (
                          <span className="text-gray-600 text-xs">N/A</span>
                        ) : b.host_paid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={10} /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                          statusStyle(b.status)
                        )}>
                          {statusIcon(b.status)}
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

type Accent = "teal" | "orange" | "amber" | "sky"

const accentGlow: Record<Accent, string> = {
  teal:   "from-[#4DB6B5]/10 to-transparent",
  orange: "from-[#F97316]/10 to-transparent",
  amber:  "from-amber-400/10 to-transparent",
  sky:    "from-sky-400/10 to-transparent",
}

function MetricCard({
  title, value, subtext, icon, accent,
}: {
  title: string
  value: string
  subtext?: string
  icon: React.ReactNode
  accent: Accent
}) {
  return (
    <div className="relative bg-[#111111] border border-white/10 rounded-xl p-5 overflow-hidden group hover:border-white/20 transition-all duration-300">
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        accentGlow[accent]
      )} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs text-gray-400 font-medium leading-tight">{title}</p>
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">{icon}</div>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight leading-none">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
      </div>
    </div>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="p-1.5 bg-white/5 rounded-md">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-white leading-tight">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}
