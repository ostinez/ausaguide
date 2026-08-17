import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { Send, Search, MessageSquare, Video, Image as ImageIcon, ArrowLeft, Loader2, Star, X } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createGeneralDailyRoom } from "@/lib/api/daily"
import { useRealtimePresence } from "@/lib/hooks/useRealtimePresence"
import { BackButton } from "@/components/ui/BackButton"

// ─── Types ───────────────────────────────────────────────────────────────────
interface Participant {
 id: string
 full_name: string
 avatar_url: string | null
 host_tier: string | null
 bio?: string | null
}

interface DirectMessage {
 id: string
 conversation_id: string
 sender_id: string | null
 receiver_id: string
 message: string
 image_url: string | null
 created_at: string
 read: boolean
 sender_type?: "user" | "system"
 metadata?: {
 type?: string
 booking_id?: string
 tour_name?: string
 date?: string
 time?: string
 guests?: number
 total?: number
 currency?: string
 payment_id?: string
 confirmed_at?: string
 } | null
}

interface Conversation {
 id: string
 participant_a: string
 participant_b: string
 last_message: string | null
 last_message_at: string | null
 created_at: string
 other: Participant
 unreadCount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatMsgTime(ts: string) {
 const d = new Date(ts)
 if (isToday(d)) return format(d, "HH:mm")
 if (isYesterday(d)) return "Yesterday"
 return format(d, "MMM d")
}

function initials(name: string) {
 return name
 .split(" ")
 .map((n) => n[0])
 .join("")
 .toUpperCase()
 .slice(0, 2)
}

// ─── Sub-component: Booking Receipt Card ────────────────────────────────────
function BookingReceiptCard({ msg }: { msg: DirectMessage }) {
 const m = msg.metadata ?? {}
 const fmtCurrency = (val: number, currency = "KES") =>
 new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(val)

 return (
 <div className="flex justify-center my-3">
 <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden shadow-lg">
 {/* Header */}
 <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
 <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
 <svg viewBox="0 0 24 24" className="size-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}>
 <polyline points="20 6 9 17 4 12" />
 </svg>
 </div>
 <div>
 <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Booking Confirmed</p>
 <p className="text-[10px] text-white/40">{m.confirmed_at ? new Date(m.confirmed_at).toLocaleString() : "Just now"}</p>
 </div>
 </div>

 {/* Body */}
 <div className="px-4 py-3 space-y-2.5">
 {m.tour_name && (
 <p className="text-sm font-bold text-white leading-snug">{m.tour_name}</p>
 )}
 <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
 {m.date && (
 <><span className="text-white/40">Date</span><span className="text-white font-medium text-right">{m.date}</span></>
 )}
 {m.time && (
 <><span className="text-white/40">Time</span><span className="text-white font-medium text-right">{m.time}</span></>
 )}
 {m.guests && (
 <><span className="text-white/40">Guests</span><span className="text-white font-medium text-right">{m.guests}</span></>
 )}
 {m.total != null && (
 <><span className="text-white/40">Total Paid</span><span className="text-emerald-400 font-bold text-right">{fmtCurrency(m.total, m.currency)}</span></>
 )}
 </div>
 {m.booking_id && (
 <p className="text-[10px] text-white/30 font-mono"># {m.booking_id.slice(0, 8)}…</p>
 )}
 </div>
 </div>
 </div>
 )
}

// ─── Sub-component: Secure Private Image Renderer ───────────────────────────
function ChatImage({ src }: { src: string }) {
 const [signedUrl, setSignedUrl] = useState<string | null>(null)

 useEffect(() => {
 async function load() {
 try {
 let path = src
 if (src.includes("/object/public/chat-images/")) {
 path = src.split("/object/public/chat-images/")[1]
 } else if (src.includes("/object/sign/chat-images/")) {
 path = src.split("/object/sign/chat-images/")[1]?.split("?")[0]
 }
 const { data, error } = await supabase.storage.from("chat-images").createSignedUrl(path, 3600)
 if (!error && data?.signedUrl) {
 setSignedUrl(data.signedUrl)
 } else {
 setSignedUrl(src)
 }
 } catch {
 setSignedUrl(src)
 }
 }
 if (src) load()
 }, [src])

 if (!signedUrl) {
 return <div className="w-48 h-32 bg-muted/20 animate-pulse rounded-xl" />
 }

 return (
 <img
 src={signedUrl}
 alt="Shared media"
 className="rounded-xl max-w-[200px] mb-1 cursor-pointer hover:opacity-90 transition-opacity"
 onClick={() => window.open(signedUrl, "_blank")}
 />
 )
}

// ─── Sub-component: Partner Profile Modal ────────────────────────────────────
function ProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
 const [profile, setProfile] = useState<any>(null)
 const [tours, setTours] = useState<any[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 async function loadProfile() {
 try {
 const { data: prof } = await supabase
 .from("profiles")
 .select("*")
 .eq("id", userId)
 .single()
 setProfile(prof)

 const { data: tourList } = await supabase
 .from("tours")
 .select("*")
 .eq("host_id", userId)
 .eq("is_published", true)
 setTours(tourList ?? [])
 } catch (err) {
 console.error(err)
 } finally {
 setLoading(false)
 }
 }
 loadProfile()
 }, [userId])

 if (loading) {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 ">
 <Loader2 className="size-8 animate-spin text-primary" />
 </div>
 )
 }

 if (!profile) return null

 // Calculate average rating
 const avgRating = tours.length ? tours.reduce((acc, t) => acc + (t.rating || 0), 0) / tours.length : 0

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
 <Card className="w-full max-w-md border-border/80 bg-card text-white overflow-hidden shadow-2xl relative">
 <button
 onClick={onClose}
 className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-card shadow-modern text-muted-foreground hover:text-white transition-colors"
 >
 <X className="size-5" />
 </button>

 <CardHeader className="text-center pt-8 pb-4">
 <Avatar className="size-20 mx-auto border-2 border-[#0D6F73]">
 <AvatarImage src={profile.avatar_url ?? ""} />
 <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
 {initials(profile.full_name || "U")}
 </AvatarFallback>
 </Avatar>
 <CardTitle className="text-xl font-black mt-3 flex items-center justify-center gap-2">
 {profile.full_name}
 {profile.host_tier === "certified_guide" && (
 <span className="text-[10px] bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/15 border border-[#0D6F73]/40 text-[#a78bfa] rounded-full px-2 py-0.5 font-bold">
 🏅 Certified Guide
 </span>
 )}
 {profile.host_tier === "local_host" && (
 <span className="text-[10px] bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/15 border border-[#0D6F73]/40 text-[#0D6F73] rounded-full px-2 py-0.5 font-bold">
 Local Host
 </span>
 )}
 </CardTitle>
 <p className="text-xs text-muted-foreground">{profile.location || "Kenya"}</p>
 </CardHeader>

 <CardContent className="space-y-4 px-6 pb-6">
 <div className="space-y-1">
 <h4 className="text-xs font-bold text-[#0D6F73] uppercase tracking-wider">Bio</h4>
 <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
 {profile.bio || "No bio added yet."}
 </p>
 </div>

 <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-3">
 <div className="text-center">
 <span className="text-xs text-muted-foreground block">Rating</span>
 <span className="text-base font-bold flex items-center justify-center gap-1 mt-0.5">
 <Star className="size-4 fill-primary text-primary" />
 {avgRating ? avgRating.toFixed(1) : "N/A"}
 </span>
 </div>
 <div className="text-center">
 <span className="text-xs text-muted-foreground block">Tours Hosted</span>
 <span className="text-base font-bold block mt-0.5">{tours.length}</span>
 </div>
 </div>

 {tours.length > 0 && (
 <div className="space-y-2">
 <h4 className="text-xs font-bold text-[#0D6F73] uppercase tracking-wider">Tours</h4>
 <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
 {tours.map((t) => (
 <a
 key={t.id}
 href={`/tours/${t.id}`}
 target="_blank"
 rel="noreferrer"
 className="flex items-center justify-between text-xs p-2 rounded bg-card shadow-modern hover:bg-card shadow-modern transition-colors border border-white/5"
 >
 <span className="font-semibold truncate max-w-[200px]">{t.title}</span>
 <span className="text-[#0D6F73] font-bold shrink-0">{t.currency} {t.price}</span>
 </a>
 ))}
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MessagesPage() {
 const [searchParams] = useSearchParams()
 const preselectedConvId = searchParams.get("conversationId") || ""
 const paramHostId = searchParams.get("hostId") || searchParams.get("userId") || ""
 const paramBookingId = searchParams.get("bookingId") || ""

 const [currentUserId, setCurrentUserId] = useState<string | null>(null)
 const { isUserOnline } = useRealtimePresence(currentUserId)
 const [conversations, setConversations] = useState<Conversation[]>([])
 const [selectedConvId, setSelectedConvId] = useState<string>(preselectedConvId)
 const [messages, setMessages] = useState<DirectMessage[]>([])
 const [inputValue, setInputValue] = useState("")
 const [searchQuery, setSearchQuery] = useState("")
 const [otherTyping, setOtherTyping] = useState(false)
 const [loading, setLoading] = useState(true)
 const [sending, setSending] = useState(false)
 const [mobileView, setMobileView] = useState<"list" | "chat">(preselectedConvId || paramHostId || paramBookingId ? "chat" : "list")
 const [uploadProgress, setUploadProgress] = useState<number | null>(null)
 const [showProfileUserId, setShowProfileUserId] = useState<string | null>(null)
 const fileInputRef = useRef<HTMLInputElement>(null)
 const messagesEndRef = useRef<HTMLDivElement>(null)
 const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
 const typingTimeoutRef = useRef<any>(null)

 // ─── Load current user ──────────────────────────────────────────────────────
 useEffect(() => {
 supabase.auth.getUser().then(({ data }) => {
 setCurrentUserId(data.user?.id ?? null)
 })
 }, [])

 // ─── Load conversations ─────────────────────────────────────────────────────
 const loadConversations = useCallback(async () => {
 if (!currentUserId) return
 setLoading(true)
 try {
 let targetOtherId = paramHostId

 if (!targetOtherId && paramBookingId) {
 const { data: bData } = await supabase
 .from("bookings")
 .select("host_id, guest_id")
 .eq("id", paramBookingId)
 .maybeSingle()
 if (bData) {
 targetOtherId = bData.host_id === currentUserId ? bData.guest_id : bData.host_id
 }
 }

 const { data: convRows, error } = await supabase
 .from("conversations")
 .select("id, participant_a, participant_b, last_message, last_message_at, created_at")
 .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
 .order("last_message_at", { ascending: false })

 if (error) throw error

 let allConvRows = convRows ?? []

 // If target user specified and no existing conversation, create one automatically
 if (targetOtherId && targetOtherId !== currentUserId) {
 const [pA, pB] = [currentUserId, targetOtherId].sort()
 let existing = allConvRows.find(
 (c) =>
 (c.participant_a === pA && c.participant_b === pB) ||
 (c.participant_a === pB && c.participant_b === pA)
 )

 if (!existing) {
 const { data: newConv, error: createErr } = await supabase
 .from("conversations")
 .insert({
 participant_a: pA,
 participant_b: pB,
 last_message: "Started conversation",
 last_message_at: new Date().toISOString(),
 })
 .select()
 .single()

 if (!createErr && newConv) {
 allConvRows.unshift(newConv)
 setSelectedConvId(newConv.id)
 setMobileView("chat")
 }
 } else if (!selectedConvId) {
 setSelectedConvId(existing.id)
 setMobileView("chat")
 }
 }

 const enriched: Conversation[] = await Promise.all(
 allConvRows.map(async (row) => {
 const otherId = row.participant_a === currentUserId ? row.participant_b : row.participant_a
 const { data: profile } = await supabase
 .from("profiles")
 .select("id, full_name, avatar_url, host_tier, bio")
 .eq("id", otherId)
 .maybeSingle()

 const { count: unreadCount } = await supabase
 .from("messages")
 .select("*", { count: "exact", head: true })
 .eq("conversation_id", row.id)
 .eq("receiver_id", currentUserId)
 .eq("read", false)

 return {
 ...row,
 other: (profile as Participant) ?? { id: otherId, full_name: "User", avatar_url: null, host_tier: null },
 unreadCount: unreadCount ?? 0,
 }
 })
 )

 enriched.sort((a, b) => {
 const at = a.last_message_at ?? a.created_at
 const bt = b.last_message_at ?? b.created_at
 return new Date(bt).getTime() - new Date(at).getTime()
 })

 setConversations(enriched)
 if (!selectedConvId && enriched.length > 0) {
 setSelectedConvId(enriched[0].id)
 }
 } catch (err) {
 console.error("Error loading conversations:", err)
 } finally {
 setLoading(false)
 }
 }, [currentUserId, paramHostId, paramBookingId, selectedConvId])

 useEffect(() => {
 loadConversations()
 }, [loadConversations])

 // ─── Load messages for selected conversation ────────────────────────────────
 const loadMessages = useCallback(async () => {
 if (!selectedConvId || !currentUserId) return
 const { data, error } = await supabase
 .from("messages")
 .select("*")
 .eq("conversation_id", selectedConvId)
 .order("created_at", { ascending: true })
 if (!error) {
 setMessages((data ?? []) as DirectMessage[])
 }

 // Mark messages read in this thread
 await supabase
 .from("messages")
 .update({ read: true })
 .eq("conversation_id", selectedConvId)
 .eq("receiver_id", currentUserId)
 .eq("read", false)
 }, [selectedConvId, currentUserId])

 useEffect(() => {
 loadMessages()
 }, [loadMessages])

 // ─── Realtime message & typing listener ─────────────────────────────────────
 useEffect(() => {
 if (!selectedConvId || !currentUserId) return

 const channel = supabase
 .channel(`conv:${selectedConvId}`)
 .on(
 "postgres_changes",
 { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConvId}` },
 (payload) => {
 const newMsg = payload.new as DirectMessage
 setMessages((prev) => {
 if (prev.some((m) => m.id === newMsg.id)) return prev
 return [...prev, newMsg]
 })
 if (newMsg.sender_id !== currentUserId) {
 supabase
 .from("messages")
 .update({ read: true })
 .eq("id", newMsg.id)
 }
 loadConversations()
 }
 )
 .on("broadcast", { event: "typing" }, (payload) => {
 if (payload.payload.senderId !== currentUserId) {
 setOtherTyping(payload.payload.isTyping)
 }
 })
 .subscribe()

 channelRef.current = channel

 return () => {
 supabase.removeChannel(channel)
 }
 }, [selectedConvId, currentUserId, loadConversations])

 const broadcastTyping = (val: string) => {
 setInputValue(val)
 if (!channelRef.current || !currentUserId) return

 channelRef.current.send({
 type: "broadcast",
 event: "typing",
 payload: { senderId: currentUserId, isTyping: val.length > 0 },
 })

 if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
 typingTimeoutRef.current = setTimeout(() => {
 channelRef.current?.send({
 type: "broadcast",
 event: "typing",
 payload: { senderId: currentUserId, isTyping: false },
 })
 }, 2000)
 }

 // ─── Auto-scroll ────────────────────────────────────────────────────────────
 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
 }, [messages])

 const selectedConv = conversations.find((c) => c.id === selectedConvId)
 const otherId = selectedConv
 ? selectedConv.participant_a === currentUserId
 ? selectedConv.participant_b
 : selectedConv.participant_a
 : null

 // ─── Send message ───────────────────────────────────────────────────────────
 const sendMsg = async (content: string, imageUrl?: string) => {
 if (!selectedConvId || !currentUserId || !otherId) return
 if (!content.trim() && !imageUrl) return
 setSending(true)
 try {
 const { error } = await supabase.from("messages").insert({
 conversation_id: selectedConvId,
 sender_id: currentUserId,
 receiver_id: otherId,
 message: content.trim(),
 image_url: imageUrl || null,
 read: false,
 })
 if (error) throw error

 // Update last message in thread
 await supabase
 .from("conversations")
 .update({
 last_message: content.trim() || "📷 Photo",
 last_message_at: new Date().toISOString(),
 })
 .eq("id", selectedConvId)

 setInputValue("")
 // Notify other user we are no longer typing
 channelRef.current?.send({
 type: "broadcast",
 event: "typing",
 payload: { senderId: currentUserId, isTyping: false },
 })
 } catch (err: any) {
 toast.error(err.message ?? "Failed to send message.")
 } finally {
 setSending(false)
 }
 }

 // ─── Image upload ───────────────────────────────────────────────────────────
 const handleImageUpload = async (file: File) => {
 if (!currentUserId || !otherId) return
 // Validate type & size
 if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
 toast.error("Invalid image format. Please select JPEG, PNG, or WebP.")
 return
 }
 if (file.size > 10 * 1024 * 1024) {
 toast.error("File size exceeds 10 MB limit.")
 return
 }

 setUploadProgress(10)
 try {
 const ext = file.name.split(".").pop()
 const path = `${currentUserId}/${Date.now()}.${ext}`

 setUploadProgress(30)
 const { error: upErr } = await supabase.storage.from("chat-images").upload(path, file)
 if (upErr) throw upErr

 setUploadProgress(70)
 const { data: { publicUrl } } = supabase.storage.from("chat-images").getPublicUrl(path)
 
 setUploadProgress(90)
 await sendMsg("", publicUrl)
 } catch (err: any) {
 toast.error("Failed to upload image.")
 } finally {
 setUploadProgress(null)
 }
 }

 // ─── Video calling integration ──────────────────────────────────────────────
 const handleVideoCall = async () => {
 if (!selectedConvId) return
 const loadingToast = toast.loading("Creating video room...")
 try {
 const roomUrl = await createGeneralDailyRoom(selectedConvId)
 toast.dismiss(loadingToast)
 window.open(roomUrl, "_blank")
 } catch (err: any) {
 toast.dismiss(loadingToast)
 toast.error(err.message || "Failed to start video call.")
 }
 }

 const filteredConvs = conversations.filter((c) =>
 c.other.full_name.toLowerCase().includes(searchQuery.toLowerCase())
 )

 return (
 <div className="flex h-[calc(100vh-4rem)] bg-[#0d0d12] text-foreground overflow-hidden pt-16">
 {/* ── Sidebar ── */}
 <div
 className={cn(
 "w-full md:w-80 flex-shrink-0 border-r border-white/5 bg-card shadow-modern flex flex-col",
 "md:flex",
 mobileView === "chat" ? "hidden" : "flex"
 )}
 >
 <div className="px-4 pt-5 pb-3 border-b border-white/5 space-y-3">
 <div className="flex items-center gap-2">
 <BackButton fallback="/dashboard" label="" className="p-1 min-h-[36px] min-w-[36px]" />
 <h1 className="text-xl font-black tracking-tight text-white">Direct Messages</h1>
 </div>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
 <Input
 id="messages-search"
 placeholder="Search conversations…"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 bg-card shadow-modern border-white/5 text-sm rounded-full text-white placeholder:text-white/30 focus-visible:ring-[#0D6F73]"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto divide-y divide-white/5">
 {loading ? (
 <div className="flex items-center justify-center py-16">
 <Loader2 className="size-5 animate-spin text-primary" />
 </div>
 ) : filteredConvs.length === 0 ? (
 <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
 <MessageSquare className="size-10 text-white/20" />
 <p className="text-xs text-white/50">No conversations yet.</p>
 </div>
 ) : (
 filteredConvs.map((conv) => (
 <button
 key={conv.id}
 id={`conv-${conv.id}`}
 className={cn(
 "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-card shadow-modern",
 conv.id === selectedConvId && "bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/10 border-r-2 border-[#0D6F73]"
 )}
 onClick={() => {
 setSelectedConvId(conv.id)
 setMobileView("chat")
 }}
 >
 <div className="relative flex-shrink-0">
 <Avatar className="size-12 border border-white/10">
 <AvatarImage src={conv.other.avatar_url ?? ""} />
 <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
 {initials(conv.other.full_name)}
 </AvatarFallback>
 </Avatar>
 {isUserOnline(conv.other.id) && (
 <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-[#16161A]" title="Online" />
 )}
 {conv.unreadCount > 0 && (
 <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-[10px] text-white font-black flex items-center justify-center animate-pulse">
 {conv.unreadCount}
 </span>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-1 mb-0.5">
 <span className={cn("text-sm font-semibold truncate text-white", conv.unreadCount > 0 && "text-[#0D6F73]")}>
 {conv.other.full_name}
 </span>
 {conv.last_message_at && (
 <span className="text-[10px] text-white/30 flex-shrink-0">
 {formatMsgTime(conv.last_message_at)}
 </span>
 )}
 </div>
 <p className={cn("text-xs truncate text-white/60", conv.unreadCount > 0 && "text-white font-bold")}>
 {conv.last_message ?? "Sent an attachment"}
 </p>
 </div>
 </button>
 ))
 )}
 </div>
 </div>

 {/* ── Chat panel ── */}
 <div
 className={cn(
 "flex-1 flex flex-col bg-card shadow-modern",
 "md:flex",
 mobileView === "list" ? "hidden" : "flex"
 )}
 >
 {!selectedConvId ? (
 <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
 <div className="size-20 rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/10 flex items-center justify-center">
 <MessageSquare className="size-10 text-[#0D6F73]" />
 </div>
 <h2 className="text-xl font-bold text-white">Start Chatting</h2>
 <p className="text-sm text-white/50 max-w-xs leading-relaxed">
 Connect with guides and local hosts to schedule experiences and ask questions.
 </p>
 </div>
 ) : (
 <>
 {/* Header */}
 <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-card shadow-modern ">
 <button
 className="md:hidden text-white/60 hover:text-white transition-colors mr-1"
 onClick={() => setMobileView("list")}
 aria-label="Back to conversations"
 >
 <ArrowLeft className="size-5" />
 </button>

 {selectedConv && (
 <>
 <button
 onClick={() => setShowProfileUserId(selectedConv.other.id)}
 className="flex items-center gap-3 hover:opacity-85 transition-opacity"
 title="View Profile"
 >
 <div className="relative">
 <Avatar className="size-10 border border-white/10">
 <AvatarImage src={selectedConv.other.avatar_url ?? ""} />
 <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
 {initials(selectedConv.other.full_name)}
 </AvatarFallback>
 </Avatar>
 {otherId && isUserOnline(otherId) && (
 <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-[#16161A]" />
 )}
 </div>
 <div className="text-left min-w-0">
 <div className="flex items-center gap-1.5">
 <p className="font-semibold text-sm leading-tight text-white">{selectedConv.other.full_name}</p>
 {selectedConv.other.host_tier === "certified_guide" && (
 <span className="text-[9px] bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/10 border border-[#0D6F73]/40 text-[#a78bfa] rounded-full px-1.5 py-0.25 font-bold">
 🏅 Certified Guide
 </span>
 )}
 {selectedConv.other.host_tier === "local_host" && (
 <span className="text-[9px] bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/10 border border-[#0D6F73]/40 text-[#0D6F73] rounded-full px-1.5 py-0.25 font-bold">
 Local Host
 </span>
 )}
 </div>
 </div>
 </button>

 <div className="flex-1" />

 <Button
 variant="ghost"
 size="icon"
 onClick={handleVideoCall}
 className="text-white/60 hover:text-[#0D6F73] hover:bg-card shadow-modern rounded-full"
 title="Video Call"
 >
 <Video className="size-5" />
 </Button>
 </>
 )}
 </div>

 {/* Chat Messages */}
 <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" id="messages-list">
 {messages.map((msg, i) => {
 const isMine = msg.sender_id === currentUserId
 const showDate =
 i === 0 ||
 new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString()

 // System messages render as a receipt card, centered
 if (msg.sender_type === "system") {
 return (
 <div key={msg.id}>
 {showDate && (
 <div className="flex items-center justify-center my-4">
 <span className="text-[10px] text-white/40 bg-card shadow-modern rounded-full px-3 py-0.5 tracking-wider font-semibold">
 {isToday(new Date(msg.created_at))
 ? "TODAY"
 : isYesterday(new Date(msg.created_at))
 ? "YESTERDAY"
 : format(new Date(msg.created_at), "MMMM d, yyyy").toUpperCase()}
 </span>
 </div>
 )}
 {msg.metadata?.type === "booking_receipt" ? (
 <BookingReceiptCard msg={msg} />
 ) : (
 <div className="flex justify-center my-2">
 <span className="text-[11px] text-white/40 bg-card shadow-modern rounded-full px-3 py-1 italic">{msg.message}</span>
 </div>
 )}
 </div>
 )
 }

 return (
 <div key={msg.id}>
 {showDate && (
 <div className="flex items-center justify-center my-4">
 <span className="text-[10px] text-white/40 bg-card shadow-modern rounded-full px-3 py-0.5 tracking-wider font-semibold">
 {isToday(new Date(msg.created_at))
 ? "TODAY"
 : isYesterday(new Date(msg.created_at))
 ? "YESTERDAY"
 : format(new Date(msg.created_at), "MMMM d, yyyy").toUpperCase()}
 </span>
 </div>
 )}
 <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
 <div
 className={cn(
 "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md border border-white/5",
 isMine
 ? "bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon text-white rounded-br-none border-0"
 : "bg-card text-white/90 rounded-bl-none"
 )}
 >
 {msg.image_url && <ChatImage src={msg.image_url} />}
 {msg.message && <p className="break-words">{msg.message}</p>}
 <div className={cn("text-[9px] mt-1 text-right font-medium", isMine ? "text-white/60" : "text-white/30")}>
 {format(new Date(msg.created_at), "HH:mm")}
 </div>
 </div>
 </div>
 </div>
 )
 })}
 {otherTyping && (
 <div className="flex items-center gap-2">
 <span className="text-xs text-white/40 italic">Someone is typing...</span>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Input bar */}
 <div className="px-4 py-3.5 border-t border-white/5 bg-card shadow-modern ">
 {uploadProgress !== null && (
 <div className="mb-2 flex items-center justify-between text-xs text-[#0D6F73]">
 <span>Uploading image...</span>
 <span>{uploadProgress}%</span>
 </div>
 )}

 <div className="flex items-center gap-2">
 <input
 ref={fileInputRef}
 type="file"
 accept="image/jpeg,image/png,image/webp"
 className="hidden"
 onChange={(e) => {
 const file = e.target.files?.[0]
 if (file) handleImageUpload(file)
 e.target.value = ""
 }}
 />
 <Button
 variant="ghost"
 size="icon"
 className="rounded-full text-white/55 hover:text-white hover:bg-card shadow-modern flex-shrink-0"
 onClick={() => fileInputRef.current?.click()}
 disabled={uploadProgress !== null}
 >
 <ImageIcon className="size-5" />
 </Button>

 <Input
 id="message-input"
 value={inputValue}
 onChange={(e) => broadcastTyping(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault()
 sendMsg(inputValue)
 }
 }}
 placeholder="Message…"
 className="flex-1 rounded-full bg-card shadow-modern border-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-[#0D6F73]"
 disabled={sending}
 />

 <Button
 id="send-message-btn"
 size="icon"
 className="rounded-full size-9 bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon hover:bg-[#6b47d6] text-white shadow-md shadow-[#0D6F73]/10 flex-shrink-0"
 onClick={() => sendMsg(inputValue)}
 disabled={sending || !inputValue.trim()}
 >
 {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
 </Button>
 </div>
 </div>
 </>
 )}
 </div>

 {/* Profile popover modal */}
 {showProfileUserId && (
 <ProfileModal userId={showProfileUserId} onClose={() => setShowProfileUserId(null)} />
 )}
 </div>
 )
}
