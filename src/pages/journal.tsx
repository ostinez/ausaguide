import { useState, useEffect } from "react"
import { Plus, MapPin, Lock, Globe, Trash2, BookOpen, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import Dropzone from "@/components/ui/Dropzone"
import { useSEO } from "@/hooks/useSEO"

interface JournalEntry {
  id: string
  title: string
  location: string | null
  description: string | null
  image_urls: string[]
  is_public: boolean
  created_at: string
}

export default function JournalPage() {
  useSEO({
    title: "Traveler Journals & Stories",
    description:
      "Read unfiltered guides, reviews, and stories shared by real travelers in Kenya.",
    url: "https://ausaguide.com/journal",
  })
  const userId = localStorage.getItem("user_id")
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const load = async () => {
      try {
        const { data } = await supabase
          .from("journal_entries")
          .select("id, title, location, description, image_urls, is_public, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        setEntries((data ?? []) as JournalEntry[])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !title.trim()) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: userId,
          title: title.trim(),
          location: location || null,
          description: description || null,
          is_public: isPublic,
          image_urls: imageUrls,
        })
        .select("id, title, location, description, image_urls, is_public, created_at")
        .single()
      if (error) throw error
      setEntries((prev) => [data as JournalEntry, ...prev])
      setTitle("")
      setLocation("")
      setDescription("")
      setIsPublic(false)
      setImageUrls([])
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("journal_entries").delete().eq("id", id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  if (!userId) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Log in to access your journal</h2>
        <Link to="/auth"><Button className="rounded-full">Log In</Button></Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Travel Journal</h1>
              <p className="text-sm text-muted-foreground">Your personal travel diary</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 rounded-full">
            <Plus className="size-4" /> New Entry
          </Button>
        </div>

        {/* New Entry Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-border bg-card/60 p-6">
            <h2 className="mb-4 text-lg font-bold text-foreground">New Journal Entry</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="j-title">Title *</Label>
                <Input id="j-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What an adventure!" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="j-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nairobi, Kenya" className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-desc">Description</Label>
                <textarea
                  id="j-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Write about your experience..."
                  className="w-full resize-none rounded-md border border-border/80 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Photos</Label>
                <Dropzone
                  bucket="journals"
                  multiple={true}
                  value={imageUrls}
                  onChange={setImageUrls}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isPublic ? "Public post" : "Private entry"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublic ? "Visible on the social feed" : "Only you can see this"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                    isPublic ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn("pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform duration-200", isPublic ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="rounded-full">
                  {saving ? <Spinner className="size-4" /> : "Save Entry"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-full">Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">No journal entries yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Start writing about your travel experiences.</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="rounded-full gap-2">
              <Plus className="size-4" /> Write First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="group rounded-2xl border border-border bg-card/50 p-5 transition-all hover:border-primary/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-foreground truncate">{entry.title}</h3>
                      {entry.is_public ? (
                        <span className="flex items-center gap-1 rounded-full bg-teal/10 border border-teal/30 px-2 py-0.5 text-[10px] font-bold text-teal">
                          <Globe className="size-2.5" /> Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-muted/50 border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          <Lock className="size-2.5" /> Private
                        </span>
                      )}
                    </div>
                    {entry.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="size-3" />{entry.location}
                      </div>
                    )}
                    {entry.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{entry.description}</p>
                    )}
                    {entry.image_urls && entry.image_urls.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                        {entry.image_urls.map((url) => (
                          <div key={url} className="aspect-square overflow-hidden rounded-xl border border-border/80 bg-muted">
                            <img src={url} alt="Journal spot" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground/60">
                      {new Date(entry.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="opacity-0 group-hover:opacity-100 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
