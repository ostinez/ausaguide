import { useState, useEffect, useRef } from "react"
import { Send, Image as ImageIcon, ArrowLeft, Check, CheckCheck, Loader2, Video, Star, Trash2, X } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMessages, type DirectMessage } from "@/hooks/useMessages"
import BookingRequestCard from "./BookingRequestCard"
import BookingConfirmedCard from "./BookingConfirmedCard"
import BookingDeclinedCard from "./BookingDeclinedCard"
import DailyRoomSharedCard from "./DailyRoomSharedCard"
import MessageContent from "./MessageContent"
import EmojiPickerPopover from "./EmojiPickerPopover"
import TourInclusionsGuidance from "./TourInclusionsGuidance"
import HostTourBookingDetails, { type TourBookingInfo } from "./HostTourBookingDetails"
import { createGeneralDailyRoom } from "@/lib/daily"
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
  currentUserName?: string
  tourName?: string | null
  bookingId?: string | null
  bookingInfo?: TourBookingInfo | null
  onBack?: () => void
  onStartVideoCall?: () => void
  className?: string
}

function getDateDivider(currentDateStr: string, prevDateStr?: string): string | null {
  if (!currentDateStr) return null
  try {
    const cur = new Date(currentDateStr)
    if (prevDateStr) {
      const prev = new Date(prevDateStr)
      if (cur.toDateString() === prev.toDateString()) return null
    }
    if (isToday(cur)) return "Today"
    if (isYesterday(cur)) return "Yesterday"
    return format(cur, "MMMM d, yyyy")
  } catch {
    return null
  }
}

function formatMsgTime(ts: string) {
  try {
    const d = new Date(ts)
    return format(d, "HH:mm")
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
    <a
      href={signedUrl || src}
      target="_blank"
      rel="noopener noreferrer"
      className="block my-1 overflow-hidden rounded-xl border border-border/60 max-w-xs group cursor-zoom-in"
    >
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
  currentUserName,
  tourName,
  bookingId,
  bookingInfo,
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
    deleteMessageForMe,
    clearChat,
    broadcastTyping,
    refreshMessages,
  } = useMessages(conversationId, currentUserId, otherUser.id, currentUserRole)

  const [activeBooking, setActiveBooking] = useState<TourBookingInfo | null>(bookingInfo ?? null)

  useEffect(() => {
    if (bookingInfo) {
      setActiveBooking(bookingInfo)
      return
    }

    async function loadBooking() {
      try {
        let query = supabase
          .from("bookings")
          .select("id, status, booking_date, booking_time, total_price, currency, guest_count, guest_name, guest_email, guest_phone, notes, tours(id, title, location)")
        
        if (bookingId) {
          query = query.eq("id", bookingId)
        } else {
          query = query
            .or(`and(guest_id.eq.${currentUserId},host_id.eq.${otherUser.id}),and(guest_id.eq.${otherUser.id},host_id.eq.${currentUserId})`)
            .order("created_at", { ascending: false })
            .limit(1)
        }

        const { data: bData } = await query.maybeSingle()
        if (bData) {
          setActiveBooking({
            id: bData.id,
            tour_id: (bData.tours as any)?.id,
            tour_name: (bData.tours as any)?.title || tourName || "Booked Tour",
            booking_date: bData.booking_date,
            booking_time: (bData as any).booking_time,
            guest_count: bData.guest_count || 1,
            total_price: bData.total_price || 0,
            currency: bData.currency || "KES",
            status: bData.status || "confirmed",
            guest_name: bData.guest_name,
            guest_email: bData.guest_email,
            guest_phone: bData.guest_phone,
            notes: bData.notes,
          })
        }
      } catch (err) {
        console.warn("Could not load booking context:", err)
      }
    }

    if (currentUserId && otherUser?.id) {
      loadBooking()
    }
  }, [bookingId, currentUserId, otherUser?.id, bookingInfo, tourName])

  const handleClearChat = async () => {
    if (window.confirm("Clear all messages on your side? This will erase chat history for you only, just like WhatsApp.")) {
      await clearChat()
    }
  }

  const [inputVal, setInputVal] = useState("")
  const [selectedImage, setSelectedImage] = useState<{ file: File; previewUrl: string } | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isSharingVideo, setIsSharingVideo] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, otherTyping, selectedImage])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputVal(val)
    broadcastTyping(val.length > 0)
  }

  const handleSelectEmoji = (emoji: string) => {
    setInputVal((prev) => prev + emoji)
    broadcastTyping(true)
    inputRef.current?.focus()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB.")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedImage({ file, previewUrl })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleRemoveImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl)
    }
    setSelectedImage(null)
  }

  const handleShareDailyRoom = async () => {
    if (!conversationId) return
    setIsSharingVideo(true)
    const toastId = toast.loading("Creating video room...")
    try {
      const roomUrl = await createGeneralDailyRoom(conversationId)
      toast.dismiss(toastId)

      const senderType = currentUserRole === "host" ? "host" : currentUserRole === "traveler" ? "traveler" : "user"
      const ok = await sendMessage(
        `📹 I've started a live video meeting room: ${roomUrl}`,
        undefined,
        senderType,
        "daily_room_shared",
        {
          type: "daily_room_shared",
          daily_room_url: roomUrl,
          shared_by_name: currentUserName || (currentUserRole === "host" ? "Host" : "Traveler"),
        },
        bookingId
      )

      if (ok) {
        toast.success("Live video room shared with participant!")
        window.open(roomUrl, "_blank")
      }
    } catch (err: any) {
      toast.dismiss(toastId)
      console.error("Error sharing daily room:", err)
      toast.error(err.message || "Failed to create video room.")
    } finally {
      setIsSharingVideo(false)
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((!inputVal.trim() && !selectedImage) || sending) return

    const text = inputVal.trim()
    const imageToSend = selectedImage
    setInputVal("")
    setSelectedImage(null)

    const senderType = currentUserRole === "host" ? "host" : currentUserRole === "traveler" ? "traveler" : "user"

    if (imageToSend) {
      setUploadingImage(true)
      try {
        const ext = imageToSend.file.name.split(".").pop() || "jpg"
        const filePath = `${currentUserId}/${Date.now()}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from("chat-images")
          .upload(filePath, imageToSend.file, { upsert: false })

        if (uploadErr) throw uploadErr

        await sendMessage(text, filePath, senderType, undefined, undefined, bookingId)
        toast.success("Photo sent!")
      } catch (err: any) {
        console.error("Upload error:", err)
        toast.error(err.message || "Failed to upload image")
      } finally {
        setUploadingImage(false)
        URL.revokeObjectURL(imageToSend.previewUrl)
      }
    } else {
      await sendMessage(text, undefined, senderType, undefined, undefined, bookingId)
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden shadow-modern", className)}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
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
              {currentUserRole === "host" ? (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20">
                  {activeBooking ? "Verified Guest" : "Traveler"}
                </span>
              ) : otherUser.host_tier ? (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/20">
                  <Star className="size-2.5 fill-amber-500 text-amber-500" />
                  {otherUser.host_tier}
                </span>
              ) : null}
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
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-xs font-semibold gap-1.5"
            onClick={onStartVideoCall || handleShareDailyRoom}
            disabled={isSharingVideo}
            title="Start Video Meeting Room"
          >
            <Video className="size-3.5" />
            <span className="hidden sm:inline">Video Call</span>
          </Button>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              onClick={handleClearChat}
              title="Clear chat on your side"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ─── Host / Traveler Verified Booking Receipt & Countdown Banner ─── */}
      {activeBooking && (
        <HostTourBookingDetails
          variant="banner"
          booking={activeBooking}
          isHost={currentUserRole === "host"}
          onStartVideoCall={onStartVideoCall || handleShareDailyRoom}
        />
      )}

      {/* ─── Tour Inclusions & Planning Guidance Bar ─── */}
      <TourInclusionsGuidance
        userRole={currentUserRole}
        tourName={tourName}
        onSelectPrompt={(text) => {
          setInputVal((prev) => (prev ? prev + " " + text : text))
          broadcastTyping(true)
          inputRef.current?.focus()
        }}
        onShareVideoCall={handleShareDailyRoom}
        isSharingVideo={isSharingVideo}
      />

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
              This is the beginning of your direct conversation on Ausaguide. Discuss inclusions, transport, meals, and customize your experience.
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
            const prevMsg = index > 0 ? messages[index - 1] : undefined
            const dateDivider = getDateDivider(msg.created_at, prevMsg?.created_at)

            return (
              <div key={msg.id || index} className="space-y-3">
                {/* WhatsApp-Style Date Divider Pill */}
                {dateDivider && (
                  <div className="flex justify-center my-3 w-full select-none">
                    <span className="px-3.5 py-1 rounded-full bg-muted/90 backdrop-blur-md border border-border/70 text-[11px] font-semibold text-muted-foreground shadow-xs">
                      {dateDivider}
                    </span>
                  </div>
                )}

                {isSystem || notifType ? (
                  (() => {
                    if (notifType === "daily_room_shared") {
                      return (
                        <DailyRoomSharedCard
                          key={msg.id || index}
                          roomUrl={msg.metadata?.daily_room_url || msg.message}
                          sharedByName={msg.metadata?.shared_by_name || (isMe ? "You" : otherUser.full_name)}
                          createdAt={msg.created_at}
                          isMe={isMe}
                        />
                      )
                    }

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
                  })()
                ) : (
                  <div className={cn("flex flex-col group/msg relative", isMe ? "items-end" : "items-start")}>
                    <div className="flex items-end gap-1.5 max-w-[88%] sm:max-w-[75%]">
                      {!isMe && (
                        <Avatar className="size-6 mb-1 shrink-0">
                          <AvatarImage src={otherUser.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-[9px] text-foreground font-semibold">
                            {initials(otherUser.full_name || "U")}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {isMe && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Delete this message for you?")) {
                              deleteMessageForMe(msg.id)
                            }
                          }}
                          className="opacity-0 group-hover/msg:opacity-100 focus:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-rose-500 rounded-full hover:bg-muted/80 text-xs shrink-0 cursor-pointer"
                          title="Delete for me"
                          aria-label="Delete for me"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}

                      <div
                        className={cn(
                          "relative px-3.5 py-2 text-sm shadow-sm transition-all select-text",
                          isMe
                            ? "bg-[#0D6F73] text-white rounded-2xl rounded-tr-xs"
                            : "bg-card text-foreground rounded-2xl rounded-tl-xs border border-border/80"
                        )}
                      >
                        {msg.image_url && <ChatImage src={msg.image_url} />}
                        {msg.message && (
                          <div className="text-sm">
                            <MessageContent text={msg.message} isMe={isMe} />
                          </div>
                        )}

                        <div
                          className={cn(
                            "flex items-center justify-end gap-1 mt-1 text-[10px] select-none",
                            isMe ? "text-white/80" : "text-muted-foreground"
                          )}
                        >
                          <span>{formatMsgTime(msg.created_at)}</span>
                          {isMe && (
                            msg.read ? (
                              <span title="Read" className="inline-flex items-center">
                                <CheckCheck className="size-3.5 text-[#53bdeb] stroke-[2.5]" />
                              </span>
                            ) : (
                              <span title="Delivered" className="inline-flex items-center">
                                <CheckCheck className="size-3.5 text-white/70 stroke-[2]" />
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Delete this message for you?")) {
                              deleteMessageForMe(msg.id)
                            }
                          }}
                          className="opacity-0 group-hover/msg:opacity-100 focus:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-rose-500 rounded-full hover:bg-muted/80 text-xs shrink-0 cursor-pointer"
                          title="Delete for me"
                          aria-label="Delete for me"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
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

      {/* ─── Image Preview Tray (when an image is selected before sending) ─── */}
      {selectedImage && (
        <div className="px-4 py-2.5 bg-muted/60 border-t border-border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="relative size-14 rounded-xl overflow-hidden border border-border bg-card shrink-0">
            <img
              src={selectedImage.previewUrl}
              alt="Preview"
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 size-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
              title="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{selectedImage.file.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {(selectedImage.file.size / 1024).toFixed(0)} KB • Ready to send
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            className="h-7 text-xs text-muted-foreground hover:text-rose-500"
          >
            Remove
          </Button>
        </div>
      )}

      {/* ─── Composer Input Bar (Sticky for Mobile) ─── */}
      <div className="p-3 bg-card/95 backdrop-blur-md border-t border-border shrink-0 sticky bottom-0 z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSend} className="flex items-center gap-1.5 max-w-4xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Attach Image Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || sending}
            className="size-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 touch-target"
            title="Attach photo"
          >
            {uploadingImage ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <ImageIcon className="size-5" />
            )}
          </Button>

          {/* Emoji Picker Popover */}
          <EmojiPickerPopover
            onSelectEmoji={handleSelectEmoji}
            disabled={sending || uploadingImage}
          />

          {/* Text Input */}
          <Input
            ref={inputRef}
            value={inputVal}
            onChange={handleInputChange}
            placeholder={selectedImage ? "Add a caption..." : "Type a message, link, or question..."}
            disabled={sending || uploadingImage}
            className="flex-1 bg-muted/60 border-border text-foreground placeholder:text-muted-foreground rounded-full px-4 h-11 text-base focus-visible:ring-1 focus-visible:ring-primary"
          />

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={(!inputVal.trim() && !selectedImage) || sending || uploadingImage}
            className="size-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 disabled:opacity-40 transition-all shadow-sm touch-target cursor-pointer"
          >
            {sending || uploadingImage ? (
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
