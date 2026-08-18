import { useEffect, useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  UserCheck,
  UserX,
  Users,
  UserPlus,
  MessageSquare,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  fetchPendingFollowRequests,
  acceptFollowRequest,
  declineFollowRequest,
  fetchFollowers,
  fetchFollowing,
  type FollowRequestItem,
} from "@/lib/api/follows"
import { FollowButton } from "@/components/common/FollowButton"
import { useSEO } from "@/hooks/useSEO"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function FollowRequestsPage() {
  useSEO({
    title: "Follow Requests & Connections | Ausaguide",
    description: "Manage your incoming follow requests and connected travelers and hosts.",
  })

  const navigate = useNavigate()
  const currentUserId = localStorage.getItem("user_id")

  const [activeTab, setActiveTab] = useState<"requests" | "followers" | "following">("requests")
  const [requests, setRequests] = useState<FollowRequestItem[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // 1. Load data
  const loadData = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [reqData, followersData, followingData] = await Promise.all([
        fetchPendingFollowRequests(currentUserId),
        fetchFollowers(currentUserId),
        fetchFollowing(currentUserId),
      ])

      setRequests(reqData)
      setFollowers(followersData)
      setFollowing(followingData)
    } catch (err) {
      console.error("[FollowRequestsPage] Failed to load data:", err)
      toast.error("Failed to load connection data.")
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 2. Realtime listener for incoming follow requests
  useEffect(() => {
    if (!currentUserId) return

    const channelName = `follow-requests-page-${currentUserId}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${currentUserId}`,
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, loadData])

  // 3. Accept Follow Request
  const handleAccept = async (request: FollowRequestItem) => {
    if (!currentUserId) return

    setActionLoading((prev) => ({ ...prev, [request.id]: true }))
    try {
      await acceptFollowRequest(
        request.id,
        request.follower_id,
        request.following_id
      )

      toast.success(`Accepted follow request from ${request.follower.full_name}!`)
      
      // Update counts in state
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
      setFollowers((prev) => [request.follower, ...prev])
    } catch (err: any) {
      console.error("[FollowRequestsPage] Accept error:", err)
      toast.error(err.message || "Failed to accept follow request.")
    } finally {
      setActionLoading((prev) => ({ ...prev, [request.id]: false }))
    }
  }

  // 4. Decline Follow Request
  const handleDecline = async (request: FollowRequestItem) => {
    setActionLoading((prev) => ({ ...prev, [request.id]: true }))
    try {
      await declineFollowRequest(request.id)
      toast.info(`Declined follow request from ${request.follower.full_name}.`)
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
    } catch (err: any) {
      console.error("[FollowRequestsPage] Decline error:", err)
      toast.error(err.message || "Failed to decline follow request.")
    } finally {
      setActionLoading((prev) => ({ ...prev, [request.id]: false }))
    }
  }

  return (
    <div className="min-h-[85vh] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2 rounded-full min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <Link
            to="/messages"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground transition-all border border-border/60 min-h-[44px]"
          >
            <MessageSquare className="size-3.5 text-primary" />
            <span>Go to Messages</span>
          </Link>
        </div>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-modern p-6 sm:p-8 space-y-6">
        {/* Title */}
        <div className="space-y-1 border-b border-border/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="size-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-headline text-foreground">
                Connections & Requests
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-body">
                Manage your followers, follow requests, and people you follow on Ausaguide.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-muted/50 border border-border/50 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 min-h-[40px]",
              activeTab === "requests"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Requests</span>
            {requests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground">
                {requests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("followers")}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 min-h-[40px]",
              activeTab === "followers"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Followers</span>
            <span className="text-xs text-muted-foreground">({followers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("following")}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 min-h-[40px]",
              activeTab === "following"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Following</span>
            <span className="text-xs text-muted-foreground">({following.length})</span>
          </button>
        </div>

        {/* ── Content Section ────────────────────────────────────────────── */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm">Loading connections...</p>
          </div>
        ) : activeTab === "requests" ? (
          /* ── Tab 1: Pending Follow Requests ── */
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="size-14 rounded-2xl bg-muted/60 border border-border/60 mx-auto flex items-center justify-center text-muted-foreground">
                  <Clock className="size-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">No Pending Requests</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                  When someone requests to follow your private profile, their request will appear here for your approval.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => {
                  const isOperating = actionLoading[req.id]
                  const follower = req.follower

                  return (
                    <div
                      key={req.id}
                      className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Requester Information */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar className="size-12 rounded-full border border-border/80 shrink-0">
                          <AvatarImage src={follower.avatar_url || undefined} alt={follower.full_name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {follower.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={follower.role === "host" ? `/host/${follower.id}` : `/traveler/${follower.id}`}
                              className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate"
                            >
                              {follower.full_name}
                            </Link>

                            {follower.is_verified && (
                              <ShieldCheck className="size-4 text-primary shrink-0" />
                            )}

                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
                            >
                              {follower.host_type === "certified_guide"
                                ? "Guide"
                                : follower.role === "host"
                                ? "Host"
                                : "Traveler"}
                            </Badge>
                          </div>

                          {follower.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-3 text-muted-foreground/70" />
                              <span>{follower.location}</span>
                            </p>
                          )}

                          {follower.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-md pt-0.5">
                              {follower.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                        <Button
                          onClick={() => handleAccept(req)}
                          disabled={isOperating}
                          className="flex-1 sm:flex-initial gap-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm px-5 py-2 min-h-[40px]"
                        >
                          {isOperating ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="size-3.5" />
                          )}
                          <span>Accept</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleDecline(req)}
                          disabled={isOperating}
                          className="flex-1 sm:flex-initial gap-1.5 rounded-full border-border/80 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 font-medium text-xs sm:text-sm px-4 py-2 min-h-[40px]"
                        >
                          <UserX className="size-3.5" />
                          <span>Decline</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : activeTab === "followers" ? (
          /* ── Tab 2: Accepted Followers ── */
          <div className="space-y-4">
            {followers.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="size-14 rounded-2xl bg-muted/60 border border-border/60 mx-auto flex items-center justify-center text-muted-foreground">
                  <Users className="size-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">No Followers Yet</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                  When travelers or hosts follow your profile, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {followers.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar className="size-12 rounded-full border border-border/80 shrink-0">
                        <AvatarImage src={f.avatar_url || undefined} alt={f.full_name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {f.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={f.role === "host" ? `/host/${f.id}` : `/traveler/${f.id}`}
                            className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate"
                          >
                            {f.full_name}
                          </Link>
                          {f.is_verified && <ShieldCheck className="size-4 text-primary shrink-0" />}
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                            {f.role}
                          </Badge>
                        </div>
                        {f.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground/70" />
                            <span>{f.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/messages?userId=${f.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all min-h-[36px]"
                      >
                        <MessageSquare className="size-3.5" />
                        <span>Message</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Tab 3: Accounts You're Following ── */
          <div className="space-y-4">
            {following.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="size-14 rounded-2xl bg-muted/60 border border-border/60 mx-auto flex items-center justify-center text-muted-foreground">
                  <UserPlus className="size-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Not Following Anyone Yet</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                  Explore local hosts and fellow travelers to connect and explore Kenya together.
                </p>
                <div className="pt-2">
                  <Link
                    to="/tours"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-modern-glow min-h-[44px]"
                  >
                    <Sparkles className="size-4" />
                    <span>Explore Experiences</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {following.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar className="size-12 rounded-full border border-border/80 shrink-0">
                        <AvatarImage src={f.avatar_url || undefined} alt={f.full_name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {f.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={f.role === "host" ? `/host/${f.id}` : `/traveler/${f.id}`}
                            className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate"
                          >
                            {f.full_name}
                          </Link>
                          {f.is_verified && <ShieldCheck className="size-4 text-primary shrink-0" />}
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                            {f.role}
                          </Badge>
                        </div>
                        {f.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground/70" />
                            <span>{f.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/messages?userId=${f.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border/80 transition-all min-h-[36px]"
                      >
                        <MessageSquare className="size-3.5 text-primary" />
                        <span>Chat</span>
                      </Link>

                      <FollowButton
                        targetUserId={f.id}
                        targetUserName={f.full_name}
                        size="sm"
                        onStatusChange={() => loadData()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
