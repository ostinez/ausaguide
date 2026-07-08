import { supabase } from "@/lib/supabase"

export interface EarningRow {
  id: string
  booking_ref: string
  tour_title: string
  guest_name: string
  amount: number
  currency: string
  status: "confirmed" | "pending" | "completed" | "cancelled" | "declined"
  booking_date: string
  created_at: string
}

export interface EarningsSummary {
  total: number
  paid: number
  pending: number
  completedCount: number
}

export interface DailyEarning {
  date: string
  amount: number
}

export async function fetchHostEarnings(hostId: string): Promise<{
  summary: EarningsSummary
  rows: EarningRow[]
  daily: DailyEarning[]
}> {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_date,
      total_price,
      currency,
      status,
      guest_name,
      created_at,
      tour:tours(title)
    `)
    .eq("host_id", hostId)
    .order("booking_date", { ascending: false })

  if (error) throw error

  const rows: EarningRow[] = (data ?? []).map((b: any) => ({
    id: b.id,
    booking_ref: `BK-${b.id.slice(0, 8).toUpperCase()}`,
    tour_title: b.tour?.title ?? "Unknown Tour",
    guest_name: b.guest_name,
    amount: Number(b.total_price),
    currency: b.currency ?? "KES",
    status: b.status as any,
    booking_date: b.booking_date,
    created_at: b.created_at,
  }))

  const confirmedAndCompleted = rows.filter((r) => r.status === "confirmed" || r.status === "completed")
  const pendingPayouts = rows.filter((r) => r.status === "confirmed")
  const paidPayouts = rows.filter((r) => r.status === "completed")

  const summary: EarningsSummary = {
    total: confirmedAndCompleted.reduce((s, r) => s + r.amount, 0),
    paid: paidPayouts.reduce((s, r) => s + r.amount, 0),
    pending: pendingPayouts.reduce((s, r) => s + r.amount, 0),
    completedCount: confirmedAndCompleted.length,
  }

  // Build daily earnings for the last 30 days
  const now = new Date()
  const dayMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = 0
  }
  for (const r of confirmedAndCompleted) {
    const key = r.booking_date.slice(0, 10)
    if (key in dayMap) dayMap[key] += r.amount
  }
  const daily: DailyEarning[] = Object.entries(dayMap).map(([date, amount]) => ({
    date,
    amount,
  }))

  return { summary, rows, daily }
}
