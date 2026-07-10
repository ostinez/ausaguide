import React, { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Send, Search, MessageSquare, ShieldAlert } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { fetchMessages, sendMessage, markMessagesRead, type Message as ApiMessage } from "@/lib/api/messages"
import { GlassmorphismNavbar } from "@/components/ui/GlassmorphismNavbar"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { sanitizeText } from "@/lib/validation"
import { toast } from "sonner"

interface Thread {
  id: string // booking_id
  tourTitle: string
  bookingDate: string
  otherUser: {
    id: string
    name: string
    avatarUrl: string | null
    initials: string
  }
  lastMessage?: ApiMessage
  unreadCount: number
  online: boolean
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const bookingId = searchParams.get("bookingId") || ""

  const currentUserId = localStorage.getItem("user_id")
  const role = localStorage.getItem("user_role")

  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string>(bookingId)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [mobileView, setMobileView] = useState<"list" | "chat">(bookingId ? "chat" : "list")
  const [error, setError] = useState<string | null>(null)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Synchronize search params changes
  useEffect(() => {
    if (bookingId) {
      setSelectedThreadId(bookingId)
      setMobileView("chat")
    }
  }, [bookingId])

  // Simulated Typing indicator when changing threads
  useEffect(() => {
    if (!selectedThreadId) return
    setIsOtherUserTyping(true)
    const timer = setTimeout(() => {
      setIsOtherUserTyping(false)
    }, 1800)
    return () => clearTimeout(timer)
  }, [selectedThreadId])

  // Load threads
  const loadThreads = async () => {
    if (!currentUserId) return
    setLoadingThreads(true)
    try {
      const { data: bookingsData, error: bookingsErr } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_date,
          guest_name,
          guest_id,
          host_id,
          status,
          tour:tours (
            title
          ),
          guest:profiles!bookings_guest_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          host:profiles!bookings_host_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`host_id.eq.${currentUserId},guest_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })

      if (bookingsErr) throw bookingsErr

      const { data: messagesData, error: messagesErr } = await supabase
        .from("messages")
        .select("id, booking_id, sender_id, receiver_id, message, read, created_at")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: true })

      if (messagesErr) throw messagesErr

      const allMsgs = (messagesData ?? []).map((row: any) => ({
        id: row.id,
        booking_id: row.booking_id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id,
        content: row.message,
        is_read: row.read,
        created_at: row.created_at,
      })) as ApiMessage[]

      const mappedThreads: Thread[] = (bookingsData ?? []).map((b: any) => {
        const isHost = b.host_id === currentUserId
        const otherUserObj = isHost ? b.guest : b.host
        const otherUserName = otherUserObj?.full_name || (isHost ? b.guest_name : "Host")

        const bookingMsgs = allMsgs.filter(m => m.booking_id === b.id)
        const lastMsg = bookingMsgs.length > 0 ? bookingMsgs[bookingMsgs.length - 1] : undefined
        const unreadCount = bookingMsgs.filter(m => m.receiver_id === currentUserId && !m.is_read).length

        const initials = otherUserName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()

        return {
          id: b.id,
          tourTitle: b.tour?.title || "Custom Tour",
          bookingDate: b.booking_date,
          otherUser: {
            id: isHost ? (b.guest_id || "guest-id") : b.host_id,
            name: otherUserName,
            avatarUrl: otherUserObj?.avatar_url || null,
            initials,
          },
          lastMessage: lastMsg,
          unreadCount,
          online: Math.random() > 0.4,
        }
      })

      mappedThreads.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0
        const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0
        return bTime - aTime
      })

      setThreads(mappedThreads)

      if (bookingId && !selectedThreadId) {
        setSelectedThreadId(bookingId)
      } else if (!selectedThreadId && mappedThreads.length > 0) {
        setSelectedThreadId(mappedThreads[0].id)
      }
    } catch (err) {
      console.error("Failed to load threads:", err)
      setError("Failed to load conversation threads.")
    } finally {
      setLoadingThreads(false)
    }
  }

  // Load messages for selected thread
  const loadThreadMessages = async (threadId: string) => {
    if (!threadId) return
    setLoadingMessages(true)
    setError(null)
    try {
      const data = await fetchMessages(threadId)
      setMessages(data)
      // Mark read
      if (currentUserId) {
        await markMessagesRead(threadId, currentUserId)
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
        )
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
      setError("Failed to load messages.")
    } finally {
      setLoadingMessages(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (!currentUserId) return
    loadThreads()
  }, [currentUserId])

  // Fetch messages when thread changes
  useEffect(() => {
    if (selectedThreadId) {
      loadThreadMessages(selectedThreadId)
    }
  }, [selectedThreadId, threads.length])

  // Realtime subscription setup
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel("messages-realtime-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const newMsg = payload.new
          // Check if user is sender or receiver
          if (newMsg.sender_id === currentUserId || newMsg.receiver_id === currentUserId) {
            // Reload threads list
            await loadThreads()

            // If it belongs to currently selected conversation, append message
            if (newMsg.booking_id === selectedThreadId) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev
                return [
                  ...prev,
                  {
                    id: newMsg.id,
                    booking_id: newMsg.booking_id,
                    sender_id: newMsg.sender_id,
                    receiver_id: newMsg.receiver_id,
                    content: newMsg.message,
                    is_read: newMsg.read,
                    created_at: newMsg.created_at,
                  },
                ]
              })
              // Mark as read
              await markMessagesRead(selectedThreadId, currentUserId)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, selectedThreadId])

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOtherUserTyping])

  const selectedThread = threads.find((t) => t.id === selectedThreadId)

  // Handle Send action
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !selectedThread || !currentUserId) return

    const cleanMessage = sanitizeText(inputValue.trim())
    setSending(true)
    setInputValue("")

    try {
      const sentMsg = await sendMessage(
        currentUserId,
        selectedThread.otherUser.id,
        cleanMessage,
        selectedThreadId
      )

      // Optimistic state updates
      setMessages((prev) => [...prev, sentMsg])

      // Re-fetch threads silently to update last message preview
      loadThreads()
    } catch (err) {
      console.error("Failed to send message:", err)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setSending(true)
      // Slight artificial timeout to ensure layout stability
      setTimeout(() => setSending(false), 200)
    }
  }

  // Filter threads
  const filteredThreads = threads.filter((t) =>
    t.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tourTitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupMessages = () => {
    const groups: { [key: string]: ApiMessage[] } = {}
    messages.forEach((msg) => {
      const date = new Date(msg.created_at)
      const dateStr = format(date, "yyyy-MM-dd")
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(msg)
    })
    return groups
  }

  const renderDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "EEEE, MMMM d")
  }

  if (!currentUserId || role === "admin") {
    return (
      <div className="min-h-screen bg-background">
        <GlassmorphismNavbar />
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <ShieldAlert className="size-12 text-muted-foreground animate-pulse" />
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-white/60 text-sm">Please log in as a traveler or local host to access your inbox.</p>
          <Button onClick={() => navigate("/auth")} className="rounded-full bg-primary hover:opacity-90">Log In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlassmorphismNavbar />

      {/* Main Inbox container */}
      <div className="flex-1 pt-24 pb-8 px-4 max-w-7xl mx-auto w-full flex flex-col h-[calc(100vh-20px)]">
        <div className="flex-1 bg-card/40 border border-border backdrop-blur-xl rounded-2xl overflow-hidden flex shadow-2xl">
          
          {/* Thread List Pane */}
          <div
            className={cn(
              "w-full md:w-80 border-r border-border flex flex-col bg-black/10 shrink-0",
              mobileView === "chat" && "hidden md:flex"
            )}
          >
            {/* Search header */}
            <div className="p-4 border-b border-border space-y-3">
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Messages
                {threads.some((t) => t.unreadCount > 0) && (
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                )}
              </h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search direct messages..."
                  className="pl-9 h-9 text-xs rounded-lg bg-black/35 border-border focus-visible:ring-primary text-white"
                />
              </div>
            </div>

            {/* Threads index list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingThreads ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-white/40">
                  <Spinner className="size-6 text-primary animate-spin" />
                  <span className="text-xs">Loading conversations...</span>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-16 text-white/30 text-xs">
                  {searchQuery ? "No messages match search" : "No active message history"}
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const active = thread.id === selectedThreadId
                  return (
                    <button
                      key={thread.id}
                      onClick={() => {
                        setSelectedThreadId(thread.id)
                        setSearchParams({ bookingId: thread.id })
                        setMobileView("chat")
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl flex gap-3 transition-all duration-200 border",
                        active
                          ? "bg-[#7F5AF0]/10 border-[#7F5AF0]/20 text-white shadow-sm shadow-[#7F5AF0]/5"
                          : "border-transparent text-white/60 hover:bg-accent/ hover:text-white"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar className="size-10 border border-border">
                          {thread.otherUser.avatarUrl ? (
                            <img src={thread.otherUser.avatarUrl} alt={thread.otherUser.name} className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                              {thread.otherUser.initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {thread.online && (
                          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold truncate text-white">
                            {thread.otherUser.name}
                          </h4>
                          {thread.lastMessage && (
                            <span className="text-[10px] text-white/30 shrink-0">
                              {isToday(new Date(thread.lastMessage.created_at))
                                ? format(new Date(thread.lastMessage.created_at), "h:mm a")
                                : format(new Date(thread.lastMessage.created_at), "MMM d")}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40 truncate mt-0.5">
                          {thread.tourTitle}
                        </p>
                        <p className={cn(
                          "text-xs truncate mt-1 leading-relaxed",
                          thread.unreadCount > 0 ? "text-white font-bold" : "text-white/50"
                        )}>
                          {thread.lastMessage ? thread.lastMessage.content : "Start chatting..."}
                        </p>
                      </div>

                      {thread.unreadCount > 0 && (
                        <div className="self-center flex size-5 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white shrink-0 shadow shadow-primary/20">
                          {thread.unreadCount}
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Active Chat Timeline Pane */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0 bg-[#0F0F12]/50",
              mobileView === "list" && "hidden md:flex"
            )}
          >
            {selectedThread ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-black/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => {
                        setMobileView("list")
                        setSearchParams({})
                      }}
                      className="md:hidden p-1.5 rounded-lg border border-white/15 bg-accent/ text-white/60 hover:text-white"
                    >
                      <Search className="size-4 rotate-90" />
                    </button>
                    
                    <div className="relative shrink-0">
                      <Avatar className="size-9 border border-border">
                        {selectedThread.otherUser.avatarUrl ? (
                          <img src={selectedThread.otherUser.avatarUrl} alt={selectedThread.otherUser.name} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                            {selectedThread.otherUser.initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {selectedThread.online && (
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-[#16161A]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {selectedThread.otherUser.name}
                      </h3>
                      <p className="text-[10px] text-white/40 truncate mt-0.5">
                        {selectedThread.tourTitle} ({format(new Date(selectedThread.bookingDate), "MMMM d, yyyy")})
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="flex items-center gap-1.5 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full font-bold">
                      <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                      Active Chat
                    </span>
                  </div>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-white/35">
                      <Spinner className="size-6 text-primary animate-spin" />
                      <span className="text-xs">Loading messages...</span>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full text-xs text-red-400 font-semibold">
                      {error}
                    </div>
                  ) : (
                    Object.entries(groupMessages()).map(([dateStr, dayMsgs]) => (
                      <div key={dateStr} className="space-y-4">
                        {/* Date Divider */}
                        <div className="flex items-center justify-center my-6">
                          <div className="h-px flex-1 bg-accent/" />
                          <span className="mx-4 text-[9px] font-black tracking-wider text-white/30 uppercase">
                            {renderDateHeader(dateStr)}
                          </span>
                          <div className="h-px flex-1 bg-accent/" />
                        </div>

                        {/* Messages bubbles */}
                        {dayMsgs.map((msg) => {
                          const isSelf = msg.sender_id === currentUserId
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex items-end gap-2 max-w-[85%] animate-fade-in",
                                isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                              )}
                            >
                              {!isSelf && (
                                <Avatar className="size-6 shrink-0 border border-border">
                                  {selectedThread.otherUser.avatarUrl ? (
                                    <img src={selectedThread.otherUser.avatarUrl} alt={selectedThread.otherUser.name} className="object-cover" />
                                  ) : (
                                    <AvatarFallback className="bg-primary/20 text-[9px] font-semibold text-primary">
                                      {selectedThread.otherUser.initials}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              )}

                              <div className="flex flex-col gap-0.5">
                                <div
                                  className={cn(
                                    "px-4 py-2 text-xs rounded-2xl shadow-md leading-relaxed whitespace-pre-wrap",
                                    isSelf
                                      ? "bg-gradient-to-r from-primary to-[#2CB67D] text-white rounded-br-none"
                                      : "bg-accent/ text-white/90 border border-border rounded-bl-none"
                                  )}
                                >
                                  {msg.content}
                                </div>
                                <span
                                  className={cn(
                                    "text-[8px] text-white/20 mt-0.5 px-1 flex items-center gap-1",
                                    isSelf ? "justify-end" : "justify-start"
                                  )}
                                >
                                  {format(new Date(msg.created_at), "h:mm a")}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))
                  )}

                  {isOtherUserTyping && (
                    <div className="flex items-end gap-2 max-w-[85%] mr-auto">
                      <Avatar className="size-6 shrink-0 border border-border">
                        {selectedThread.otherUser.avatarUrl ? (
                          <img src={selectedThread.otherUser.avatarUrl} alt={selectedThread.otherUser.name} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-primary/20 text-[9px] font-semibold text-primary">
                            {selectedThread.otherUser.initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col gap-0.5 animate-pulse">
                        <div className="bg-accent/ text-white/40 border border-border text-xs px-3.5 py-2 rounded-2xl rounded-bl-none flex items-center gap-1">
                          <span>typing</span>
                          <span className="flex gap-0.5 mt-1 shrink-0">
                            <span className="size-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="size-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="size-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input form */}
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 p-4 border-t border-border bg-black/10 shrink-0"
                >
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 h-10 text-xs rounded-full bg-black/25 border-border focus-visible:ring-primary px-4 text-white placeholder:text-white/20"
                    disabled={loadingMessages || sending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="size-10 rounded-full bg-primary hover:opacity-95 text-white shrink-0 shadow-md"
                    disabled={!inputValue.trim() || loadingMessages || sending}
                  >
                    {sending ? (
                      <Spinner className="size-4 animate-spin text-white" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-white/30">
                <MessageSquare className="size-12 text-white/10 mb-3" />
                <h3 className="font-bold text-white">Select a conversation</h3>
                <p className="text-xs mt-1 max-w-xs">Choose a chat thread from the left menu to start messaging with local hosts or travelers.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
