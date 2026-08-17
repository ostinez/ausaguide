import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export interface DirectMessage {
 id: string
 conversation_id: string
 sender_id: string | null
 receiver_id: string
 message: string
 image_url: string | null
 created_at: string
 read: boolean
 sender_type?: "user" | "system" | "traveler" | "host"
 metadata?: {
 type?: string
 booking_id?: string
 tour_name?: string
 date?: string
 time?: string
 guests?: number
 total?: number
 currency?: string
 payment_id?: string
 confirmed_at?: string
 } | null
}

export function useMessages(
 conversationId: string | null,
 currentUserId: string | null,
 otherUserId: string | null
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
 setMessages((data ?? []) as DirectMessage[])

 // Automatically mark received messages in this conversation as read
 await supabase
 .from("messages")
 .update({ read: true })
 .eq("conversation_id", conversationId)
 .eq("receiver_id", currentUserId)
 .eq("read", false)
 } catch (err: any) {
 console.error("[useMessages] Error loading messages:", err)
 } finally {
 setLoading(false)
 }
 }, [conversationId, currentUserId])

 useEffect(() => {
 loadMessages()
 }, [loadMessages])

 // 2. Realtime listener for new messages & typing indicator
 useEffect(() => {
 if (!conversationId || !currentUserId) return

 const channel = supabase
 .channel(`conv:${conversationId}`)
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
 setMessages((prev) => {
 if (prev.some((m) => m.id === newMsg.id)) return prev
 return [...prev, newMsg]
 })

 // If current user is receiver, mark as read immediately
 if (newMsg.receiver_id === currentUserId) {
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
 setMessages((prev) =>
 prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
 )
 }
 )
 .on("broadcast", { event: "typing" }, (payload) => {
 if (payload.payload?.senderId && payload.payload.senderId !== currentUserId) {
 setOtherTyping(Boolean(payload.payload.isTyping))
 }
 })
 .subscribe()

 channelRef.current = channel

 return () => {
 channel.unsubscribe()
 supabase.removeChannel(channel)
 }
 }, [conversationId, currentUserId])

 // 3. Typing broadcast
 const broadcastTyping = useCallback(
 (isTyping: boolean) => {
 if (!channelRef.current || !currentUserId) return

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
 image_url: imageUrl || null,
 read: false,
 sender_type: senderType || "user",
 }

 const { error } = await supabase
 .from("messages")
 .insert(payload)

 if (error) throw error

 // Update conversation metadata
 await supabase
 .from("conversations")
 .update({
 last_message: content.trim() || "📷 Photo",
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

 return {
 messages,
 loading,
 sending,
 otherTyping,
 sendMessage,
 broadcastTyping,
 markConversationRead,
 refreshMessages: loadMessages,
 }
}
