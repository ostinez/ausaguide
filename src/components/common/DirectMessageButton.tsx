import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useConversations } from "@/hooks/useConversations"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface DirectMessageButtonProps {
  hostId: string
  hostName?: string
  tourId?: string
  bookingId?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "icon" | "pill"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
  label?: string
  tooltipText?: string
}

export function DirectMessageButton({
  hostId,
  hostName,
  tourId,
  bookingId,
  className,
  variant = "outline",
  size,
  showLabel = true,
  label,
  tooltipText,
}: DirectMessageButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isStartingChat, setIsStartingChat] = useState(false)

  // Fetch authenticated user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const { createOrGetConversation } = useConversations(currentUserId)

  // Hide button if current user is the host themselves or if hostId is missing
  if (!hostId || (currentUserId && currentUserId === hostId)) {
    return null
  }

  const defaultLabel = label || (hostName ? `Message ${hostName.split(" ")[0]}` : "Message Host")
  const resolvedTooltip = tooltipText || (hostName ? `Chat with ${hostName}` : "Message Host")

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // If user is not authenticated, redirect to login with return path
    if (!currentUserId) {
      toast.info("Please log in to message this host.")
      const redirectUrl = encodeURIComponent(location.pathname + location.search)
      navigate(`/auth?redirect=${redirectUrl}&message=chat`)
      return
    }

    setIsStartingChat(true)
    try {
      const conversationId = await createOrGetConversation(hostId)

      if (!conversationId) {
        // Fallback: navigate to messages with hostId search param if direct ID generation fails
        let targetUrl = `/messages?hostId=${hostId}`
        if (tourId) targetUrl += `&tourId=${tourId}`
        if (bookingId) targetUrl += `&bookingId=${bookingId}`
        navigate(targetUrl)
        return
      }

      // Navigate to dedicated message conversation route
      let targetUrl = `/messages/${conversationId}`
      const params = new URLSearchParams()
      if (tourId) params.set("tourId", tourId)
      if (bookingId) params.set("bookingId", bookingId)
      if (params.toString()) {
        targetUrl += `?${params.toString()}`
      }

      navigate(targetUrl)
    } catch (err: any) {
      console.error("[DirectMessageButton] Failed to start conversation:", err)
      toast.error(err.message || "Failed to start chat. Please try again.")
    } finally {
      setIsStartingChat(false)
    }
  }

  // Icon-only circular button
  if (variant === "icon" || !showLabel) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isStartingChat}
        title={resolvedTooltip}
        aria-label={resolvedTooltip}
        className={cn(
          "inline-flex items-center justify-center size-9 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] rounded-full border border-border bg-card shadow-modern text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className
        )}
      >
        {isStartingChat ? (
          <Loader2 className="size-4 animate-spin text-primary" />
        ) : (
          <MessageSquare className="size-4 text-primary" />
        )}
      </button>
    )
  }

  // Pill badge style
  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isStartingChat}
        title={resolvedTooltip}
        aria-label={resolvedTooltip}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]",
          className
        )}
      >
        {isStartingChat ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <MessageSquare className="size-3.5" />
        )}
        <span>{defaultLabel}</span>
      </button>
    )
  }

  // Standard Button component style
  return (
    <Button
      type="button"
      variant={variant === "outline" ? "outline" : variant === "ghost" ? "ghost" : variant === "secondary" ? "secondary" : "default"}
      size={size || "sm"}
      onClick={handleClick}
      disabled={isStartingChat}
      title={resolvedTooltip}
      aria-label={resolvedTooltip}
      className={cn(
        "rounded-full gap-2 font-semibold transition-all duration-200 min-h-[40px]",
        variant === "outline" && "border-primary/40 text-primary hover:bg-primary/10 hover:border-primary",
        className
      )}
    >
      {isStartingChat ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <MessageSquare className="size-4" />
      )}
      <span>{defaultLabel}</span>
    </Button>
  )
}
