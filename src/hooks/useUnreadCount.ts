import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function useUnreadCount(userId: string | null | undefined) {
 const [unreadCount, setUnreadCount] = useState<number>(0)

 const fetchUnreadCount = useCallback(async () => {
 if (!userId) {
 setUnreadCount(0)
 return
 }

 try {
 const { count, error } = await supabase
 .from("messages")
 .select("*", { count: "exact", head: true })
 .eq("receiver_id", userId)
 .eq("read", false)

 if (!error && typeof count === "number") {
 setUnreadCount(count)
 }
 } catch (err) {
 console.error("[useUnreadCount] Error fetching unread message count:", err)
 }
 }, [userId])

 useEffect(() => {
 if (!userId) {
 setUnreadCount(0)
 return
 }

 fetchUnreadCount()

 // Realtime subscription for incoming/updated messages
 const channelId = `unread-messages-${userId}-${Math.random().toString(36).substring(2, 7)}`
 const channel = supabase
 .channel(channelId)
 .on(
 "postgres_changes",
 {
 event: "*",
 schema: "public",
 table: "messages",
 filter: `receiver_id=eq.${userId}`,
 },
 () => {
 fetchUnreadCount()
 }
 )
 .subscribe()

 // Periodic safety fallback check every 10 seconds
 const interval = setInterval(fetchUnreadCount, 10000)

 return () => {
 clearInterval(interval)
 channel.unsubscribe()
 supabase.removeChannel(channel)
 }
 }, [userId, fetchUnreadCount])

 return { unreadCount, refreshUnreadCount: fetchUnreadCount }
}
