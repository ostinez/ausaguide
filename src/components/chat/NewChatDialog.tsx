import { useState, useEffect, useCallback } from "react"
import { Search, Loader2, MessageSquare, MapPin, ShieldCheck, User, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { findOrCreateDirectConversation } from "@/lib/api/follows"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface ProfileUser {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
  bio?: string | null
  location?: string | null
  host_type?: string | null
  is_verified?: boolean
}

interface NewChatDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
  onSelectConversation: (conversationId: string) => void
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function NewChatDialog({
  isOpen,
  onOpenChange,
  currentUserId,
  onSelectConversation,
}: NewChatDialogProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<ProfileUser[]>([])
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null)

  // Load suggested users / search results
  const searchUsers = useCallback(
    async (searchTerm: string) => {
      if (!currentUserId) return
      setLoading(true)

      try {
        let queryBuilder = supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role, bio, location, host_type, is_verified")
          .neq("id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(20)

        if (searchTerm.trim()) {
          queryBuilder = queryBuilder.ilike("full_name", `%${searchTerm.trim()}%`)
        } else {
          // Default: prioritize verified hosts/guides and active members
          queryBuilder = queryBuilder.limit(10)
        }

        const { data, error } = await queryBuilder

        if (error) throw error
        setUsers((data as ProfileUser[]) || [])
      } catch (err: any) {
        console.error("Error searching users for chat:", err)
      } finally {
        setLoading(false)
      }
    },
    [currentUserId]
  )

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      searchUsers("")
    }
  }, [isOpen, searchUsers])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    searchUsers(val)
  }

  const handleStartChat = async (targetUser: ProfileUser) => {
    if (!currentUserId) return
    setStartingChatWith(targetUser.id)

    try {
      // 1. Check if target user has direct messaging restrictions
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("is_private")
        .eq("id", targetUser.id)
        .maybeSingle()

      const dmPref = (targetProfile as any)?.direct_messages_permission || (targetProfile?.is_private ? "followers" : "everyone")

      if (dmPref === "bookings") {
        // Check if current user has a confirmed booking with target user
        const { data: bookingCheck } = await supabase
          .from("bookings")
          .select("id")
          .or(`and(guest_id.eq.${currentUserId},host_id.eq.${targetUser.id}),and(guest_id.eq.${targetUser.id},host_id.eq.${currentUserId})`)
          .eq("status", "confirmed")
          .limit(1)

        if (!bookingCheck || bookingCheck.length === 0) {
          toast.error(`${targetUser.full_name} only accepts direct messages from confirmed tour bookings.`)
          return
        }
      } else if (dmPref === "followers") {
        // Check if there is an accepted follow connection
        const { data: followCheck } = await supabase
          .from("follows")
          .select("id")
          .or(`and(follower_id.eq.${currentUserId},following_id.eq.${targetUser.id}),and(follower_id.eq.${targetUser.id},following_id.eq.${currentUserId})`)
          .eq("status", "accepted")
          .limit(1)

        if (!followCheck || followCheck.length === 0) {
          toast.info(`Please send a follow request to ${targetUser.full_name} before starting a direct chat.`)
          return
        }
      }

      const { id: convId } = await findOrCreateDirectConversation(currentUserId, targetUser.id)
      onOpenChange(false)
      onSelectConversation(convId)
      toast.success(`Chat started with ${targetUser.full_name}`)
    } catch (err: any) {
      console.error("Failed to start direct conversation:", err)
      toast.error(err.message || "Failed to start conversation. Please try again.")
    } finally {
      setStartingChatWith(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-card border-border/80 text-foreground rounded-2xl shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/60">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MessageSquare className="size-4 text-primary" />
            </div>
            <span>New Message</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search for local guides, hosts, or travelers to start a direct conversation.
          </DialogDescription>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={handleQueryChange}
              placeholder="Search by name…"
              className="pl-9 pr-4 py-2 bg-muted/60 border-border/60 rounded-xl text-sm focus-visible:ring-primary/30"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="max-h-[380px] overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Searching users…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center text-muted-foreground px-4">
              <User className="size-10 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-foreground">No users found</p>
              <p className="text-xs">Try searching for a different name.</p>
            </div>
          ) : (
            <>
              {!query.trim() && (
                <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="size-3 text-primary" />
                  <span>Suggested Hosts & Guides</span>
                </div>
              )}

              {users.map((u) => {
                const isStarting = startingChatWith === u.id

                return (
                  <div
                    key={u.id}
                    onClick={() => !isStarting && handleStartChat(u)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer select-none",
                      "border border-transparent hover:border-border/60 hover:bg-muted/60 active:scale-[0.99]",
                      isStarting && "opacity-70 pointer-events-none"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <Avatar className="size-11 border border-border/60">
                          {u.avatar_url && (
                            <AvatarImage src={u.avatar_url} alt={u.full_name} className="object-cover" />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {initials(u.full_name || "User")}
                          </AvatarFallback>
                        </Avatar>
                        {u.is_verified && (
                          <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-primary flex items-center justify-center ring-2 ring-card">
                            <ShieldCheck className="size-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-foreground truncate">{u.full_name}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 uppercase font-semibold shrink-0",
                              u.role === "host"
                                ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                                : "bg-primary/10 text-primary border-primary/30"
                            )}
                          >
                            {u.host_type || u.role}
                          </Badge>
                        </div>

                        {u.location && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="size-2.5 text-primary shrink-0" />
                            <span>{u.location}</span>
                          </p>
                        )}

                        {u.bio && (
                          <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                            {u.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full shrink-0 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground h-8 text-xs font-semibold px-3 ml-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartChat(u)
                      }}
                      disabled={isStarting}
                    >
                      {isStarting ? (
                        <Loader2 className="size-3.5 animate-spin mr-1" />
                      ) : (
                        <MessageSquare className="size-3.5 mr-1" />
                      )}
                      Chat
                    </Button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
