import { supabase } from "../supabase"

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  image_urls?: string[] | null
  created_at: string
  updated_at: string
  author?: { full_name: string; avatar_url: string | null; role?: string }
  instagram?: string | null
  tiktok?: string | null
  facebook?: string | null
  reddit?: string | null
  likes?: { user_id: string }[]
  saves?: { user_id: string }[]
}

export interface Journal {
  id: string
  user_id: string
  title: string
  content: string
  image_url: string | null
  created_at: string
  updated_at: string
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
    .select("*, author:profiles(full_name, avatar_url, role), likes(user_id), saves(user_id)")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    author: Array.isArray(row.author) ? row.author[0] : row.author,
    likes: row.likes || [],
    saves: row.saves || [],
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
    .select("*, author:profiles(full_name, avatar_url, role)")
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
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: followerId, following_id: followingId })
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
  if (error) throw error
  return (data ?? []).map((r: any) => r.following_id)
}
