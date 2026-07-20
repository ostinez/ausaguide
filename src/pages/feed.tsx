import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  Trash2, Edit3, Heart, Rss, Globe, ImageIcon, X, Check, Loader2, ChevronLeft, ChevronRight, ArrowLeft, Eye
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { fetchPosts, createPost, updatePost, deletePost, toggleFollow, fetchUserFollows, fetchPostLikers, trackView, type Post, type PostLiker } from "@/lib/api/content"
import { cn, formatSocialLink } from "@/lib/utils"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"
import { formatDistanceToNow } from "date-fns"
import { SkeletonPostCard } from "@/components/ui/SkeletonCard"

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
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

// ─── Like List Modal ──────────────────────────────────────────────────────────
function LikeListModal({ postId, likeCount, likers, onClose }: {
  postId: string
  likeCount: number
  likers: PostLiker[]
  onClose: () => void
}) {
  const [fullLikers, setFullLikers] = useState<PostLiker[]>(likers)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (likeCount === 0) return
    setLoading(true)
    fetchPostLikers(postId)
      .then(setFullLikers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [postId, likeCount])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" />
      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border/60 bg-[#16161a] shadow-2xl flex flex-col max-h-[75vh] animate-in slide-in-from-bottom-4 fade-in duration-250"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Heart className="size-4 fill-red-400 stroke-red-400" />
            <span className="font-bold text-white text-sm">
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        {/* Body */}
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
            fullLikers.map(liker => (
              <div key={liker.user_id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={liker.profile?.avatar_url ?? ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials(liker.profile?.full_name ?? 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {liker.profile?.full_name ?? 'Unknown User'}
                  </p>
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

function CreatePostCard({ currentUserId, onCreated }: { currentUserId: string; onCreated: (p: Post) => void }) {
  const [content, setContent] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [showSocials, setShowSocials] = useState(false)
  const [instagram, setInstagram] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [facebook, setFacebook] = useState("")
  const [reddit, setReddit] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImages = (files: FileList) => {
    const validFiles: File[] = []
    const previews: string[] = []

    const remainingSlots = 4 - imageFiles.length
    const count = Math.min(files.length, remainingSlots)

    for (let i = 0; i < count; i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        continue
      }
      validFiles.push(file)
      previews.push(URL.createObjectURL(file))
    }

    setImageFiles(prev => [...prev, ...validFiles])
    setImagePreviews(prev => [...prev, ...previews])
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && imageFiles.length === 0) return
    setSaving(true)
    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const ext = file.name.split(".").pop() || "jpeg"
        const path = `${currentUserId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
        const { error: upErr } = await supabase.storage.from("posts").upload(path, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path)
        return publicUrl
      })

      const imageUrls = await Promise.all(uploadPromises)

      const post = await createPost(currentUserId, content, imageUrls, {
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
        facebook: facebook.trim() || null,
        reddit: reddit.trim() || null,
      })
      onCreated(post)
      setContent("")
      setImageFiles([])
      setImagePreviews([])
      setInstagram("")
      setTiktok("")
      setFacebook("")
      setReddit("")
      setShowSocials(false)
      toast.success("Post shared!")
    } catch (err: any) {
      toast.error(err.message ?? "Failed to post.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-4 space-y-3">
      <textarea
        id="new-post-input"
        placeholder="Share a travel moment, tip, or story…"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none"
      />
      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
          {imagePreviews.map((preview, index) => (
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border/40 group" key={index}>
              <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
              <button
                type="button"
                className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                onClick={() => removeImage(index)}
              >
                <X className="size-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Social Links Expandable Section */}
      <div className="space-y-2 border-t border-border/20 pt-2">
        <button
          type="button"
          onClick={() => setShowSocials(!showSocials)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-semibold"
        >
          <span>🔗</span> {showSocials ? "Hide Social Links" : "Add Social Links"}
        </button>
        {showSocials && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white/3 rounded-xl border border-white/5 animate-in fade-in duration-200">
            {[
              { id: "post-instagram", label: "Instagram", placeholder: "@handle or URL", value: instagram, set: setInstagram },
              { id: "post-tiktok", label: "TikTok", placeholder: "@handle or URL", value: tiktok, set: setTiktok },
              { id: "post-facebook", label: "Facebook", placeholder: "handle or URL", value: facebook, set: setFacebook },
              { id: "post-reddit", label: "Reddit", placeholder: "username or URL", value: reddit, set: setReddit },
            ].map(({ id, label, placeholder, value, set }) => (
              <div key={id} className="space-y-1">
                <label htmlFor={id} className="text-[10px] font-bold text-muted-foreground uppercase">{label}</label>
                <input
                  id={id}
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  onChange={e => set(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) handleImages(e.target.files); e.target.value = "" }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={imageFiles.length >= 4}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon className="size-4" /> Photo ({imageFiles.length}/4)
          </button>
        </div>
        <Button
          id="post-submit-btn"
          size="sm"
          className="rounded-full px-5 bg-[#7F5AF0] hover:bg-[#6b47d6] text-white text-xs font-semibold"
          onClick={handleSubmit}
          disabled={saving || (!content.trim() && imageFiles.length === 0)}
        >
          {saving ? <Loader2 className="size-3 animate-spin" /> : "Post"}
        </Button>
      </div>
    </div>
  )
}

function PrivatePostImage({ src, alt, className, onClick }: { src: string; alt?: string; className?: string; onClick?: () => void }) {
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
    return () => { active = false }
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

function ImageLightbox({ urls, initialIndex, onClose }: { urls: string[], initialIndex: number, onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrentIndex(prev => (prev > 0 ? prev - 1 : urls.length - 1))
      if (e.key === 'ArrowRight') setCurrentIndex(prev => (prev < urls.length - 1 ? prev + 1 : 0))
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [urls.length, onClose])

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex flex-col" onClick={onClose}>
      <div className="flex justify-between items-center p-4">
        <span className="text-white text-sm font-medium">{currentIndex + 1} / {urls.length}</span>
        <button onClick={onClose} className="p-2 bg-black/50 hover:bg-white/10 rounded-full text-white transition-colors">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 relative flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
        <PrivatePostImage 
          src={urls[currentIndex]} 
          alt="Expanded view" 
          className="max-w-full max-h-full object-contain"
        />
        
        {urls.length > 1 && (
          <>
            <button 
              className="absolute left-4 p-3 bg-black/50 hover:bg-white/10 rounded-full text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev > 0 ? prev - 1 : urls.length - 1)) }}
            >
              <ChevronLeft className="size-6" />
            </button>
            <button 
              className="absolute right-4 p-3 bg-black/50 hover:bg-white/10 rounded-full text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev < urls.length - 1 ? prev + 1 : 0)) }}
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function PostCard({
  post,
  currentUserId,
  onDelete,
  onImageClick,
  isFollowing,
  onFollowToggle,
  onLikesChange,
}: {
  post: Post
  currentUserId: string | null
  onDelete: (id: string) => void
  onImageClick: (urls: string[], index: number) => void
  isFollowing: boolean
  onFollowToggle: (authorId: string) => void
  onLikesChange: (postId: string, newLikes: PostLiker[]) => void
}) {
  const isOwn = post.user_id === currentUserId
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [showLikeModal, setShowLikeModal] = useState(false)
  const [likingInProgress, setLikingInProgress] = useState(false)

  // Track post view when rendered
  useEffect(() => {
    if (post.id) {
      trackView("post", post.id, currentUserId)
    }
  }, [post.id, currentUserId])

  const [editInstagram, setEditInstagram] = useState(post.instagram || "")
  const [editTiktok, setEditTiktok] = useState(post.tiktok || "")
  const [editFacebook, setEditFacebook] = useState(post.facebook || "")
  const [editReddit, setEditReddit] = useState(post.reddit || "")
  const [showEditSocials, setShowEditSocials] = useState(false)

  const authorRole = post.author?.role ?? "traveler"
  const profileHref = authorRole === "host" ? `/host/${post.user_id}` : `/traveler/${post.user_id}`

  // Check if current user liked and saved
  const likesList = post.likes || []
  const savesList = post.saves || []
  const liked = currentUserId ? likesList.some(l => l.user_id === currentUserId) : false
  const saved = currentUserId ? savesList.some(s => s.user_id === currentUserId) : false

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to like posts.")
      return
    }
    if (likingInProgress) return
    setLikingInProgress(true)
    // Optimistic update
    const wasLiked = liked
    const newLikes = wasLiked
      ? likesList.filter(l => l.user_id !== currentUserId)
      : [...likesList, { user_id: currentUserId, created_at: new Date().toISOString() }]
    onLikesChange(post.id, newLikes)
    try {
      const { toggleLike } = await import("@/lib/api/content")
      await toggleLike(post.id, currentUserId, !wasLiked)
    } catch (err: any) {
      // Revert on error
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
      const { toggleSave } = await import("@/lib/api/content")
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
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-4 space-y-3">
      {/* Author */}
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
                {authorRole === "host" && (
                  <span className="text-[8px] font-bold text-[#2CB67D] bg-[#2CB67D]/10 border border-[#2CB67D]/30 rounded-full px-1.5 py-0.25 tracking-wide">
                    🟢 LOCAL HOST
                  </span>
                )}
                {authorRole === "admin" && (
                  <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-full px-1.5 py-0.25 tracking-wide">
                    🛡️ ADMIN
                  </span>
                )}
                {authorRole === "traveler" && (
                  <span className="text-[8px] font-bold text-[#7F5AF0] bg-[#7F5AF0]/10 border border-[#7F5AF0]/30 rounded-full px-1.5 py-0.25 tracking-wide">
                    ✈️ TRAVELER
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
            </div>
          </Link>

          {/* Follow Button */}
          {!isOwn && currentUserId && (
            <button
              onClick={handleFollowClick}
              disabled={loadingFollow}
              className={cn(
                "ml-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all duration-200",
                isFollowing
                  ? "bg-muted text-muted-foreground hover:bg-muted/85"
                  : "bg-[#7F5AF0] text-white hover:bg-[#6b47d6] shadow-sm"
              )}
            >
              {loadingFollow ? "..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {isOwn && (
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(!editing)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              {editing ? <X className="size-3.5" /> : <Edit3 className="size-3.5" />}
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={3}
            className="w-full text-sm bg-muted/40 rounded-xl px-3 py-2 text-foreground resize-none focus:outline-none border border-border/60"
          />

          {/* Edit social links */}
          <div className="space-y-2 border-t border-border/20 pt-2">
            <button
              type="button"
              onClick={() => setShowEditSocials(!showEditSocials)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-semibold"
            >
              <span>🔗</span> {showEditSocials ? "Hide Social Links" : "Edit Social Links"}
            </button>
            {showEditSocials && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white/3 rounded-xl border border-white/5 animate-in fade-in duration-200">
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
                      onChange={e => set(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-xs rounded-full">Cancel</Button>
            <Button size="sm" className="text-xs rounded-full bg-[#7F5AF0] hover:bg-[#6b47d6] text-white" onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="size-3 animate-spin" /> : <><Check className="size-3 mr-1" />Save</>}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Images Grid */}
      {(() => {
        const urls = post.image_urls && post.image_urls.length > 0 
          ? post.image_urls 
          : (post.image_url ? [post.image_url] : [])

        if (urls.length === 0) return null

        if (urls.length === 1) {
          return (
            <PrivatePostImage 
              src={urls[0]} 
              alt="Post media" 
              className="w-full rounded-xl max-h-80 object-cover cursor-pointer border border-border/40" 
              onClick={() => onImageClick(urls, 0)} 
            />
          )
        }

        if (urls.length === 2) {
          return (
            <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden border border-border/40 aspect-[2/1]">
              <div className="relative cursor-pointer h-full" onClick={() => onImageClick(urls, 0)}>
                <PrivatePostImage src={urls[0]} alt="Post media 0" className="w-full h-full object-cover" />
              </div>
              <div className="relative cursor-pointer h-full" onClick={() => onImageClick(urls, 1)}>
                <PrivatePostImage src={urls[1]} alt="Post media 1" className="w-full h-full object-cover" />
              </div>
            </div>
          )
        }

        if (urls.length === 3) {
          return (
            <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden border border-border/40 aspect-[4/3]">
              <div className="row-span-2 relative cursor-pointer h-full" onClick={() => onImageClick(urls, 0)}>
                <PrivatePostImage src={urls[0]} alt="Post media 0" className="w-full h-full object-cover" />
              </div>
              <div className="relative cursor-pointer h-full" onClick={() => onImageClick(urls, 1)}>
                <PrivatePostImage src={urls[1]} alt="Post media 1" className="w-full h-full object-cover" />
              </div>
              <div className="relative cursor-pointer h-full" onClick={() => onImageClick(urls, 2)}>
                <PrivatePostImage src={urls[2]} alt="Post media 2" className="w-full h-full object-cover" />
              </div>
            </div>
          )
        }

        return (
          <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden border border-border/40 aspect-[4/3]">
            {urls.slice(0, 4).map((url, index) => {
              const isLast = index === 3 && urls.length > 4
              return (
                <div key={url} className="relative w-full h-full group overflow-hidden cursor-pointer" onClick={() => onImageClick(urls, index)}>
                  <PrivatePostImage 
                    src={url} 
                    alt={`Post media ${index}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-lg select-none">
                      +{urls.length - 4}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Social Links Badge Row */}
      {(post.instagram || post.tiktok || post.facebook || post.reddit) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/20">
          {post.instagram && (
            <a
              href={formatSocialLink("instagram", post.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-border/40 hover:border-[#7F5AF0] text-[10px] text-muted-foreground hover:text-white transition-colors"
              title="Instagram"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-border/40 hover:border-[#7F5AF0] text-[10px] text-muted-foreground hover:text-white transition-colors"
              title="TikTok"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-border/40 hover:border-[#7F5AF0] text-[10px] text-muted-foreground hover:text-white transition-colors"
              title="Facebook"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-border/40 hover:border-[#7F5AF0] text-[10px] text-muted-foreground hover:text-white transition-colors"
              title="Reddit"
            >
              <RedditIcon className="size-3" />
              <span>Reddit</span>
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <div className="flex items-center gap-4">
          {/* Heart / Like toggle */}
          <button
            onClick={handleLike}
            disabled={likingInProgress}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-all duration-150 active:scale-90",
              liked ? "text-red-400 font-bold" : "text-muted-foreground hover:text-red-400",
              likingInProgress && "opacity-60 cursor-not-allowed"
            )}
          >
            <Heart className={cn("size-4 transition-transform", liked && "fill-red-400 stroke-red-400 scale-110")} />
          </button>
          {/* Clickable like count → opens modal */}
          <button
            onClick={() => likesList.length > 0 && setShowLikeModal(true)}
            className={cn(
              "text-xs transition-colors",
              likesList.length > 0
                ? "text-muted-foreground hover:text-white cursor-pointer"
                : "text-muted-foreground/50 cursor-default"
            )}
            title={likesList.length > 0 ? "See who liked this" : undefined}
          >
            {likesList.length} {likesList.length === 1 ? "Like" : "Likes"}
          </button>
          {/* View count */}
          {(post.view_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
              <Eye className="size-3.5" />
              {post.view_count}
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
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
          <span>{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

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
}


export default function FeedPage() {
  useSEO({
    title: "Ausaguide Community Feed",
    description: "Posts, tips, and stories from Ausaguide travelers and local hosts in Kenya.",
    url: "https://ausaguide.com/feed",
  })
  const navigate = useNavigate()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [feedError, setFeedError] = useState(false)
  const [filter, setFilter] = useState<"all" | "favorites">("all")
  const [lightboxData, setLightboxData] = useState<{ urls: string[], index: number } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null
      setCurrentUserId(uid)
      if (uid) {
        fetchUserFollows(uid).then(setFollowingIds).catch(console.error)
      }
    })
  }, [])

  const loadFeed = () => {
    setLoading(true)
    setFeedError(false)
    fetchPosts()
      .then(setPosts)
      .catch(err => { console.error(err); setFeedError(true) })
      .finally(() => setLoading(false))
  }

  // Real-time Postgres subscriptions for likes and saves
  useEffect(() => {
    // Debounce timer to avoid rapid refetches from realtime
    let refetchTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleRefetch = () => {
      if (refetchTimer) clearTimeout(refetchTimer)
      refetchTimer = setTimeout(() => {
        fetchPosts().then(setPosts).catch(console.error)
      }, 1500)
    }

    const likesChannel = supabase
      .channel("feed-likes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes" },
        scheduleRefetch
      )
      .subscribe()

    const savesChannel = supabase
      .channel("feed-saves-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saves" },
        scheduleRefetch
      )
      .subscribe()

    return () => {
      if (refetchTimer) clearTimeout(refetchTimer)
      supabase.removeChannel(likesChannel)
      supabase.removeChannel(savesChannel)
    }
  }, [])

  useEffect(() => {
    loadFeed()
  }, [])

  const handleFollowToggle = async (authorId: string) => {
    if (!currentUserId) return
    const isFollowing = followingIds.includes(authorId)
    try {
      await toggleFollow(currentUserId, authorId, !isFollowing)
      setFollowingIds(prev =>
        isFollowing ? prev.filter(id => id !== authorId) : [...prev, authorId]
      )
      toast.success(isFollowing ? "Unfollowed user." : "Following user!")
    } catch (err: any) {
      toast.error(err.message || "Failed to update follow status.")
    }
  }

  const handleLikesChange = useCallback((postId: string, newLikes: PostLiker[]) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p))
  }, [])

  // Filter & Sort Posts: Show followed users first in 'all' view
  const displayPosts = posts
    .filter(post => {
      if (filter === "favorites") {
        return currentUserId ? (post.saves || []).some(s => s.user_id === currentUserId) : false
      }
      return true
    })
    .sort((a, b) => {
      if (filter === "all") {
        const aFollowed = followingIds.includes(a.user_id) ? 1 : 0
        const bFollowed = followingIds.includes(b.user_id) ? 1 : 0
        if (aFollowed !== bFollowed) return bFollowed - aFollowed
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-xl px-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/dashboard")}
              aria-label="Go back"
              className="p-2.5 hover:bg-muted/40 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
              title="Back"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="size-9 rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/20 flex items-center justify-center">
              <Rss className="size-4 text-[#7F5AF0]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Community Feed</h1>
              <p className="text-xs text-[#7F5AF0] font-semibold flex items-center gap-1.5 mt-0.5">
                <span>🌐 Public Shared Space</span>
              </p>
            </div>
          </div>
        </div>

        {/* Create post (logged in only) */}
        {currentUserId && (
          <CreatePostCard
            currentUserId={currentUserId}
            onCreated={post => setPosts(prev => [post, ...prev])}
          />
        )}
        {!currentUserId && (
          <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Sign in to share your travel stories</p>
            <Button size="sm" className="rounded-full" onClick={() => navigate("/auth")}>Sign in</Button>
          </div>
        )}

        {/* Filters Panel (Tabs) */}
        {currentUserId && (
          <div className="flex border-b border-border/40 gap-6">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "pb-3 text-sm font-semibold transition-all relative",
                filter === "all" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Posts
              {filter === "all" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setFilter("favorites")}
              className={cn(
                "pb-3 text-sm font-semibold transition-all relative flex items-center gap-1",
                filter === "favorites" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              Favorites
              {filter === "favorites" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonPostCard />
            <SkeletonPostCard />
            <SkeletonPostCard />
          </div>
        ) : feedError ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Couldn't load the feed</p>
              <p className="text-xs text-muted-foreground mt-1">There was a problem connecting to the server.</p>
            </div>
            <button
              onClick={loadFeed}
              className="px-4 py-2 rounded-full bg-[#7F5AF0] text-white text-xs font-semibold hover:bg-[#6b47d6] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Globe className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {filter === "favorites" ? "No saved posts yet." : "No posts yet. Be the first to share!"}
            </p>
          </div>
        ) : (
          displayPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isFollowing={followingIds.includes(post.user_id)}
              onFollowToggle={handleFollowToggle}
              onLikesChange={handleLikesChange}
              onDelete={id => setPosts(prev => prev.filter(p => p.id !== id))}
              onImageClick={(urls, index) => setLightboxData({ urls, index })}
            />
          ))
        )}
      </div>

      {lightboxData && (
        <ImageLightbox 
          urls={lightboxData.urls} 
          initialIndex={lightboxData.index} 
          onClose={() => setLightboxData(null)} 
        />
      )}
    </div>
  )
}
