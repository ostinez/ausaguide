import { supabase } from "@/lib/supabase"

export interface Notification {
  id: string
  user_id: string
  booking_id: string | null
  message: string
  type: "booking_request" | "booking_accepted" | "booking_declined" | "booking_completed" | "new_message"
  read: boolean
  created_at: string
}

export async function createNotification(
  userId: string,
  message: string,
  type: Notification["type"],
  bookingId?: string | null
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      message,
      type,
      booking_id: bookingId ?? null,
      read: false,
    })
    .select("*")
    .single()

  if (error) throw error
  return data as Notification
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)

  if (error) throw error
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false)

  if (error) throw error
}
