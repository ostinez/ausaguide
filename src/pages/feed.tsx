import { useEffect, useState } from "react"
import { MapPin, Globe, Heart, MessageCircle, Rss } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { getHostInitials } from "@/lib/tour-utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { useSEO } from "@/hooks/useSEO"

interface FeedPost {
  id: string
  user_id: string
  title: string
  location: string | null
  description: string | null
  image_urls: string[]
  created_at: string
  likes?: number
  comments?: { id: string }[]
  author?: { full_name: string; avatar_url: string | null }
}

interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_id: string | null
  created_at: string
  author?: { full_name: string; avatar_url: string | null }
}

export default function FeedPage() {
  useSEO({
    title: "Ausaguide Activity Feed",
    description:
      "Real-time updates, local notifications, and posts from the local Kenyan communities.",
    url: "https://ausaguide.com/feed",
  })
  const navigate = useNavigate()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const userId = localStorage.getItem("user_id")
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  // Load liked posts from localStorage on mount
  useEffect(() => {
    if (userId) {
      try {
        const saved = localStorage.getItem(`liked_journal_posts_${userId}`)
        if (saved) {
          setLikedPosts(new Set(JSON.parse(saved)))
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [userId])

  const saveLikesToLocal = (newLiked: Set<string>) => {
    if (userId) {
      localStorage.setItem(`liked_journal_posts_${userId}`, JSON.stringify(Array.from(newLiked)))
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("journal_entries")
          .select("*, author:profiles!journal_entries_user_id_fkey(full_name, avatar_url), comments(id)")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(30)
        setPosts((data ?? []) as unknown as FeedPost[])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()

    // Subscribe to realtime updates for journal entries (likes count changes)
    const channel = supabase
      .channel("feed-realtime-entries")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "journal_entries" },
        (payload) => {
          const updated = payload.new as any
          setPosts((prev) =>
            prev.map((p) =>
              p.id === updated.id
                ? { ...p, likes: updated.likes }
                : p
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleLike = async (postId: string) => {
    if (!userId) {
      toast.error("Please log in to like posts.")
      navigate("/auth")
      return
    }

    const isLiked = likedPosts.has(postId)
    const newLiked = new Set(likedPosts)
    if (isLiked) {
      newLiked.delete(postId)
    } else {
      newLiked.add(postId)
    }
    setLikedPosts(newLiked)
    saveLikesToLocal(newLiked)

    // Optimistically update state
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentLikes = p.likes || 0
          return { ...p, likes: Math.max(0, currentLikes + (isLiked ? -1 : 1)) }
        }
        return p
      })
    )

    try {
      const { data: current } = await supabase
        .from("journal_entries")
        .select("likes")
        .eq("id", postId)
        .single()
      
      const currentLikes = current?.likes || 0
      const nextLikes = Math.max(0, currentLikes + (isLiked ? -1 : 1))

      await supabase
        .from("journal_entries")
        .update({ likes: nextLikes })
        .eq("id", postId)
    } catch (err) {
      console.error(err)
    }
  }

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <Rss className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Community Feed</h1>
            <p className="text-sm text-muted-foreground">Public travel stories from the Ausaguide community</p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Rss className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">No public posts yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to share your travel story! Go to{" "}
                <a href="/journal" className="text-primary hover:underline">your journal</a>{" "}
                and make a post public.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const authorName = post.author?.full_name ?? "Traveler"
              const isLiked = likedPosts.has(post.id)
              const hasExpandedComments = expandedComments.has(post.id)
              
              return (
                <article key={post.id} className="rounded-2xl border border-border bg-card/50 overflow-hidden transition-all hover:border-primary/30">
                  {/* Author Header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                        {getHostInitials(authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{authorName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {post.location && (
                          <>
                            <MapPin className="size-3" />
                            <span>{post.location}</span>
                            <span className="mx-1">·</span>
                          </>
                        )}
                        <Globe className="size-3" />
                        <span>
                          {new Date(post.created_at).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  {post.image_urls.length > 0 && (
                    <div className="grid grid-cols-2 gap-0.5 bg-border">
                      {post.image_urls.slice(0, 4).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className="px-5 py-4">
                    <h3 className="font-bold text-foreground mb-1">{post.title}</h3>
                    {post.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {post.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Stats */}
                  <div className="flex items-center justify-between px-5 pb-4 text-xs text-muted-foreground border-b border-border/40">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={cn(
                          "flex items-center gap-1.5 hover:text-primary transition-colors",
                          isLiked && "text-rose-500 hover:text-rose-600 font-semibold"
                        )}
                      >
                        <Heart className={cn("size-4", isLiked && "fill-current")} />
                        <span>{post.likes || 0} Like{post.likes !== 1 ? "s" : ""}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className={cn(
                          "flex items-center gap-1.5 hover:text-primary transition-colors",
                          hasExpandedComments && "text-primary font-semibold"
                        )}
                      >
                        <MessageCircle className="size-4" />
                        <span>
                          {post.comments?.length || 0} Comment{post.comments?.length !== 1 ? "s" : ""}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Collapsible Panel */}
                  {hasExpandedComments && (
                    <CommentsPanel
                      postId={post.id}
                      userId={userId}
                      postAuthorId={post.user_id}
                    />
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentsPanel({ postId, userId, postAuthorId }: { postId: string; userId: string | null; postAuthorId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*, author:profiles!comments_author_id_fkey(full_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setComments((data ?? []) as unknown as Comment[])
    } catch (err) {
      console.error("Failed to load comments:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()

    // Subscribe to realtime comments changes on this post
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        () => {
          loadComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault()
    if (!userId) {
      toast.error("Please log in to comment.")
      return
    }

    const text = parentId ? replyContent : content
    if (!text.trim()) return

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: userId,
        content: text.trim(),
        parent_id: parentId,
      })

      if (error) throw error

      if (parentId) {
        setReplyContent("")
        setReplyToId(null)
      } else {
        setContent("")
      }
      toast.success("Comment posted!")
      loadComments()
    } catch (err) {
      console.error(err)
      toast.error("Failed to post comment.")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4 bg-muted/5">
        <Spinner className="size-5 text-primary" />
      </div>
    )
  }

  const parentComments = comments.filter((c) => !c.parent_id)
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId)

  return (
    <div className="border-t border-border/40 bg-muted/5 px-5 py-4 space-y-4">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comments</h4>

      {parentComments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-4">
          {parentComments.map((comment) => {
            const replies = getReplies(comment.id)
            const authorName = comment.author?.full_name ?? "Traveler"
            const initials = getHostInitials(authorName)

            return (
              <div key={comment.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 bg-card border border-border/40 rounded-2xl px-3.5 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{authorName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
                      {comment.content}
                    </p>

                    {/* Reply CTA for journal author */}
                    {userId === postAuthorId && (
                      <button
                        onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                        className="text-[10px] text-primary font-semibold hover:underline mt-2 block"
                      >
                        {replyToId === comment.id ? "Cancel Reply" : "Reply"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {replyToId === comment.id && (
                  <form onSubmit={(e) => handleAddComment(e, comment.id)} className="flex gap-2 ml-11">
                    <Input
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="h-8 text-xs rounded-full bg-background"
                      required
                    />
                    <Button type="submit" size="sm" className="h-8 rounded-full text-xs">
                      Reply
                    </Button>
                  </form>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="space-y-2 ml-11 border-l border-border pl-4">
                    {replies.map((reply) => {
                      const repName = reply.author?.full_name ?? "Traveler"
                      const repInit = getHostInitials(repName)

                      return (
                        <div key={reply.id} className="flex items-start gap-2.5">
                          <Avatar className="size-6 shrink-0">
                            <AvatarFallback className="bg-teal/20 text-[10px] font-semibold text-teal">
                              {repInit}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 bg-card border border-border/40 rounded-2xl px-3.5 py-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">{repName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(reply.created_at).toLocaleDateString("en-KE", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Base Comment Form */}
      {userId ? (
        <form onSubmit={(e) => handleAddComment(e, null)} className="flex gap-2 pt-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="h-9 text-xs rounded-full bg-background"
            required
          />
          <Button type="submit" size="sm" className="h-9 rounded-full text-xs">
            Send
          </Button>
        </form>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">
            Please <a href="/auth" className="text-primary hover:underline font-semibold">Log In</a> to join the conversation.
          </p>
        </div>
      )}
    </div>
  )
}
