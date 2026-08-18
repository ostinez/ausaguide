import { useState, useEffect } from "react"
import { useSearchParams, useNavigate, useParams } from "react-router-dom"
import {
  MessageSquare,
  ArrowLeft,
  Video,
  Info,
  Loader2,
  CalendarDays,
  Calendar,
  CheckCircle2,
  MapPin,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { JournalButton } from "@/components/chat/JournalButton"
import { useConversations } from "@/hooks/useConversations"
import { useRealtimePresence } from "@/lib/hooks/useRealtimePresence"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createGeneralDailyRoom } from "@/lib/api/daily"
import { Link } from "react-router-dom"

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string
  role: "traveler" | "host" | "admin" | "user"
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

function EmptyConversationPane({ userRole }: { userRole?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8 select-none">
      <div className="size-24 rounded-3xl bg-gradient-to-br from-primary/20 to-brand-light/10 border border-primary/20 flex items-center justify-center shadow-modern">
        <MessageSquare className="size-11 text-primary/70" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Your messages</h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Conversations appear here after a host accepts your booking request.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground pt-2">
        <span className="px-3 py-1.5 rounded-full bg-muted/60 border border-border/60 font-medium flex items-center gap-1.5">
          <Calendar className="size-3.5 text-primary" />
          <span>Book a tour</span>
        </span>
        <span className="px-3 py-1.5 rounded-full bg-muted/60 border border-border/60 font-medium flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span>Host accepts</span>
        </span>
        <span className="px-3 py-1.5 rounded-full bg-muted/60 border border-border/60 font-medium flex items-center gap-1.5">
          <MessageSquare className="size-3.5 text-primary" />
          <span>Chat opens</span>
        </span>
      </div>

      {userRole === "traveler" && (
        <Link
          to="/tours"
          className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-modern-glow min-h-[44px]"
        >
          Browse Tours
        </Link>
      )}
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

interface ChatHeaderProps {
  name: string
  avatarUrl: string | null
  hostTier?: string | null
  isOnline: boolean
  isTyping: boolean
  tourName?: string | null
  bookingDate?: string | null
  onBack: () => void
  onVideoCall: () => void
  onViewProfile: () => void
  showBack: boolean
  hostName: string
}

function ChatHeader({
  name,
  avatarUrl,
  hostTier,
  isOnline,
  isTyping,
  tourName,
  bookingDate,
  onBack,
  onVideoCall,
  onViewProfile,
  showBack,
  hostName,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card shrink-0 shadow-modern">
      {showBack && (
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </Button>
      )}

      <button
        onClick={onViewProfile}
        className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
        title="View profile"
      >
        <div className="relative shrink-0">
          <Avatar className="size-10 border-2 border-border/60 ring-2 ring-primary/10">
            {avatarUrl && (
              <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
            )}
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-brand-light/20 text-primary font-bold text-sm">
              {initials(name || "U")}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
          )}
        </div>

        <div className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground truncate max-w-[160px] sm:max-w-xs">
              {name}
            </span>
            {hostTier === "certified_guide" && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold flex items-center gap-1">
                <Award className="size-2.5" />
                <span>Guide</span>
              </span>
            )}
            {hostTier === "local_host" && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                Local Host
              </span>
            )}
          </div>

          {/* Booking context pill */}
          {tourName ? (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="size-2.5 shrink-0" />
              <span className="truncate max-w-[180px]">{tourName}</span>
              {bookingDate && (
                <>
                  <span className="text-border">·</span>
                  <CalendarDays className="size-2.5 shrink-0" />
                  <span>{new Date(bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-tight">
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
                "Confirmed Booking"
              )}
            </p>
          )}
        </div>
      </button>

      <div className="flex items-center gap-1 shrink-0">
        <JournalButton
          hostName={hostName}
          variant="ghost"
          className="h-9 px-2.5 sm:px-3 text-xs"
          showText={true}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onVideoCall}
          className="size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Video call"
        >
          <Video className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onViewProfile}
          className="size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          title="View profile"
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
  onClose: () => void
}

function ProfileSidebar({ userId, onClose }: ProfileSidebarProps) {
  const [profile, setProfile] = useState<any>(null)
  const [tours, setTours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()
        setProfile(prof)

        const { data: tourList } = await supabase
          .from("tours")
          .select("id, title, price, currency, rating")
          .eq("host_id", userId)
          .eq("is_published", true)
          .limit(5)
        setTours(tourList ?? [])
      } catch (err) {
        console.error("ProfileSidebar load error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  return (
    <div className="w-72 shrink-0 border-l border-border/60 bg-card flex flex-col h-full overflow-hidden shadow-modern">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
        <span className="text-sm font-semibold text-foreground">Profile</span>
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
          <div className="flex flex-col items-center gap-3 px-4 py-6 border-b border-border/60">
            <Avatar className="size-20 border-2 border-primary/30 ring-4 ring-primary/10">
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
              {profile.host_tier && (
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

          {profile.bio && (
            <div className="px-4 py-4 border-b border-border/60">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bio</p>
              <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
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
  const preselectedConvId = routeConvId || searchParams.get("conversationId") || searchParams.get("chatId") || ""

  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [selectedConvId, setSelectedConvId] = useState<string>(preselectedConvId)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileView, setMobileView] = useState<"list" | "chat">(
    preselectedConvId || paramBookingId ? "chat" : "list"
  )
  const [showProfile, setShowProfile] = useState(false)
  const [otherTyping] = useState(false)

  // Load the authenticated user
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle()
      setAuthUser({
        id: data.user.id,
        role: (profile?.role as AuthUser["role"]) || "user",
      })
    })
  }, [])

  const { conversations, loading: convsLoading } = useConversations(authUser?.id ?? null)
  const { isUserOnline } = useRealtimePresence(authUser?.id ?? null)

  // Auto-select conversation based on route params, query params, or first item
  useEffect(() => {
    if (conversations.length === 0) return

    // 1. If bookingId is provided, find conversation by bookingId
    if (paramBookingId) {
      const matchByBooking = conversations.find(c => c.bookingId === paramBookingId)
      if (matchByBooking) {
        setSelectedConvId(matchByBooking.id)
        setMobileView("chat")
        return
      }
    }

    // 2. If preselectedConvId is provided, match by ID
    if (preselectedConvId) {
      const matchById = conversations.find(c => c.id === preselectedConvId)
      if (matchById) {
        setSelectedConvId(matchById.id)
        setMobileView("chat")
        return
      }
    }

    // 3. Fallback: select first conversation if none is selected
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id)
    }
  }, [conversations, preselectedConvId, paramBookingId, selectedConvId])

  const selectedConv = conversations.find((c) => c.id === selectedConvId)

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

  const handleVideoCall = async () => {
    if (!selectedConvId) return
    const loadingToast = toast.loading("Creating video room…")
    try {
      const roomUrl = await createGeneralDailyRoom(selectedConvId)
      toast.dismiss(loadingToast)
      window.open(roomUrl, "_blank")
    } catch (err: any) {
      toast.dismiss(loadingToast)
      toast.error(err.message || "Failed to start video call.")
    }
  }

  if (!authUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background pt-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const otherUserId = selectedConv
    ? selectedConv.participant_a === authUser.id
      ? selectedConv.participant_b
      : selectedConv.participant_a
    : null

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden pt-16">

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
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/60 bg-card/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MessageSquare className="size-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Messages</h1>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/60">
            {conversations.length}
          </span>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-border/60 shrink-0">
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
                  Book a tour and once the host accepts, your chat will appear here.
                </p>
              </div>
              {authUser.role === "traveler" && (
                <Link
                  to="/tours"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition min-h-[36px]"
                >
                  Explore Tours
                </Link>
              )}
            </div>
          ) : (
            conversations
              .filter(
                (c) =>
                  (c.other?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (c.last_message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (c.tourName || "").toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((conv) => {
                const isSelected = conv.id === selectedConvId
                const online = isUserOnline(conv.other.id)

                return (
                  <button
                    key={conv.id}
                    id={`conv-item-${conv.id}`}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 border-b border-border/40",
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

                      {/* Tour context */}
                      {conv.tourName && (
                        <p className="text-[10px] text-primary/80 font-medium truncate mb-0.5 flex items-center gap-1">
                          <MapPin className="size-2.5 shrink-0" />
                          {conv.tourName}
                        </p>
                      )}

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
                )
              })
          )}
        </div>
      </aside>

      {/* ── Main Chat Panel ──────────────────────────────────────────────── */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0",
          "md:flex",
          mobileView === "list" ? "hidden" : "flex"
        )}
      >
        {!selectedConvId || !selectedConv ? (
          conversations.length > 0
            ? <NoChatSelected />
            : <EmptyConversationPane userRole={authUser.role} />
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <ChatHeader
              name={selectedConv.other.full_name}
              avatarUrl={selectedConv.other.avatar_url}
              hostTier={selectedConv.other.host_tier}
              isOnline={isUserOnline(selectedConv.other.id)}
              isTyping={otherTyping}
              tourName={selectedConv.tourName}
              bookingDate={selectedConv.bookingDate}
              onBack={handleBack}
              onVideoCall={handleVideoCall}
              onViewProfile={() => setShowProfile((v) => !v)}
              showBack={mobileView === "chat"}
              hostName={selectedConv.other.full_name}
            />

            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                {authUser && selectedConv && otherUserId && (
                  <ChatWindow
                    conversationId={selectedConvId}
                    currentUserId={authUser.id}
                    otherUser={{
                      id: otherUserId,
                      full_name: selectedConv.other.full_name,
                      avatar_url: selectedConv.other.avatar_url,
                      host_tier: selectedConv.other.host_tier,
                      isOnline: isUserOnline(selectedConv.other.id),
                    }}
                    currentUserRole={authUser.role}
                    className="flex-1 min-h-0 rounded-none border-0 shadow-none bg-background"
                  />
                )}
              </div>

              {showProfile && otherUserId && (
                <div className="hidden lg:flex">
                  <ProfileSidebar
                    userId={otherUserId}
                    onClose={() => setShowProfile(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
