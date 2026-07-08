import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { MapPin, Star, Calendar, ArrowLeft, Globe, User, BookOpen, Quote } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { getHostInitials } from "@/lib/tour-utils"

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
  bio: string | null
  location: string | null
  languages: string[]
  created_at: string
}

interface JournalPost {
  id: string
  title: string
  content: string
  description?: string
  location: string | null
  image_urls: string[]
  created_at: string
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  tour?: { title: string }
}

export default function TravelerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [journals, setJournals] = useState<JournalPost[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function loadData() {
      setLoading(true)
      try {
        // 1. Fetch profile
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, bio, location, languages, created_at")
          .eq("id", id)
          .maybeSingle()

        if (profErr) {
          setError("Traveler profile not found.")
          setLoading(false)
          return
        }
        if (!prof) {
          setError("Traveler profile not found.")
          setLoading(false)
          return
        }
        setProfile(prof as unknown as Profile)

        // 2. Fetch public journal posts
        const { data: jrns, error: jrnErr } = await supabase
          .from("journal_entries")
          .select("id, title, location, description, image_urls, created_at")
          .eq("user_id", id)
          .eq("is_public", true)
          .order("created_at", { ascending: false })

        if (jrnErr) throw jrnErr
        setJournals((jrns ?? []) as unknown as JournalPost[])

        // 3. Fetch reviews written by the traveler (left on tours)
        const { data: revs, error: revErr } = await supabase
          .from("reviews")
          .select(`
            id,
            rating,
            comment,
            created_at,
            tour:tours (
              title
            )
          `)
          .eq("user_id", id)
          .order("created_at", { ascending: false })

        if (revErr) throw revErr
        setReviews((revs ?? []) as unknown as Review[])

      } catch (err) {
        console.error(err)
        setError("Profile not found")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <p className="text-lg font-semibold text-destructive">{error || "Profile not found"}</p>
        <Link to="/dashboard" className="mt-4">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 size-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  const initials = getHostInitials(profile.full_name)

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        {/* Back Button */}
        <Link to="/dashboard" className="mb-6 inline-flex">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 size-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
          {/* Sidebar Info Card */}
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/40 backdrop-blur-md text-center p-6">
              <CardContent className="space-y-4 pt-4 flex flex-col items-center">
                <Avatar className="size-20 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{profile.full_name}</h2>
                  <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                    {profile.role}
                  </span>
                </div>

                <div className="w-full space-y-2 border-t border-border/40 pt-4 text-left text-xs text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5 text-teal shrink-0" />
                    <span>Speaks: {profile.languages.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                    <span>Member since {new Date(profile.created_at).getFullYear()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Profile Tabs Content */}
          <div className="space-y-6">
            {/* Bio Section */}
            <Card className="border-border/60 bg-card/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4 text-primary" /> About {profile.full_name.split(" ")[0]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {profile.bio || "This traveler hasn't written a bio yet."}
                </p>
              </CardContent>
            </Card>

            {/* Public Journal Entries */}
            <Card className="border-border/60 bg-card/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 text-primary" /> Travel Journal Posts ({journals.length})
                </CardTitle>
                <CardDescription>Public stories shared by this traveler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {journals.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No public journal posts yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {journals.map((post) => (
                      <div key={post.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                        <h4 className="font-bold text-foreground text-sm truncate">{post.title}</h4>
                        {post.location && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="size-3 text-primary" />
                            <span>{post.location}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {post.description || post.content}
                        </p>
                        <div className="text-[10px] text-muted-foreground pt-1">
                          {new Date(post.created_at).toLocaleDateString("en-KE")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guest Reviews */}
            <Card className="border-border/60 bg-card/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Quote className="size-4 text-teal" /> Reviews Left as a Guest ({reviews.length})
                </CardTitle>
                <CardDescription>Feedback this traveler submitted for hosted experiences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No reviews submitted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground text-xs">
                            {review.tour?.title || "Hosted Tour"}
                          </h4>
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="size-3 fill-primary text-primary" />
                            <span className="font-semibold">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic mt-2">
                          "{review.comment || "No written review comments"}"
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          Reviewed on {new Date(review.created_at).toLocaleDateString("en-KE")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
