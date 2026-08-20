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
  bookingTime?: string | null
  guestCount?: number | null
  totalPrice?: number | null
  currency?: string | null
  guestName?: string | null
  guestEmail?: string | null
  guestPhone?: string | null
  bookingNotes?: string | null
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
          created_at
        `)
        .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
        .order("created_at", { ascending: false })

      if (convErr) throw convErr

      const deletedConvsKey = `deleted_convs_${currentUserId}`
      const deletedConvsMap: Record<string, string> = JSON.parse(localStorage.getItem(deletedConvsKey) || "{}")

      const validRows = convRows || []

      // 2. Enrich with the other participant's profile + last message + unread count + booking context
      const results = await Promise.all(
        validRows.map(async (row: any): Promise<ConversationItem | null> => {
          const otherId =
            row.participant_a === currentUserId ? row.participant_b : row.participant_a

          // Fetch last message from messages table
          let lastMessageText: string | null = null
          let lastMessageTime: string | null = row.created_at

          try {
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("message, created_at")
              .eq("conversation_id", row.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()

            if (lastMsg) {
              lastMessageText = lastMsg.message
              lastMessageTime = lastMsg.created_at
            }
          } catch (_) {}

          // Check if conversation was soft deleted
          const deletedAt = deletedConvsMap[row.id]
          if (deletedAt) {
            if (lastMessageTime && new Date(lastMessageTime) > new Date(deletedAt)) {
              delete deletedConvsMap[row.id]
              localStorage.setItem(deletedConvsKey, JSON.stringify(deletedConvsMap))
            } else {
              return null
            }
          }

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
          let bookingInfo: {
            id: string
            status: string
            tourName: string | null
            bookingDate: string | null
            bookingTime: string | null
            guestCount: number | null
            totalPrice: number | null
            currency: string | null
            guestName: string | null
            guestEmail: string | null
            guestPhone: string | null
            notes: string | null
          } | null = null

          try {
            const { data: bData } = await supabase
              .from("bookings")
              .select("id, status, booking_date, booking_time, total_price, currency, guest_count, guest_name, guest_email, guest_phone, notes, tours(title)")
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
                bookingTime: (bData as any).booking_time ?? null,
                guestCount: (bData as any).guest_count ?? null,
                totalPrice: (bData as any).total_price ?? null,
                currency: (bData as any).currency ?? "KES",
                guestName: (bData as any).guest_name ?? null,
                guestEmail: (bData as any).guest_email ?? null,
                guestPhone: (bData as any).guest_phone ?? null,
                notes: (bData as any).notes ?? null,
              }
            }
          } catch (_) {
            // Safe fallback
          }

          return {
            id: row.id,
            participant_a: row.participant_a,
            participant_b: row.participant_b,
            last_message: lastMessageText,
            last_message_at: lastMessageTime,
            created_at: row.created_at,
            isDirect: !bookingInfo,
            bookingId: bookingInfo?.id ?? null,
            bookingStatus: bookingInfo?.status ?? null,
            tourName: bookingInfo?.tourName ?? null,
            bookingDate: bookingInfo?.bookingDate ?? null,
            bookingTime: bookingInfo?.bookingTime ?? null,
            guestCount: bookingInfo?.guestCount ?? null,
            totalPrice: bookingInfo?.totalPrice ?? null,
            currency: bookingInfo?.currency ?? null,
            guestName: bookingInfo?.guestName ?? null,
            guestEmail: bookingInfo?.guestEmail ?? null,
            guestPhone: bookingInfo?.guestPhone ?? null,
            bookingNotes: bookingInfo?.notes ?? null,
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

      const enriched: ConversationItem[] = results
        .filter((c): c is ConversationItem => Boolean(c))
        .sort((a, b) => {
          const tA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
          const tB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
          return tB - tA
        })

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
