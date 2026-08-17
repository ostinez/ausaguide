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
 <div className={cn("flex flex-col h-full bg-[#0E131F]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl", className)}>
 {/* Search & Header */}
 <div className="p-3.5 border-b border-white/10 bg-card shadow-modern space-y-3 shrink-0">
 <div className="flex items-center justify-between">
 <h2 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
 <MessageSquare className="size-4 text-primary" />
 Messages
 </h2>
 <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-card shadow-modern text-white/70">
 {conversations.length}
 </span>
 </div>

 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/40" />
 <Input
 value={searchQuery}
 onChange={(e) => onSearchChange(e.target.value)}
 placeholder="Search messages..."
 className="pl-8.5 bg-card shadow-modern border-white/10 text-white placeholder:text-white/40 h-8.5 text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
 />
 </div>
 </div>

 {/* Conversations scroll area */}
 <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
 {filtered.length === 0 ? (
 <div className="text-center py-12 px-4 text-white/40">
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
 ? "bg-primary/20 border border-primary/40 shadow-sm"
 : "hover:bg-card shadow-modern border border-transparent"
 )}
 >
 {/* Avatar with presence */}
 <div className="relative shrink-0">
 <Avatar className="size-11 border border-white/10">
 {conv.other.avatar_url ? (
 <AvatarImage src={conv.other.avatar_url} alt={conv.other.full_name} className="object-cover" />
 ) : null}
 <AvatarFallback className="bg-gradient-to-br from-primary/30 to-teal/30 text-white font-bold text-xs">
 {initials(conv.other.full_name || "User")}
 </AvatarFallback>
 </Avatar>
 {online && (
 <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-[#0E131F]" />
 )}
 </div>

 {/* Text and preview */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-1 mb-0.5">
 <span className="font-semibold text-xs text-white truncate group-hover:text-primary transition-colors flex items-center gap-1">
 {conv.other.full_name}
 {conv.other.host_tier && (
 <Star className="size-2.5 fill-amber-400 text-amber-400 shrink-0" />
 )}
 </span>
 <span className="text-[10px] text-white/40 shrink-0">
 {formatConvTime(conv.last_message_at || conv.created_at)}
 </span>
 </div>

 <div className="flex items-center justify-between gap-2">
 <p
 className={cn(
 "text-[11px] truncate leading-tight",
 conv.unreadCount > 0
 ? "font-semibold text-white"
 : "text-white/50 group-hover:text-white/70"
 )}
 >
 {conv.last_message || "No messages yet"}
 </p>

 {conv.unreadCount > 0 && (
 <span className="flex size-4.5 items-center justify-center rounded-full bg-gradient-to-r from-[#0D6F73] to-[#0D6F73] text-[9px] font-bold text-white shrink-0 shadow-sm animate-pulse">
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
