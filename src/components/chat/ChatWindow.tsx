import { useState, useEffect, useRef } from "react"
import { Send, Image as ImageIcon, ArrowLeft, Check, CheckCheck, Loader2, Video, Star } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMessages, type DirectMessage } from "@/hooks/useMessages"
import BookingRequestCard from "./BookingRequestCard"
import BookingConfirmedCard from "./BookingConfirmedCard"
import BookingDeclinedCard from "./BookingDeclinedCard"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface ChatParticipant {
 id: string
 full_name: string
 avatar_url: string | null
 host_tier?: string | null
 bio?: string | null
 isOnline?: boolean
}

export interface ChatWindowProps {
 conversationId: string
 currentUserId: string
 otherUser: ChatParticipant
 currentUserRole?: "traveler" | "host" | "admin" | "user"
 onBack?: () => void
 onStartVideoCall?: () => void
 className?: string
}

function formatMsgTime(ts: string) {
 try {
 const d = new Date(ts)
 if (isToday(d)) return format(d, "HH:mm")
 if (isYesterday(d)) return "Yesterday " + format(d, "HH:mm")
 return format(d, "MMM d, HH:mm")
 } catch {
 return ""
 }
}

function initials(name: string) {
 return name
 .split(" ")
 .map((n) => n[0])
 .join("")
 .toUpperCase()
 .slice(0, 2)
}

function ChatImage({ src }: { src: string }) {
 const [signedUrl, setSignedUrl] = useState<string | null>(null)
 const [loading, setLoading] = useState(true)

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
 } finally {
 setLoading(false)
 }
 }
 if (src) load()
 }, [src])

  if (loading) {
    return (
      <div className="size-48 rounded-xl bg-muted/50 flex items-center justify-center animate-pulse">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <a href={signedUrl || src} target="_blank" rel="noopener noreferrer" className="block my-1 overflow-hidden rounded-xl border border-border/60 max-w-xs group cursor-zoom-in">
      <img
        src={signedUrl || src}
        alt="Attachment"
        className="max-h-60 w-auto rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </a>
  )
}

function BookingReceiptBubble({ msg }: { msg: DirectMessage }) {
  const m = msg.metadata ?? {}
  const fmtCurrency = (val: number, currency = "KES") =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(val)

  return (
    <div className="flex justify-center my-3 w-full">
      <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-card overflow-hidden shadow-modern">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20">
          <div className="size-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="size-3.5 text-emerald-600 stroke-[3]" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Booking Confirmed</p>
            <p className="text-[10px] text-muted-foreground">{m.confirmed_at ? new Date(m.confirmed_at).toLocaleDateString() : "Active"}</p>
          </div>
        </div>
        <div className="px-4 py-3 space-y-2 text-xs">
          {m.tour_name && <p className="font-bold text-foreground text-sm">{m.tour_name}</p>}
          <div className="grid grid-cols-2 gap-2 text-foreground/80">
            {m.date && <div><span className="text-muted-foreground block text-[10px]">Date</span>{m.date}</div>}
            {m.guests && <div><span className="text-muted-foreground block text-[10px]">Guests</span>{m.guests} Guests</div>}
            {m.total != null && (
              <div className="col-span-2 pt-1 border-t border-border flex justify-between items-center">
                <span className="text-muted-foreground">Total Paid:</span>
                <span className="text-emerald-700 font-bold">{fmtCurrency(m.total, m.currency)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
  currentUserRole = "user",
  onBack,
  onStartVideoCall,
  className,
}: ChatWindowProps) {
  const {
    messages,
    loading,
    sending,
    otherTyping,
    sendMessage,
    broadcastTyping,
    refreshMessages,
  } = useMessages(conversationId, currentUserId, otherUser.id)


  const [inputVal, setInputVal] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, otherTyping])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputVal(val)
    broadcastTyping(val.length > 0)
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputVal.trim() || sending) return
    const text = inputVal
    setInputVal("")
    const senderType = currentUserRole === "host" ? "host" : currentUserRole === "traveler" ? "traveler" : "user"
    await sendMessage(text, undefined, senderType)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUserId) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB.")
      return
    }

    setUploadingImage(true)
    try {
      const ext = file.name.split(".").pop() || "jpg"
      const filePath = `${currentUserId}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from("chat-images")
        .upload(filePath, file, { upsert: false })

      if (uploadErr) throw uploadErr

      const senderType = currentUserRole === "host" ? "host" : currentUserRole === "traveler" ? "traveler" : "user"
      await sendMessage("", filePath, senderType)
      toast.success("Photo sent successfully!")
    } catch (err: any) {
      console.error("Upload error:", err)
      toast.error(err.message || "Failed to upload image")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden shadow-modern", className)}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted md:hidden shrink-0"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}

          <div className="relative">
            <Avatar className="size-10 border border-border ring-2 ring-primary/10">
              {otherUser.avatar_url ? (
                <AvatarImage src={otherUser.avatar_url} alt={otherUser.full_name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
                {initials(otherUser.full_name || "User")}
              </AvatarFallback>
            </Avatar>
            {otherUser.isOnline && (
              <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground truncate max-w-[180px] sm:max-w-xs">
                {otherUser.full_name}
              </h3>
              {otherUser.host_tier && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/20">
                  <Star className="size-2.5 fill-amber-500 text-amber-500" />
                  {otherUser.host_tier}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {otherTyping ? (
                <span className="text-primary font-medium flex items-center gap-1">
                  typing<span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </span>
              ) : otherUser.isOnline ? (
                <span className="text-emerald-600 font-medium">Active now</span>
              ) : (
                "Direct Message"
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {onStartVideoCall && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={onStartVideoCall}
              title="Start Video Call"
            >
              <Video className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ─── Message Bubbles Container ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar bg-background/50">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-xs">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Avatar className="size-12">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {initials(otherUser.full_name || "User")}
                </AvatarFallback>
              </Avatar>
            </div>
            <h4 className="font-bold text-foreground text-base mb-1">{otherUser.full_name}</h4>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              This is the beginning of your direct conversation on Ausaguide.
            </p>
            <span className="inline-block text-[11px] px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
              Say hello 👋
            </span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserId
            const isSystem = msg.sender_type === "system"
            const notifType = msg.notification_type || msg.metadata?.type

            if (isSystem || notifType) {
              if (notifType === "booking_request") {
                return (
                  <BookingRequestCard
                    key={msg.id || index}
                    booking={{
                      booking_id: msg.metadata?.booking_id || msg.id,
                      tour_name: msg.metadata?.tour_name || "Experience",
                      traveler_name: msg.metadata?.traveler_name || otherUser.full_name,
                      date: msg.metadata?.date || "Selected Date",
                      time: msg.metadata?.time || "Scheduled Time",
                      guests: msg.metadata?.guests || 1,
                      amount: msg.metadata?.amount || msg.metadata?.total || 0,
                      currency: msg.metadata?.currency || "KES",
                      status: msg.metadata?.status,
                    }}
                    hostId={currentUserId}
                    currentUserId={currentUserId}
                    isHost={currentUserRole === "host"}
                    onActionComplete={refreshMessages}
                  />
                )
              }

              if (notifType === "booking_confirmed") {
                return (
                  <BookingConfirmedCard
                    key={msg.id || index}
                    content={{
                      booking_id: msg.metadata?.booking_id,
                      tour_name: msg.metadata?.tour_name,
                      daily_room_url: msg.metadata?.daily_room_url,
                      daily_room_id: msg.metadata?.daily_room_id,
                      message: msg.message || msg.metadata?.message,
                    }}
                  />
                )
              }

              if (notifType === "booking_declined") {
                return (
                  <BookingDeclinedCard
                    key={msg.id || index}
                    content={{
                      booking_id: msg.metadata?.booking_id,
                      tour_name: msg.metadata?.tour_name,
                      decline_reason: msg.metadata?.decline_reason,
                      message: msg.message || msg.metadata?.message,
                    }}
                  />
                )
              }

              if (notifType === "booking_confirmation") {
                return <BookingReceiptBubble key={msg.id || index} msg={msg} />
              }

              return (
                <div key={msg.id || index} className="flex justify-center my-2.5 w-full">
                  <div className="rounded-full bg-muted/80 border border-border/60 px-3.5 py-1 text-center text-[11px] text-muted-foreground max-w-sm">
                    {msg.message || JSON.stringify(msg.metadata)}
                  </div>
                </div>
              )
            }


            return (
              <div
                key={msg.id || index}
                className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
              >
                <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                  {!isMe && (
                    <Avatar className="size-6 mb-1 shrink-0">
                      <AvatarImage src={otherUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-[9px] text-foreground font-semibold">
                        {initials(otherUser.full_name || "U")}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex flex-col">
                    <div
                      className={cn(
                        "relative px-4 py-2.5 text-sm transition-all duration-200",
                        isMe
                          ? "bg-primary text-white rounded-2xl rounded-br-sm shadow-sm"
                          : "bg-card text-foreground rounded-2xl rounded-bl-sm border border-border/80 shadow-sm"
                      )}
                    >
                      {msg.image_url && <ChatImage src={msg.image_url} />}
                      {msg.message && <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-1 mt-1 text-[10px] text-muted-foreground",
                        isMe ? "justify-end pr-1" : "justify-start pl-1"
                      )}
                    >
                      <span>{formatMsgTime(msg.created_at)}</span>
                      {isMe && (
                        msg.read ? (
                          <span title="Read"><CheckCheck className="size-3 text-primary" /></span>
                        ) : (
                          <span title="Delivered"><Check className="size-3 text-muted-foreground" /></span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Live typing indicator */}
        {otherTyping && (
          <div className="flex items-center gap-2 pl-2">
            <Avatar className="size-6">
              <AvatarImage src={otherUser.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-[9px] text-foreground">
                {initials(otherUser.full_name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-card border border-border flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" />
              <span className="size-1.5 rounded-full bg-primary/60 animate-bounce delay-150" />
              <span className="size-1.5 rounded-full bg-primary/60 animate-bounce delay-300" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Composer Input Bar (Sticky for Mobile) ─── */}
      <div className="p-3 bg-card/95 backdrop-blur-md border-t border-border shrink-0 sticky bottom-0 z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || sending}
            className="size-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 touch-target"
            title="Attach photo"
          >
            {uploadingImage ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <ImageIcon className="size-5" />
            )}
          </Button>

          <Input
            value={inputVal}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 bg-muted/60 border-border text-foreground placeholder:text-muted-foreground rounded-full px-4 h-11 text-base focus-visible:ring-1 focus-visible:ring-primary"
          />

          <Button
            type="submit"
            size="icon"
            disabled={!inputVal.trim() || sending}
            className="size-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 disabled:opacity-40 transition-all shadow-sm touch-target"
          >
            {sending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

