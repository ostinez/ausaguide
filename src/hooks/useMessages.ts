import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string | null
  receiver_id?: string | null
  message: string
  image_url?: string | null
  created_at: string
  read: boolean
  sender_type?: "user" | "system" | "traveler" | "host"
  deleted_for_traveler?: boolean
  deleted_for_host?: boolean
  deleted_by_users?: string[]
  notification_type?: "booking_request" | "booking_confirmed" | "booking_declined" | "daily_room_shared" | string | null
  metadata?: {
    type?: string
    booking_id?: string
    tour_name?: string
    traveler_name?: string
    date?: string
    time?: string
    guests?: number
    amount?: number
    total?: number
    currency?: string
    payment_id?: string
    confirmed_at?: string
    decline_reason?: string
    daily_room_url?: string | null
    daily_room_id?: string | null
    message?: string
    status?: string
    [key: string]: any
  } | null
}


export function useMessages(
  conversationId: string | null,
  currentUserId: string | null,
  otherUserId: string | null,
  userRole: "traveler" | "host" | "admin" | "user" = "user"
) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 1. Load message history
  const loadMessages = useCallback(async () => {
    if (!conversationId || !currentUserId) {
      setMessages([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error

      const clearedKey = `cleared_chat_${currentUserId}_${conversationId}`
      const deletedMsgsKey = `deleted_msgs_${currentUserId}_${conversationId}`

      const clearedAt = localStorage.getItem(clearedKey)
      const deletedList: string[] = JSON.parse(localStorage.getItem(deletedMsgsKey) || "[]")

      let list = (data ?? []) as DirectMessage[]
      // Filter out soft-deleted messages for current user
      list = list.filter((m) => {
        if (clearedAt && new Date(m.created_at) <= new Date(clearedAt)) return false
        if (deletedList.includes(m.id)) return false
        if (m.deleted_by_users && m.deleted_by_users.includes(currentUserId)) return false
        if (userRole === "host" && m.deleted_for_host) return false
        if (userRole === "traveler" && m.deleted_for_traveler) return false
        return true
      })

      setMessages(list)

      // Automatically mark all received messages in this conversation as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", currentUserId)
        .eq("read", false)
    } catch (err: any) {
      console.error("[useMessages] Error loading messages:", err)
    } finally {
      setLoading(false)
    }
  }, [conversationId, currentUserId, userRole])


  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // 2. Realtime listener for new messages & typing indicator
  useEffect(() => {
    if (!conversationId || !currentUserId) return

    const topicName = `conv:${conversationId}`

    try {
      const existingChannels = supabase.getChannels()
      const existing = existingChannels.find(
        (ch) => ch.topic === `realtime:${topicName}` || ch.topic === topicName
      )
      if (existing) {
        supabase.removeChannel(existing)
      }
    } catch (e) {
      console.warn("[useMessages] Error cleaning up pre-existing channel:", e)
    }

    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current)
      } catch (_) {}
      channelRef.current = null
    }

    const channel = supabase
      .channel(topicName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage
          // Filter out if message was soft deleted for current user
          const deletedMsgsKey = `deleted_msgs_${currentUserId}_${conversationId}`
          const deletedList: string[] = JSON.parse(localStorage.getItem(deletedMsgsKey) || "[]")
          if (deletedList.includes(newMsg.id)) return
          if (newMsg.deleted_by_users && newMsg.deleted_by_users.includes(currentUserId)) return
          if (userRole === "host" && newMsg.deleted_for_host) return
          if (userRole === "traveler" && newMsg.deleted_for_traveler) return

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          // If message is from the other user, mark as read immediately in real-time
          if (newMsg.sender_id && newMsg.sender_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ read: true })
              .eq("id", newMsg.id)
              .then(() => {})
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as DirectMessage
          // If updated message was soft-deleted for current user, remove from list
          const deletedMsgsKey = `deleted_msgs_${currentUserId}_${conversationId}`
          const deletedList: string[] = JSON.parse(localStorage.getItem(deletedMsgsKey) || "[]")
          if (
            deletedList.includes(updatedMsg.id) ||
            (updatedMsg.deleted_by_users && updatedMsg.deleted_by_users.includes(currentUserId)) ||
            (userRole === "host" && updatedMsg.deleted_for_host) ||
            (userRole === "traveler" && updatedMsg.deleted_for_traveler)
          ) {
            setMessages((prev) => prev.filter((m) => m.id !== updatedMsg.id))
            return
          }

          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          )
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const { senderId, isTyping } = payload.payload as { senderId: string; isTyping: boolean }
        if (senderId !== currentUserId) {
          setOtherTyping(isTyping)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      try {
        channel.unsubscribe()
        supabase.removeChannel(channel)
      } catch (_) {}
      channelRef.current = null
    }
  }, [conversationId, currentUserId, userRole])

  // 3. Broadcast typing status
  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!currentUserId || !channelRef.current) return
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { senderId: currentUserId, isTyping },
      })

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.send({
            type: "broadcast",
            event: "typing",
            payload: { senderId: currentUserId, isTyping: false },
          })
        }, 2500)
      }
    },
    [currentUserId]
  )

  // 4. Send message function
  const sendMessage = useCallback(
    async (content: string, imageUrl?: string, senderType?: "traveler" | "host" | "user") => {
      if (!conversationId || !currentUserId || !otherUserId) {
        toast.error("Unable to send message: conversation participant missing.")
        return false
      }

      if (!content.trim() && !imageUrl) return false

      setSending(true)
      try {
        const payload: Record<string, any> = {
          conversation_id: conversationId,
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: content.trim(),
          read: false,
        }

        if (imageUrl) payload.image_url = imageUrl
        if (senderType) payload.sender_type = senderType

        const { error } = await supabase
          .from("messages")
          .insert(payload)

        if (error) throw error

        // Update conversation metadata
        await supabase
          .from("conversations")
          .update({
            last_message: content.trim() || "Photo",
            last_message_at: new Date().toISOString(),
          })
          .eq("id", conversationId)

        // Reset typing status
        broadcastTyping(false)

        return true
      } catch (err: any) {
        console.error("[useMessages] Error sending message:", err)
        toast.error(err.message || "Failed to send message.")
        return false
      } finally {
        setSending(false)
      }
    },
    [conversationId, currentUserId, otherUserId, broadcastTyping]
  )

  // 5. Mark conversation read
  const markConversationRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return
    try {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .eq("receiver_id", currentUserId)
        .eq("read", false)
    } catch (err) {
      console.error("[useMessages] Error marking messages read:", err)
    }
  }, [conversationId, currentUserId])

  // 6. Delete single message for me (WhatsApp "Delete for me")
  const deleteMessageForMe = useCallback(
    async (messageId: string) => {
      if (!conversationId || !currentUserId || !messageId) return false
      try {
        const deletedMsgsKey = `deleted_msgs_${currentUserId}_${conversationId}`
        const deletedList: string[] = JSON.parse(localStorage.getItem(deletedMsgsKey) || "[]")
        if (!deletedList.includes(messageId)) {
          deletedList.push(messageId)
          localStorage.setItem(deletedMsgsKey, JSON.stringify(deletedList))
        }

        setMessages((prev) => prev.filter((m) => m.id !== messageId))

        // Attempt soft-delete in DB if supported
        try {
          const msg = messages.find((m) => m.id === messageId)
          const updatedUsers = Array.from(new Set([...(msg?.deleted_by_users || []), currentUserId]))
          await supabase
            .from("messages")
            .update({ deleted_by_users: updatedUsers })
            .eq("id", messageId)
        } catch (_) {}

        toast.success("Message deleted for you.")
        return true
      } catch (err: any) {
        console.error("[useMessages] Error deleting message:", err)
        toast.error("Failed to delete message.")
        return false
      }
    },
    [conversationId, currentUserId, messages]
  )

  // 7. Clear entire chat on user's side
  const clearChat = useCallback(async () => {
    if (!conversationId || !currentUserId) return false
    try {
      const clearedKey = `cleared_chat_${currentUserId}_${conversationId}`
      localStorage.setItem(clearedKey, new Date().toISOString())

      setMessages([])

      // Attempt soft-delete in DB if columns exist
      try {
        const updateData: Record<string, any> = {}
        if (userRole === "host") {
          updateData.deleted_for_host = true
        } else {
          updateData.deleted_for_traveler = true
        }
        await supabase
          .from("messages")
          .update(updateData)
          .eq("conversation_id", conversationId)
      } catch (_) {}

      toast.success("Chat cleared for you.")
      return true
    } catch (err: any) {
      console.error("[useMessages] Error clearing chat:", err)
      toast.error("Failed to clear chat.")
      return false
    }
  }, [conversationId, currentUserId, userRole])

  return {
    messages,
    loading,
    sending,
    otherTyping,
    sendMessage,
    deleteMessageForMe,
    clearChat,
    broadcastTyping,
    markConversationRead,
    refreshMessages: loadMessages,
  }
}
