import { useState, useEffect, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { UserPlus, UserCheck, UserMinus, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import {
  getFollowStatus,
  followUser,
  unfollowUser,
  type FollowStatus,
} from "@/lib/api/follows"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface FollowButtonProps {
  targetUserId: string
  targetUserName?: string
  targetIsPrivate?: boolean
  variant?: "default" | "outline" | "pill" | "compact"
  size?: "default" | "sm" | "lg"
  className?: string
  onStatusChange?: (newStatus: FollowStatus) => void
}

export function FollowButton({
  targetUserId,
  targetUserName = "User",
  size = "default",
  className,
  onStatusChange,
}: FollowButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const [currentUserId, setCurrentUserId] = useState<string | null>(
    localStorage.getItem("user_id")
  )
  const [status, setStatus] = useState<FollowStatus>("none")
  const [loading, setLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // 1. Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setCurrentUserId(session.user.id)
      }
    })
  }, [])

  // 2. Fetch initial follow status
  const checkStatus = useCallback(async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return
    try {
      const res = await getFollowStatus(currentUserId, targetUserId)
      setStatus(res.status)
    } catch (err) {
      console.warn("[FollowButton] Fetch status error:", err)
    }
  }, [currentUserId, targetUserId])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  // 3. Realtime updates for live status changes
  useEffect(() => {
    if (!currentUserId || !targetUserId) return

    const channelName = `follow-btn-${currentUserId}-${targetUserId}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `follower_id=eq.${currentUserId}`,
        },
        (payload: any) => {
          if (payload.new?.following_id === targetUserId) {
            const nextStatus = (payload.new.status as FollowStatus) || "none"
            setStatus(nextStatus)
            if (onStatusChange) onStatusChange(nextStatus)
          } else if (payload.eventType === "DELETE") {
            setStatus("none")
            if (onStatusChange) onStatusChange("none")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, targetUserId, onStatusChange])

  // Don't render button for own profile or missing target
  if (!targetUserId || (currentUserId && currentUserId === targetUserId)) {
    return null
  }

  // 4. Handle Follow / Request Action
  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!currentUserId) {
      toast.info(`Please sign in to follow ${targetUserName}.`)
      const returnUrl = encodeURIComponent(location.pathname + location.search)
      navigate(`/auth?redirect=${returnUrl}`)
      return
    }

    setLoading(true)
    try {
      const res = await followUser(currentUserId, targetUserId)
      setStatus(res.status)
      if (onStatusChange) onStatusChange(res.status)

      if (res.status === "pending") {
        toast.success(`Follow request sent to ${targetUserName}.`)
      } else {
        toast.success(`You are now following ${targetUserName}!`)
      }
    } catch (err: any) {
      console.error("[FollowButton] Follow failed:", err)
      toast.error(err.message || "Failed to send follow request.")
    } finally {
      setLoading(false)
    }
  }

  // 5. Handle Unfollow Action
  const handleUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!currentUserId) return

    setLoading(true)
    try {
      await unfollowUser(currentUserId, targetUserId)
      setStatus("none")
      if (onStatusChange) onStatusChange("none")
      toast.success(`Unfollowed ${targetUserName}.`)
    } catch (err: any) {
      console.error("[FollowButton] Unfollow failed:", err)
      toast.error(err.message || "Failed to unfollow user.")
    } finally {
      setLoading(false)
    }
  }

  // Size styling classes
  const sizeClasses =
    size === "sm"
      ? "h-8 px-3 text-xs gap-1.5"
      : size === "lg"
      ? "h-12 px-6 text-base gap-2.5"
      : "h-10 px-4 text-sm gap-2"

  // ── Render Pending State ──────────────────────────────────────────────────
  if (status === "pending") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleUnfollow}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={loading}
        className={cn(
          "rounded-full font-medium transition-all duration-200 min-h-[36px]",
          "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-400",
          sizeClasses,
          className
        )}
        title="Click to cancel follow request"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isHovered ? (
          <>
            <UserMinus className="size-3.5 text-rose-400" />
            <span>Cancel Request</span>
          </>
        ) : (
          <>
            <Clock className="size-3.5 text-amber-400" />
            <span>Requested</span>
          </>
        )}
      </Button>
    )
  }

  // ── Render Accepted / Following State ─────────────────────────────────────
  if (status === "accepted") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleUnfollow}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={loading}
        className={cn(
          "rounded-full font-medium transition-all duration-200 min-h-[36px]",
          isHovered
            ? "border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
            : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
          sizeClasses,
          className
        )}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isHovered ? (
          <>
            <UserMinus className="size-3.5" />
            <span>Unfollow</span>
          </>
        ) : (
          <>
            <UserCheck className="size-3.5 text-primary" />
            <span>Following</span>
          </>
        )}
      </Button>
    )
  }

  // ── Render Default / Follow State ─────────────────────────────────────────
  return (
    <Button
      type="button"
      onClick={handleFollow}
      disabled={loading}
      className={cn(
        "rounded-full font-semibold transition-all duration-200 shadow-sm min-h-[36px]",
        "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-modern-glow active:scale-[0.98]",
        sizeClasses,
        className
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <>
          <UserPlus className="size-3.5" />
          <span>Follow</span>
        </>
      )}
    </Button>
  )
}
