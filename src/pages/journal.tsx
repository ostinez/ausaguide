import { useState, useEffect, useRef } from "react"
import { BookOpen, Plus, Edit3, Trash2, X, Check, Loader2, ImageIcon, ChevronRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { fetchJournals, createJournal, updateJournal, deleteJournal, trackView, type Journal } from "@/lib/api/content"
import { toast } from "sonner"
import { format } from "date-fns"
import { useSEO } from "@/hooks/useSEO"
import { useNavigate } from "react-router-dom"
import { BackButton } from "@/components/ui/BackButton"
import { formatSocialLink } from "@/lib/utils"

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

function PrivateJournalImage({ src, alt, className, onClick }: { src: string; alt?: string; className?: string; onClick?: () => void }) {
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

  if (!signedUrl) return <div className={`bg-muted/20 animate-pulse ${className}`} />

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  )
}

type Mode = "list" | "create" | "edit" | "view"

export default function JournalPage() {
  useSEO({
    title: "My Travel Journals",
    description: "Your personal travel journals — write, edit, and save your stories.",
    url: "https://ausaguide.com/journal",
  })
  const navigate = useNavigate()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>("list")
  const [selected, setSelected] = useState<Journal | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formImageFile, setFormImageFile] = useState<File | null>(null)
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null)
  const [instagram, setInstagram] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [facebook, setFacebook] = useState("")
  const [reddit, setReddit] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  // Load journals (own only)
  useEffect(() => {
    if (!currentUserId) { setLoading(false); return }
    fetchJournals(currentUserId)
      .then(setJournals)
      .catch(err => { console.error(err); toast.error("Failed to load journals.") })
      .finally(() => setLoading(false))
  }, [currentUserId])

  // Track views when a journal entry is viewed
  useEffect(() => {
    if (mode === "view" && selected) {
      trackView("journal", selected.id, currentUserId)
    }
  }, [mode, selected?.id, currentUserId])

  const resetForm = () => {
    setFormTitle("")
    setFormContent("")
    setFormImageFile(null)
    setFormImagePreview(null)
    setSelected(null)
    setInstagram("")
    setTiktok("")
    setFacebook("")
    setReddit("")
  }

  const openCreate = () => {
    resetForm()
    setMode("create")
  }

  const openEdit = (j: Journal) => {
    setSelected(j)
    setFormTitle(j.title)
    setFormContent(j.content)
    setFormImagePreview(j.image_url ?? null)
    setFormImageFile(null)
    setInstagram(j.instagram || "")
    setTiktok(j.tiktok || "")
    setFacebook(j.facebook || "")
    setReddit(j.reddit || "")
    setMode("edit")
  }

  const openView = (j: Journal) => {
    setSelected(j)
    setMode("view")
  }

  const uploadImage = async (userId: string): Promise<string | undefined> => {
    if (!formImageFile) return undefined
    const ext = formImageFile.name.split(".").pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("posts").upload(path, formImageFile)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path)
    return publicUrl
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error("Title and content are required.")
      return
    }
    if (!currentUserId) return
    setSaving(true)
    try {
      const imageUrl = await uploadImage(currentUserId)
      const socialsObj = {
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
        facebook: facebook.trim() || null,
        reddit: reddit.trim() || null,
      }
      if (mode === "create") {
        const j = await createJournal(currentUserId, formTitle, formContent, imageUrl, socialsObj)
        setJournals(prev => [j, ...prev])
        toast.success("Journal entry created!")
      } else if (mode === "edit" && selected) {
        await updateJournal(selected.id, formTitle, formContent, imageUrl ?? formImagePreview, socialsObj)
        setJournals(prev => prev.map(jj => jj.id === selected.id ? { 
          ...jj, 
          title: formTitle, 
          content: formContent, 
          image_url: imageUrl ?? formImagePreview ?? null,
          instagram: socialsObj.instagram,
          tiktok: socialsObj.tiktok,
          facebook: socialsObj.facebook,
          reddit: socialsObj.reddit
        } : jj))
        toast.success("Journal entry updated!")
      }
      resetForm()
      setMode("list")
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this journal entry?")) return
    try {
      await deleteJournal(id)
      setJournals(prev => prev.filter(j => j.id !== id))
      if (selected?.id === id) { setSelected(null); setMode("list") }
      toast.success("Deleted.")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (!currentUserId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center bg-background">
        <div className="space-y-4">
          <BookOpen className="mx-auto size-12 text-muted-foreground" />
          <h2 className="text-xl font-bold">Sign in to access your journals</h2>
          <Button className="rounded-full" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    )
  }

  // ─── Form view ────────────────────────────────────────────────────────────
  if (mode === "create" || mode === "edit") {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-4 space-y-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => { resetForm(); setMode("list") }}>
              <X className="size-4 mr-1" /> Cancel
            </Button>
            <h1 className="text-xl font-bold">{mode === "create" ? "New Journal Entry" : "Edit Entry"}</h1>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-5">
            <div className="space-y-1.5">
              <Label htmlFor="journal-title">Title *</Label>
              <Input
                id="journal-title"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Give your entry a title…"
                className="border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="journal-content">Content *</Label>
              <textarea
                id="journal-content"
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                rows={12}
                placeholder="Write your travel story, tips, or reflections…"
                className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              />
            </div>

            {/* Cover image */}
            <div className="space-y-1.5">
              <Label>Cover Image (optional)</Label>
              {formImagePreview && (
                <div className="relative w-fit">
                  <img src={formImagePreview} alt="Preview" className="max-h-48 rounded-xl" />
                  <button
                    className="absolute top-1 right-1 size-6 rounded-full bg-black/60 flex items-center justify-center"
                    onClick={() => { setFormImageFile(null); setFormImagePreview(null) }}
                  >
                    <X className="size-3 text-white" />
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) { setFormImageFile(file); setFormImagePreview(URL.createObjectURL(file)) }
                  e.target.value = ""
                }}
              />
              <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => fileRef.current?.click()}>
                <ImageIcon className="size-4" /> {formImagePreview ? "Change Image" : "Add Image"}
              </Button>
            </div>

            {/* Social Links Section */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <Label className="text-sm font-semibold">Social Links (optional)</Label>
              <p className="text-[11px] text-muted-foreground -mt-1.5">Attach social handles or links to this journal entry.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "journal-instagram", label: "Instagram", placeholder: "@handle or URL", value: instagram, set: setInstagram },
                  { id: "journal-tiktok", label: "TikTok", placeholder: "@handle or URL", value: tiktok, set: setTiktok },
                  { id: "journal-facebook", label: "Facebook", placeholder: "handle or URL", value: facebook, set: setFacebook },
                  { id: "journal-reddit", label: "Reddit", placeholder: "username or URL", value: reddit, set: setReddit },
                ].map(({ id, label, placeholder, value, set }) => (
                  <div key={id} className="space-y-1">
                    <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      id={id}
                      type="text"
                      placeholder={placeholder}
                      value={value}
                      onChange={e => set(e.target.value)}
                      className="border-border/80 text-foreground placeholder:text-muted-foreground/50 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full rounded-full bg-[#7F5AF0] hover:bg-[#6b47d6] text-white font-semibold"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
              {mode === "create" ? "Save Entry" : "Update Entry"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── View single entry ────────────────────────────────────────────────────
  if (mode === "view" && selected) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-4 space-y-5">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setMode("list")}>
              ← Back
            </Button>
          </div>
          {selected.image_url && (
            <PrivateJournalImage src={selected.image_url} alt="Cover" className="w-full max-h-72 object-cover rounded-2xl" />
          )}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{selected.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">{format(new Date(selected.created_at), "MMMM d, yyyy")}</p>
              {(selected.view_count ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                  <Eye className="size-3" />
                  {selected.view_count} views
                </span>
              )}
            </div>
          </div>

          {/* Social Links Badge Row */}
          {(selected.instagram || selected.tiktok || selected.facebook || selected.reddit) && (
            <div className="flex flex-wrap items-center gap-2 py-3 border-t border-b border-border/20">
              {selected.instagram && (
                <a
                  href={formatSocialLink("instagram", selected.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-border/40 hover:border-[#7F5AF0] text-[10px] text-muted-foreground hover:text-white transition-colors"
                  title="Instagram"
                >
                  <InstagramIcon className="size-3" />
                  <span>Instagram</span>
                </a>
              )}
              {selected.tiktok && (
                <a
                  href={formatSocialLink("tiktok", selected.tiktok)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-border/40 hover:border-[#7F5AF0] text-[10px] text-muted-foreground hover:text-white transition-colors"
                  title="TikTok"
                >
                  <TikTokIcon className="size-3" />
                  <span>TikTok</span>
                </a>
              )}
              {selected.facebook && (
                <a
                  href={formatSocialLink("facebook", selected.facebook)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-border/40 hover:border-[#7F5AF0] text-[10px] text-muted-foreground hover:text-white transition-colors"
                  title="Facebook"
                >
                  <FacebookIcon className="size-3" />
                  <span>Facebook</span>
                </a>
              )}
              {selected.reddit && (
                <a
                  href={formatSocialLink("reddit", selected.reddit)}
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

          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{selected.content}</p>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="rounded-full gap-1.5" onClick={() => openEdit(selected)}>
              <Edit3 className="size-3.5" /> Edit
            </Button>
            <Button size="sm" variant="destructive" className="rounded-full gap-1.5" onClick={() => handleDelete(selected.id)}>
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── List view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 relative">
      {/* Soft warm gold background ambient light */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-2xl px-4 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallback="/dashboard" label="" className="p-2 border-amber-500/10 hover:border-amber-500/20 text-amber-500/60 hover:text-amber-500" />
            <div className="size-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <BookOpen className="size-4 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-accent">Personal Travel Diary</h1>
              <p className="text-xs text-amber-500/60 flex items-center gap-1">
                <span>🔒 Private memoirs</span>
                <span>·</span>
                <span>{journals.length} {journals.length === 1 ? "entry" : "entries"}</span>
              </p>
            </div>
          </div>
          <Button
            id="new-journal-btn"
            size="sm"
            className="rounded-full gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold shadow-md shadow-amber-950/20 border border-amber-500/20"
            onClick={openCreate}
          >
            <Plus className="size-4" /> New Entry
          </Button>
        </div>

        {/* Journal list */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="size-6 text-amber-500" /></div>
        ) : journals.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-dashed border-amber-500/20 bg-[#1d1b18]/25 p-8">
            <BookOpen className="size-12 text-amber-500/30" />
            <div>
              <h3 className="font-semibold text-white text-sm">Your Personal Diary is Empty</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Write down private travel thoughts, itineraries, or memories that only you can see.
              </p>
            </div>
            <Button
              className="rounded-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold"
              onClick={openCreate}
            >
              <Plus className="size-4 mr-1" /> Write First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {journals.map(j => (
              <div
                key={j.id}
                className="group relative rounded-2xl border border-amber-500/10 bg-[#1d1b18]/45 backdrop-blur-md overflow-hidden hover:border-amber-500/30 transition-all duration-300 shadow-md shadow-amber-950/20"
              >
                <div className="flex items-stretch">
                  {j.image_url && (
                    <PrivateJournalImage src={j.image_url} alt="Cover" className="w-24 object-cover flex-shrink-0" />
                  )}
                  <div className="flex flex-1 items-center px-5 py-4 gap-3 min-w-0">
                    <button className="flex-1 text-left min-w-0 pr-16" onClick={() => openView(j)}>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-amber-500/70 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">🔒 Private Memo</span>
                      </div>
                      <p className="font-semibold text-base text-amber-100 group-hover:text-amber-300 transition-colors font-accent mt-1.5 truncate">{j.title}</p>
                      <p className="text-xs text-amber-100/60 mt-1 line-clamp-2 leading-relaxed">{j.content}</p>
                      <p className="text-[10px] text-amber-500/50 mt-2 font-mono">{format(new Date(j.created_at), "MMMM d, yyyy")}</p>
                    </button>
                    <div className="absolute right-4 bottom-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(j)} className="p-1.5 rounded-lg hover:bg-white/5 text-amber-500/60 hover:text-amber-400 transition-colors">
                        <Edit3 className="size-3.5" />
                      </button>
                      <button onClick={() => handleDelete(j.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-amber-500/60 hover:text-destructive transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <ChevronRight className="size-4 text-amber-500/30 absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
