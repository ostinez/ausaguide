import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Rss, Globe, ImageIcon, X, Loader2, ChevronLeft, ChevronRight, ArrowLeft, AlertTriangle, Link2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { fetchPosts, createPost, toggleFollow, fetchUserFollows, type Post, type PostLiker } from "@/lib/api/content"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"
import { SkeletonPostCard } from "@/components/ui/Skeleton"
import { PostCard } from "@/components/feed/PostCard"



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
 <div className="rounded-2xl border border-border/60 bg-card shadow-modern p-4 space-y-3">
 <textarea
        id="new-post-input"
        placeholder="Share a travel moment, tip, or story…"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={6}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[180px] overflow-y-auto resize-y leading-relaxed"
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
 className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-semibold"
 >
 <Link2 className="size-3.5" />
 <span>{showSocials ? "Hide Social Links" : "Add Social Links"}</span>
 </button>
 {showSocials && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-card shadow-modern rounded-xl border border-white/5 animate-in fade-in duration-200">
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
 className="rounded-full px-5 bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon hover:bg-[#6b47d6] text-white text-xs font-semibold"
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
 <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col" onClick={onClose}>
 <div className="flex justify-between items-center p-4">
 <span className="text-white text-sm font-medium">{currentIndex + 1} / {urls.length}</span>
 <button onClick={onClose} className="p-2 bg-black/50 hover:bg-card shadow-modern rounded-full text-white transition-colors">
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
 className="absolute left-4 p-3 bg-black/50 hover:bg-card shadow-modern rounded-full text-white transition-colors"
 onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev > 0 ? prev - 1 : urls.length - 1)) }}
 >
 <ChevronLeft className="size-6" />
 </button>
 <button 
 className="absolute right-4 p-3 bg-black/50 hover:bg-card shadow-modern rounded-full text-white transition-colors"
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

// PostCard component is imported from "@/components/feed/PostCard"


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
 likesChannel.unsubscribe()
 savesChannel.unsubscribe()
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
 <div className="size-9 rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/10 border border-[#0D6F73]/20 flex items-center justify-center">
 <Rss className="size-4 text-[#0D6F73]" />
 </div>
 <div>
 <h1 className="text-xl font-bold tracking-tight text-white">Community Feed</h1>
 <span className="flex items-center gap-1.5">
 <Globe className="size-3.5 text-[#0D6F73]" />
 Public Shared Space
 </span>
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
 <div className="rounded-2xl border border-border/60 bg-card shadow-modern p-4 text-center space-y-2">
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
 <div className="space-y-4 animate-in fade-in duration-300">
 <SkeletonPostCard />
 <SkeletonPostCard />
 <SkeletonPostCard className="hidden sm:block" />
 <SkeletonPostCard className="hidden sm:block" />
 </div>
 ) : feedError ? (
 <div className="flex flex-col items-center gap-4 py-16 text-center animate-in fade-in duration-300">
 <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center">
 <AlertTriangle className="size-6 text-red-500" />
 </div>
 <div>
 <p className="text-sm font-semibold text-white">Couldn't load the feed</p>
 <p className="text-xs text-muted-foreground mt-1">There was a problem connecting to the server.</p>
 </div>
 <button
 onClick={loadFeed}
 className="px-4 py-2 rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon text-white text-xs font-semibold hover:bg-[#6b47d6] transition-colors"
 >
 Try Again
 </button>
 </div>
 ) : displayPosts.length === 0 ? (
 <div className="flex flex-col items-center gap-3 py-16 text-center animate-in fade-in duration-300">
 <Globe className="size-10 text-muted-foreground/40" />
 <p className="text-sm text-muted-foreground">
 {filter === "favorites" ? "No saved posts yet." : "No posts yet. Be the first to share!"}
 </p>
 </div>
 ) : (
 <div className="space-y-4 animate-in fade-in duration-300">
 {displayPosts.map(post => (
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
 ))}
 </div>
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
