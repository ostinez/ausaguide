import { useEffect, useState, useRef } from "react"
import { Bell, BellDot, Clock, Check, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "@/lib/api/notifications"
import { formatDistanceToNow } from "date-fns"

export default function NotificationBell() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const userId = localStorage.getItem("user_id")
  const userRole = localStorage.getItem("user_role") || "traveler"
  
  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => n && !n.read).length
    : 0

  async function loadNotifications() {
    if (!userId) return
    try {
      setLoading(true)
      const data = await fetchNotifications(userId)
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load notifications:", err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()

    if (!userId) return

    // Use a unique channel name per mount to avoid the Supabase channel-reuse
    // error: "cannot add postgres_changes callbacks after subscribe()".
    // The timestamp suffix ensures a fresh channel even on strict-mode double-mount.
    const channelName = `user-notifications-${userId}-${Date.now()}`

    // Remove any pre-existing channel with the same base name to prevent leaks
    const existingChannels = supabase.getChannels()
    existingChannels
      .filter((ch) => ch.topic.includes(`user-notifications-${userId}`))
      .forEach((ch) => supabase.removeChannel(ch))

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleNotificationClick(notif: Notification) {
    if (!notif) return
    setIsOpen(false)
    if (!notif.read) {
      try {
        await markAsRead(notif.id)
        setNotifications((prev) =>
          (prev || []).map((n) => (n && n.id === notif.id ? { ...n, read: true } : n))
        )
      } catch (err) {
        console.error("Failed to mark read:", err)
      }
    }

    if (notif.booking_id) {
      if (userRole === "host") {
        navigate(`/dashboard?tab=bookings`)
      } else {
        navigate(`/confirmation/${notif.booking_id}`)
      }
    } else {
      navigate("/dashboard")
    }
  }

  async function handleMarkAllAsRead() {
    if (!userId) return
    try {
      await markAllAsRead(userId)
      setNotifications((prev) => (prev || []).map((n) => n ? { ...n, read: true } : n))
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-full hover:bg-accent/ text-foreground transition-all duration-300 focus:outline-none"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <>
            <BellDot className="size-5 text-teal animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-lg">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell className="size-5 text-muted-foreground hover:text-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-20 sm:top-auto left-4 right-4 sm:left-auto sm:right-0 mt-2.5 w-auto sm:w-96 rounded-2xl border border-primary/20 bg-card p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/80">
            <span className="font-bold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-primary-foreground font-semibold flex items-center gap-1 hover:underline"
              >
                <Check className="size-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="mt-2 space-y-1.5 max-h-80 overflow-y-auto">
            {loading && (!notifications || notifications.length === 0) ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                Loading...
              </div>
            ) : (!notifications || notifications.length === 0) ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => {
                if (!notif) return null
                return (
                  <div
                    key={notif.id || Math.random().toString()}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-primary/10 border ${
                      notif.read
                        ? "border-transparent bg-transparent text-muted-foreground"
                        : "border-primary/20 bg-primary/5 text-foreground font-medium"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs break-words">{notif.message || ""}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="size-3" />
                        <span>
                          {(() => {
                            try {
                              if (!notif.created_at) return "recently"
                              const d = new Date(notif.created_at)
                              if (isNaN(d.getTime())) return "recently"
                              return formatDistanceToNow(d, { addSuffix: true })
                            } catch {
                              return "recently"
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                    {!notif.read && (
                      <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_8px_#8b5cf6]" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
