import { useState, useEffect } from "react"
import { Search, Loader2, X, MessageSquare, MapPin, BadgeCheck } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/lib/types"

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectHost: (hostId: string) => void
  currentUserId: string | null
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function NewConversationModal({
  isOpen,
  onClose,
  onSelectHost,
  currentUserId,
}: NewConversationModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [hosts, setHosts] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [startingChatId, setStartingChatId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    async function loadInitialHosts() {
      setLoading(true)
      try {
        let query = supabase
          .from("profiles")
          .select("*")
          .limit(15)

        if (currentUserId) {
          query = query.neq("id", currentUserId)
        }

        const { data, error } = await query

        if (!error && data) {
          setHosts(data as Profile[])
        }
      } catch (err) {
        console.error("Failed to load hosts for conversation modal:", err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialHosts()
  }, [isOpen, currentUserId])

  const handleSearch = async (val: string) => {
    setSearchTerm(val)
    if (!val.trim()) {
      // Reload top hosts
      setLoading(true)
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId || "")
        .limit(15)
      setHosts((data as Profile[]) || [])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId || "")
        .ilike("full_name", `%${val.trim()}%`)
        .limit(10)

      setHosts((data as Profile[]) || [])
    } catch (err) {
      console.error("Error searching hosts:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (hostId: string) => {
    setStartingChatId(hostId)
    try {
      await onSelectHost(hostId)
      onClose()
    } finally {
      setStartingChatId(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 text-foreground p-6 rounded-3xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              New Conversation
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Search for local guides and hosts to start a direct message thread.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-3 bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              autoFocus
            />
          </div>

          {/* Search Results / Host List */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : hosts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No hosts or users found matching "{searchTerm}"
              </div>
            ) : (
              hosts.map((host) => (
                <button
                  key={host.id}
                  onClick={() => handleSelect(host.id)}
                  disabled={startingChatId === host.id}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-border/80 hover:bg-muted/50 active:scale-[0.98] transition-all text-left group min-h-[52px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-10 shrink-0 border border-border">
                      {host.avatar_url && (
                        <AvatarImage src={host.avatar_url} alt={host.full_name} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {initials(host.full_name || "U")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {host.full_name}
                        </span>
                        {host.verified_guide && (
                          <BadgeCheck className="size-3.5 text-blue-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        {host.location && (
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="size-3" />
                            {host.location}
                          </span>
                        )}
                        <span className="capitalize text-primary/80 font-medium">
                          {host.role === "host" ? "Local Host" : host.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {startingChatId === host.id ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <span className="text-xs font-semibold text-primary px-3 py-1.5 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                        Chat
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
