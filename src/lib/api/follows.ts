import { supabase } from "@/lib/supabase"

export type FollowStatus = "none" | "pending" | "accepted" | "declined" | "blocked"

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  status: "pending" | "accepted" | "declined" | "blocked"
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface FollowRequestItem {
  id: string
  follower_id: string
  following_id: string
  status: "pending" | "accepted" | "declined" | "blocked"
  is_private: boolean
  created_at: string
  follower: {
    id: string
    full_name: string
    avatar_url: string | null
    bio?: string | null
    role: string
    location?: string | null
    host_type?: string | null
    is_verified?: boolean
  }
}

export interface ReachableConnection {
  user_id: string
  full_name: string
  avatar_url: string | null
  role: string
  bio?: string | null
  location?: string | null
  host_type?: string | null
  is_verified?: boolean
  connection_type: "following" | "follower" | "mutual" | "booking"
  conversation_id?: string | null
  last_message?: string | null
  last_message_at?: string | null
}

/**
 * Get current follow relationship status between two users.
 */
export async function getFollowStatus(
  followerId: string,
  followingId: string
): Promise<{ status: FollowStatus; followId: string | null; isPrivate: boolean }> {
  if (!followerId || !followingId || followerId === followingId) {
    return { status: "none", followId: null, isPrivate: true }
  }

  try {
    const { data, error } = await supabase
      .from("follows")
      .select("id, status, is_private")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle()

    if (error) {
      console.warn("[getFollowStatus] Query notice:", error.message)
      return { status: "none", followId: null, isPrivate: true }
    }

    if (!data) {
      // Check if target profile is private
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("is_private")
        .eq("id", followingId)
        .maybeSingle()

      const isTargetPrivate = targetProfile?.is_private ?? true
      return { status: "none", followId: null, isPrivate: isTargetPrivate }
    }

    return {
      status: (data.status as FollowStatus) || "none",
      followId: data.id,
      isPrivate: data.is_private ?? true,
    }
  } catch (err) {
    console.error("[getFollowStatus] Unexpected error:", err)
    return { status: "none", followId: null, isPrivate: true }
  }
}

/**
 * Follow a user (or send a follow request if target profile is private).
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ status: FollowStatus; followId: string }> {
  if (!followerId || !followingId || followerId === followingId) {
    throw new Error("Invalid follow parameters.")
  }

  // 1. Check if target account is private
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("full_name, is_private")
    .eq("id", followingId)
    .maybeSingle()

  const isPrivate = targetProfile?.is_private ?? true
  const initialStatus: "pending" | "accepted" = isPrivate ? "pending" : "accepted"

  // 2. Fetch follower's name for notifications
  const { data: followerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", followerId)
    .maybeSingle()

  const followerName = followerProfile?.full_name || "Someone"

  // 3. Upsert follow record
  const { data: follow, error: followErr } = await supabase
    .from("follows")
    .upsert(
      {
        follower_id: followerId,
        following_id: followingId,
        status: initialStatus,
        is_private: isPrivate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "follower_id,following_id" }
    )
    .select("id, status")
    .single()

  if (followErr) throw followErr

  // 4. Send notification to target user
  try {
    const notifMessage = isPrivate
      ? `${followerName} requested to follow you.`
      : `${followerName} started following you.`

    await supabase.from("notifications").insert({
      user_id: followingId,
      type: isPrivate ? "follow_request" : "new_follower",
      title: isPrivate ? "New Follow Request" : "New Follower",
      message: notifMessage,
      link: isPrivate ? "/follow-requests" : `/traveler/${followerId}`,
      read: false,
    })
  } catch (notifErr) {
    console.warn("[followUser] Notification dispatch notice:", notifErr)
  }

  // 5. If auto-accepted, ensure conversation thread is ready
  if (initialStatus === "accepted") {
    try {
      await findOrCreateDirectConversation(followerId, followingId)
    } catch (convErr) {
      console.warn("[followUser] Auto-create conversation notice:", convErr)
    }
  }

  return {
    status: follow.status as FollowStatus,
    followId: follow.id,
  }
}

/**
 * Unfollow a user or cancel a follow request.
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId)

  if (error) throw error
}

/**
 * Accept an incoming follow request.
 */
export async function acceptFollowRequest(
  requestId: string,
  followerId: string,
  followingId: string
): Promise<{ success: boolean; conversationId: string | null }> {
  // 1. Update follow status to accepted
  const { error: updateErr } = await supabase
    .from("follows")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)

  if (updateErr) throw updateErr

  // 2. Fetch following user's name
  const { data: approverProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", followingId)
    .maybeSingle()

  const approverName = approverProfile?.full_name || "A user"

  // 3. Send notification to the follower
  try {
    await supabase.from("notifications").insert({
      user_id: followerId,
      type: "follow_accepted",
      title: "Follow Request Accepted",
      message: `${approverName} accepted your follow request. You can now chat!`,
      link: `/messages?userId=${followingId}`,
      read: false,
    })
  } catch (notifErr) {
    console.warn("[acceptFollowRequest] Notification notice:", notifErr)
  }

  // 4. Automatically find or create conversation thread
  let conversationId: string | null = null
  try {
    const conv = await findOrCreateDirectConversation(followerId, followingId)
    conversationId = conv.id
  } catch (convErr) {
    console.warn("[acceptFollowRequest] Create conversation notice:", convErr)
  }

  return { success: true, conversationId }
}

/**
 * Decline an incoming follow request.
 */
export async function declineFollowRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .update({
      status: "declined",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)

  if (error) throw error
}

/**
 * Fetch pending follow requests for a user.
 */
export async function fetchPendingFollowRequests(userId: string): Promise<FollowRequestItem[]> {
  if (!userId) return []

  try {
    const { data, error } = await supabase
      .from("follows")
      .select(`
        id,
        follower_id,
        following_id,
        status,
        is_private,
        created_at,
        follower:profiles!follows_follower_id_fkey(
          id,
          full_name,
          avatar_url,
          bio,
          role,
          location,
          host_type,
          is_verified
        )
      `)
      .eq("following_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("[fetchPendingFollowRequests] Query notice:", error.message)
      // Fallback manual join if foreign key alias not configured in PostgREST cache
      const { data: rawFollows, error: rawErr } = await supabase
        .from("follows")
        .select("id, follower_id, following_id, status, is_private, created_at")
        .eq("following_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (rawErr) throw rawErr
      if (!rawFollows || rawFollows.length === 0) return []

      const followerIds = rawFollows.map((f: any) => f.follower_id)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, role, location, host_type, is_verified")
        .in("id", followerIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

      return rawFollows.map((f: any) => ({
        ...f,
        follower: profileMap.get(f.follower_id) || {
          id: f.follower_id,
          full_name: "Explorer",
          avatar_url: null,
          role: "traveler",
        },
      }))
    }

    return (data || []).map((item: any) => ({
      ...item,
      follower: Array.isArray(item.follower) ? item.follower[0] : item.follower,
    }))
  } catch (err) {
    console.error("[fetchPendingFollowRequests] Error:", err)
    return []
  }
}

/**
 * Fetch accepted followers of a user.
 */
export async function fetchFollowers(userId: string): Promise<any[]> {
  if (!userId) return []

  try {
    const { data: follows, error } = await supabase
      .from("follows")
      .select("id, follower_id, created_at")
      .eq("following_id", userId)
      .eq("status", "accepted")

    if (error) throw error
    if (!follows || follows.length === 0) return []

    const followerIds = follows.map((f) => f.follower_id)
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio, role, location, host_type, is_verified")
      .in("id", followerIds)

    if (pErr) throw pErr
    return profiles || []
  } catch (err) {
    console.error("[fetchFollowers] Error:", err)
    return []
  }
}

/**
 * Fetch accepted accounts that a user is following.
 */
export async function fetchFollowing(userId: string): Promise<any[]> {
  if (!userId) return []

  try {
    const { data: follows, error } = await supabase
      .from("follows")
      .select("id, following_id, created_at")
      .eq("follower_id", userId)
      .eq("status", "accepted")

    if (error) throw error
    if (!follows || follows.length === 0) return []

    const followingIds = follows.map((f) => f.following_id)
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio, role, location, host_type, is_verified")
      .in("id", followingIds)

    if (pErr) throw pErr
    return profiles || []
  } catch (err) {
    console.error("[fetchFollowing] Error:", err)
    return []
  }
}

/**
 * Find or create a direct conversation between two users (e.g. from follows).
 */
export async function findOrCreateDirectConversation(
  userId1: string,
  userId2: string
): Promise<{ id: string; createdNew: boolean }> {
  if (!userId1 || !userId2 || userId1 === userId2) {
    throw new Error("Invalid user IDs for conversation.")
  }

  // Canonical ordering for consistent unique participant pairs
  const [pA, pB] = [userId1, userId2].sort()

  // 1. Look for existing conversation
  const { data: existing, error: findErr } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_a", pA)
    .eq("participant_b", pB)
    .maybeSingle()

  if (findErr) {
    console.warn("[findOrCreateDirectConversation] Check error:", findErr.message)
  }

  if (existing?.id) {
    return { id: existing.id, createdNew: false }
  }

  // 2. Create new conversation
  const { data: newConv, error: createErr } = await supabase
    .from("conversations")
    .insert({
      participant_a: pA,
      participant_b: pB,
      last_message: "You are now connected! Start your conversation.",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (createErr) {
    // If another request inserted in parallel, re-fetch
    if (createErr.code === "23505") {
      const { data: retry } = await supabase
        .from("conversations")
        .select("id")
        .eq("participant_a", pA)
        .eq("participant_b", pB)
        .single()
      if (retry?.id) return { id: retry.id, createdNew: false }
    }
    throw createErr
  }

  // 3. Send system introductory message
  try {
    await supabase.from("messages").insert({
      conversation_id: newConv.id,
      sender_id: null,
      message: "You are now connected! Feel free to say hello and plan your journey.",
      read: false,
    })
  } catch (mErr) {
    console.warn("[findOrCreateDirectConversation] Message notice:", mErr)
  }

  return { id: newConv.id, createdNew: true }
}

/**
 * Fetch all reachable connections for a user (accepted follows + bookings) for direct messaging.
 */
export async function fetchReachableConnections(
  currentUserId: string
): Promise<ReachableConnection[]> {
  if (!currentUserId) return []

  try {
    // 1. Fetch all accepted follows where current user is follower or following
    const { data: followRows, error: fErr } = await supabase
      .from("follows")
      .select("id, follower_id, following_id, updated_at")
      .or(`follower_id.eq.${currentUserId},following_id.eq.${currentUserId}`)
      .eq("status", "accepted")

    if (fErr) console.warn("[fetchReachableConnections] Follows notice:", fErr.message)

    const connectionMap = new Map<string, { type: "following" | "follower" | "mutual" }>()

    for (const f of followRows || []) {
      if (f.follower_id === currentUserId) {
        const targetId = f.following_id
        connectionMap.set(targetId, { type: "following" })
      } else if (f.following_id === currentUserId) {
        const targetId = f.follower_id
        const existing = connectionMap.get(targetId)
        if (existing) {
          connectionMap.set(targetId, { type: "mutual" })
        } else {
          connectionMap.set(targetId, { type: "follower" })
        }
      }
    }

    const partnerIds = Array.from(connectionMap.keys())
    if (partnerIds.length === 0) return []

    // 2. Fetch profiles of all partners
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, bio, location, host_type, is_verified")
      .in("id", partnerIds)

    if (pErr) throw pErr

    // 3. Fetch existing conversation IDs
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, participant_a, participant_b, last_message, last_message_at")
      .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)

    const convMap = new Map<string, any>()
    for (const c of convs || []) {
      const otherId = c.participant_a === currentUserId ? c.participant_b : c.participant_a
      convMap.set(otherId, c)
    }

    // 4. Build enriched connection list
    return (profiles || []).map((p: any) => {
      const conn = connectionMap.get(p.id)
      const conv = convMap.get(p.id)
      return {
        user_id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        role: p.role,
        bio: p.bio,
        location: p.location,
        host_type: p.host_type,
        is_verified: p.is_verified,
        connection_type: conn?.type || "following",
        conversation_id: conv?.id || null,
        last_message: conv?.last_message || null,
        last_message_at: conv?.last_message_at || null,
      }
    })
  } catch (err) {
    console.error("[fetchReachableConnections] Error:", err)
    return []
  }
}
