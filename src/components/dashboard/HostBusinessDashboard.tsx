import { useState, useMemo, useEffect } from "react"
import { format, isBefore, startOfDay, parseISO } from "date-fns"
import {
  DollarSign,
  Calendar as CalendarIcon,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  XCircle,
  Search,
  User,
  TrendingUp,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import type { Booking, Profile } from "@/lib/types"
import { HostCancellationApologyModal } from "./HostCancellationApologyModal"
import { getTrustScoreTier } from "@/lib/algorithms/trustScore"

interface HostBusinessDashboardProps {
  hostProfile: Profile | null
  bookings: Booking[]
  onChat?: (booking: Booking) => void
  onRefresh: () => void
}

export function HostBusinessDashboard({
  hostProfile,
  bookings,
  onChat,
  onRefresh,
}: HostBusinessDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [strikeCount, setStrikeCount] = useState<number>(0)

  // Fetch strike count for host
  useEffect(() => {
    if (!hostProfile?.id) return
    supabase
      .from("strikes")
      .select("*", { count: "exact", head: true })
      .eq("host_id", hostProfile.id)
      .then(({ count }) => {
        if (count !== null) setStrikeCount(count)
      })
  }, [hostProfile?.id])

  // 1. Metric: Total Earnings
  const totalEarnings = useMemo(() => {
    return bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.payment_amount || b.total_price || 0), 0)
  }, [bookings])

  // 2. Metric: Upcoming Tours
  const today = startOfDay(new Date())
  const upcomingBookings = useMemo(() => {
    return bookings.filter((b) => {
      const isUpcoming = !isBefore(parseISO(b.booking_date), today)
      return isUpcoming && (b.status === "confirmed" || b.status === "pending")
    })
  }, [bookings, today])

  // 3. Metric: Trust Score & Tier
  const rawScore = Number(hostProfile?.trust_score ?? 100)
  const trustScore = rawScore > 5 ? (rawScore / 100) * 5 : rawScore
  const trustTier = getTrustScoreTier(trustScore)

  // 4. "Needs Action" Widget: Tours that passed but not marked completed
  const needsActionBookings = useMemo(() => {
    return bookings.filter((b) => {
      const isPast = isBefore(parseISO(b.booking_date), today)
      return isPast && b.status === "confirmed"
    })
  }, [bookings, today])

  // 5. Left Column: "My Bookings" sorted by booking_date ASC (soonest first)
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.booking_date).getTime()
      const dateB = new Date(b.booking_date).getTime()
      return dateA - dateB
    })
  }, [bookings])

  const filteredBookings = useMemo(() => {
    return sortedBookings.filter((b) => {
      const matchesSearch =
        searchQuery === "" ||
        b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.tour?.title && b.tour.title.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus =
        selectedStatus === "all" ||
        b.status === selectedStatus ||
        (selectedStatus === "needs_action" && isBefore(parseISO(b.booking_date), today) && b.status === "confirmed")

      const matchesDate =
        !selectedDate ||
        format(parseISO(b.booking_date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [sortedBookings, searchQuery, selectedStatus, selectedDate, today])

  // Booked tour dates for calendar highlighting
  const bookedDates = useMemo(() => {
    return bookings
      .filter((b) => b.status === "confirmed" || b.status === "pending")
      .map((b) => parseISO(b.booking_date))
  }, [bookings])

  // Handle Quick Tour Completion
  const handleConfirmCompletion = async (booking: Booking) => {
    setCompletingId(booking.id)
    try {
      // 1. Retrieve host payout account information
      const { data: hostProf } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", booking.host_id)
        .maybeSingle()

      const targetPhone = (hostProf as any)?.mpesa_phone || hostProf?.phone || booking.guest_phone
      const targetName = hostProf?.full_name || "Ausaguide Host"

      // 2. Trigger payout edge function or update status directly
      const { data, error: fnErr } = await supabase.functions.invoke("inta-pay-host", {
        body: {
          booking_id: booking.id,
          bookingId: booking.id,
          host_id: booking.host_id,
          hostId: booking.host_id,
          amount: booking.payment_amount || booking.total_price,
          account_number: targetPhone,
          account_name: targetName,
          phone: targetPhone,
        },
      })

      if (fnErr || data?.error) {
        // Fallback: update status directly in Supabase
        await supabase
          .from("bookings")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", booking.id)
      }

      toast.success("Tour marked complete! Payout dispatched.")
      onRefresh()
    } catch (err: any) {
      console.error("Completion error:", err)
      toast.error(err.message || "Failed to complete tour.")
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── TOP: 3 HIGH-IMPACT METRIC CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Earnings */}
        <Card className="border-border/60 bg-gradient-to-br from-[#16161A] to-[#1E2028] shadow-modern rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Earnings
              </p>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                KSh {totalEarnings.toLocaleString()}
              </h3>
              <p className="text-[11px] text-brand-light flex items-center gap-1 font-medium">
                <TrendingUp className="size-3" /> From completed tours
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
              <DollarSign className="size-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Upcoming Tours */}
        <Card className="border-border/60 bg-gradient-to-br from-[#16161A] to-[#1E2028] shadow-modern rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Upcoming Tours
              </p>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                {upcomingBookings.length}
              </h3>
              <p className="text-[11px] text-teal flex items-center gap-1 font-medium">
                <Clock className="size-3" /> Scheduled with travelers
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-teal/15 border border-teal/30 flex items-center justify-center text-teal">
              <CalendarIcon className="size-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Trust Score & Ranking Algorithm */}
        <Card className="border-border/60 bg-gradient-to-br from-[#16161A] to-[#1E2028] shadow-modern rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Trust Score & Tier
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                  {trustScore.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
                </h3>
                <Badge className={`text-[10px] font-bold uppercase tracking-wider ${trustTier.colorClass}`}>
                  {trustTier.tier}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <ShieldAlert className={`size-3 ${strikeCount > 0 ? "text-rose-400" : "text-emerald-400"}`} />
                <span>{strikeCount} / 10 Strikes Recorded</span>
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2-COLUMN MAIN BUSINESS LAYOUT ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT COLUMN: MY BOOKINGS (8 COLS) ────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-border/60 bg-card/60 backdrop-blur-md rounded-2xl shadow-modern">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <span>My Bookings</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      Sorted soonest first
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Chronological schedule of travelers booking your experiences
                  </CardDescription>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "all", label: "All" },
                    { id: "confirmed", label: "Confirmed" },
                    { id: "pending", label: "Pending" },
                    { id: "completed", label: "Completed" },
                    { id: "cancelled", label: "Cancelled" },
                  ].map((tab) => (
                    <Button
                      key={tab.id}
                      size="sm"
                      variant={selectedStatus === tab.id ? "default" : "outline"}
                      onClick={() => setSelectedStatus(tab.id)}
                      className={`h-7 text-xs rounded-full px-2.5 ${
                        selectedStatus === tab.id
                          ? "bg-brand text-white font-semibold"
                          : "border-border/50 text-muted-foreground hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by guest name or tour title..."
                  className="pl-9 h-9 text-xs bg-background/50 border-border/50 rounded-xl"
                />
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {filteredBookings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm font-medium">No bookings match the selected criteria.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedStatus("all")
                      setSelectedDate(undefined)
                    }}
                    className="mt-2 text-xs text-brand hover:underline"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                filteredBookings.map((b) => {
                  const isPast = isBefore(parseISO(b.booking_date), today)
                  const canCancel = b.status === "confirmed" || b.status === "pending"

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-border/50 bg-[#16161A]/80 hover:border-brand/40 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm truncate">
                              {b.tour?.title || "Tour Experience"}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize px-2 py-0 font-semibold ${
                                b.status === "confirmed"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : b.status === "pending"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : b.status === "completed"
                                  ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                                  : "bg-zinc-500/20 text-zinc-300 border-zinc-500/40"
                              }`}
                            >
                              {b.status}
                            </Badge>
                            {isPast && b.status === "confirmed" && (
                              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px]">
                                Past Due (Needs Action)
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 text-white font-medium">
                              <User className="size-3 text-brand" /> {b.guest_name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="size-3" />
                              {format(parseISO(b.booking_date), "MMM d, yyyy")} {b.booking_time ? `at ${b.booking_time}` : ""}
                            </span>
                            <span>•</span>
                            <span>{b.currency || "KES"} {(b.payment_amount || b.total_price || 0).toLocaleString()}</span>
                          </p>
                        </div>

                        {/* Booking Row Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {onChat && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onChat(b)}
                              className="h-8 text-xs rounded-full border-border/60 hover:border-brand text-muted-foreground hover:text-white"
                            >
                              <MessageSquare className="size-3.5 mr-1" />
                              Chat
                            </Button>
                          )}

                          {/* Confirm Completion Button */}
                          {b.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirmCompletion(b)}
                              disabled={completingId === b.id}
                              className="h-8 text-xs rounded-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-semibold gap-1"
                            >
                              {completingId === b.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-3.5" />
                              )}
                              Complete
                            </Button>
                          )}

                          {/* Host Cancel Tour (Triggers Apology Modal) */}
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancellingBooking(b)}
                              className="h-8 text-xs rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            >
                              <XCircle className="size-3.5 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN: CALENDAR & "NEEDS ACTION" (4 COLS) ──────────────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* "Needs Action" Widget */}
          <Card className={`rounded-2xl shadow-modern transition-all ${
            needsActionBookings.length > 0
              ? "border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-[#16161A]"
              : "border-border/60 bg-card/60"
          }`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  needsActionBookings.length > 0 ? "bg-amber-500/20 text-amber-400" : "bg-primary/10 text-primary"
                }`}>
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white">
                    Needs Action
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    Passed tours requiring your confirmation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-2 space-y-3">
              {needsActionBookings.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="size-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                  <p className="font-semibold text-white">All caught up!</p>
                  <p>No past-due unconfirmed tours.</p>
                </div>
              ) : (
                needsActionBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">
                          {b.tour?.title || "Tour Experience"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Guest: {b.guest_name} • {format(parseISO(b.booking_date), "MMM d")}
                        </p>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0">
                        Needs Payout
                      </Badge>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleConfirmCompletion(b)}
                      disabled={completingId === b.id}
                      className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg gap-1"
                    >
                      {completingId === b.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3" />
                      )}
                      Confirm Tour Completion
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Tour Schedule Calendar Widget */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-md rounded-2xl shadow-modern overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span>Tour Calendar</span>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(undefined)}
                    className="text-[11px] font-normal text-brand hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Dates with active or pending bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  booked: bookedDates,
                }}
                modifiersClassNames={{
                  booked: "border border-brand font-bold text-brand bg-brand/10 rounded-md",
                }}
                className="rounded-xl border border-border/30 bg-[#16161A]/50"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Host Cancellation Apology Modal */}
      <HostCancellationApologyModal
        isOpen={cancellingBooking !== null}
        onClose={() => setCancellingBooking(null)}
        booking={cancellingBooking}
        currentStrikes={strikeCount}
        onSuccess={() => {
          onRefresh()
          setCancellingBooking(null)
        }}
      />
    </div>
  )
}
