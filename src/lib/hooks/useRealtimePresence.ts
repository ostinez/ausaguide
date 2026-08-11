import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface UserPresenceState {
  userId: string
  online: boolean
  lastSeen?: string
}

export function useRealtimePresence(currentUserId: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresenceState>>({})

  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<UserPresenceState>()
        const updatedMap: Record<string, UserPresenceState> = {}

        Object.keys(state).forEach((key) => {
          const presences = state[key]
          if (presences && presences.length > 0) {
            const p = presences[0]
            updatedMap[key] = {
              userId: key,
              online: true,
              lastSeen: p.lastSeen || new Date().toISOString(),
            }
          }
        })

        setOnlineUsers(updatedMap)
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [key]: {
            userId: key,
            online: true,
            lastSeen: newPresences[0]?.lastSeen || new Date().toISOString(),
          },
        }))
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [key]: {
            userId: key,
            online: false,
            lastSeen: new Date().toISOString(),
          },
        }))
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: currentUserId,
            online: true,
            lastSeen: new Date().toISOString(),
          })
        }
      })

    const handleBeforeUnload = () => {
      channel.untrack()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const isUserOnline = (userId: string): boolean => {
    if (!userId) return false
    return onlineUsers[userId]?.online ?? false
  }

  const getUserLastSeen = (userId: string): string | null => {
    if (!userId) return null
    return onlineUsers[userId]?.lastSeen ?? null
  }

  return { onlineUsers, isUserOnline, getUserLastSeen }
}
