import { useState, useEffect, useRef } from "react"
import { BookOpen, Plus, Edit3, Trash2, X, Check, Loader2, ImageIcon, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { fetchJournals, createJournal, updateJournal, deleteJournal, type Journal } from "@/lib/api/content"
import { toast } from "sonner"
import { format } from "date-fns"
import { useSEO } from "@/hooks/useSEO"
import { useNavigate } from "react-router-dom"

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

  const resetForm = () => {
    setFormTitle("")
    setFormContent("")
    setFormImageFile(null)
    setFormImagePreview(null)
    setSelected(null)
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
      if (mode === "create") {
        const j = await createJournal(currentUserId, formTitle, formContent, imageUrl)
        setJournals(prev => [j, ...prev])
        toast.success("Journal entry created!")
      } else if (mode === "edit" && selected) {
        await updateJournal(selected.id, formTitle, formContent, imageUrl ?? formImagePreview)
        setJournals(prev => prev.map(jj => jj.id === selected.id ? { ...jj, title: formTitle, content: formContent, image_url: imageUrl ?? formImagePreview ?? null } : jj))
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
            <p className="text-xs text-muted-foreground">{format(new Date(selected.created_at), "MMMM d, yyyy")}</p>
          </div>
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
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="size-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">My Journals</h1>
              <p className="text-xs text-muted-foreground">{journals.length} {journals.length === 1 ? "entry" : "entries"}</p>
            </div>
          </div>
          <Button id="new-journal-btn" size="sm" className="rounded-full gap-1.5 bg-[#7F5AF0] hover:bg-[#6b47d6] text-white" onClick={openCreate}>
            <Plus className="size-4" /> New Entry
          </Button>
        </div>

        {/* Journal list */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="size-6 text-primary" /></div>
        ) : journals.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-dashed border-border/60 p-8">
            <BookOpen className="size-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Your journal is empty. Start writing your first entry!</p>
            <Button className="rounded-full bg-[#7F5AF0] hover:bg-[#6b47d6] text-white" onClick={openCreate}>
              <Plus className="size-4 mr-1" /> Write First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {journals.map(j => (
              <div
                key={j.id}
                className="group rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden hover:border-primary/30 transition-colors"
              >
                <div className="flex items-stretch">
                  {j.image_url && (
                    <PrivateJournalImage src={j.image_url} alt="Cover" className="w-20 object-cover flex-shrink-0" />
                  )}
                  <div className="flex flex-1 items-center px-4 py-3.5 gap-3 min-w-0">
                    <button className="flex-1 text-left min-w-0" onClick={() => openView(j)}>
                      <p className="font-semibold text-sm truncate">{j.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{j.content}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{format(new Date(j.created_at), "MMM d, yyyy")}</p>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(j)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Edit3 className="size-3.5" />
                      </button>
                      <button onClick={() => handleDelete(j.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/40 flex-shrink-0" />
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
