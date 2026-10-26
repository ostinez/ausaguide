import { useState, useEffect, useRef, useCallback, memo } from "react"
import { Link } from "react-router-dom"
import useEmblaCarousel from "embla-carousel-react"
import {
  Trash2,
  Edit3,
  Heart,
  MessageCircle,
  Send,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Medal,
  MapPin,
  Shield,
  Link2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import {
  type Post,
  type PostLiker,
  type Comment,
  fetchPostLikers,
  updatePost,
  deletePost,
  toggleLike,
  toggleSave,
  trackView,
  fetchPostComments,
  addComment,
  toggleCommentLike,
  deleteComment,
} from "@/lib/api/content"
import { cn, formatSocialLink } from "@/lib/utils"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { DirectMessageButton } from "@/components/common/DirectMessageButton"

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

const RedditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
)

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function PrivatePostImage({
  src,
  alt,
  className,
  onClick,
}: {
  src: string
  alt?: string
  className?: string
  onClick?: () => void
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        let path = src
        if (src.includes("/object/public/posts/")) {
          path = src.split("/object/public/posts/")[1]
        } else if (src.includes("/object/sign/posts/")) {
          path = src.split("/object/sign/posts/")[1]?.split("?")[0]
        } else if (src.includes("/object/public/chat-images/")) {
          path = src.split("/object/public/chat-images/")[1]
          const { data, error } = await supabase.storage.from("chat-images").createSignedUrl(path, 3600)
          if (!error && data?.signedUrl && active) {
            setSignedUrl(data.signedUrl)
            return
          }
        }
        const { data, error } = await supabase.storage.from("posts").createSignedUrl(path, 3600)
        if (!error && data?.signedUrl && active) {
          setSignedUrl(data.signedUrl)
        } else if (active) {
          setSignedUrl(src)
        }
      } catch {
        if (active) setSignedUrl(src)
      }
    }
    if (src) load()
    return () => {
      active = false
    }
  }, [src])

  if (!signedUrl) return <div className={cn("bg-muted/20 animate-pulse rounded-xl w-full h-full min-h-[4rem]", className)} />

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      onClick={onClick}
      loading="lazy"
    />
  )
}

function ImageCarousel({
  urls,
  onImageClick,
}: {
  urls: string[]
  onImageClick: (urls: string[], index: number) => void
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" })
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setPrevBtnEnabled(emblaApi.canScrollPrev())
    setNextBtnEnabled(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="relative group overflow-hidden rounded-xl border border-white/5 bg-card shadow-modern shadow-inner aspect-video">
      <div className="overflow-hidden w-full h-full" ref={emblaRef}>
        <div className="flex h-full">
          {urls.map((url, idx) => (
            <div key={url} className="flex-[0_0_100%] min-w-0 h-full relative cursor-pointer" onClick={() => onImageClick(urls, idx)}>
              <PrivatePostImage
                src={url}
                alt={`Post media ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
              />
            </div>
          ))}
        </div>
      </div>

      {prevBtnEnabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            scrollPrev()
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/85"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      {nextBtnEnabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            scrollNext()
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/85"
        >
          <ChevronRight className="size-4" />
        </button>
      )}

      {urls.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
          {urls.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                emblaApi?.scrollTo(idx)
              }}
              className={cn(
                "size-2 rounded-full transition-all duration-200 cursor-pointer border-0 shrink-0",
                idx === selectedIndex ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LikeListModal({
  postId,
  likeCount,
  likers,
  onClose,
}: {
  postId: string
  likeCount: number
  likers: PostLiker[]
  onClose: () => void
}) {
  const [fullLikers, setFullLikers] = useState<PostLiker[]>(likers)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  useEffect(() => {
    if (likeCount === 0) return
    setLoading(true)
    fetchPostLikers(postId)
      .then(setFullLikers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [postId, likeCount])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 animate-in fade-in duration-200" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border/60 bg-[#16161a] shadow-2xl flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Heart className="size-4 fill-red-500 stroke-red-500" />
            <span className="font-bold text-foreground text-sm">
              {likeCount} {likeCount === 1 ? "Like" : "Likes"}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : fullLikers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Heart className="size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No likes yet</p>
            </div>
          ) : (
            fullLikers.map((liker) => (
              <div key={liker.user_id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-card shadow-modern transition-colors">
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={liker.profile?.avatar_url ?? ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials(liker.profile?.full_name ?? "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{liker.profile?.full_name ?? "Unknown User"}</p>
                  {liker.created_at && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Liked {formatDistanceToNow(new Date(liker.created_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export interface PostCardProps {
  post: Post
  currentUserId: string | null
  onDelete: (id: string) => void
  onImageClick?: (urls: string[], index: number) => void
  isFollowing?: boolean
  onFollowToggle?: (authorId: string) => void
  onLikesChange?: (postId: string, newLikes: PostLiker[]) => void
}

export const PostCard = memo(function PostCard({
  post,
  currentUserId,
  onDelete,
  onImageClick = () => {},
  isFollowing = false,
  onFollowToggle = () => {},
  onLikesChange = () => {},
}: PostCardProps) {
  const isOwn = post.user_id === currentUserId
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [showLikeModal, setShowLikeModal] = useState(false)
  const [likingInProgress, setLikingInProgress] = useState(false)
  const [viewCount, setViewCount] = useState(post.view_count ?? 0)

  // Socials edit state
  const [editInstagram, setEditInstagram] = useState(post.instagram || "")
  const [editTiktok, setEditTiktok] = useState(post.tiktok || "")
  const [editFacebook, setEditFacebook] = useState(post.facebook || "")
  const [editReddit, setEditReddit] = useState(post.reddit || "")
  const [showEditSocials, setShowEditSocials] = useState(false)

  // Comments state
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentInput, setCommentInput] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count ?? 0)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // View tracking
  useEffect(() => {
    if (post.id) {
      trackView("post", post.id, currentUserId).then((didTrack) => {
        if (didTrack) setViewCount((prev) => prev + 1)
      })
    }
  }, [post.id, currentUserId])

  // Load comments when expanded
  const toggleCommentsSection = async () => {
    const nextState = !showComments
    setShowComments(nextState)

    if (nextState && !commentsLoaded) {
      setLoadingComments(true)
      try {
        const data = await fetchPostComments(post.id, currentUserId)
        setComments(data)
        setCommentCount(data.length)
        setCommentsLoaded(true)
      } catch (err: any) {
        console.error("Failed to load comments:", err)
        toast.error("Failed to load comments")
      } finally {
        setLoadingComments(false)
      }
    }
  }

  // Submit comment
  const handleCommentSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!commentInput.trim() || submittingComment) return

    if (!currentUserId) {
      toast.error("Please sign in to comment on posts.")
      return
    }

    const text = commentInput.trim()
    setSubmittingComment(true)

    try {
      const newComment = await addComment(post.id, currentUserId, text)
      setComments((prev) => [...prev, newComment])
      setCommentCount((prev) => prev + 1)
      setCommentInput("")
      toast.success("Comment added!")
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (err: any) {
      console.error("Failed to add comment:", err)
      toast.error(err.message || "Failed to post comment.")
    } finally {
      setSubmittingComment(false)
    }
  }

  // Toggle comment like
  const handleToggleCommentLike = async (commentId: string, currentLiked: boolean) => {
    if (!currentUserId) {
      toast.error("Please sign in to like comments.")
      return
    }

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const nextLiked = !currentLiked
          const nextCount = nextLiked ? (c.likes_count || 0) + 1 : Math.max(0, (c.likes_count || 0) - 1)
          return { ...c, liked_by_me: nextLiked, likes_count: nextCount }
        }
        return c
      })
    )

    try {
      await toggleCommentLike(commentId, currentUserId, !currentLiked)
    } catch (err: any) {
      console.error("Error toggling comment like:", err)
      // Revert on error
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, liked_by_me: currentLiked, likes_count: c.likes_count }
          }
          return c
        })
      )
      toast.error("Failed to update like.")
    }
  }

  // Delete own comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setCommentCount((prev) => Math.max(0, prev - 1))
      toast.success("Comment deleted.")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment.")
    }
  }

  const authorRole = post.author?.role ?? "traveler"
  const profileHref = authorRole === "host" ? `/host/${post.user_id}` : `/traveler/${post.user_id}`

  const likesList = post.likes || []
  const savesList = post.saves || []
  const liked = currentUserId ? likesList.some((l) => l.user_id === currentUserId) : false
  const saved = currentUserId ? savesList.some((s) => s.user_id === currentUserId) : false

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to like posts.")
      return
    }
    if (likingInProgress) return
    setLikingInProgress(true)
    const wasLiked = liked
    const newLikes = wasLiked
      ? likesList.filter((l) => l.user_id !== currentUserId)
      : [...likesList, { user_id: currentUserId, created_at: new Date().toISOString() }]
    onLikesChange(post.id, newLikes)
    try {
      await toggleLike(post.id, currentUserId, !wasLiked)
    } catch (err: any) {
      onLikesChange(post.id, likesList)
      toast.error(err.message || "Failed to update like.")
    } finally {
      setLikingInProgress(false)
    }
  }

  const handleSave = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to save posts.")
      return
    }
    try {
      await toggleSave(post.id, currentUserId, !saved)
      toast.success(!saved ? "Saved to favorites!" : "Removed from favorites.")
    } catch (err: any) {
      toast.error(err.message || "Failed to save post.")
    }
  }

  const handleFollowClick = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to follow hosts.")
      return
    }
    setLoadingFollow(true)
    try {
      await onFollowToggle(post.user_id)
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle follow.")
    } finally {
      setLoadingFollow(false)
    }
  }

  const saveEdit = async () => {
    if (!editContent.trim()) return
    setSaving(true)
    try {
      const socialsObj = {
        instagram: editInstagram.trim() || null,
        tiktok: editTiktok.trim() || null,
        facebook: editFacebook.trim() || null,
        reddit: editReddit.trim() || null,
      }
      await updatePost(post.id, editContent, null, socialsObj)
      post.content = editContent
      post.instagram = socialsObj.instagram
      post.tiktok = socialsObj.tiktok
      post.facebook = socialsObj.facebook
      post.reddit = socialsObj.reddit
      setEditing(false)
      toast.success("Post updated.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return
    try {
      await deletePost(post.id)
      onDelete(post.id)
      toast.success("Post deleted.")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="post-card rounded-2xl border border-white/10 bg-card shadow-modern p-4 space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:border-primary/30 transition-all">
      {/* ─── Header: Author Info & Actions ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={profileHref} className="flex items-center gap-3 group">
            <Avatar className="size-10 ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
              <AvatarImage src={post.author?.avatar_url ?? ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials(post.author?.full_name ?? "U")}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors text-white">
                  {post.author?.full_name ?? "Unknown"}
                </span>
                {post.author?.host_tier === "certified_guide" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#b49cf8] bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 tracking-wide">
                    <Medal size={10} className="text-[#a78bfa]" />
                    <span>Certified Guide</span>
                  </span>
                )}
                {post.author?.host_tier === "local_host" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#34e0a1] bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5 tracking-wide">
                    <MapPin size={10} className="text-emerald-400" />
                    <span>Local Host</span>
                  </span>
                )}
                {authorRole === "admin" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5 tracking-wide">
                    <Shield size={10} className="text-amber-500" />
                    <span>Admin</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>

          {/* Follow & Message Buttons */}
          <div className="flex items-center gap-1.5 ml-1">
            {!isOwn && currentUserId && (
              <button
                onClick={handleFollowClick}
                disabled={loadingFollow}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer",
                  isFollowing
                    ? "bg-muted text-muted-foreground hover:bg-muted/85"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                )}
              >
                {loadingFollow ? "..." : isFollowing ? "Following" : "Follow"}
              </button>
            )}
            {!isOwn && (
              <DirectMessageButton
                hostId={post.user_id}
                hostName={post.author?.full_name}
                variant="icon"
                className="size-8 min-h-[32px] min-w-[32px]"
              />
            )}
          </div>
        </div>

        {isOwn && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(!editing)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {editing ? <X className="size-3.5" /> : <Edit3 className="size-3.5" />}
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full text-sm bg-muted/40 rounded-xl px-3 py-2 text-foreground focus:outline-none border border-border/60 min-h-[120px] resize-y leading-relaxed"
          />

          <div className="space-y-2 border-t border-border/20 pt-2">
            <button
              type="button"
              onClick={() => setShowEditSocials(!showEditSocials)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Link2 className="size-3.5" />
              <span>{showEditSocials ? "Hide Social Links" : "Edit Social Links"}</span>
            </button>
            {showEditSocials && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-card shadow-modern rounded-xl border border-white/5 animate-in fade-in duration-200">
                {[
                  { id: "edit-instagram", label: "Instagram", placeholder: "@handle or URL", value: editInstagram, set: setEditInstagram },
                  { id: "edit-tiktok", label: "TikTok", placeholder: "@handle or URL", value: editTiktok, set: setEditTiktok },
                  { id: "edit-facebook", label: "Facebook", placeholder: "handle or URL", value: editFacebook, set: setEditFacebook },
                  { id: "edit-reddit", label: "Reddit", placeholder: "username or URL", value: editReddit, set: setEditReddit },
                ].map(({ id, label, placeholder, value, set }) => (
                  <div key={id} className="space-y-1">
                    <label htmlFor={id} className="text-[10px] font-bold text-muted-foreground uppercase">{label}</label>
                    <input
                      id={id}
                      type="text"
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-xs rounded-full">Cancel</Button>
            <Button size="sm" className="text-xs rounded-full" onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="size-3 animate-spin" /> : <><Check className="size-3 mr-1" />Save</>}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}

      {/* ─── Images Carousel / Grid ─── */}
      {(() => {
        const urls = post.image_urls && post.image_urls.length > 0 ? post.image_urls : post.image_url ? [post.image_url] : []
        if (urls.length === 0) return null

        if (urls.length === 1) {
          return (
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-card shadow-modern aspect-video w-full">
              <PrivatePostImage
                src={urls[0]}
                alt="Post media"
                className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform duration-300"
                onClick={() => onImageClick(urls, 0)}
              />
            </div>
          )
        }

        return <ImageCarousel urls={urls} onImageClick={onImageClick} />
      })()}

      {/* ─── Social Links ─── */}
      {(post.instagram || post.tiktok || post.facebook || post.reddit) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
          {post.instagram && (
            <a
              href={formatSocialLink("instagram", post.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card shadow-modern border border-border hover:border-primary text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <InstagramIcon className="size-3" />
              <span>Instagram</span>
            </a>
          )}
          {post.tiktok && (
            <a
              href={formatSocialLink("tiktok", post.tiktok)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card shadow-modern border border-border hover:border-primary text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <TikTokIcon className="size-3" />
              <span>TikTok</span>
            </a>
          )}
          {post.facebook && (
            <a
              href={formatSocialLink("facebook", post.facebook)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card shadow-modern border border-border hover:border-primary text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <FacebookIcon className="size-3" />
              <span>Facebook</span>
            </a>
          )}
          {post.reddit && (
            <a
              href={formatSocialLink("reddit", post.reddit)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card shadow-modern border border-border hover:border-primary text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <RedditIcon className="size-3" />
              <span>Reddit</span>
            </a>
          )}
        </div>
      )}

      {/* ─── Action Bar (Like, Comment, Save, View Count) ─── */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Like */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLike}
              disabled={likingInProgress}
              className={cn(
                "flex items-center gap-1 text-xs transition-all duration-150 active:scale-90 cursor-pointer",
                liked ? "text-red-400 font-bold" : "text-muted-foreground hover:text-red-400",
                likingInProgress && "opacity-60 cursor-not-allowed"
              )}
            >
              <Heart className={cn("size-4 transition-transform", liked && "fill-red-400 stroke-red-400 scale-110")} />
            </button>
            <button
              onClick={() => likesList.length > 0 && setShowLikeModal(true)}
              className={cn(
                "text-xs transition-colors",
                likesList.length > 0 ? "text-muted-foreground hover:text-white cursor-pointer" : "text-muted-foreground/50 cursor-default"
              )}
            >
              {likesList.length}
            </button>
          </div>

          {/* Comment button with count */}
          <button
            onClick={toggleCommentsSection}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors cursor-pointer group",
              showComments ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"
            )}
            title="Comments"
          >
            <MessageCircle className={cn("size-4 transition-transform group-hover:scale-110", showComments && "fill-primary/20 text-primary")} />
            <span>{commentCount}</span>
          </button>

          {/* View Count */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground/60 select-none">
            <Eye className="size-3.5" />
            <span>{viewCount}</span>
          </span>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors cursor-pointer",
            saved ? "text-emerald-400 font-bold" : "text-muted-foreground hover:text-emerald-400"
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("size-4", saved && "fill-emerald-400 stroke-emerald-400")}
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
          <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {/* ─── Inline Comments Section (TASK 2) ─── */}
      {showComments && (
        <div className="pt-3 border-t border-border/30 space-y-3 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              Comments ({commentCount})
            </span>
          </div>

          {/* Flat Comment List */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {loadingComments ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="size-4 animate-spin mr-2" />
                <span className="text-xs">Loading comments...</span>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 italic">
                No comments yet. Start the conversation!
              </p>
            ) : (
              comments.map((comment) => {
                const isCommentAuthor = comment.user_id === currentUserId
                return (
                  <div
                    key={comment.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/30 hover:border-border/60 transition-colors group"
                  >
                    <Avatar className="size-7 shrink-0 mt-0.5">
                      <AvatarImage src={comment.author?.avatar_url ?? ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {initials(comment.author?.full_name ?? "U")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {comment.author?.full_name ?? "User"}
                          </span>
                          {comment.author?.host_tier && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-semibold">
                              {comment.author.host_tier === "certified_guide" ? "Guide" : "Host"}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Delete Comment */}
                        {isCommentAuthor && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                            title="Delete comment"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-foreground/90 mt-1 whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>

                      {/* Comment Like Heart */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <button
                          onClick={() => handleToggleCommentLike(comment.id, Boolean(comment.liked_by_me))}
                          className={cn(
                            "flex items-center gap-1 text-[11px] transition-colors cursor-pointer",
                            comment.liked_by_me ? "text-red-400 font-bold" : "text-muted-foreground hover:text-red-400"
                          )}
                        >
                          <Heart
                            className={cn(
                              "size-3 transition-transform",
                              comment.liked_by_me && "fill-red-400 stroke-red-400 scale-110"
                            )}
                          />
                          {(comment.likes_count ?? 0) > 0 && <span>{comment.likes_count}</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Add a Comment Input & Send Arrow */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={currentUserId ? "Add a comment..." : "Sign in to add a comment..."}
              disabled={!currentUserId || submittingComment}
              className="flex-1 bg-muted/60 border border-border/60 rounded-full px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!commentInput.trim() || submittingComment || !currentUserId}
              className="size-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer disabled:opacity-40"
              title="Post comment"
            >
              {submittingComment ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Like List Modal */}
      {showLikeModal && (
        <LikeListModal
          postId={post.id}
          likeCount={likesList.length}
          likers={likesList}
          onClose={() => setShowLikeModal(false)}
        />
      )}
    </div>
  )
})
