/**
 * useConversations
 *
 * Loads conversations that are tied to CONFIRMED bookings only.
 * No direct messaging, no free-form "New Chat" creation.
 * A conversation only exists because a host accepted a booking.
 */
import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"

export interface Participant {
  id: string
  full_name: string
  avatar_url: string | null
  host_tier: string | null
  bio?: string | null
  role?: string | null
  location?: string | null
}

export interface ConversationItem {
  id: string
  participant_a: string
  participant_b: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
  other: Participant
  unreadCount: number
  // Direct / Booking context
  isDirect: boolean
  bookingId?: string | null
  bookingStatus?: string | null
  tourName?: string | null
  bookingDate?: string | null
}

export function useConversations(currentUserId: string | null) {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    if (!currentUserId) {
      setConversations([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Load conversations
      const { data: convRows, error: convErr } = await supabase
        .from("conversations")
        .select(`
          id,
          participant_a,
          participant_b,
          last_message,
          last_message_at,
          created_at
        `)
        .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false })

      if (convErr) throw convErr

      const deletedConvsKey = `deleted_convs_${currentUserId}`
      const deletedConvsMap: Record<string, string> = JSON.parse(localStorage.getItem(deletedConvsKey) || "{}")

      // 2. Include all conversations except ones deleted for this user that have no new messages
      const validRows = (convRows || []).filter((row: any) => {
        const deletedAt = deletedConvsMap[row.id]
        if (!deletedAt) return true
        if (row.last_message_at && new Date(row.last_message_at) > new Date(deletedAt)) {
          delete deletedConvsMap[row.id]
          localStorage.setItem(deletedConvsKey, JSON.stringify(deletedConvsMap))
          return true
        }
        return false
      })

      // 3. Enrich with the other participant's profile + unread count + booking context
      const enriched: ConversationItem[] = await Promise.all(
        validRows.map(async (row: any) => {
          const otherId =
            row.participant_a === currentUserId ? row.participant_b : row.participant_a

          // Fetch the other user's profile
          let profile: any = null
          try {
            const { data } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url, host_tier, bio, role, location")
              .eq("id", otherId)
              .maybeSingle()
            profile = data
          } catch (pErr) {
            console.warn("[useConversations] Profile fetch notice:", pErr)
          }

          // Count unread messages
          let unreadCount = 0
          try {
            const { count } = await supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", row.id)
              .eq("receiver_id", currentUserId)
              .eq("read", false)
            unreadCount = count ?? 0
          } catch (_) {
            // Safe fallback
          }

          // Check for active/recent booking between the two participants
          let bookingInfo: { id: string; status: string; tourName: string | null; bookingDate: string | null } | null = null
          try {
            const { data: bData } = await supabase
              .from("bookings")
              .select("id, status, booking_date, tours(title)")
              .or(`and(guest_id.eq.${currentUserId},host_id.eq.${otherId}),and(guest_id.eq.${otherId},host_id.eq.${currentUserId})`)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()

            if (bData) {
              bookingInfo = {
                id: bData.id,
                status: bData.status,
                tourName: (bData.tours as any)?.title ?? null,
                bookingDate: bData.booking_date ?? null,
              }
            }
          } catch (_) {
            // Safe fallback
          }

          return {
            id: row.id,
            participant_a: row.participant_a,
            participant_b: row.participant_b,
            last_message: row.last_message,
            last_message_at: row.last_message_at,
            created_at: row.created_at,
            isDirect: !bookingInfo,
            bookingId: bookingInfo?.id ?? null,
            bookingStatus: bookingInfo?.status ?? null,
            tourName: bookingInfo?.tourName ?? null,
            bookingDate: bookingInfo?.bookingDate ?? null,
            other: (profile as Participant) ?? {
              id: otherId,
              full_name: "Ausaguide User",
              avatar_url: null,
              host_tier: null,
              role: "user",
            },
            unreadCount,
          }
        })
      )

      setConversations(enriched)
    } catch (err: any) {
      console.error("[useConversations] Error loading conversations:", err)
      setError(err.message || "Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    loadConversations()

    if (!currentUserId) return

    const topicName = `user-conversations-${currentUserId}`

    // Clean up any pre-existing channel
    try {
      const existingChannels = supabase.getChannels()
      const existing = existingChannels.find(
        (ch) => ch.topic === `realtime:${topicName}` || ch.topic === topicName
      )
      if (existing) supabase.removeChannel(existing)
    } catch (e) {
      console.warn("[useConversations] Channel cleanup notice:", e)
    }

    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current)
      } catch (_) {}
      channelRef.current = null
    }

    // Subscribe to conversation + message changes
    const channel = supabase
      .channel(topicName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => { loadConversations() }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => { loadConversations() }
      )
      // Also listen for booking status changes (host accept auto-creates chat)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `status=eq.confirmed`,
        },
        () => { loadConversations() }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      try {
        channel.unsubscribe()
        supabase.removeChannel(channel)
      } catch (_) {}
      channelRef.current = null
    }
  }, [currentUserId, loadConversations])

  const deleteConversationForMe = useCallback(
    (conversationId: string) => {
      if (!currentUserId || !conversationId) return
      const deletedConvsKey = `deleted_convs_${currentUserId}`
      const deletedConvsMap: Record<string, string> = JSON.parse(
        localStorage.getItem(deletedConvsKey) || "{}"
      )
      deletedConvsMap[conversationId] = new Date().toISOString()
      localStorage.setItem(deletedConvsKey, JSON.stringify(deletedConvsMap))

      const clearedKey = `cleared_chat_${currentUserId}_${conversationId}`
      localStorage.setItem(clearedKey, new Date().toISOString())

      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
    },
    [currentUserId]
  )

  return {
    conversations,
    loading,
    error,
    deleteConversationForMe,
    refreshConversations: loadConversations,
  }
}

export default useConversations
