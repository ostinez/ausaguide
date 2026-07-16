import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Image as ImageIcon, Loader2, Trash2, Edit3, X, Check,
  Heart, Globe, Rss
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { fetchPosts, createPost, updatePost, deletePost, type Post } from "@/lib/api/content"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"
import { formatDistanceToNow } from "date-fns"

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function CreatePostCard({ currentUserId, onCreated }: { currentUserId: string; onCreated: (p: Post) => void }) {
  const [content, setContent] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
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
      const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              const MAX_SIZE = 1200
              let width = img.width
              let height = img.height
              if (width > height && width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width)
                width = MAX_SIZE
              } else if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height)
                height = MAX_SIZE
              }
              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx?.drawImage(img, 0, 0, width, height)
              canvas.toBlob((blob) => {
                if (blob) {
                  const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpeg"
                  resolve(new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() }))
                } else {
                  resolve(file)
                }
              }, 'image/jpeg', 0.8)
            }
            img.onerror = () => resolve(file)
            img.src = e.target?.result as string
          }
          reader.onerror = () => resolve(file)
          reader.readAsDataURL(file)
        })
      }

      const uploadPromises = imageFiles.map(async (rawFile) => {
        const file = await compressImage(rawFile)
        const path = `${currentUserId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpeg`
        const { error: upErr } = await supabase.storage.from("posts").upload(path, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path)
        return publicUrl
      })

      const imageUrls = await Promise.all(uploadPromises)

      const post = await createPost(currentUserId, content, imageUrls)
      onCreated(post)
      setContent("")
      setImageFiles([])
      setImagePreviews([])
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
          if (!error && data?.signedUrl) {
            setSignedUrl(data.signedUrl)
            return
          }
        }
        const { data, error } = await supabase.storage.from("posts").createSignedUrl(path, 3600)
        if (!error && data?.signedUrl) {
          setSignedUrl(data.signedUrl)
        } else {
          setSignedUrl(src)
        }
      } catch {
        setSignedUrl(src)
      }
    }
    if (src) load()
  }, [src])

  if (!signedUrl) return <div className={cn("bg-muted/20 animate-pulse rounded-xl w-full h-48", className)} />

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  )
}

function PostCard({ post, currentUserId, onDelete }: { post: Post; currentUserId: string | null; onDelete: (id: string) => void }) {
  const isOwn = post.user_id === currentUserId
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const [liked, setLiked] = useState(false)

  const saveEdit = async () => {
    if (!editContent.trim()) return
    setSaving(true)
    try {
      await updatePost(post.id, editContent)
      post.content = editContent
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
          <Avatar className="size-10">
            <AvatarImage src={post.author?.avatar_url ?? ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials(post.author?.full_name ?? "U")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-tight">{post.author?.full_name ?? "Unknown"}</p>
            <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
          </div>
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
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={3}
            className="w-full text-sm bg-muted/40 rounded-xl px-3 py-2 text-foreground resize-none focus:outline-none border border-border/60"
          />
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
              onClick={() => window.open(urls[0], "_blank")} 
            />
          )
        }

        if (urls.length === 2) {
          return (
            <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden border border-border/40 aspect-[2/1]">
              <div className="relative cursor-pointer h-full" onClick={() => window.open(urls[0], "_blank")}>
                <PrivatePostImage src={urls[0]} alt="Post media 0" className="w-full h-full object-cover" />
              </div>
              <div className="relative cursor-pointer h-full" onClick={() => window.open(urls[1], "_blank")}>
                <PrivatePostImage src={urls[1]} alt="Post media 1" className="w-full h-full object-cover" />
              </div>
            </div>
          )
        }

        if (urls.length === 3) {
          return (
            <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden border border-border/40 aspect-[4/3]">
              <div className="row-span-2 relative cursor-pointer h-full" onClick={() => window.open(urls[0], "_blank")}>
                <PrivatePostImage src={urls[0]} alt="Post media 0" className="w-full h-full object-cover" />
              </div>
              <div className="relative cursor-pointer h-full" onClick={() => window.open(urls[1], "_blank")}>
                <PrivatePostImage src={urls[1]} alt="Post media 1" className="w-full h-full object-cover" />
              </div>
              <div className="relative cursor-pointer h-full" onClick={() => window.open(urls[2], "_blank")}>
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
                <div key={url} className="relative w-full h-full group overflow-hidden cursor-pointer" onClick={() => window.open(url, "_blank")}>
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

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-border/30">
        <button
          onClick={() => setLiked(!liked)}
          className={cn("flex items-center gap-1.5 text-xs transition-colors", liked ? "text-red-400" : "text-muted-foreground hover:text-red-400")}
        >
          <Heart className={cn("size-4", liked && "fill-current")} />
          {liked ? "Liked" : "Like"}
        </button>
      </div>
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(err => { console.error(err); toast.error("Failed to load feed.") })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-xl px-4 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Rss className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Community Feed</h1>
            <p className="text-xs text-muted-foreground">Stories & tips from the Ausaguide community</p>
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

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="size-6 text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Globe className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={id => setPosts(prev => prev.filter(p => p.id !== id))}
            />
          ))
        )}
      </div>
    </div>
  )
}
