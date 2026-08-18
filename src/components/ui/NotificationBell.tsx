import { useEffect, useState, useRef } from "react"
import { Bell, BellDot, Clock, Check, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
 fetchNotifications,
 markAsRead,
 markAllAsRead,
 type Notification,
} from "@/lib/api/notifications"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/supabase"
import { Link } from "react-router-dom"
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

export default function NotificationBell() {
 const navigate = useNavigate()
 const [notifications, setNotifications] = useState<Notification[]>([])
 const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null)
 const [isOpen, setIsOpen] = useState(false)
 const [loading, setLoading] = useState(false)
 const dropdownRef = useRef<HTMLDivElement>(null)
 
 const userId = localStorage.getItem("user_id")
 
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
 channel.unsubscribe()
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

 // Toggle expanded state
 setExpandedNotifId(expandedNotifId === notif.id ? null : notif.id)
 }

 function handleActionClick(notif: Notification, e: React.MouseEvent) {
 e.stopPropagation()
 setIsOpen(false)

 if (notif.link) {
 navigate(notif.link)
 } else if (notif.booking_id) {
 navigate(`/messages?bookingId=${notif.booking_id}`)
 } else {
 navigate("/messages")
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
 className="relative flex items-center justify-center p-2 rounded-full hover:bg-white/10 text-foreground transition-all duration-300 focus:outline-none"
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
 <div className="fixed sm:absolute top-20 sm:top-auto left-4 right-4 sm:left-auto sm:right-0 mt-2.5 w-auto sm:w-96 rounded-2xl border border-white/10 bg-card shadow-modern p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
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
 notifications.slice(0, 10).map((notif) => {
 if (!notif) return null
 const isExpanded = expandedNotifId === notif.id
 return (
 <div
 key={notif.id || Math.random().toString()}
 onClick={() => handleNotificationClick(notif)}
 className={`group relative flex flex-col p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-primary/10 border ${
 notif.read
 ? "border-transparent bg-transparent text-muted-foreground"
 : "border-primary/20 bg-primary/5 text-foreground font-medium"
 }`}
 >
 <div className="flex items-start gap-3 w-full">
 <div className="flex-1 min-w-0">
 {notif.title && (
 <p className="text-xs font-semibold text-white mb-0.5">{notif.title}</p>
 )}
 <p className={`text-xs break-words ${isExpanded ? "" : "line-clamp-2"}`}>
 {notif.message || ""}
 </p>
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
 <div className="flex flex-col items-center gap-2 shrink-0">
 {!notif.read && (
 <span className="size-2 rounded-full bg-primary shrink-0 shadow-[0_0_8px_#0D6F73]" />
 )}
 {isExpanded ? (
 <ChevronUp className="size-3.5 text-muted-foreground" />
 ) : (
 <ChevronDown className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
 )}
 </div>
 </div>

 {isExpanded && (
 <div className="mt-2.5 pt-2.5 border-t border-white/5 flex justify-end">
 <button
 onClick={(e) => handleActionClick(notif, e)}
 className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-primary hover:bg-primary/80 rounded-lg transition-colors"
 >
 <span>Go to details</span>
 <ExternalLink className="size-3" />
 </button>
 </div>
 )}
 </div>
 )
 })
 )}
 </div>

 <div className="mt-2 pt-2 border-t border-border/80 flex justify-center">
 <Link
 to="/notifications"
 onClick={() => setIsOpen(false)}
 className="text-xs text-primary hover:text-primary-foreground font-semibold py-1 hover:underline"
 >
 View All Notifications
 </Link>
 </div>
 </div>
 )}
 </div>
 )
}
