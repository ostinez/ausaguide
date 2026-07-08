import React, { useEffect, useRef, useState } from "react"
import { Send, Search, ArrowLeft, MessageSquare, RefreshCw } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { fetchMessages, sendMessage, markMessagesRead, type Message as ApiMessage } from "@/lib/api/messages"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { sanitizeText } from "@/lib/validation"

interface ChatDialogProps {
  bookingId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
  receiverId: string
  receiverName: string
}

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

export function ChatDialog({
  bookingId: initialBookingId,
  isOpen,
  onOpenChange,
  currentUserId,
}: ChatDialogProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string>(initialBookingId)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [mobileView, setMobileView] = useState<"list" | "chat">(initialBookingId ? "chat" : "list")
  const [error, setError] = useState<string | null>(null)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Synchronize deep links and force thread activation on change
  useEffect(() => {
    if (isOpen && initialBookingId) {
      setSelectedThreadId(initialBookingId)
      setMobileView("chat")
    }
  }, [isOpen, initialBookingId])

  // Simulated Typing Indicator when thread changes or replies are sent
  useEffect(() => {
    if (!selectedThreadId) return
    setIsOtherUserTyping(true)
    const timer = setTimeout(() => {
      setIsOtherUserTyping(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [selectedThreadId])

  // Fetch threads and initial messages
  const loadThreads = async () => {
    if (!currentUserId) return
    setLoadingThreads(true)
    try {
      // 1. Fetch bookings
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

      // 2. Fetch all messages involving the user to find last message & unread count
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

      // 3. Construct threads
      const mappedThreads: Thread[] = (bookingsData ?? []).map((b: any) => {
        const isHost = b.host_id === currentUserId
        const otherUserObj = isHost ? b.guest : b.host
        const otherUserName = otherUserObj?.full_name || (isHost ? b.guest_name : "Host")
        
        // Find messages for this booking
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
          online: Math.random() > 0.3, // simulated online status indicator
        }
      })

      // Sort threads so that threads with the newest messages appear first
      mappedThreads.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0
        const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0
        return bTime - aTime
      })

      setThreads(mappedThreads)

      // Auto-select thread if initial selected thread is not found in mapped list but we have one
      if (initialBookingId && !selectedThreadId) {
        setSelectedThreadId(initialBookingId)
      } else if (!selectedThreadId && mappedThreads.length > 0) {
        setSelectedThreadId(mappedThreads[0].id)
      }
    } catch (err) {
      console.error("Failed to load threads:", err)
      setError("Failed to load inbox threads.")
    } finally {
      setLoadingThreads(false)
    }
  }

  // Load messages for the selected thread
  const loadThreadMessages = async (threadId: string) => {
    if (!threadId) return
    setLoadingMessages(true)
    setError(null)
    try {
      const activeThread = threads.find(t => t.id === threadId)
      const data = await fetchMessages(threadId)
      setMessages(data)

      if (activeThread) {
        await markMessagesRead(currentUserId, activeThread.otherUser.id)
        // Update local thread list to clear unread counts
        setThreads(prev =>
          prev.map(t => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
        )
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
      setError("Failed to load chat messages.")
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadThreads()
    }
  }, [isOpen, initialBookingId])

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadMessages(selectedThreadId)
    }
  }, [selectedThreadId, threads.length])

  // Real-time listener for incoming messages
  useEffect(() => {
    if (!isOpen) return

    const channel = supabase
      .channel("inbox-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as any
          const mappedMsg: ApiMessage = {
            id: newMsg.id,
            booking_id: newMsg.booking_id,
            sender_id: newMsg.sender_id,
            receiver_id: newMsg.receiver_id,
            content: newMsg.message,
            is_read: newMsg.read,
            created_at: newMsg.created_at,
          }

          // If the message belongs to our selected thread, add to messages stream
          if (mappedMsg.booking_id === selectedThreadId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === mappedMsg.id)) return prev
              return [...prev, mappedMsg]
            })
            // Mark read immediately
            if (mappedMsg.sender_id !== currentUserId) {
              markMessagesRead(currentUserId, mappedMsg.sender_id).catch(console.error)
            }
          }

          // Update the threads list with the new last message
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id === mappedMsg.booking_id) {
                const isRecipient = mappedMsg.receiver_id === currentUserId
                return {
                  ...t,
                  lastMessage: mappedMsg,
                  unreadCount: isRecipient && selectedThreadId !== t.id ? t.unreadCount + 1 : t.unreadCount,
                }
              }
              return t
            }).sort((a, b) => {
              const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0
              const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0
              return bTime - aTime
            })
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, selectedThreadId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOtherUserTyping])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = sanitizeText(inputValue)
    const activeThread = threads.find((t) => t.id === selectedThreadId)
    if (!content || !activeThread || sending) return

    setSending(true)
    try {
      const newMsg = await sendMessage(
        currentUserId,
        activeThread.otherUser.id,
        content,
        selectedThreadId
      )
      setMessages((prev) => [...prev, newMsg])
      setInputValue("")
      
      // Update thread last message locally
      setThreads((prev) =>
        prev.map((t) => (t.id === selectedThreadId ? { ...t, lastMessage: newMsg } : t))
      )
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const selectedThread = threads.find((t) => t.id === selectedThreadId)

  // Filter threads by search query
  const filteredThreads = threads.filter(
    (t) =>
      t.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tourTitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group messages by date helper
  const groupMessages = () => {
    const groups: { [key: string]: ApiMessage[] } = {}
    messages.forEach((msg) => {
      const date = new Date(msg.created_at)
      let dateKey = format(date, "yyyy-MM-dd")
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(msg)
    })
    return groups
  }

  const renderDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMMM d, yyyy")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col md:flex-row h-[650px] max-w-4xl p-0 overflow-hidden bg-card border-border shadow-2xl">
        
        {/* Left Side: Threads List */}
        <div
          className={cn(
            "w-full md:w-[320px] border-r border-border/80 flex flex-col h-full bg-card/65 select-none shrink-0",
            mobileView === "chat" ? "hidden md:flex" : "flex"
          )}
        >
          <DialogHeader className="p-4 border-b border-border/80 text-left">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-foreground">Messages</DialogTitle>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={loadThreads}
                disabled={loadingThreads}
              >
                <RefreshCw className={cn("size-4", loadingThreads && "animate-spin text-primary")} />
              </Button>
            </div>
            
            {/* Search Input */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-full bg-background border-border/80 focus-visible:ring-primary"
              />
            </div>
          </DialogHeader>

          {/* Threads List Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2 space-y-1">
            {loadingThreads ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Spinner className="size-5 text-primary animate-spin" />
                <span className="text-xs">Loading inbox...</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-xs text-muted-foreground">
                <MessageSquare className="size-8 text-muted-foreground/45 mb-2" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === selectedThreadId
                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      setSelectedThreadId(thread.id)
                      setMobileView("chat")
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                      isActive
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/40 border border-transparent"
                    )}
                  >
                    {/* User Avatar + Online Dot */}
                    <div className="relative">
                      <Avatar className="size-11 border border-border">
                        {thread.otherUser.avatarUrl ? (
                          <img src={thread.otherUser.avatarUrl} alt={thread.otherUser.name} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                            {thread.otherUser.initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {thread.online && (
                        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-card" />
                      )}
                    </div>

                    {/* Thread Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-semibold text-foreground truncate pr-2">
                          {thread.otherUser.name}
                        </h4>
                        {thread.lastMessage && (
                          <span className="text-[10px] text-muted-foreground/60">
                            {format(new Date(thread.lastMessage.created_at), "h:mm a")}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/75 truncate mb-1">
                        {thread.tourTitle} ({format(new Date(thread.bookingDate), "MMM d")})
                      </p>
                      {thread.lastMessage ? (
                        <p className={cn(
                          "text-xs truncate",
                          thread.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground/80"
                        )}>
                          {thread.lastMessage.sender_id === currentUserId ? "You: " : ""}
                          {thread.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs italic text-muted-foreground/50">No messages yet</p>
                      )}
                    </div>

                    {/* Unread badge */}
                    {thread.unreadCount > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full bg-background/25",
            mobileView === "list" ? "hidden md:flex" : "flex"
          )}
        >
          {selectedThread ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-card/65 shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full md:hidden mr-1"
                    onClick={() => setMobileView("list")}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>

                  {/* Recipient Avatar */}
                  <div className="relative">
                    <Avatar className="size-9 border border-border">
                      {selectedThread.otherUser.avatarUrl ? (
                        <img src={selectedThread.otherUser.avatarUrl} alt={selectedThread.otherUser.name} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                          {selectedThread.otherUser.initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {selectedThread.online && (
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border border-card" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {selectedThread.otherUser.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground/75 truncate max-w-[200px] sm:max-w-md">
                      {selectedThread.tourTitle} ({format(new Date(selectedThread.bookingDate), "MMMM d, yyyy")})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">
                    <span className="size-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                </div>
              </div>

              {/* Chat Messages stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/5">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <Spinner className="size-6 text-primary animate-spin" />
                    <span className="text-xs">Loading messages...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full text-xs text-destructive">
                    {error}
                  </div>
                ) : (
                  Object.entries(groupMessages()).map(([dateStr, dayMsgs]) => (
                    <div key={dateStr} className="space-y-4">
                      {/* Date Divider */}
                      <div className="flex items-center justify-center my-6">
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="mx-4 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                          {renderDateHeader(dateStr)}
                        </span>
                        <div className="h-px flex-1 bg-border/40" />
                      </div>

                      {/* Day Messages */}
                      {dayMsgs.map((msg) => {
                        const isSelf = msg.sender_id === currentUserId
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex items-end gap-2 max-w-[85%] animate-fade-in-up",
                              isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                          >
                            {!isSelf && (
                              <Avatar className="size-6 shrink-0">
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
                                  "px-3.5 py-2 text-xs rounded-2xl shadow-sm leading-relaxed",
                                  isSelf
                                    ? "bg-gradient-to-r from-primary to-teal text-white rounded-br-none"
                                    : "bg-muted/70 text-foreground border border-border/80 rounded-bl-none"
                                )}
                              >
                                {msg.content}
                              </div>
                              <span
                                className={cn(
                                  "text-[8px] text-muted-foreground/75 mt-0.5 px-1 flex items-center gap-1",
                                  isSelf ? "justify-end" : "justify-start"
                                )}
                              >
                                {format(new Date(msg.created_at), "h:mm a")}
                                {isSelf && (
                                  msg.is_read ? (
                                    <span className="text-teal-400 flex" title="Read">
                                      <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M0.282,12.721C0.1,12.902,0,13.15,0,13.41s0.1,0.508,0.282,0.689l5.034,5.034C5.502,19.32,5.75,19.418,6.01,19.418s0.508-0.098,0.689-0.285l12.784-12.784c0.18-0.181,0.281-0.429,0.281-0.689s-0.1-0.508-0.281-0.689l-1.378-1.378c-0.182-0.182-0.43-0.282-0.689-0.282s-0.508,0.1-0.689,0.282L6.01,14.654L2.35,10.994C2.169,10.812,1.921,10.712,1.661,10.712s-0.508,0.1-0.689,0.282L0.282,12.721z"/><path d="M5.597,12.721c-0.181,0.181-0.282,0.429-0.282,0.689s0.101,0.508,0.282,0.689l1.378,1.378c0.182,0.182,0.43,0.282,0.689,0.282s0.508-0.1,0.689-0.282l9.027-9.027l1.378,1.378L9.027,16.852l-2.052-2.052c-0.181-0.181-0.429-0.282-0.689-0.282s-0.508,0.1-0.689,0.282l-1.378,1.378c-0.181,0.181-0.282,0.429-0.282,0.689s0.101,0.508,0.282,0.689l3.414,3.414c0.181,0.181,0.429,0.282,0.689,0.282s0.508-0.1,0.689-0.282L23.718,5.434c0.182-0.182,0.282-0.43,0.282-0.689s-0.1-0.508-0.282-0.689l-1.378-1.378c-0.181-0.181-0.429-0.282-0.689-0.282s-0.508,0.1-0.689,0.282L10.395,11.343L9.027,9.975c-0.182-0.182-0.43-0.282-0.689-0.282s-0.508,0.1-0.689,0.282L5.597,12.721z"/></svg>
                                    </span>
                                  ) : (
                                    <span className="text-white/40 flex" title="Sent">
                                      <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M0.282,12.721C0.1,12.902,0,13.15,0,13.41s0.1,0.508,0.282,0.689l5.034,5.034C5.502,19.32,5.75,19.418,6.01,19.418s0.508-0.098,0.689-0.285l12.784-12.784c0.18-0.181,0.281-0.429,0.281-0.689s-0.1-0.508-0.281-0.689l-1.378-1.378c-0.182-0.182-0.43-0.282-0.689-0.282s-0.508,0.1-0.689,0.282L6.01,14.654L2.35,10.994C2.169,10.812,1.921,10.712,1.661,10.712s-0.508,0.1-0.689,0.282L0.282,12.721z"/><path d="M5.597,12.721c-0.181,0.181-0.282,0.429-0.282,0.689s0.101,0.508,0.282,0.689l1.378,1.378c0.182,0.182,0.43,0.282,0.689,0.282s0.508-0.1,0.689-0.282l9.027-9.027l1.378,1.378L9.027,16.852l-2.052-2.052c-0.181-0.181-0.429-0.282-0.689-0.282s-0.508,0.1-0.689,0.282l-1.378,1.378c-0.181,0.181-0.282,0.429-0.282,0.689s0.101,0.508,0.282,0.689l3.414,3.414c0.181,0.181,0.429,0.282,0.689,0.282s0.508-0.1,0.689-0.282L23.718,5.434c0.182-0.182,0.282-0.43,0.282-0.689s-0.1-0.508-0.282-0.689l-1.378-1.378c-0.181-0.181-0.429-0.282-0.689-0.282s-0.508,0.1-0.689,0.282L10.395,11.343L9.027,9.975c-0.182-0.182-0.43-0.282-0.689-0.282s-0.508,0.1-0.689,0.282L5.597,12.721z"/></svg>
                                    </span>
                                  )
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}

                {isOtherUserTyping && (
                  <div className="flex items-end gap-2 max-w-[85%] animate-pulse mr-auto">
                    <Avatar className="size-6 shrink-0">
                      {selectedThread.otherUser.avatarUrl ? (
                        <img src={selectedThread.otherUser.avatarUrl} alt={selectedThread.otherUser.name} className="object-cover animate-fade-in" />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-[9px] font-semibold text-primary">
                          {selectedThread.otherUser.initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <div className="bg-muted/70 text-foreground border border-border/80 text-xs px-3.5 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1.5 shadow-sm">
                        <span className="font-semibold text-foreground/80">{selectedThread.otherUser.name.split(" ")[0]} is typing</span>
                        <span className="flex gap-0.5 mt-1 shrink-0">
                          <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                          <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                          <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 p-3 border-t border-border/80 bg-card/65 shrink-0"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 h-10 text-xs rounded-full bg-background border-border/80 focus-visible:ring-primary px-4"
                  disabled={loadingMessages || sending}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="size-10 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shrink-0 shadow-md"
                  disabled={!inputValue.trim() || loadingMessages || sending}
                >
                  {sending ? (
                    <Spinner className="size-4 animate-spin text-primary-foreground" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
              <MessageSquare className="size-12 text-muted-foreground/35 mb-3" />
              <h3 className="font-semibold text-foreground">Select a conversation</h3>
              <p className="text-xs mt-1">Pick a chat thread from the left menu to start messaging.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
