import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"

export interface Participant {
  id: string
  full_name: string
  avatar_url: string | null
  host_tier: string | null
  bio?: string | null
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
      const { data: convRows, error: convErr } = await supabase
        .from("conversations")
        .select("id, participant_a, participant_b, last_message, last_message_at, created_at")
        .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false })

      if (convErr) throw convErr

      const rawRows = convRows || []

      const enriched: ConversationItem[] = await Promise.all(
        rawRows.map(async (row) => {
          const otherId =
            row.participant_a === currentUserId ? row.participant_b : row.participant_a

          let profile: any = null
          try {
            const { data } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url, host_tier, bio")
              .eq("id", otherId)
              .maybeSingle()
            profile = data
          } catch (pErr) {
            console.warn("[useConversations] Profile fetch notice:", pErr)
          }

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
            // Safe fallback if count query encounters permission/column difference
          }

          return {
            id: row.id,
            participant_a: row.participant_a,
            participant_b: row.participant_b,
            last_message: row.last_message,
            last_message_at: row.last_message_at,
            created_at: row.created_at,
            other: (profile as Participant) ?? {
              id: otherId,
              full_name: "Ausaguide User",
              avatar_url: null,
              host_tier: null,
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

    // Unsubscribe from any previous channel before creating a new one.
    // This prevents "cannot add postgres_changes callbacks after subscribe()" errors
    // when currentUserId changes (e.g. on login/logout).
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Realtime channel on conversations and messages
    const channel = supabase
      .channel(`user-conversations-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          loadConversations()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [currentUserId, loadConversations])


  const createOrGetConversation = useCallback(
    async (otherUserId: string): Promise<string | null> => {
      if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
        return null
      }

      try {
        const [pA, pB] = [currentUserId, otherUserId].sort()

        // Check if existing conversation exists
        const { data: existing, error: findErr } = await supabase
          .from("conversations")
          .select("id")
          .or(
            `and(participant_a.eq.${pA},participant_b.eq.${pB}),and(participant_a.eq.${pB},participant_b.eq.${pA})`
          )
          .maybeSingle()

        if (!findErr && existing) {
          return existing.id
        }

        // Insert new conversation with sorted participant_a and participant_b
        const { data: newConv, error: createErr } = await supabase
          .from("conversations")
          .insert({
            participant_a: pA,
            participant_b: pB,
            last_message: "Started conversation",
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (createErr) throw createErr

        await loadConversations()
        return newConv.id
      } catch (err) {
        console.error("[useConversations] Error creating/getting conversation:", err)
        return null
      }
    },
    [currentUserId, loadConversations]
  )

  return {
    conversations,
    loading,
    error,
    refreshConversations: loadConversations,
    createOrGetConversation,
  }
}

export default useConversations
