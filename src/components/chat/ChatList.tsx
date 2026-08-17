import { Search, Star, MessageSquare } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ConversationItem } from "@/hooks/useConversations"
import { cn } from "@/lib/utils"

export interface ChatListProps {
 conversations: ConversationItem[]
 selectedConvId: string | null
 onSelectConversation: (convId: string) => void
 searchQuery: string
 onSearchChange: (query: string) => void
 isUserOnline?: (userId: string) => boolean
 className?: string
}

function formatConvTime(ts: string | null) {
 if (!ts) return ""
 try {
 const d = new Date(ts)
 if (isToday(d)) return format(d, "HH:mm")
 if (isYesterday(d)) return "Yesterday"
 return format(d, "MMM d")
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

export function ChatList({
 conversations,
 selectedConvId,
 onSelectConversation,
 searchQuery,
 onSearchChange,
 isUserOnline,
 className,
}: ChatListProps) {
 const filtered = conversations.filter((c) =>
 (c.other?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
 (c.last_message || "").toLowerCase().includes(searchQuery.toLowerCase())
 )

 return (
 <div className={cn("flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden shadow-modern", className)}>
 {/* Search & Header */}
 <div className="p-3.5 border-b border-border bg-card space-y-3 shrink-0">
 <div className="flex items-center justify-between">
 <h2 className="font-bold text-foreground text-base tracking-tight flex items-center gap-2">
 <MessageSquare className="size-4 text-primary" />
 Messages
 </h2>
 <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
 {conversations.length}
 </span>
 </div>

 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
 <Input
 value={searchQuery}
 onChange={(e) => onSearchChange(e.target.value)}
 placeholder="Search messages..."
 className="pl-8.5 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-8.5 text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
 />
 </div>
 </div>

 {/* Conversations scroll area */}
 <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
 {filtered.length === 0 ? (
 <div className="text-center py-12 px-4 text-muted-foreground">
 <p className="text-xs">No conversations found</p>
 </div>
 ) : (
 filtered.map((conv) => {
 const isSelected = conv.id === selectedConvId
 const online = isUserOnline ? isUserOnline(conv.other.id) : false

 return (
 <button
 key={conv.id}
 onClick={() => onSelectConversation(conv.id)}
 className={cn(
 "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left group cursor-pointer",
 isSelected
 ? "bg-primary/10 border border-primary/30 shadow-sm"
 : "hover:bg-muted/60 border border-transparent"
 )}
 >
 {/* Avatar with presence */}
 <div className="relative shrink-0">
 <Avatar className="size-11 border border-border">
 {conv.other.avatar_url ? (
 <AvatarImage src={conv.other.avatar_url} alt={conv.other.full_name} className="object-cover" />
 ) : null}
 <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
 {initials(conv.other.full_name || "User")}
 </AvatarFallback>
 </Avatar>
 {online && (
 <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
 )}
 </div>

 {/* Text and preview */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-1 mb-0.5">
 <span className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1">
 {conv.other.full_name}
 {conv.other.host_tier && (
 <Star className="size-2.5 fill-amber-500 text-amber-500 shrink-0" />
 )}
 </span>
 <span className="text-[10px] text-muted-foreground shrink-0">
 {formatConvTime(conv.last_message_at || conv.created_at)}
 </span>
 </div>

 <div className="flex items-center justify-between gap-2">
 <p
 className={cn(
 "text-[11px] truncate leading-tight",
 conv.unreadCount > 0
 ? "font-bold text-foreground"
 : "text-muted-foreground group-hover:text-foreground/80"
 )}
 >
 {conv.last_message || "No messages yet"}
 </p>

 {conv.unreadCount > 0 && (
 <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shrink-0 shadow-sm animate-pulse">
 {conv.unreadCount}
 </span>
 )}
 </div>
 </div>
 </button>
 )
 })
 )}
 </div>
 </div>
 )
}
