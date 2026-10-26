import { supabase } from "../supabase"

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PostLiker {
 user_id: string
 created_at?: string
 profile?: { full_name: string; avatar_url: string | null }
}

export interface Post {
 id: string
 user_id: string
 content: string
 image_url: string | null
 image_urls?: string[] | null
 created_at: string
 updated_at: string
 view_count?: number
 author?: { full_name: string; avatar_url: string | null; role?: string; host_tier?: string | null }
 instagram?: string | null
 tiktok?: string | null
 facebook?: string | null
 reddit?: string | null
 likes?: PostLiker[]
 saves?: { user_id: string }[]
 comments_count?: number
}

export interface Comment {
 id: string
 post_id: string
 user_id: string
 content: string
 created_at: string
 likes_count?: number
 liked_by_me?: boolean
 author?: {
   id?: string
   full_name: string
   avatar_url: string | null
   role?: string
   host_tier?: string | null
 }
}

export interface Journal {
 id: string
 user_id: string
 title: string
 content: string
 image_url: string | null
 created_at: string
 updated_at: string
 view_count?: number
 author?: { full_name: string; avatar_url: string | null }
 instagram?: string | null
 tiktok?: string | null
 facebook?: string | null
 reddit?: string | null
}

// ─── Posts ────────────────────────────────────────────────────────────────────
export async function fetchPosts(): Promise<Post[]> {
 const { data, error } = await supabase
 .from("posts")
 .select("*, author:profiles(full_name, avatar_url, role, host_tier), likes(user_id, created_at, profile:profiles(full_name, avatar_url)), saves(user_id), comments(id)")
 .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row: any) => ({
 ...row,
 author: Array.isArray(row.author) ? row.author[0] : row.author,
 likes: (row.likes || []).map((l: any) => ({
 user_id: l.user_id,
 created_at: l.created_at,
 profile: Array.isArray(l.profile) ? l.profile[0] : l.profile,
 })),
 saves: row.saves || [],
 comments_count: (row.comments || []).length,
 view_count: row.view_count ?? 0,
 }))
}

export async function fetchPostLikers(postId: string): Promise<PostLiker[]> {
 const { data, error } = await supabase
 .from("likes")
 .select("user_id, created_at, profile:profiles(full_name, avatar_url)")
 .eq("post_id", postId)
 .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((l: any) => ({
 user_id: l.user_id,
 created_at: l.created_at,
 profile: Array.isArray(l.profile) ? l.profile[0] : l.profile,
 }))
}

export async function createPost(
 userId: string,
 content: string,
 imageUrls?: string[],
 socials?: { instagram?: string | null; tiktok?: string | null; facebook?: string | null; reddit?: string | null }
): Promise<Post> {
 const firstImage = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null
 const { data, error } = await supabase
 .from("posts")
 .insert({ 
 user_id: userId, 
 content, 
 image_urls: imageUrls ?? [],
 image_url: firstImage,
 instagram: socials?.instagram || null,
 tiktok: socials?.tiktok || null,
 facebook: socials?.facebook || null,
 reddit: socials?.reddit || null,
 })
 .select("*, author:profiles(full_name, avatar_url, role, host_tier)")
 .single()
 if (error) throw error
 return { ...(data as any), author: Array.isArray((data as any).author) ? (data as any).author[0] : (data as any).author }
}

export async function updatePost(
 id: string,
 content: string,
 imageUrl?: string | null,
 socials?: { instagram?: string | null; tiktok?: string | null; facebook?: string | null; reddit?: string | null }
): Promise<void> {
 const { error } = await supabase
 .from("posts")
 .update({ 
 content, 
 image_url: imageUrl ?? null, 
 instagram: socials?.instagram || null,
 tiktok: socials?.tiktok || null,
 facebook: socials?.facebook || null,
 reddit: socials?.reddit || null,
 updated_at: new Date().toISOString() 
 })
 .eq("id", id)
 if (error) throw error
}

export async function deletePost(id: string): Promise<void> {
 const { error } = await supabase.from("posts").delete().eq("id", id)
 if (error) throw error
}

// ─── Journals ────────────────────────────────────────────────────────────────
export async function fetchJournals(userId?: string): Promise<Journal[]> {
 let query = supabase
 .from("journals")
 .select("*, author:profiles(full_name, avatar_url)")
 .order("created_at", { ascending: false })
 if (userId) query = query.eq("user_id", userId)
 const { data, error } = await query
 if (error) throw error
 return (data ?? []).map((row: any) => ({
 ...row,
 author: Array.isArray(row.author) ? row.author[0] : row.author,
 }))
}

export async function createJournal(
 userId: string,
 title: string,
 content: string,
 imageUrl?: string,
 socials?: { instagram?: string | null; tiktok?: string | null; facebook?: string | null; reddit?: string | null }
): Promise<Journal> {
 const { data, error } = await supabase
 .from("journals")
 .insert({ 
 user_id: userId, 
 title, 
 content, 
 image_url: imageUrl ?? null,
 instagram: socials?.instagram || null,
 tiktok: socials?.tiktok || null,
 facebook: socials?.facebook || null,
 reddit: socials?.reddit || null,
 })
 .select("*, author:profiles(full_name, avatar_url)")
 .single()
 if (error) throw error
 return { ...(data as any), author: Array.isArray((data as any).author) ? (data as any).author[0] : (data as any).author }
}

export async function updateJournal(
 id: string,
 title: string,
 content: string,
 imageUrl?: string | null,
 socials?: { instagram?: string | null; tiktok?: string | null; facebook?: string | null; reddit?: string | null }
): Promise<void> {
 const { error } = await supabase
 .from("journals")
 .update({ 
 title, 
 content, 
 image_url: imageUrl ?? null, 
 instagram: socials?.instagram || null,
 tiktok: socials?.tiktok || null,
 facebook: socials?.facebook || null,
 reddit: socials?.reddit || null,
 updated_at: new Date().toISOString() 
 })
 .eq("id", id)
 if (error) throw error
}

export async function deleteJournal(id: string): Promise<void> {
 const { error } = await supabase.from("journals").delete().eq("id", id)
 if (error) throw error
}

// ─── Likes, Follows, Saves API ──────────────────────────────────────────────

export async function toggleLike(postId: string, userId: string, liked: boolean): Promise<void> {
 if (liked) {
 const { error } = await supabase
 .from("likes")
 .insert({ post_id: postId, user_id: userId })
 if (error && error.code !== "23505") throw error
 } else {
 const { error } = await supabase
 .from("likes")
 .delete()
 .eq("post_id", postId)
 .eq("user_id", userId)
 if (error) throw error
 }
}

export async function toggleSave(postId: string, userId: string, saved: boolean): Promise<void> {
 if (saved) {
 const { error } = await supabase
 .from("saves")
 .insert({ post_id: postId, user_id: userId })
 if (error && error.code !== "23505") throw error
 } else {
 const { error } = await supabase
 .from("saves")
 .delete()
 .eq("post_id", postId)
 .eq("user_id", userId)
 if (error) throw error
 }
}

export async function toggleFollow(followerId: string, followingId: string, following: boolean): Promise<void> {
  if (following) {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("is_private")
      .eq("id", followingId)
      .maybeSingle()

    const isPrivate = targetProfile?.is_private ?? true
    const status = isPrivate ? "pending" : "accepted"

    const { error } = await supabase
      .from("follows")
      .upsert(
        {
          follower_id: followerId,
          following_id: followingId,
          status,
          is_private: isPrivate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "follower_id,following_id" }
      )
    if (error && error.code !== "23505") throw error
  } else {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
    if (error) throw error
  }
}

export async function fetchUserFollows(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .eq("status", "accepted")
  if (error) throw error
  return (data ?? []).map((r: any) => r.following_id)
}

export async function trackView(targetType: "tour" | "post" | "journal" | "host", targetId: string, userId: string | null): Promise<boolean> {
 const sessionKey = `viewed_${targetType}_${targetId}`
 if (sessionStorage.getItem(sessionKey)) {
 return false // debounced once per session per target
 }
 
 // Set session storage item to block duplicates
 sessionStorage.setItem(sessionKey, "1")

 // Generate or get session ID
 let sessionId = sessionStorage.getItem("ausaguide_session_id")
 if (!sessionId) {
 sessionId = typeof crypto.randomUUID === 'function' 
 ? crypto.randomUUID() 
 : Math.random().toString(36).substring(2) + Date.now().toString(36)
 sessionStorage.setItem("ausaguide_session_id", sessionId)
 }

 try {
 const { error } = await supabase
 .from("views")
 .insert({
 user_id: userId || null,
 target_type: targetType,
 target_id: targetId,
 session_id: sessionId,
 })
 if (error) {
 console.error(`Failed to track view for ${targetType} ${targetId}:`, error)
 return false
 }
 return true
 } catch (err) {
 console.error("View tracking error:", err)
 return false
 }
}

// ─── Comments API ──────────────────────────────────────────────────────────

export async function fetchPostComments(postId: string, currentUserId?: string | null): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      post_id,
      user_id,
      content,
      created_at,
      author:profiles(id, full_name, avatar_url, role, host_tier),
      comment_likes(user_id)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const likes = row.comment_likes || []
    return {
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      author: Array.isArray(row.author) ? row.author[0] : row.author,
      likes_count: likes.length,
      liked_by_me: currentUserId ? likes.some((l: any) => l.user_id === currentUserId) : false,
    }
  })
}

export async function addComment(postId: string, userId: string, content: string): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
    })
    .select(`
      id,
      post_id,
      user_id,
      content,
      created_at,
      author:profiles(id, full_name, avatar_url, role, host_tier)
    `)
    .single()

  if (error) throw error

  return {
    ...(data as any),
    author: Array.isArray((data as any).author) ? (data as any).author[0] : (data as any).author,
    likes_count: 0,
    liked_by_me: false,
  }
}

export async function toggleCommentLike(commentId: string, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase
      .from("comment_likes")
      .insert({ comment_id: commentId, user_id: userId })
    if (error && error.code !== "23505") throw error
  } else {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId)
    if (error) throw error
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
  if (error) throw error
}
