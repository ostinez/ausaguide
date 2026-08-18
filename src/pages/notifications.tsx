import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, Clock, Check, Loader2, Trash2, ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import {
 fetchNotifications,
 markAsRead,
 markAllAsRead,
 type Notification,
} from "@/lib/api/notifications"
import { formatDistanceToNow } from "date-fns"
import { useSEO } from "@/hooks/useSEO"

export default function NotificationsPage() {
 useSEO({
 title: "My Notifications | Ausaguide",
 description: "View all your notifications, booking requests, and updates.",
 })

 const navigate = useNavigate()
 const [notifications, setNotifications] = useState<Notification[]>([])
 const [loading, setLoading] = useState(true)
 const userId = localStorage.getItem("user_id")
 const userRole = localStorage.getItem("user_role") || "traveler"

 async function loadNotifications() {
 if (!userId) {
 setLoading(false)
 return
 }
 try {
 setLoading(true)
 const data = await fetchNotifications(userId)
 setNotifications(data)
 } catch (err) {
 console.error("Failed to load notifications:", err)
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 loadNotifications()

 if (!userId) return

 const existingChannels = supabase.getChannels()
 existingChannels
 .filter((ch) => ch.topic.includes(`user-notifications-page-${userId}`))
 .forEach((ch) => supabase.removeChannel(ch))

 const channelName = `user-notifications-page-${userId}-${Date.now()}`
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
 channel.unsubscribe()
 supabase.removeChannel(channel)
 }
 }, [userId])

 async function handleNotificationClick(notif: Notification) {
 if (!notif.read) {
 try {
 await markAsRead(notif.id)
 setNotifications((prev) =>
 prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
 )
 } catch (err) {
 console.error("Failed to mark read:", err)
 }
 }
 }

 function handleActionClick(notif: Notification) {
 if (notif.link) {
 navigate(notif.link)
 } else if (notif.booking_id) {
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
 setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
 } catch (err) {
 console.error("Failed to mark all as read:", err)
 }
 }

 async function handleDeleteNotification(id: string, e: React.MouseEvent) {
 e.stopPropagation()
 try {
 const { error } = await supabase.from("notifications").delete().eq("id", id)
 if (error) throw error
 setNotifications((prev) => prev.filter((n) => n.id !== id))
 } catch (err) {
 console.error("Failed to delete notification:", err)
 }
 }

 if (!userId) {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
 <Bell className="size-12 text-muted-foreground/40 mb-3" />
 <h2 className="text-xl font-bold">Please sign in to see notifications</h2>
 <Button className="mt-4 rounded-full" onClick={() => navigate("/auth")}>
 Sign In
 </Button>
 </div>
 )
 }

 return (
    <div className="min-h-screen bg-background pt-24 pb-20 text-foreground">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
              title="Back"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your updates and requests</p>
            </div>
          </div>
          {notifications.some((n) => !n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="rounded-full text-xs border-border hover:bg-primary/10 hover:text-primary font-semibold"
            >
              <Check className="size-3.5 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 border border-border bg-card shadow-modern rounded-2xl p-6">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center">
              <Bell className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              We'll notify you here when you receive bookings, direct messages, or other updates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  handleNotificationClick(notif)
                  handleActionClick(notif)
                }}
                className={`relative flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 border cursor-pointer group shadow-sm ${
                  notif.read
                    ? "border-border/60 bg-card hover:bg-muted/40 text-muted-foreground"
                    : "border-primary/40 bg-card hover:border-primary text-foreground shadow-modern ring-1 ring-primary/10"
                }`}
              >
                <div className="flex-1 min-w-0">
                  {notif.title && (
                    <h3 className="text-sm font-bold text-foreground mb-1">{notif.title}</h3>
                  )}
                  <p className="text-sm break-words leading-relaxed text-foreground/90">
                    {notif.message}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                    {(notif.link || notif.booking_id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNotificationClick(notif)
                          handleActionClick(notif)
                        }}
                        className="text-primary hover:underline font-bold flex items-center gap-1"
                      >
                        Go to action <ExternalLink className="size-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start shrink-0">
                  {!notif.read && (
                    <span className="size-2.5 rounded-full bg-primary" />
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                    className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
