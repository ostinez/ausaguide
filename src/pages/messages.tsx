import { useState, useEffect } from "react"
import { useSearchParams, useNavigate, useParams } from "react-router-dom"
import {
  MessageSquare,
  ArrowLeft,
  Video,
  Info,
  Loader2,
  CalendarDays,
  MapPin,
  Award,
  Users,
  UserPlus,
  Plus,
  Compass,
  Trash2,
  ShieldCheck,
  CheckCircle,
  Calendar,
  Receipt,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { JournalButton } from "@/components/chat/JournalButton"
import { NewChatDialog } from "@/components/chat/NewChatDialog"
import HostTourBookingDetails, { type TourBookingInfo } from "@/components/chat/HostTourBookingDetails"
import { TourReceiptTicketModal } from "@/components/chat/TourReceiptTicketModal"
import { useConversations, type ConversationItem, type Participant } from "@/hooks/useConversations"
import { useRealtimePresence } from "@/lib/hooks/useRealtimePresence"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createGeneralDailyRoom } from "@/lib/api/daily"
import { Link } from "react-router-dom"
import DailyCallOverlay from "@/components/chat/DailyCallOverlay"
import PostCallReviewModal from "@/components/chat/PostCallReviewModal"
import {
  fetchReachableConnections,
  findOrCreateDirectConversation,
  fetchPendingFollowRequests,
  type ReachableConnection,
} from "@/lib/api/follows"

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string
  role: "traveler" | "host" | "admin" | "user"
  full_name?: string
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyConversationPane({
  userRole,
  onNewChat,
}: {
  userRole?: string
  onNewChat: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8 select-none">
      <div className="size-24 rounded-3xl bg-gradient-to-br from-primary/20 to-brand-light/10 border border-primary/20 flex items-center justify-center shadow-modern">
        <MessageSquare className="size-11 text-primary/70" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Your messages</h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Start a direct conversation with guides, hosts, or fellow travelers, or view your tour messages.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 justify-center items-center pt-2">
        <Button
          onClick={onNewChat}
          className="rounded-full font-bold text-xs gap-1.5 shadow-modern-glow h-10 px-5"
        >
          <Plus className="size-3.5" />
          Start a Conversation
        </Button>
        {userRole === "traveler" && (
          <Link
            to="/tours"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-border/60 bg-muted/60 text-foreground font-medium text-xs hover:bg-muted transition-all h-10"
          >
            <Compass className="size-3.5 text-primary" />
            Explore Tours
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── No Conversation Selected ─────────────────────────────────────────────────

function NoChatSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 select-none">
      <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <MessageSquare className="size-8 text-primary/50" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">
        Select a conversation to start messaging.
      </p>
    </div>
  )
}

// ─── Chat Header ─────────────────────────────────────────────────────────────

// ─── Chat Header ─────────────────────────────────────────────────────────────

interface ChatHeaderProps {
  name: string
  avatarUrl: string | null
  hostTier?: string | null
  isOnline: boolean
  isTyping: boolean
  isHostUser?: boolean
  tourName?: string | null
  bookingDate?: string | null
  priorityNumber?: number
  onBack: () => void
  onVideoCall: () => void
  onViewProfile: () => void
  onViewReceipt?: () => void
  onClearChat?: () => void
  showBack: boolean
  hostName: string
}

function ChatHeader({
  name,
  avatarUrl,
  hostTier,
  isOnline,
  isTyping,
  isHostUser,
  tourName,
  bookingDate,
  priorityNumber,
  onBack,
  onVideoCall,
  onViewProfile,
  onViewReceipt,
  onClearChat,
  showBack,
  hostName,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-border bg-card shrink-0 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 sm:size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 md:hidden"
            onClick={onBack}
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}

        <button
          onClick={onViewProfile}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 hover:opacity-85 transition-opacity cursor-pointer text-left"
          title="View profile & tour details"
        >
          <div className="relative shrink-0">
            <Avatar className="size-9 sm:size-10 border-2 border-border/60 ring-2 ring-primary/10">
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
              )}
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-brand-light/20 text-primary font-bold text-xs sm:text-sm">
                {initials(name || "U")}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 size-2.5 sm:size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
            )}
          </div>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[110px] xs:max-w-[150px] sm:max-w-xs">
                {name}
              </span>

              {/* Priority badge for upcoming tours in line */}
              {priorityNumber && priorityNumber > 0 && (
                <span className="shrink-0 text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-black inline-flex items-center gap-0.5">
                  <Sparkles className="size-2 text-emerald-600" />
                  <span>#{priorityNumber} Next Up</span>
                </span>
              )}

              {isHostUser ? (
                <span className="shrink-0 text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                  {tourName ? "Guest" : "Traveler"}
                </span>
              ) : (
                <>
                  {hostTier === "certified_guide" && (
                    <span className="shrink-0 text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold flex items-center gap-0.5">
                      <Award className="size-2.5" />
                      <span>Guide</span>
                    </span>
                  )}
                  {hostTier === "local_host" && (
                    <span className="shrink-0 text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                      Host
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Booking context or online subtitle */}
            {tourName ? (
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate">
                <ShieldCheck className="size-3 shrink-0" />
                <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[200px]">{tourName}</span>
                {bookingDate && (
                  <>
                    <span className="text-border">·</span>
                    <CalendarDays className="size-2.5 shrink-0 hidden xs:inline" />
                    <span className="truncate">{new Date(bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-tight truncate">
                {isTyping ? (
                  <span className="text-primary font-medium">
                    typing
                    <span className="animate-bounce inline-block ml-0.5">.</span>
                    <span className="animate-bounce inline-block delay-100">.</span>
                    <span className="animate-bounce inline-block delay-200">.</span>
                  </span>
                ) : isOnline ? (
                  <span className="text-emerald-500 font-medium">Active now</span>
                ) : (
                  "Direct Message"
                )}
              </p>
            )}
          </div>
        </button>
      </div>

      {/* Action buttons (uncluttered on mobile, full on tablet/desktop) */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {onViewReceipt && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewReceipt}
            className="h-8 px-2 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer font-bold text-xs gap-1.5 border border-emerald-500/20 shadow-2xs"
            title="View Official Tour Ticket & Receipt"
          >
            <Receipt className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">Receipt</span>
          </Button>
        )}
        <JournalButton
          hostName={hostName}
          variant="ghost"
          className="hidden sm:inline-flex h-8 sm:h-9 px-2 sm:px-3 text-xs"
          showText={false}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onVideoCall}
          className="size-8 sm:size-9 rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 cursor-pointer transition-colors shrink-0"
          title="Start Live Video Tour"
        >
          <Video className="size-4" />
        </Button>
        {onClearChat && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearChat}
            className="hidden sm:inline-flex size-8 sm:size-9 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors shrink-0"
            title="Clear conversation on your side"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onViewProfile}
          className="size-8 sm:size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0"
          title="View profile & tour details"
        >
          <Info className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Profile Sidebar ─────────────────────────────────────────────────────────

interface ProfileSidebarProps {
  userId: string
  authUser: AuthUser | null
  activeConversation?: ConversationItem | null
  onClose: () => void
  onStartVideoCall?: () => void
  onOpenReceipt?: (booking: TourBookingInfo) => void
}

function ProfileSidebar({
  userId,
  authUser,
  activeConversation,
  onClose,
  onStartVideoCall,
  onOpenReceipt,
}: ProfileSidebarProps) {
  const [profile, setProfile] = useState<any>(null)
  const [tours, setTours] = useState<any[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<TourBookingInfo[]>([])
  const [completedBookings, setCompletedBookings] = useState<TourBookingInfo[]>([])
  const [loading, setLoading] = useState(true)

  const isHost = authUser?.role === "host"

  useEffect(() => {
    async function load() {
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()
        setProfile(prof)

        // 1. If traveler viewing host, load host's active tours
        if (!isHost) {
          const { data: tourList } = await supabase
            .from("tours")
            .select("id, title, price, currency, rating")
            .eq("host_id", userId)
            .eq("is_published", true)
            .limit(5)
          setTours(tourList ?? [])
        }

        // 2. Load all bookings between the two users
        let bookingQuery = supabase
          .from("bookings")
          .select("id, status, booking_date, booking_time, total_price, currency, guest_count, guest_name, guest_email, guest_phone, notes, status_history, created_at, tours(id, title, location)")

        if (authUser?.id && userId) {
          bookingQuery = bookingQuery
            .or(`and(guest_id.eq.${authUser.id},host_id.eq.${userId}),and(guest_id.eq.${userId},host_id.eq.${authUser.id})`)
            .order("booking_date", { ascending: true })
        }

        const { data: bDataList } = await bookingQuery

        let allBookings: TourBookingInfo[] = []
        if (bDataList && bDataList.length > 0) {
          allBookings = bDataList.map((bData) => ({
            id: bData.id,
            tour_id: (bData.tours as any)?.id,
            tour_name: (bData.tours as any)?.title || activeConversation?.tourName || "Booked Tour",
            booking_date: bData.booking_date,
            booking_time: (bData as any).booking_time,
            guest_count: bData.guest_count || 1,
            total_price: bData.total_price || 0,
            currency: bData.currency || "KES",
            status: bData.status || "confirmed",
            guest_name: bData.guest_name || prof?.full_name,
            guest_email: bData.guest_email,
            guest_phone: bData.guest_phone,
            notes: bData.notes,
            status_history: Array.isArray((bData as any).status_history) ? (bData as any).status_history : [],
            created_at: (bData as any).created_at,
          }))
        }

        // Include active conversation booking if not already fetched
        if (activeConversation?.bookingId && !allBookings.some((b) => b.id === activeConversation.bookingId)) {
          const { data: singleB } = await supabase
            .from("bookings")
            .select("id, status, booking_date, booking_time, total_price, currency, guest_count, guest_name, guest_email, guest_phone, notes, status_history, created_at, tours(id, title, location)")
            .eq("id", activeConversation.bookingId)
            .maybeSingle()
          if (singleB) {
            allBookings.push({
              id: singleB.id,
              tour_id: (singleB.tours as any)?.id,
              tour_name: (singleB.tours as any)?.title || activeConversation?.tourName || "Booked Tour",
              booking_date: singleB.booking_date,
              booking_time: (singleB as any).booking_time,
              guest_count: singleB.guest_count || 1,
              total_price: singleB.total_price || 0,
              currency: singleB.currency || "KES",
              status: singleB.status || "confirmed",
              guest_name: singleB.guest_name || prof?.full_name,
              guest_email: singleB.guest_email,
              guest_phone: singleB.guest_phone,
              notes: singleB.notes,
              status_history: Array.isArray((singleB as any).status_history) ? (singleB as any).status_history : [],
              created_at: (singleB as any).created_at,
            })
          }
        }

        const upcoming = allBookings.filter(
          (b) => b.status?.toLowerCase() !== "completed" && b.status?.toLowerCase() !== "cancelled"
        )
        const completed = allBookings.filter(
          (b) => b.status?.toLowerCase() === "completed"
        )

        setUpcomingBookings(upcoming)
        setCompletedBookings(completed)
      } catch (err) {
        console.error("ProfileSidebar load error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, isHost, authUser?.id, activeConversation?.bookingId, activeConversation?.tourName])

  const handleCompleteTour = async (bookingId: string) => {
    const toastId = toast.loading("Confirming tour completion…")
    try {
      const target = upcomingBookings.find((b) => b.id === bookingId)
      const now = new Date().toISOString()
      const currentHistory = Array.isArray(target?.status_history) ? target.status_history : []
      const updatedHistory = [...currentHistory, { status: "completed", changed_at: now }]

      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed", status_history: updatedHistory })
        .eq("id", bookingId)

      if (error) throw error

      if (target) {
        const updatedBooking: TourBookingInfo = {
          ...target,
          status: "completed",
          status_history: updatedHistory,
        }
        // Remove from upcoming line of tours and move to completed
        setUpcomingBookings((prev) => prev.filter((b) => b.id !== bookingId))
        setCompletedBookings((prev) => [updatedBooking, ...prev])
      }

      toast.dismiss(toastId)
      toast.success("Tour marked as completed and removed from pending line!")

      if (activeConversation?.id && authUser?.id && userId && target) {
        await supabase.from("messages").insert({
          conversation_id: activeConversation.id,
          sender_id: authUser.id,
          receiver_id: userId,
          message: "🎉 Tour has been confirmed as completed! Official service invoice & receipt generated.",
          read: false,
          sender_type: "host",
          notification_type: "tour_completed",
          metadata: {
            type: "tour_completed",
            booking_id: target.id,
            tour_name: target.tour_name,
            host_name: authUser.full_name || "Host",
            traveler_name: target.guest_name || profile?.full_name || "Traveler",
            date: target.booking_date,
            time: target.booking_time,
            amount: target.total_price,
            currency: target.currency || "KES",
            completed_at: now,
          },
          booking_id: target.id,
        })
      }
    } catch (e: any) {
      toast.dismiss(toastId)
      toast.error(e.message || "Failed to update booking status.")
    }
  }

  return (
    <div className="w-80 shrink-0 border-l border-border/60 bg-card flex flex-col h-full overflow-hidden shadow-modern">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0 bg-muted/20">
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          {isHost ? (
            <>
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Traveler &amp; Tour Receipt</span>
            </>
          ) : (
            <span>Host Profile</span>
          )}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-8 rounded-full text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : !profile ? (
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
          Profile unavailable
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* User Profile Header Card */}
          <div className="flex flex-col items-center gap-3 px-4 py-5 border-b border-border/60 bg-card/60">
            <Avatar className="size-18 border-2 border-primary/30 ring-4 ring-primary/10">
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} className="object-cover" />
              )}
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-brand-light/20 text-primary font-bold text-xl">
                {initials(profile.full_name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-bold text-foreground text-base">{profile.full_name}</h3>
              {profile.location && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <MapPin className="size-3 text-primary" />
                  <span>{profile.location}</span>
                </p>
              )}
              {isHost ? (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                  {upcomingBookings.length > 0 ? "Verified Traveler" : "Ausaguide Traveler"}
                </span>
              ) : profile.host_tier && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                  {profile.host_tier === "certified_guide" ? (
                    <>
                      <Award className="size-3" />
                      <span>Certified Guide</span>
                    </>
                  ) : (
                    <span>Local Host</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Traveler Bio */}
          {profile.bio && (
            <div className="px-4 py-3.5 border-b border-border/60">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Bio</p>
              <p className="text-xs text-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* If Host viewing Traveler: Show Pending & Upcoming Tours (Line of Tours to Come) */}
          {isHost && (
            <div className="border-b border-border/60">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/40">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>Line of Tours to Come</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {upcomingBookings.length} {upcomingBookings.length === 1 ? "tour" : "tours"}
                </span>
              </div>

              {upcomingBookings.length > 0 ? (
                <div className="space-y-3 p-3">
                  {upcomingBookings.map((b, idx) => (
                    <div key={b.id} className="space-y-2">
                      <HostTourBookingDetails
                        booking={b}
                        isHost={true}
                        priorityNumber={idx + 1}
                        onViewReceipt={() => onOpenReceipt ? onOpenReceipt(b) : undefined}
                        onStartVideoCall={onStartVideoCall}
                        onConfirmCompletion={() => handleCompleteTour(b.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center space-y-1.5">
                  <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="size-4" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">No Pending Tours in Line</p>
                  <p className="text-[11px] text-muted-foreground">All scheduled tours with this traveler have been completed.</p>
                </div>
              )}
            </div>
          )}

          {/* Completed Tours / Receipts section */}
          {isHost && completedBookings.length > 0 && (
            <div className="p-3 border-b border-border/60">
              <div className="flex items-center justify-between px-1 py-2 mb-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="size-3.5 text-emerald-600" />
                  <span>Completed Receipts</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                  {completedBookings.length}
                </span>
              </div>
              <div className="space-y-3">
                {completedBookings.map((b) => (
                  <HostTourBookingDetails
                    key={b.id}
                    booking={b}
                    isHost={true}
                    onViewReceipt={() => onOpenReceipt ? onOpenReceipt(b) : undefined}
                    onStartVideoCall={onStartVideoCall}
                  />
                ))}
              </div>
            </div>
          )}

          {/* If Traveler viewing Host: show Host's tours and any upcoming booking */}
          {!isHost && (
            <>
              {upcomingBookings.length > 0 && (
                <div className="p-3 border-b border-border/60">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 px-1">
                    Your Booked Tour
                  </p>
                  {upcomingBookings.map((b, idx) => (
                    <HostTourBookingDetails
                      key={b.id}
                      booking={b}
                      isHost={false}
                      priorityNumber={idx + 1}
                      onViewReceipt={() => onOpenReceipt ? onOpenReceipt(b) : undefined}
                      onStartVideoCall={onStartVideoCall}
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-px bg-border/60 border-b border-border/60">
                <div className="bg-card px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Tours</p>
                  <p className="text-lg font-bold text-foreground">{tours.length}</p>
                </div>
                <div className="bg-card px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-lg font-bold text-foreground">
                    {tours.length
                      ? (tours.reduce((acc, t) => acc + (t.rating || 0), 0) / tours.length).toFixed(1)
                      : "—"}
                  </p>
                </div>
              </div>

              {tours.length > 0 && (
                <div className="px-4 py-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Active Tours
                  </p>
                  <div className="space-y-2">
                    {tours.map((t) => (
                      <a
                        key={t.id}
                        href={`/tours/${t.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60 hover:bg-muted transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground truncate max-w-[140px]">{t.title}</span>
                        <span className="text-xs font-bold text-primary shrink-0 ml-2">
                          {t.currency} {t.price}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { conversationId: routeConvId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const paramBookingId = searchParams.get("bookingId") || ""
  const paramUserId = searchParams.get("userId") || ""
  const preselectedConvId = routeConvId || searchParams.get("conversationId") || searchParams.get("chatId") || ""

  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [selectedConvId, setSelectedConvId] = useState<string>(preselectedConvId)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<"all" | "direct" | "tours">("all")
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [mobileView, setMobileView] = useState<"list" | "chat">(
    preselectedConvId || paramBookingId || paramUserId ? "chat" : "list"
  )
  const [showProfile, setShowProfile] = useState(false)
  const [otherTyping] = useState(false)
  const [connections, setConnections] = useState<ReachableConnection[]>([])
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  // Load the authenticated user
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", data.user.id)
        .maybeSingle()
      setAuthUser({
        id: data.user.id,
        role: (profile?.role as AuthUser["role"]) || "user",
        full_name: profile?.full_name || data.user.user_metadata?.full_name || "User",
      })
    })
  }, [])

  const {
    conversations,
    loading: convsLoading,
    refreshConversations,
  } = useConversations(authUser?.id ?? null)
  const { isUserOnline } = useRealtimePresence(authUser?.id ?? null)
  const [fallbackConv, setFallbackConv] = useState<ConversationItem | null>(null)
  const [activeCallUrl, setActiveCallUrl] = useState<string | null>(null)
  const [isCallOverlayOpen, setIsCallOverlayOpen] = useState(false)
  const [showPostCallReview, setShowPostCallReview] = useState(false)

  // Handle ?userId=... direct messaging from profile / follow actions
  useEffect(() => {
    if (!authUser?.id || !paramUserId || paramUserId === authUser.id) return

    async function initUserChat() {
      try {
        const { id: directConvId } = await findOrCreateDirectConversation(authUser!.id, paramUserId)
        setSelectedConvId(directConvId)
        setMobileView("chat")
        await refreshConversations()
      } catch (err) {
        console.error("Failed to start direct conversation with user:", err)
      }
    }
    initUserChat()
  }, [authUser?.id, paramUserId, refreshConversations])

  // Load reachable connections and pending requests count
  useEffect(() => {
    if (!authUser?.id) return

    async function loadSocialContext() {
      try {
        const [connList, pendingList] = await Promise.all([
          fetchReachableConnections(authUser!.id),
          fetchPendingFollowRequests(authUser!.id),
        ])
        setConnections(connList)
        setPendingRequestsCount(pendingList.length)
      } catch (err) {
        console.warn("[MessagesPage] Social context notice:", err)
      }
    }
    loadSocialContext()
  }, [authUser?.id])

  // ── Auto-Inject Verified Booking Receipt at start of chat ────────────────
  const ensureBookingReceiptMessageInChat = async (conversationId: string, bookingId: string) => {
    if (!conversationId || !bookingId) return
    try {
      // 1. Check if a receipt / request message for this booking already exists in this conversation
      const { data: existing } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .or(`booking_id.eq.${bookingId},notification_type.eq.booking_request,notification_type.eq.booking_receipt`)
        .limit(1)
        .maybeSingle()

      if (existing?.id) return // Already present in conversation

      // 2. Fetch booking and tour data
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, host_id, guest_id, guest_name, booking_date, booking_time, guest_count, total_price, currency, status, tours:tour_id(title)")
        .eq("id", bookingId)
        .maybeSingle()

      if (!booking) return

      const tourTitle = (booking.tours as any)?.title || activeConv?.tourName || "Tour Experience"

      // 3. Insert the verified booking receipt system card into chat
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: null,
        receiver_id: booking.host_id,
        message: `📋 Verified Tour Booking Receipt for "${tourTitle}" — Traveler: ${booking.guest_name || "Guest"}, Date: ${booking.booking_date}${booking.booking_time ? ` at ${booking.booking_time}` : ""}, ${booking.guest_count} guest(s), Total: ${booking.currency || "KES"} ${booking.total_price}.`,
        read: false,
        sender_type: "system",
        notification_type: "booking_request",
        booking_id: booking.id,
        metadata: {
          type: "booking_request",
          booking_id: booking.id,
          tour_name: tourTitle,
          traveler_name: booking.guest_name || "Traveler",
          date: booking.booking_date,
          time: booking.booking_time,
          guests: booking.guest_count,
          amount: booking.total_price,
          currency: booking.currency || "KES",
          status: booking.status || "confirmed",
        },
      })

      window.dispatchEvent(new CustomEvent("refresh-chat-messages"))
    } catch (err) {
      console.warn("[ensureBookingReceiptMessageInChat] Notice:", err)
    }
  }

  // Handle ?bookingId=... from bookings/dashboard
  useEffect(() => {
    if (!authUser?.id || !paramBookingId) return

    async function initBookingChat() {
      try {
        const { data: bData } = await supabase
          .from("bookings")
          .select("id, guest_id, host_id")
          .eq("id", paramBookingId)
          .maybeSingle()

        if (!bData) return

        const otherUserId = bData.guest_id === authUser!.id ? bData.host_id : bData.guest_id
        if (!otherUserId) return

        const { id: convId } = await findOrCreateDirectConversation(authUser!.id, otherUserId)
        setSelectedConvId(convId)
        setMobileView("chat")
        await ensureBookingReceiptMessageInChat(convId, paramBookingId)
        await refreshConversations()
      } catch (err) {
        console.error("Failed to start booking conversation:", err)
      }
    }
    initBookingChat()
  }, [authUser?.id, paramBookingId, refreshConversations])

  // Load fallback conversation details if selectedConvId is not in conversations list yet
  useEffect(() => {
    if (!selectedConvId || !authUser?.id) {
      setFallbackConv(null)
      return
    }

    const found = conversations.find((c) => c.id === selectedConvId)
    if (found) {
      setFallbackConv(null)
      return
    }

    let isMounted = true
    async function loadFallback() {
      try {
        const { data: convData } = await supabase
          .from("conversations")
          .select("id, participant_a, participant_b, created_at")
          .eq("id", selectedConvId)
          .maybeSingle()

        if (!convData || !isMounted) return

        const otherId = convData.participant_a === authUser!.id ? convData.participant_b : convData.participant_a
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, host_tier, bio")
          .eq("id", otherId)
          .maybeSingle()

        if (!isMounted) return

        setFallbackConv({
          id: convData.id,
          participant_a: convData.participant_a,
          participant_b: convData.participant_b,
          last_message: null,
          last_message_at: convData.created_at,
          created_at: convData.created_at,
          isDirect: true,
          bookingId: null,
          bookingStatus: null,
          other: (profData as Participant) || {
            id: otherId,
            full_name: "Ausaguide User",
            avatar_url: null,
            host_tier: null,
          },
          unreadCount: 0,
        })
      } catch (err) {
        console.warn("[MessagesPage] Fallback conversation fetch error:", err)
      }
    }

    loadFallback()
    return () => {
      isMounted = false
    }
  }, [selectedConvId, conversations, authUser?.id])

  // Auto-select conversation based on route params, query params, or first item
  useEffect(() => {
    if (conversations.length === 0) return

    if (paramBookingId) {
      const matchByBooking = conversations.find((c) => c.bookingId === paramBookingId)
      if (matchByBooking) {
        setSelectedConvId(matchByBooking.id)
        setMobileView("chat")
        return
      }
    }

    if (preselectedConvId) {
      const matchById = conversations.find((c) => c.id === preselectedConvId)
      if (matchById) {
        setSelectedConvId(matchById.id)
        setMobileView("chat")
        return
      }
    }

    if (!selectedConvId && conversations.length > 0 && !paramUserId) {
      setSelectedConvId(conversations[0].id)
    }
  }, [conversations, preselectedConvId, paramBookingId, paramUserId, selectedConvId])

  const selectedConv = conversations.find((c) => c.id === selectedConvId)
  const activeConv = selectedConv || fallbackConv

  // Receipt & Ticket Modal state
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<TourBookingInfo | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  // Chronological Priority Queue Calculation for Upcoming Tours (Host / Traveler)
  const upcomingTourPriorityMap = new Map<string, number>()
  const upcomingConvs = conversations
    .filter(
      (c) =>
        c.bookingDate &&
        c.bookingStatus?.toLowerCase() !== "completed" &&
        c.bookingStatus?.toLowerCase() !== "cancelled"
    )
    .sort((a, b) => {
      const tA = new Date(`${a.bookingDate}T${a.bookingTime || "09:00"}`).getTime()
      const tB = new Date(`${b.bookingDate}T${b.bookingTime || "09:00"}`).getTime()
      return tA - tB
    })

  upcomingConvs.forEach((c, idx) => {
    upcomingTourPriorityMap.set(c.id, idx + 1)
  })

  const handleOpenReceipt = async (bookingOverride?: TourBookingInfo | null) => {
    if (bookingOverride) {
      setSelectedReceiptBooking(bookingOverride)
      setIsReceiptModalOpen(true)
      return
    }

    if (activeConv?.bookingId) {
      try {
        const { data: bData } = await supabase
          .from("bookings")
          .select("id, status, booking_date, booking_time, total_price, currency, guest_count, guest_name, guest_email, guest_phone, notes, status_history, created_at, payment_id, tours(id, title, location)")
          .eq("id", activeConv.bookingId)
          .maybeSingle()

        if (bData) {
          setSelectedReceiptBooking({
            id: bData.id,
            tour_id: (bData.tours as any)?.id,
            tour_name: (bData.tours as any)?.title || activeConv.tourName || "Booked Tour",
            booking_date: bData.booking_date,
            booking_time: (bData as any).booking_time,
            guest_count: bData.guest_count || 1,
            total_price: bData.total_price || 0,
            currency: bData.currency || "KES",
            status: bData.status || "confirmed",
            payment_id: (bData as any).payment_id,
            guest_name: bData.guest_name || activeConv.other.full_name,
            guest_email: bData.guest_email,
            guest_phone: bData.guest_phone,
            notes: bData.notes,
            status_history: Array.isArray((bData as any).status_history) ? (bData as any).status_history : [],
            created_at: (bData as any).created_at,
          })
          setIsReceiptModalOpen(true)
          return
        }
      } catch (err) {
        console.warn("Could not fetch booking for receipt:", err)
      }
    }

    if (activeConv) {
      setSelectedReceiptBooking({
        id: activeConv.bookingId || `TICKET-${activeConv.id.slice(0, 8).toUpperCase()}`,
        tour_name: activeConv.tourName || "Ausaguide Experience",
        booking_date: activeConv.bookingDate || new Date().toISOString(),
        booking_time: activeConv.bookingTime || "09:00",
        guest_count: activeConv.guestCount || 1,
        total_price: activeConv.totalPrice || 0,
        currency: activeConv.currency || "KES",
        status: activeConv.bookingStatus || "confirmed",
        guest_name: activeConv.guestName || activeConv.other.full_name,
        guest_email: activeConv.guestEmail,
        guest_phone: activeConv.guestPhone,
        notes: activeConv.bookingNotes,
        created_at: activeConv.created_at,
      })
      setIsReceiptModalOpen(true)
    }
  }

  // Automatically ensure receipt is in chat whenever an active conversation has an associated booking
  useEffect(() => {
    const bookingIdToEnsure = activeConv?.bookingId || paramBookingId
    if (selectedConvId && bookingIdToEnsure) {
      ensureBookingReceiptMessageInChat(selectedConvId, bookingIdToEnsure)
    }
  }, [selectedConvId, activeConv?.bookingId, paramBookingId])

  const handleSelectConversation = (convId: string) => {
    setSelectedConvId(convId)
    setMobileView("chat")
    setShowProfile(false)
    navigate(`/messages/${convId}`, { replace: true })
  }

  const handleBack = () => {
    setMobileView("list")
    setShowProfile(false)
  }

  const handleClearChat = async () => {
    if (!selectedConvId || !authUser?.id) return
    if (!confirm("Are you sure you want to clear your sent messages in this conversation?")) return

    const toastId = toast.loading("Clearing messages…")
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", selectedConvId)
        .eq("sender_id", authUser.id)

      toast.dismiss(toastId)
      if (error) throw error
      toast.success("Messages cleared on your side.")
      window.dispatchEvent(new CustomEvent("refresh-chat-messages"))
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err.message || "Failed to clear messages.")
    }
  }

  const handleVideoCall = async (customRoomUrl?: string) => {
    if (!selectedConvId || !authUser || !otherUserId) return
    const loadingToast = toast.loading("Launching live video room…")
    try {
      const roomUrl = customRoomUrl || (await createGeneralDailyRoom(selectedConvId))
      toast.dismiss(loadingToast)

      // Post video room invite into conversation if creating a fresh room
      if (!customRoomUrl) {
        try {
          const senderType = authUser.role === "host" ? "host" : authUser.role === "traveler" ? "traveler" : "user"
          await supabase.from("messages").insert({
            conversation_id: selectedConvId,
            sender_id: authUser.id,
            receiver_id: otherUserId,
            message: `📹 I've started a live video meeting room: ${roomUrl}`,
            read: false,
            sender_type: senderType,
            notification_type: "daily_room_shared",
            metadata: {
              type: "daily_room_shared",
              daily_room_url: roomUrl,
              shared_by_name: authUser.full_name || (authUser.role === "host" ? "Host" : "Traveler"),
            },
            ...(activeConv?.bookingId ? { booking_id: activeConv.bookingId } : {}),
          })
        } catch (_) {}
      }

      setActiveCallUrl(roomUrl)
      setIsCallOverlayOpen(true)
    } catch (err: any) {
      toast.dismiss(loadingToast)
      toast.error(err.message || "Failed to start video call.")
    }
  }

  const handleEndCall = async () => {
    setIsCallOverlayOpen(false)
    setActiveCallUrl(null)

    // Insert automatic post-call ended note
    if (selectedConvId && authUser && otherUserId) {
      try {
        const senderType = authUser.role === "host" ? "host" : authUser.role === "traveler" ? "traveler" : "user"
        await supabase.from("messages").insert({
          conversation_id: selectedConvId,
          sender_id: authUser.id,
          receiver_id: otherUserId,
          message: "🎬 Virtual tour call ended. Thank you for connecting on Ausaguide!",
          read: false,
          sender_type: senderType,
          metadata: {
            type: "call_ended",
            ended_at: new Date().toISOString(),
          },
          ...(activeConv?.bookingId ? { booking_id: activeConv.bookingId } : {}),
        })
      } catch (e) {
        console.warn("Could not post call ended message:", e)
      }
    }

    // Traveler gets automatic review modal popup
    if (authUser?.role === "traveler") {
      setShowPostCallReview(true)
    } else if (authUser?.role === "host") {
      toast.success("Call ended. You can confirm tour completion in the sidebar receipt.")
    }
  }

  if (!authUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const otherUserId = activeConv
    ? activeConv.participant_a === authUser.id
      ? activeConv.participant_b
      : activeConv.participant_a
    : null

  return (
    <div className="flex h-[100dvh] md:h-screen bg-background overflow-hidden">

      {/* ── Conversation Sidebar ───────────────────────────────────────── */}
      <aside
        className={cn(
          "w-full md:w-[320px] xl:w-[360px] shrink-0",
          "flex flex-col border-r border-border/60 bg-card",
          "md:flex",
          mobileView === "chat" ? "hidden" : "flex"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 bg-card/95 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(authUser.role === "host" ? "/host/dashboard" : "/dashboard")}
              title="Back to Dashboard"
              className="size-8 rounded-xl bg-muted/60 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MessageSquare className="size-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Messages</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsNewChatOpen(true)}
              className="h-8 rounded-full px-3 text-xs font-bold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>New Chat</span>
            </Button>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
              {conversations.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-muted/60 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-3 pb-2.5 border-b border-border/40 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All ({conversations.length})
          </button>
          <button
            onClick={() => setActiveCategory("direct")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0",
              activeCategory === "direct"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Direct ({conversations.filter((c) => c.isDirect).length})
          </button>
          <button
            onClick={() => setActiveCategory("tours")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0",
              activeCategory === "tours"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Tours & Bookings ({conversations.filter((c) => !c.isDirect).length})
          </button>
        </div>

        {/* Follow Requests Alert Banner */}
        {pendingRequestsCount > 0 && (
          <div className="px-3 pt-2.5">
            <Link
              to="/follow-requests"
              className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/15 transition-all"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="size-3.5" />
                <span>
                  {pendingRequestsCount} pending follow {pendingRequestsCount === 1 ? "request" : "requests"}
                </span>
              </div>
              <span className="text-[10px] underline font-bold">Review</span>
            </Link>
          </div>
        )}

        {/* Reachable Connections Strip */}
        {connections.length > 0 && (
          <div className="px-3 pt-3 pb-1 border-b border-border/40 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="size-3 text-primary" />
                <span>Connections ({connections.length})</span>
              </span>
              <Link to="/follow-requests" className="text-[10px] text-primary hover:underline font-semibold">
                Manage
              </Link>
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {connections.map((c) => {
                const online = isUserOnline(c.user_id)
                return (
                  <button
                    key={c.user_id}
                    onClick={async () => {
                      if (!authUser) return
                      if (c.conversation_id) {
                        handleSelectConversation(c.conversation_id)
                      } else {
                        const { id: newConvId } = await findOrCreateDirectConversation(authUser.id, c.user_id)
                        handleSelectConversation(newConvId)
                      }
                    }}
                    className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                    title={`Message ${c.full_name}`}
                  >
                    <div className="relative">
                      <Avatar className="size-10 border border-border group-hover:border-primary transition-colors">
                        <AvatarImage src={c.avatar_url || undefined} alt={c.full_name} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {initials(c.full_name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      {online && (
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground truncate max-w-[52px]">
                      {c.full_name.split(" ")[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {convsLoading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
              <MessageSquare className="size-12 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-semibold text-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Start a direct chat with any guide or host, or explore tours.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[200px]">
                <Button
                  onClick={() => setIsNewChatOpen(true)}
                  className="rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition min-h-[36px] gap-1.5"
                >
                  <Plus className="size-3.5" />
                  New Message
                </Button>
                {authUser.role === "traveler" && (
                  <Link
                    to="/tours"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-border/60 bg-muted/60 text-foreground font-semibold text-xs hover:bg-muted transition min-h-[36px]"
                  >
                    <Compass className="size-3.5 text-primary" />
                    Explore Tours
                  </Link>
                )}
              </div>
            </div>
          ) : (
            conversations
              .filter((c) => {
                if (activeCategory === "direct") return c.isDirect
                if (activeCategory === "tours") return !c.isDirect
                return true
              })
              .filter(
                (c) =>
                  (c.other?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (c.last_message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (c.tourName || "").toLowerCase().includes(searchQuery.toLowerCase())
              )
              .sort((a, b) => {
                if (activeCategory === "tours") {
                  const pA = upcomingTourPriorityMap.get(a.id) || 9999
                  const pB = upcomingTourPriorityMap.get(b.id) || 9999
                  if (pA !== pB) return pA - pB
                }
                return 0
              })
              .map((conv) => {
                const isSelected = conv.id === selectedConvId
                const online = isUserOnline(conv.other.id)
                const priorityNum = upcomingTourPriorityMap.get(conv.id)

                return (
                  <div key={conv.id} className="relative group/conv">
                    <button
                      id={`conv-item-${conv.id}`}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 border-b border-border/40 pr-10 cursor-pointer",
                        isSelected
                          ? "bg-primary/[0.08] border-r-2 border-r-primary"
                          : "hover:bg-muted/60"
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="size-11 border border-border/60">
                          {conv.other.avatar_url && (
                            <AvatarImage src={conv.other.avatar_url} alt={conv.other.full_name} className="object-cover" />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-brand-light/10 text-primary font-bold text-sm">
                            {initials(conv.other.full_name || "U")}
                          </AvatarFallback>
                        </Avatar>
                        {online && (
                          <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                        )}
                        {conv.unreadCount > 0 && !isSelected && (
                          <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-[10px] text-primary-foreground font-black flex items-center justify-center">
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={cn(
                              "text-sm truncate",
                              conv.unreadCount > 0 ? "font-bold text-foreground" : "font-semibold text-foreground/90",
                              isSelected && "text-primary"
                            )}
                          >
                            {conv.other.full_name}
                          </span>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {(() => {
                                try {
                                  const d = new Date(conv.last_message_at)
                                  const now = new Date()
                                  const diff = now.getTime() - d.getTime()
                                  if (diff < 60000) return "now"
                                  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
                                  if (d.toDateString() === now.toDateString())
                                    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  return d.toLocaleDateString([], { month: "short", day: "numeric" })
                                } catch {
                                  return ""
                                }
                              })()}
                            </span>
                          )}
                        </div>

                        {/* Tour or Direct Context */}
                        {conv.tourName ? (
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className="text-[10px] text-primary/80 font-medium truncate flex items-center gap-1">
                              <MapPin className="size-2.5 shrink-0" />
                              <span className="truncate">{conv.tourName}</span>
                            </p>
                            {priorityNum && priorityNum > 0 && (
                              <span className="shrink-0 px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-black inline-flex items-center gap-0.5">
                                <Sparkles className="size-2 text-emerald-600" />
                                #{priorityNum} Next
                              </span>
                            )}
                          </div>
                        ) : conv.isDirect ? (
                          <p className="text-[10px] text-muted-foreground/80 font-medium truncate mb-0.5 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-primary/70 inline-block" />
                            Direct Chat
                          </p>
                        ) : null}

                        <p
                          className={cn(
                            "text-xs truncate leading-tight",
                            conv.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  </div>
                )
              })
          )}
        </div>
      </aside>

      {/* ── Chat Main View ──────────────────────────────────────────────── */}
      <main
        className={cn(
          "flex-1 flex flex-col h-full overflow-hidden bg-card min-w-0",
          mobileView === "list" ? "hidden md:flex" : "flex"
        )}
      >
        {!selectedConvId || !activeConv ? (
          conversations.length > 0
            ? <NoChatSelected />
            : <EmptyConversationPane userRole={authUser.role} onNewChat={() => setIsNewChatOpen(true)} />
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <ChatHeader
              name={activeConv.other.full_name}
              avatarUrl={activeConv.other.avatar_url}
              hostTier={activeConv.other.host_tier}
              isOnline={isUserOnline(activeConv.other.id)}
              isTyping={otherTyping}
              isHostUser={authUser.role === "host"}
              tourName={activeConv.tourName}
              bookingDate={activeConv.bookingDate}
              priorityNumber={activeConv ? upcomingTourPriorityMap.get(activeConv.id) : undefined}
              onBack={handleBack}
              onVideoCall={() => handleVideoCall()}
              onViewProfile={() => setShowProfile((v) => !v)}
              onViewReceipt={() => handleOpenReceipt()}
              onClearChat={handleClearChat}
              showBack={mobileView === "chat"}
              hostName={activeConv.other.full_name}
            />

            <div className="flex flex-1 min-h-0 overflow-hidden relative">
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                {authUser && activeConv && otherUserId && (
                  <ChatWindow
                    conversationId={selectedConvId}
                    currentUserId={authUser.id}
                    currentUserName={authUser.full_name || "User"}
                    tourName={activeConv.tourName}
                    bookingId={activeConv.bookingId}
                    otherUser={{
                      id: otherUserId,
                      full_name: activeConv.other.full_name,
                      avatar_url: activeConv.other.avatar_url,
                      host_tier: activeConv.other.host_tier,
                      isOnline: isUserOnline(activeConv.other.id),
                    }}
                    currentUserRole={authUser.role}
                    showHeader={false}
                    onStartVideoCall={() => handleVideoCall()}
                    className="flex-1 min-h-0 rounded-none border-0 shadow-none bg-background"
                  />
                )}
              </div>

              {showProfile && otherUserId && (
                <div className="absolute inset-y-0 right-0 z-20 bg-card shadow-2xl lg:static lg:flex lg:shadow-none animate-in slide-in-from-right duration-200">
                  <ProfileSidebar
                    userId={otherUserId}
                    authUser={authUser}
                    activeConversation={activeConv}
                    onStartVideoCall={() => handleVideoCall()}
                    onOpenReceipt={(b) => handleOpenReceipt(b)}
                    onClose={() => setShowProfile(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Daily In-App Video Call Overlay ──────────────────────────────── */}
      {activeCallUrl && (
        <DailyCallOverlay
          isOpen={isCallOverlayOpen}
          roomUrl={activeCallUrl}
          callerName={activeConv?.other.full_name || "Live Video Room"}
          tourName={activeConv?.tourName}
          onEndCall={handleEndCall}
          isHost={authUser?.role === "host"}
        />
      )}

      {/* ── Post-Call Automatic Review Modal ─────────────────────────────── */}
      {authUser && otherUserId && (
        <PostCallReviewModal
          isOpen={showPostCallReview}
          onClose={() => setShowPostCallReview(false)}
          hostName={activeConv?.other.full_name || "Host"}
          hostId={otherUserId}
          tourName={activeConv?.tourName}
          bookingId={activeConv?.bookingId}
          currentUserId={authUser.id}
        />
      )}

      {/* ── Official Tour Ticket & Receipt Modal ─────────────────────────── */}
      {selectedReceiptBooking && (
        <TourReceiptTicketModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          booking={selectedReceiptBooking}
          hostName={activeConv?.other.full_name || "Host"}
          travelerName={selectedReceiptBooking.guest_name || activeConv?.other.full_name || "Traveler"}
          priorityNumber={activeConv ? upcomingTourPriorityMap.get(activeConv.id) : undefined}
          isHost={authUser?.role === "host"}
        />
      )}

      {/* ── New Chat Dialog ──────────────────────────────────────────────── */}
      {authUser && (
        <NewChatDialog
          isOpen={isNewChatOpen}
          onOpenChange={setIsNewChatOpen}
          currentUserId={authUser.id}
          onSelectConversation={handleSelectConversation}
        />
      )}
    </div>
  )
}
