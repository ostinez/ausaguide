import { useEffect, useState, useCallback } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { format } from "date-fns"
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Users,
  TrendingUp,
  Eye,
  Clock,
  ArrowRight,
  MessageSquare,
  XCircle,
  Lightbulb,
  Bell,
  Settings,
  Video,
  Menu,
  BadgeCheck,
  Loader2,
} from "lucide-react"
import { ChatDialog } from "@/components/chat/chat-dialog"
import NotificationBell from "@/components/ui/NotificationBell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { PlusSpinner } from "@/components/ui/PlusSpinner"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { BookingStatus, Tour, Booking, Profile } from "@/lib/types"
import { fetchToursByHostId, deleteTour, updateTour } from "@/lib/api/tours";
import { fetchHostByUserId, fetchBookingsByGuestId, fetchBookingsByHostId, fetchProfileById, updateHostSettings, type HostRecord } from "@/lib/api/hosts";
import { fetchHostSettings, fetchHostAvailability, updateHostAvailability } from "@/lib/api/availability";
import ReviewList from "@/components/ui/ReviewList";
import ReviewForm from "@/components/ui/ReviewForm";
import { updateBookingStatus } from "@/lib/api/bookings"
import { createOrGetDailyRoom } from "@/lib/api/daily"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { HostCardCarousel } from "@/components/ui/HostCardCarousel"
import { LocationToggle } from "@/components/host/LocationToggle"
import { GlassmorphismSidebar } from "@/components/ui/GlassmorphismSidebar"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { usePlatform } from "@/hooks/use-platform"


function statusColorClass(status: BookingStatus) {
  const map: Record<BookingStatus, string> = {
    pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/30",
    confirmed: "bg-green-500/20 text-green-500 border-green-500/20 hover:bg-green-500/30",
    completed: "bg-blue-500/20 text-blue-500 border-blue-500/20 hover:bg-blue-500/30",
    declined: "bg-red-500/20 text-red-500 border-red-500/20 hover:bg-red-500/30",
    cancelled: "bg-gray-500/20 text-gray-500 border-gray-500/20 hover:bg-gray-500/30",
    checked_in: "bg-green-500/20 text-green-500 border-green-500/20 hover:bg-green-500/30",
  }
  return map[status] || "bg-gray-500/20 text-gray-500 border-gray-500/20"
}

function statusLabel(status: BookingStatus) {
  const map: Record<BookingStatus, string> = {
    confirmed: "Confirmed",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    checked_in: "Checked In",
    declined: "Declined",
  }
  return map[status]
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <BorderGlow
      edgeSensitivity={30}
      glowColor="260 70 60"
      backgroundColor="#16161A"
      borderRadius={16}
      glowRadius={40}
      glowIntensity={0.8}
      coneSpread={25}
      animated={false}
      colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
      className="w-full"
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="flex items-center gap-4 pt-6">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              accent ? "bg-teal/10" : "bg-primary/10"
            }`}
          >
            <Icon className={`size-5 ${accent ? "text-teal" : "text-primary"}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </BorderGlow>
  )
}

function TourRow({
  tour,
  bookings = [],
  onRefresh,
}: {
  tour: Tour
  bookings?: Booking[]
  onRefresh?: () => void
}) {
  const navigate = useNavigate()
  const [updating, setUpdating] = useState(false)


  const bookingsCount = bookings.filter((b) => b.tour_id === tour.id).length
  
  const mockViews = tour.views || 0

  const handleTogglePublish = async () => {
    setUpdating(true)
    const newStatus = tour.status === "published" ? "draft" : "published"
    try {
      await updateTour(tour.id, { status: newStatus })
      toast.success(newStatus === "published" ? "Tour published successfully!" : "Tour saved to drafts.")
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error(err)
      toast.error("Failed to toggle status.")
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${tour.title}"?`)) return
    setUpdating(true)
    try {
      await deleteTour(tour.id)
      toast.success("Tour deleted successfully!")
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete tour.")
    } finally {
      setUpdating(false)
    }
  }

  const mainImage = tour.images && tour.images.length > 0
    ? tour.images[0]
    : "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"

  const isPublished = tour.status === "published" || tour.is_published

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md md:flex-row md:items-center">
      {/* Tour Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted md:size-24 shrink-0">
        <img
          src={mainImage}
          alt={tour.title}
          className="h-full w-full object-cover"
        />
        <Badge
          variant={isPublished ? "default" : "outline"}
          className={`absolute left-2 top-2 text-[9px] uppercase tracking-wider py-0.5 px-1.5 ${
            isPublished
              ? "bg-teal-500/90 text-white hover:bg-teal border-none"
              : "bg-black/60 text-white backdrop-blur-sm"
          }`}
        >
          {isPublished ? "Published" : "Draft"}
        </Badge>
      </div>

      {/* Info details */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate text-base font-bold text-foreground">
            {tour.title}
          </h4>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md capitalize">
            {tour.category}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {tour.duration_hours} hours
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="size-3.5" />
            {tour.currency} {tour.price.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate max-w-[150px]">{tour.location_name}</span>
          </span>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-2.5 mt-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="size-3.5 text-primary" />
            <span><strong>{bookingsCount}</strong> bookings</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="size-3.5 text-teal" />
            <span><strong>{mockViews}</strong> views</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="size-3.5 text-amber-400 fill-current" />
            <span><strong>{tour.rating}</strong> ({tour.review_count})</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 border-t border-border/40 pt-3 md:border-none md:pt-0 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 md:flex-initial"
          onClick={() => navigate(`/host/tours/${tour.id}/edit`)}
          disabled={updating}
        >
          <Pencil className="size-3.5 mr-1" />
          Edit
        </Button>

        <Button
          size="sm"
          variant={isPublished ? "outline" : "default"}
          className={`flex-1 md:flex-initial ${
            !isPublished
              ? "bg-teal-500 hover:bg-teal-600 text-white"
              : "hover:bg-accent"
          }`}
          onClick={handleTogglePublish}
          disabled={updating}
        >
          {isPublished ? "Unpublish" : "Publish"}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={updating}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function BookingExpandedDetails({ booking }: { booking: Booking }) {
  const history = Array.isArray(booking.status_history) && booking.status_history.length > 0
    ? booking.status_history
    : [
        { status: "pending", timestamp: booking.created_at || new Date().toISOString() },
        ...(booking.status !== "pending" ? [{ status: booking.status, timestamp: booking.updated_at || new Date().toISOString() }] : [])
      ]

  return (
    <div className="mt-4 border-t border-border/40 pt-4 space-y-4 text-xs text-foreground animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Guest Contact Info</p>
          <p className="font-medium text-foreground mt-1">
            Name:{" "}
            {booking.guest_id ? (
              <Link
                to={`/traveler/${booking.guest_id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:underline font-bold"
              >
                {booking.guest_name}
              </Link>
            ) : (
              booking.guest_name
            )}
          </p>
          <p className="text-muted-foreground">Email: {booking.guest_email}</p>
          <p className="text-muted-foreground">Phone: {booking.guest_phone || "Not provided"}</p>
        </div>
        <div className="space-y-1">
          <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Special Requests & Notes</p>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {booking.notes || "None"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status History Timeline</p>
        <div className="relative border-l border-border/85 ml-2 pl-4 py-1 space-y-3">
          {history.map((h: any, i: number) => (
            <div key={i} className="relative">
              <div className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-card bg-primary" />
              <div className="flex items-center gap-2">
                <span className="font-bold capitalize text-foreground">{h.status}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(h.timestamp).toLocaleString("en-KE")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BookingRow({
  booking,
  showTour,
  onChat,
}: {
  booking: Booking
  showTour?: boolean
  onChat?: (booking: Booking) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const dateStr = format(new Date(booking.booking_date), "MMM d, yyyy")
  const [joiningCall, setJoiningCall] = useState(false)
  const [countdown, setCountdown] = useState<string>("")

  useEffect(() => {
    const startStr = booking.booking_time 
      ? `${booking.booking_date}T${booking.booking_time}` 
      : `${booking.booking_date}T09:00:00`
    const startTime = new Date(startStr).getTime()

    function updateTimer() {
      const now = Date.now()
      const diff = startTime - now

      if (diff <= 0) {
        setCountdown("Started")
        return
      }

      const diffMinutes = Math.floor(diff / 60000)
      if (diffMinutes < 5) {
        setCountdown("Starting now")
        return
      }

      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      if (hours > 0) {
        setCountdown(`Starts in: ${hours}h ${minutes}m`)
      } else {
        setCountdown(`Starts in: ${minutes}m`)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [booking.booking_date, booking.booking_time])

  async function handleJoinCall(e: React.MouseEvent) {
    e.stopPropagation()
    setJoiningCall(true)
    try {
      const url = await createOrGetDailyRoom(booking.id)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to join call")
    } finally {
      setJoiningCall(false)
    }
  }

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40 cursor-pointer select-none"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-9 shrink-0" onClick={(e) => e.stopPropagation()}>
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {booking.guest_name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {showTour ? booking.tour?.title : booking.guest_name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {dateStr}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {booking.guest_count} {booking.guest_count === 1 ? "guest" : "guests"}
            </span>
            <span>KES {booking.total_price.toLocaleString()}</span>
            {countdown && (booking.status === "confirmed" || booking.status === "pending") && (
              <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400">
                ⏱️ {countdown}
              </span>
            )}
          </div>
        </div>
        {onChat && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full shrink-0 border-primary/50 text-primary hover:bg-primary/10 mr-1"
            onClick={(e) => {
              e.stopPropagation()
              onChat(booking)
            }}
          >
            <MessageSquare className="size-3.5 mr-1" />
            Chat
          </Button>
        )}
        {booking.status === "confirmed" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full shrink-0 border-teal/50 text-teal hover:bg-teal/10 mr-1 gap-1.5"
            onClick={handleJoinCall}
            disabled={joiningCall}
          >
            {joiningCall ? (
              <Spinner className="size-3.5 text-teal animate-spin" />
            ) : (
              <Video className="size-3.5" />
            )}
            Join Call
          </Button>
        )}
        {booking.status === "declined" && booking.decline_reason && (
          <span className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-xl block max-w-xs shrink-0 truncate" title={booking.decline_reason}>
            Reason: {booking.decline_reason}
          </span>
        )}
        {showTour && (
          <div onClick={(e) => e.stopPropagation()}>
            <ReviewForm
              bookingId={booking.id}
              bookingStatus={booking.status}
              tourId={booking.tour_id}
              hostId={booking.host_id}
              travelerId={localStorage.getItem('user_id') ?? booking.guest_id ?? undefined}
            />
          </div>
        )}
        <Badge variant="outline" className={cn("shrink-0 border-transparent", statusColorClass(booking.status))}>
          {statusLabel(booking.status)}
        </Badge>
      </div>
      
      {expanded && <BookingExpandedDetails booking={booking} />}
    </div>
  )
}

function PendingBookingRow({
  booking,
  onUpdateStatus,
  onChat,
}: {
  booking: Booking
  onUpdateStatus: (id: string, status: BookingStatus, reason?: string) => Promise<void>
  onChat: (booking: Booking) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [loadingAction, setLoadingAction] = useState<"accept" | "decline" | null>(null)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const dateStr = format(new Date(booking.booking_date), "MMM d, yyyy")
  const [declineReason, setDeclineReason] = useState("")

  const handleAction = async (action: "accept" | "decline") => {
    if (action === "decline" && !declineReason) {
      return
    }
    setLoadingAction(action)
    try {
      await onUpdateStatus(booking.id, action === "accept" ? "confirmed" : "declined", action === "decline" ? declineReason : undefined)
      if (action === "decline" && declineReason) {
         console.log("Creating refund for", booking.id, "reason:", declineReason)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update booking status")
    } finally {
      setLoadingAction(null)
      setShowDeclineModal(false)
    }
  }

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40 cursor-pointer select-none"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Avatar className="size-9 shrink-0" onClick={(e) => e.stopPropagation()}>
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {booking.guest_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">
              {booking.guest_name}
            </p>
            <p className="text-xs text-primary font-medium truncate mt-0.5">
              {booking.tour?.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {dateStr}
              </span>
              <span>
                Time: 10:00 AM
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {booking.guest_count} {booking.guest_count === 1 ? "guest" : "guests"}
              </span>
              <span>KES {booking.total_price.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-foreground mr-1"
            onClick={(e) => {
              e.stopPropagation()
              onChat(booking)
            }}
          >
            <MessageSquare className="size-4 mr-1" />
            Chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation()
              setShowDeclineModal(true)
            }}
            disabled={loadingAction !== null}
          >
            Decline & Refund
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-teal text-white hover:bg-teal/90"
            onClick={(e) => {
              e.stopPropagation()
              handleAction("accept")
            }}
            disabled={loadingAction !== null}
          >
            {loadingAction === "accept" && (
              <Spinner className="size-3 mr-1 text-white animate-spin" />
            )}
            Accept
          </Button>
        </div>

        {showDeclineModal && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h3 className="font-semibold text-lg text-destructive mb-2">Decline Booking</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide a reason. This will initiate a refund process.
              </p>
              <textarea
                className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                placeholder="E.g., I have a family emergency..."
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
              <div className="mt-4 rounded-lg bg-teal/10 p-3 border border-teal/20 text-xs text-teal">
                <strong>Tip:</strong> Suggest alternative times to the guest via chat to save the booking!
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeclineModal(false)} className="rounded-full">
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleAction("decline")} 
                  disabled={!declineReason.trim() || loadingAction === "decline"}
                  className="rounded-full"
                >
                  {loadingAction === "decline" && <Spinner className="size-3 mr-1 animate-spin" />}
                  Confirm Decline
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {expanded && <BookingExpandedDetails booking={booking} />}
    </div>
  )
}

function HostGamificationTips() {
  const tips = [
    "You get the most bookings between 2pm-4pm. Consider adding more slots then!",
    "Offering virtual tours increases your reach by 30%.",
    "Travelers love hosts with a 4.8+ rating. Keep up the great work!",
  ]
  const randomTip = tips[Math.floor(Math.random() * tips.length)]

  return (
    <Card className="border-teal/30 bg-gradient-to-br from-teal/10 to-primary/5">
      <CardContent className="flex items-start gap-4 p-4 sm:p-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal/20">
          <Lightbulb className="size-5 text-teal" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Host Insight</h3>
          <p className="mt-1 text-sm text-muted-foreground">{randomTip}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function HostSettingsPanel({ hostId, pendingCount }: { hostId: string, pendingCount: number }) {
  const [isBusy, setIsBusy] = useState(false)
  const [busyReason, setBusyReason] = useState("")
  const [guestLimit, setGuestLimit] = useState("5")
  const [reminderTime, setReminderTime] = useState("30")
  
  // Granular availability slots
  const [customAvailabilities, setCustomAvailabilities] = useState<{ day_of_week: number; start_time: string; end_time: string }[]>([])
  const [newSlotDay, setNewSlotDay] = useState<number>(1) // Monday
  const [newSlotStart, setNewSlotStart] = useState<string>("09:00")
  const [newSlotEnd, setNewSlotEnd] = useState<string>("17:00")
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      if (!hostId) return
      setLoading(true)
      const settings = await fetchHostSettings(hostId)
      if (settings) {
        setIsBusy(settings.is_busy)
        setBusyReason(settings.busy_reason || "")
        setReminderTime(settings.reminder_time.toString())
      }
      const availabilities = await fetchHostAvailability(hostId)
      if (availabilities.length > 0) {
        setGuestLimit(availabilities[0].guest_limit.toString())
        setCustomAvailabilities(availabilities.map(a => ({
          day_of_week: a.day_of_week,
          start_time: a.start_time.substring(0, 5),
          end_time: a.end_time.substring(0, 5)
        })))
      } else {
        setCustomAvailabilities([])
      }
      setLoading(false)
    }
    load()
  }, [hostId])

  function handleAddSlot() {
    if (!newSlotStart || !newSlotEnd) {
      alert("Please specify start and end times.")
      return
    }
    if (newSlotStart >= newSlotEnd) {
      alert("Start time must be before end time.")
      return
    }
    // Prevent exact duplicates
    const exists = customAvailabilities.some(
      a => a.day_of_week === newSlotDay && a.start_time === newSlotStart && a.end_time === newSlotEnd
    )
    if (exists) {
      alert("This slot already exists.")
      return
    }

    setCustomAvailabilities(prev => [
      ...prev,
      { day_of_week: newSlotDay, start_time: newSlotStart, end_time: newSlotEnd }
    ])
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateHostSettings(hostId, {
        reminder_time: parseInt(reminderTime, 10),
        notification_preferences: ["in_app"],
        is_busy: isBusy,
        busy_reason: isBusy ? busyReason : undefined,
      })

      const avs = customAvailabilities.map(a => ({
        day_of_week: a.day_of_week,
        start_time: a.start_time + ":00",
        end_time: a.end_time + ":00",
        guest_limit: parseInt(guestLimit, 10)
      }))

      await updateHostAvailability(hostId, avs)
      alert("Settings successfully saved to Supabase!")
    } catch (err) {
      console.error(err)
      alert("Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="size-5 text-primary" />
          Availability & Settings
        </CardTitle>
        <CardDescription>Configure your schedule, limits, and public status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Busy Mode Toggle */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Public "Busy" Mode</h4>
              <p className="text-xs text-muted-foreground">Pause new bookings temporarily</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{isBusy ? "Busy" : "Available"}</span>
              <button 
                onClick={() => {
                  if (!isBusy && pendingCount > 0) {
                    alert("You have pending bookings! Please communicate with travelers before going busy.")
                    return
                  }
                  setIsBusy(!isBusy)
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isBusy ? "bg-destructive" : "bg-muted"}`}
              >
                <span className={`inline-block size-4 transform rounded-full bg-white transition-transform ${isBusy ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
          {isBusy && (
            <div>
              <input 
                type="text" 
                placeholder="Reason (e.g., On a tour)" 
                value={busyReason}
                onChange={(e) => setBusyReason(e.target.value)}
                className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-xs" 
              />
              <p className="text-[10px] text-destructive mt-1">Travelers will see this status on your profile.</p>
            </div>
          )}
        </div>

        {/* Weekly Availability & Limits */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold">Max Guests Per Session</label>
            <select 
              value={guestLimit} 
              onChange={(e) => setGuestLimit(e.target.value)}
              className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n} Guests</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold">Booking Reminders</label>
            <div className="relative">
              <Bell className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select 
                value={reminderTime} 
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full rounded-md border border-border/80 bg-background pl-9 pr-3 py-2 text-sm"
              >
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="120">2 hours before</option>
              </select>
            </div>
          </div>
        </div>

        {/* Availability Schedule */}
        <div className="space-y-4 rounded-xl border border-border bg-muted/10 p-4">
          <label className="text-xs font-semibold block">Availability Slots (Custom Times)</label>
          <p className="text-[11px] text-muted-foreground -mt-2">Add the exact time ranges you are available to host tours.</p>
          
          {/* List of current slots */}
          {customAvailabilities.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No availability slots added yet. Travelers won't be able to book any tours with you!</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {[...customAvailabilities]
                .sort((a, b) => {
                  if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
                  return a.start_time.localeCompare(b.start_time)
                })
                .map((slot, index) => (
                  <div key={index} className="flex items-center justify-between bg-background border border-border/60 p-2 rounded-lg text-xs">
                    <span className="font-medium">
                      {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][slot.day_of_week]}: {slot.start_time} - {slot.end_time}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAvailabilities(prev => prev.filter((_) => {
                          // Find index in original unsorted list to delete correctly
                          const sorted = [...prev].sort((a, b) => {
                            if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
                            return a.start_time.localeCompare(b.start_time)
                          });
                          const itemToDelete = sorted[index];
                          return !(
                            _.day_of_week === itemToDelete.day_of_week &&
                            _.start_time === itemToDelete.start_time &&
                            _.end_time === itemToDelete.end_time
                          );
                        }))
                      }}
                      className="text-destructive hover:underline text-[10px]"
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Add Slot Form */}
          <div className="flex flex-wrap gap-2 items-end border-t border-border/60 pt-3">
            <div className="flex-1 min-w-[120px] space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold">Day</label>
              <select
                value={newSlotDay}
                onChange={e => setNewSlotDay(Number(e.target.value))}
                className="w-full rounded-md border border-border/80 bg-background px-2 py-1 text-xs"
              >
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, idx) => (
                  <option key={idx} value={idx}>{day}</option>
                ))}
              </select>
            </div>
            
            <div className="w-20 space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold">Start</label>
              <input
                type="time"
                value={newSlotStart}
                onChange={e => setNewSlotStart(e.target.value)}
                className="w-full rounded-md border border-border/80 bg-background px-2 py-1 text-xs"
              />
            </div>

            <div className="w-20 space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold">End</label>
              <input
                type="time"
                value={newSlotEnd}
                onChange={e => setNewSlotEnd(e.target.value)}
                className="w-full rounded-md border border-border/80 bg-background px-2 py-1 text-xs"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSlot}
              className="text-xs h-7"
            >
              Add Slot
            </Button>
          </div>
        </div>

        <Button disabled={saving} className="w-full rounded-full" onClick={handleSave}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  )
}

export function HostDashboard({
  tours,
  bookings,
  onUpdateStatus,
}: {
  tours: Tour[]
  bookings: Booking[]
  onUpdateStatus: (id: string, status: BookingStatus) => Promise<void>
}) {
  const [chatBooking, setChatBooking] = useState<Booking | null>(null)
  const pending = bookings.filter((b) => b.status === "pending")
  const upcoming = bookings.filter((b) => b.status === "confirmed")
  const past = bookings.filter(
    (b) => b.status === "completed" || b.status === "declined",
  )
  const totalEarnings = bookings
    .filter((b) => b.status === "completed" || b.status === "confirmed")
    .reduce((sum, b) => sum + b.total_price, 0)
  const avgRating =
    tours.length > 0
      ? tours.reduce((sum, t) => sum + t.rating, 0) / tours.length
      : 0

  return (
    <div className="space-y-8">
      <HostGamificationTips />
      
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={MapPin} label="Total Tours" value={tours.length.toString()} />
        <StatCard icon={Calendar} label="Total Bookings" value={bookings.length.toString()} />
        <StatCard
          icon={DollarSign}
          label="Total Earnings"
          value={`KES ${totalEarnings.toLocaleString()}`}
          accent
        />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value={avgRating.toFixed(1)}
          accent
        />
      </div>

      {/* Pending Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Bookings</CardTitle>
          <CardDescription>
            Booking requests requiring your confirmation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No pending booking requests.
            </p>
          ) : (
            pending.map((b) => (
              <PendingBookingRow
                key={b.id}
                booking={b}
                onUpdateStatus={onUpdateStatus}
                onChat={setChatBooking}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Tours */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tours</CardTitle>
          <CardDescription>
            Manage your listed experiences
          </CardDescription>
          <CardAction>
            <Button size="sm" className="rounded-full">
              <Plus className="size-4" />
              Add Tour
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          {tours.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tours yet.</p>
          ) : (
            tours.map((t) => <TourRow key={t.id} tour={t} />)
          )}
        </CardContent>
      </Card>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
          <CardDescription>
            Guests who have booked your tours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No upcoming bookings yet.
            </p>
          ) : (
            upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} onChat={setChatBooking} />
            ))
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Bookings</CardTitle>
            <CardDescription>Previously completed trips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} onChat={setChatBooking} />
            ))}
          </CardContent>
        </Card>
      )}

      {chatBooking && (
        <ChatDialog
          bookingId={chatBooking.id}
          isOpen={!!chatBooking}
          onOpenChange={(open) => {
            if (!open) setChatBooking(null)
          }}
          currentUserId={chatBooking.host_id}
          receiverId={chatBooking.guest_id || "22222222-2222-2222-2222-222222222201"}
          receiverName={chatBooking.guest_name}
        />
      )}
    </div>
  )
}

function UrgentRequestsSection({
  requests,
  hostId,
  onRefresh,
}: {
  requests: any[]
  hostId: string
  onRefresh: () => void
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAccept = async (requestId: string) => {
    setLoadingId(requestId)
    try {
      const { acceptUrgentRequest } = await import("@/lib/api/urgent-match")
      const result = await acceptUrgentRequest(requestId, hostId)
      if (result.success) {
        toast.success(result.message)
        onRefresh()
      } else {
        toast.error(result.message)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to accept request.")
    } finally {
      setLoadingId(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    setLoadingId(requestId)
    try {
      const { declineUrgentRequest } = await import("@/lib/api/urgent-match")
      await declineUrgentRequest(requestId, hostId)
      toast.success("Request declined.")
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to decline request.")
    } finally {
      setLoadingId(null)
    }
  }

  const filteredRequests = requests.filter(req => {
    const expiresAt = new Date(req.expires_at).getTime()
    return expiresAt > Date.now()
  })

  if (filteredRequests.length === 0) return null

  return (
    <Card className="border-violet-500/30 bg-violet-950/10 shadow-lg border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-violet-400">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
          </span>
          🚨 Incoming Urgent Matches Near You!
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          Match with travelers looking for immediate guides within 5km. Respond before expiry!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredRequests.map((req) => {
          const expiresAt = new Date(req.expires_at).getTime()
          const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)))

          useEffect(() => {
            const interval = setInterval(() => {
              const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
              setTimeLeft(remaining)
              if (remaining <= 0) {
                clearInterval(interval)
                onRefresh()
              }
            }, 1000)
            return () => clearInterval(interval)
          }, [expiresAt, onRefresh])

          if (timeLeft <= 0) return null

          return (
            <div key={req.id} className="border border-violet-500/20 bg-slate-900/60 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">
                  Traveler: {req.traveler?.full_name || "Anonymous Traveler"}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="bg-violet-900/40 text-violet-300 px-2 py-0.5 rounded-full capitalize">
                    {req.experience_type?.join(", ") || "General"}
                  </span>
                  <span className="font-semibold text-emerald-400">
                    Budget: {req.budget} KES/hr
                  </span>
                </div>
                <p className="text-[10px] text-rose-400 font-mono font-bold">
                  Expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(req.id)}
                  disabled={loadingId !== null}
                  className="flex-1 sm:flex-initial border-slate-700 text-slate-400 hover:text-white"
                >
                  Decline
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAccept(req.id)}
                  disabled={loadingId !== null}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold"
                >
                  {loadingId === req.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Accept Match
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function TravelerDashboard({ bookings = [], onChat }: { bookings?: Booking[]; onChat?: (booking: Booking) => void }) {
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  )
  const past = bookings.filter(
    (b) => b.status === "completed" || b.status === "declined",
  )
  const totalSpent = bookings.reduce((sum, b) => sum + b.total_price, 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={Calendar} label="Upcoming" value={upcoming.length.toString()} />
        <StatCard icon={Clock} label="Past Trips" value={past.length.toString()} accent />
        <StatCard
          icon={TrendingUp}
          label="Total Spent"
          value={`KES ${totalSpent.toLocaleString()}`}
        />
      </div>

      {/* Upcoming */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tours</CardTitle>
          <CardDescription>Your scheduled experiences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No upcoming tours yet
            </p>
          ) : (
            upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} showTour onChat={onChat} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Past trips */}
      <Card>
        <CardHeader>
          <CardTitle>Past Trips</CardTitle>
          <CardDescription>
            Your completed experiences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {past.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No past trips yet.
            </p>
          ) : (
            past.map((b) => (
              <BookingRow key={b.id} booking={b} showTour onChat={onChat} />
            ))
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex justify-center">
        <Link to="/tours">
          <Button variant="outline" className="rounded-full">
            View All Tours
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams()
  const platform = usePlatform()
  const [userRoleState, setUserRoleState] = useState<string>(() => localStorage.getItem("user_role") || "traveler");
  const userId = localStorage.getItem("user_id");
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [view, setView] = useState<string>(() => {
    if (userRoleState === "host") {
      const tab = searchParams.get("tab")
      if (tab && ["dashboard", "tours", "bookings", "reviews", "settings"].includes(tab)) {
        return tab
      }
      return "dashboard"
    }
    return "traveler";
  });
  
  const [hostProfile, setHostProfile] = useState<Profile | null>(null);
  const [travelerProfile, setTravelerProfile] = useState<Profile | null>(null);
  const [hostRecord, setHostRecord] = useState<HostRecord | null>(null);
  const [hostTours, setHostTours] = useState<Tour[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [travelerBookings, setTravelerBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgentRequests, setUrgentRequests] = useState<any[]>([]);

  const fetchPendingUrgent = useCallback(async () => {
    if (!userId || userRoleState !== "host") return
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("urgent_requests")
      .select("*, traveler:profiles!urgent_requests_traveler_id_fkey(*)")
      .eq("status", "pending")
      .gt("expires_at", now)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pending urgent requests:", error)
    } else if (data) {
      setUrgentRequests(data)
    }
  }, [userId, userRoleState])

  useEffect(() => {
    if (userRoleState !== "host" || !userId) return

    fetchPendingUrgent()

    const channel = supabase
      .channel(`urgent_requests_dashboard_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "urgent_requests" },
        () => {
          fetchPendingUrgent()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, userRoleState, fetchPendingUrgent])

  const refreshHostTours = async () => {
    if (userId) {
      try {
        const tours = await fetchToursByHostId(userId)
        setHostTours(tours)
      } catch (err) {
        console.error(err)
      }
    }
  }
  const [error, setError] = useState<string | null>(null);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const handleChatClick = (b: Booking) => navigate(`/messages?bookingId=${b.id}`);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (userRoleState === "host") {
      const tab = searchParams.get("tab")
      if (tab && ["dashboard", "tours", "bookings", "reviews", "settings"].includes(tab)) {
        setView(tab)
      }
    }
  }, [searchParams, userRoleState])

  const loadDashboard = useCallback(async () => {
    try {
      if (!userId) {
        setError("No user ID found. Please log in.")
        setLoading(false)
        return
      }

      const profile = await fetchProfileById(userId)
      if (!profile) {
        setError("User profile not found in database.")
        setLoading(false)
        return
      }

      // Sync role in localStorage and state
      if (profile.role !== userRoleState) {
        localStorage.setItem("user_role", profile.role)
        setUserRoleState(profile.role)
      }

      setTravelerProfile(profile)

      // Fetch notifications for the user
      const { data: notifData } = await supabase
        .from("notifications")
        .select("id, read, message, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
      
      if (notifData) {
        setNotifications(notifData)
        setUnreadNotifications(notifData.filter(n => !n.read).length)
      }

      if (profile.role === "host") {
        setHostProfile(profile)
        const hostRec = await fetchHostByUserId(profile.id)
        setHostRecord(hostRec)
        if (hostRec) {
          const [tours, bookings] = await Promise.all([
            fetchToursByHostId(profile.id),
            fetchBookingsByHostId(profile.id),
          ])
          setHostTours(tours)
          setHostBookings(bookings)
        }
      }

      const bookings = await fetchBookingsByGuestId(profile.id)
      setTravelerBookings(bookings)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [userId, userRoleState])

  useEffect(() => {
    if (userRoleState === "admin") {
      navigate("/admin");
      return;
    }

    loadDashboard()

    // Subscribe to bookings updates
    /*
    const bookingChannel = supabase
      .channel(`bookings-updates-${userId || "anon"}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          console.log("Realtime booking update received:", payload)
          loadDashboard()
        }
      )
      .subscribe()

    // Subscribe to notifications inserts
    const notifChannel = supabase
      .channel(`notifications-updates-${userId || "anon"}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          console.log("Realtime notification received:", payload)
          loadDashboard()
        }
      )
      .subscribe()
    */

    return () => {
      // bookingChannel.unsubscribe()
      // notifChannel.unsubscribe()
      // supabase.removeChannel(bookingChannel)
      // supabase.removeChannel(notifChannel)
    }
  }, [userRoleState, navigate, loadDashboard])

  async function handleUpdateBookingStatus(bookingId: string, status: BookingStatus, reason?: string) {
    if (status === "confirmed" || status === "declined") {
      try {
        const action = status === "confirmed" ? "confirm" : "reject"
        const { data, error } = await supabase.functions.invoke("manage-booking-payment", {
          body: {
            bookingId,
            action,
            declineReason: reason,
          }
        })
        if (error) throw error
        
        if (data?.success) {
          toast.success(`Booking ${status === "confirmed" ? "confirmed" : "declined"} successfully!`)
        }
      } catch (err: any) {
        console.error("Failed to update payment status:", err)
        toast.error(`Error: ${err.message || "Failed to update booking"}`)
      }
    } else {
      const updated = await updateBookingStatus(bookingId, status, reason)
      setHostBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: updated.status, decline_reason: updated.decline_reason } : b))
      )
    }
    loadDashboard()
  }

  const profile = hostProfile || travelerProfile

  const pendingCount = hostBookings.filter((b) => b.status === "pending").length

  function handleViewChange(v: string) {
    if (v === "earnings") {
      navigate("/dashboard/earnings")
      return
    }
    setView(v)
    if (userRoleState === "host") {
      setSearchParams({ tab: v })
    }
  }





  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        platform.isLowEndDevice && "low-end-device",
        platform.isIOS && "is-ios",
        platform.isAndroid && "is-android"
      )}
      style={{ paddingBottom: platform.isIOS ? "env(safe-area-inset-bottom, 0px)" : undefined }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </div>

      {/* Glassmorphism Sidebar — controlled drawer */}
      <GlassmorphismSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        view={view}
        onViewChange={handleViewChange}
        profile={profile}
        userRole={userRoleState}
        pendingCount={pendingCount}
        unreadNotifications={unreadNotifications}
      />

      {/* Main content — full width, sidebar no longer takes permanent space */}
      <div className="relative z-10">
        <div className="mx-auto max-w-5xl px-4 pt-24 pb-16">
          {/* Page header */}
          <div className="mb-8 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Welcome back, {profile?.full_name ? profile.full_name.split(" ")[0] : "there"} 👋
                </h1>
              </div>

              {/* Top-Right Header Actions (Bell + Role Switch + Avatar + Menu) */}
              <div className="flex items-center gap-3 ml-auto sm:ml-0">
                {userId && <NotificationBell />}

                {profile?.avatar_url && (
                  <Link to="/profile/edit" title="Edit Profile">
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="size-8 rounded-full object-cover border border-primary/20 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:scale-105"
                    />
                  </Link>
                )}

                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation"
                  className="flex size-9 items-center justify-center rounded-xl border border-border bg-[#16161A]/50 text-white/60 hover:text-white hover:border-[#7F5AF0]/40 transition-all duration-200"
                >
                  <Menu className="size-5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {userRoleState === "host"
                ? "Manage your tours and bookings"
                : "Track your upcoming adventures"}
            </p>
          </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <PlusSpinner size={48} />
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-foreground">Could not load dashboard</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : userRoleState === "host" ? (
          !hostRecord ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold text-foreground">Host profile pending</p>
              <p className="mt-2 text-sm text-muted-foreground">Your host profile registration is pending review.</p>
            </div>
          ) : hostRecord.status === "pending" ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-amber-500/10">
                  <Clock className="size-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Application Under Review</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Your application is being reviewed. You'll receive an email once approved.
                </p>
              </CardContent>
            </Card>
          ) : hostRecord.status === "rejected" ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="size-8 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-destructive">Application Rejected</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {hostRecord.rejection_reason || "Unfortunately, your application to become a host was not approved at this time."}
                </p>
                <Link to="/host/signup">
                  <Button variant="outline" className="mt-6 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
                    Submit New Application
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {view === "dashboard" && (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* Left Column: stats, notifications, bookings */}
                  <div className="space-y-8 lg:col-span-2">
                    {profile?.tra_number && (
                      <div className="space-y-4">
                        {!profile.verified_guide && !profile.rejected_as_guide && (
                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
                            <Clock className="size-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-sm text-amber-400">⏳ Certified Guide Application Under Review</h4>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Your Certified Guide application is under review. You are currently a Local Host.
                              </p>
                            </div>
                          </div>
                        )}
                        {profile.verified_guide && (
                          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 flex items-start gap-3">
                            <BadgeCheck className="size-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-sm text-blue-400">✅ Verified Guide Status Active</h4>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                You are a Verified Guide ✅
                              </p>
                            </div>
                          </div>
                        )}
                        {profile.rejected_as_guide && (
                          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
                            <XCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-sm text-red-400">Your Certified Guide Application was not approved</h4>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Your Certified Guide application was not approved. You are currently a Local Host.
                              </p>
                              {profile.verification_notes && (
                                <div className="mt-2 text-xs border-l-2 border-red-500/50 pl-2 text-red-300 italic">
                                  Reason: "{profile.verification_notes}"
                                </div>
                              )}
                              <button
                                onClick={() => navigate("/onboarding?become-host=true")}
                                className="mt-2.5 text-xs text-red-400 underline font-semibold hover:text-red-300"
                              >
                                Re-apply for Guide Status
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <UrgentRequestsSection
                      requests={urgentRequests}
                      hostId={userId || ""}
                      onRefresh={fetchPendingUrgent}
                    />
                    <HostGamificationTips />
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard icon={MapPin} label="Total Tours" value={hostTours.length.toString()} />
                      <StatCard icon={Calendar} label="Total Bookings" value={hostBookings.length.toString()} />
                      <StatCard
                        icon={DollarSign}
                        label="Total Earnings"
                        value={`KES ${hostBookings.filter((b) => b.status === "completed" || b.status === "confirmed").reduce((sum, b) => sum + b.total_price, 0).toLocaleString()}`}
                        accent
                      />
                      <StatCard
                        icon={Star}
                        label="Avg Rating"
                        value={(hostTours.length > 0 ? hostTours.reduce((sum, t) => sum + t.rating, 0) / hostTours.length : 0).toFixed(1)}
                        accent
                      />
                    </div>

                    {notifications.length > 0 && (
                      <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span>🔔 Notifications</span>
                              {unreadNotifications > 0 && (
                                <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                  {unreadNotifications} New
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>Real-time booking and platform alerts</CardDescription>
                          </div>
                          {unreadNotifications > 0 && (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-primary hover:underline h-7"
                              onClick={async () => {
                                if (hostProfile) {
                                  await supabase.from("notifications").update({ read: true }).eq("user_id", hostProfile.id)
                                  setUnreadNotifications(0)
                                  setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                                }
                              }}
                            >
                              Mark all as read
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={cn(
                                "p-3 rounded-xl border text-xs flex justify-between items-center transition-colors",
                                notif.read ? "border-border/60 bg-muted/5 text-muted-foreground" : "border-primary/20 bg-primary/5 text-foreground font-medium"
                              )}
                            >
                              <span>{notif.message}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                {format(new Date(notif.created_at), "MMM d, h:mm a")}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle>Pending Bookings</CardTitle>
                        <CardDescription>Booking requests requiring your confirmation</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {hostBookings.filter((b) => b.status === "pending").length === 0 ? (
                          <p className="py-6 text-center text-sm text-muted-foreground">No pending booking requests.</p>
                        ) : (
                          hostBookings.filter((b) => b.status === "pending").map((b) => (
                            <PendingBookingRow
                              key={b.id}
                              booking={b}
                              onUpdateStatus={handleUpdateBookingStatus}
                              onChat={handleChatClick}
                            />
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Public Profile Card Preview */}
                  <div className="space-y-6 lg:col-span-1">
                    {hostProfile && (
                      <LocationToggle userId={hostProfile.id} className="animate-in slide-in-from-right duration-500" />
                    )}
                    <Card className="border-border bg-card">
                      <CardHeader>
                        <CardTitle className="text-base">Public Card Preview</CardTitle>
                        <CardDescription>How travelers view your profile. Hover to auto-play images.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <HostCardCarousel 
                          hostId={hostProfile?.id} 
                          aspectRatio="video"
                          className="border-2 border-primary/20 shadow-md"
                        />
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-foreground">{hostProfile?.full_name}</h4>
                            <Badge variant="outline" className="border-teal/30 bg-teal/10 text-teal capitalize">
                              {hostProfile?.host_type?.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {hostProfile?.bio || "No biography provided yet."}
                          </p>
                          <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-xs">
                            <MapPin className="size-3.5 text-muted-foreground" />
                            <span>{hostProfile?.location || "Nairobi, Kenya"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {view === "tours" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Tours</CardTitle>
                    <CardDescription>Manage your listed experiences</CardDescription>
                    <CardAction>
                      <Button size="sm" className="rounded-full" onClick={() => navigate("/host/tours/new")}>
                        <Plus className="size-4" />
                        Add Tour
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hostTours.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No tours yet.</p>
                    ) : (
                      hostTours.map((t) => <TourRow key={t.id} tour={t} bookings={hostBookings} onRefresh={refreshHostTours} />)
                    )}
                  </CardContent>
                </Card>
              )}

              {view === "bookings" && (
                <>
                  {/* Pending Bookings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Pending Bookings
                        {hostBookings.filter((b) => b.status === "pending").length > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500 text-white leading-none animate-pulse">
                            {hostBookings.filter((b) => b.status === "pending").length}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>Booking requests requiring your confirmation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {hostBookings.filter((b) => b.status === "pending").length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No pending booking requests.</p>
                      ) : (
                        hostBookings.filter((b) => b.status === "pending").map((b) => (
                          <PendingBookingRow
                            key={b.id}
                            booking={b}
                            onUpdateStatus={handleUpdateBookingStatus}
                            onChat={handleChatClick}
                          />
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Upcoming Tours (confirmed) */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Tours</CardTitle>
                      <CardDescription>Confirmed bookings — guests who are coming</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {hostBookings.filter((b) => b.status === "confirmed").length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No upcoming bookings yet.</p>
                      ) : (
                        hostBookings.filter((b) => b.status === "confirmed").map((b) => (
                          <BookingRow key={b.id} booking={b} onChat={handleChatClick} />
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Past Tours (completed or declined) */}
                  {hostBookings.filter((b) => b.status === "completed" || b.status === "declined").length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Past Tours</CardTitle>
                        <CardDescription>Completed and declined bookings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {hostBookings.filter((b) => b.status === "completed" || b.status === "declined").map((b) => (
                          <BookingRow key={b.id} booking={b} onChat={handleChatClick} />
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {view === "reviews" && (
                <ReviewList hostId={hostRecord?.id} />
              )}

              {view === "settings" && (
                <HostSettingsPanel hostId={hostProfile?.id || ""} pendingCount={hostBookings.filter((b) => b.status === "pending").length} />
              )}
            </div>
          )
        ) : view === "reviews" ? (
          userRoleState === "host" ? (
            <ReviewList hostId={hostRecord?.id} />
          ) : (
            <div className="space-y-6">
              <Card className="border-border/60 bg-gradient-to-b from-card to-card/60 shadow-lg">
                <CardHeader className="border-b border-border/30 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <Star className="size-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-foreground">Your Reviews</h2>
                      <p className="text-xs text-muted-foreground">Reviews you've shared for completed tours</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted/40">
                    <Star className="size-7 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">No reviews written yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                    After completing a tour, visit your "Past Trips" section to share feedback and help the community!
                  </p>
                </CardContent>
              </Card>
            </div>
          )
        ) : (
          <TravelerDashboard bookings={travelerBookings} onChat={handleChatClick} />
        )}

        {chatBooking && (() => {
          const isHost = userRoleState === "host"
          const curUid = userId || (isHost ? chatBooking.host_id : (chatBooking.guest_id || "22222222-2222-2222-2222-222222222202"))
          const recUid = isHost ? (chatBooking.guest_id || "22222222-2222-2222-2222-222222222202") : chatBooking.host_id
          const recName = isHost ? chatBooking.guest_name : (chatBooking.host?.full_name || chatBooking.tour?.host?.full_name || "Host")
          
          return (
            <ChatDialog
              bookingId={chatBooking.id}
              isOpen={!!chatBooking}
              onOpenChange={(open) => {
                if (!open) setChatBooking(null)
              }}
              currentUserId={curUid}
              receiverId={recUid}
              receiverName={recName}
            />
          )
        })()}
      </div>
      </div>
    </div>
  )
}
