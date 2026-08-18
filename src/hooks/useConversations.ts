import { useState, useEffect, useCallback } from "react"
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
      // 1. First attempt: participant_a and participant_b
      let rawRows: any[] = []

      const { data: convRowsAB, error: convErrAB } = await supabase
        .from("conversations")
        .select("id, participant_a, participant_b, last_message, last_message_at, created_at")
        .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false })

      if (convErrAB) {
        // Check if error is due to participant_a column not existing in legacy schema
        if (
          convErrAB.message?.includes("participant_a") ||
          convErrAB.message?.includes("column") ||
          convErrAB.code === "42703"
        ) {
          const { data: convRows12, error: convErr12 } = await supabase
            .from("conversations")
            .select("id, participant1_id, participant2_id, last_message, last_message_at, created_at")
            .or(`participant1_id.eq.${currentUserId},participant2_id.eq.${currentUserId}`)
            .order("last_message_at", { ascending: false, nullsFirst: false })

          if (convErr12) {
            console.warn("[useConversations] Query fallback failed:", convErr12)
            throw convErr12
          }
          rawRows = (convRows12 || []).map((r) => ({
            ...r,
            participant_a: r.participant1_id,
            participant_b: r.participant2_id,
          }))
        } else {
          throw convErrAB
        }
      } else {
        rawRows = convRowsAB || []
      }

      const enriched: ConversationItem[] = await Promise.all(
        rawRows.map(async (row) => {
          const pA = row.participant_a || row.participant1_id
          const pB = row.participant_b || row.participant2_id
          const otherId = pA === currentUserId ? pB : pA

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
            // Safe fallback if receiver_id or read column is not present
          }

          return {
            id: row.id,
            participant_a: pA,
            participant_b: pB,
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

  useEffect(() => {
    loadConversations()

    if (!currentUserId) return

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
        },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [currentUserId, loadConversations])

  const createOrGetConversation = useCallback(
    async (otherUserId: string): Promise<string | null> => {
      if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
        return null
      }

      try {
        const [pA, pB] = [currentUserId, otherUserId].sort()

        // 1. Try finding conversation with participant_a and participant_b
        const { data: existingAB, error: findErrAB } = await supabase
          .from("conversations")
          .select("id")
          .or(
            `and(participant_a.eq.${pA},participant_b.eq.${pB}),and(participant_a.eq.${pB},participant_b.eq.${pA})`
          )
          .maybeSingle()

        if (!findErrAB && existingAB) {
          return existingAB.id
        }

        // Try finding with participant1_id / participant2_id fallback
        if (findErrAB) {
          const { data: existing12 } = await supabase
            .from("conversations")
            .select("id")
            .or(
              `and(participant1_id.eq.${pA},participant2_id.eq.${pB}),and(participant1_id.eq.${pB},participant2_id.eq.${pA})`
            )
            .maybeSingle()

          if (existing12) {
            return existing12.id
          }
        }

        // 2. Insert new conversation (try participant_a / participant_b first, fallback to participant1_id / participant2_id)
        const { data: newConvAB, error: insertErrAB } = await supabase
          .from("conversations")
          .insert({
            participant_a: pA,
            participant_b: pB,
            last_message: "Started conversation",
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (!insertErrAB && newConvAB) {
          await loadConversations()
          return newConvAB.id
        }

        // Fallback insert
        const { data: newConv12, error: insertErr12 } = await supabase
          .from("conversations")
          .insert({
            participant1_id: pA,
            participant2_id: pB,
            last_message: "Started conversation",
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (insertErr12) throw insertErr12

        await loadConversations()
        return newConv12.id
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
