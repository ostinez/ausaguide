import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Compass, ChevronRight, X, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PinnedChatContextProps {
  contextType?: string | null
  contextId?: string | null
  tourName?: string | null
  bookingPrice?: number | null
  currency?: string | null
}

export default function PinnedChatContext({
  contextType,
  contextId,
  tourName,
  bookingPrice,
  currency = "KES",
}: PinnedChatContextProps) {
  const [tourData, setTourData] = useState<{ id: string; title: string; price: number; currency: string; location_name?: string; image_url?: string } | null>(null)
  const [postData, setPostData] = useState<{ id: string; content: string; image_url?: string; author_name?: string; author_avatar?: string } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let active = true

    if (contextType === "tour") {
      if (contextId) {
        supabase
          .from("tours")
          .select("id, title, price, currency, location_name, images")
          .eq("id", contextId)
          .maybeSingle()
          .then(({ data }) => {
            if (active && data) {
              setTourData({
                id: data.id,
                title: data.title,
                price: data.price,
                currency: data.currency || "KES",
                location_name: data.location_name,
                image_url: data.images?.[0] || undefined,
              })
            }
          })
      } else if (tourName) {
        setTourData({
          id: "",
          title: tourName,
          price: bookingPrice || 0,
          currency: currency || "KES",
        })
      }
    } else if (contextType === "post" && contextId) {
      supabase
        .from("posts")
        .select("id, content, image_url, image_urls, author:profiles(full_name, avatar_url)")
        .eq("id", contextId)
        .maybeSingle()
        .then(({ data }) => {
          if (active && data) {
            const author = Array.isArray(data.author) ? data.author[0] : data.author
            const img = (data.image_urls && data.image_urls[0]) || data.image_url
            setPostData({
              id: data.id,
              content: data.content,
              image_url: img,
              author_name: author?.full_name || "Community Member",
              author_avatar: author?.avatar_url,
            })
          }
        })
    }

    return () => {
      active = false
    }
  }, [contextType, contextId, tourName, bookingPrice, currency])

  if (dismissed) return null

  // Tour Pinned Card
  if (contextType === "tour" && (tourData || tourName)) {
    const title = tourData?.title || tourName
    const price = tourData?.price ?? bookingPrice
    const curr = tourData?.currency || currency || "KES"

    return (
      <div className="px-4 py-2 bg-gradient-to-r from-primary/10 via-card to-card border-b border-primary/20 flex items-center justify-between gap-3 text-left animate-in fade-in duration-150 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 text-primary">
            <Compass className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Inquiring About Tour
              </span>
              {price ? (
                <span className="text-[10px] font-black text-foreground">
                  · {curr} {Number(price).toLocaleString()}
                </span>
              ) : null}
            </div>
            <p className="text-xs font-semibold text-foreground truncate max-w-sm">
              {title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {tourData?.id ? (
            <Link
              to={`/tours/${tourData.id}`}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-primary/10"
            >
              <span>View Tour</span>
              <ChevronRight className="size-3" />
            </Link>
          ) : null}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Post Pinned Card
  if (contextType === "post" && postData) {
    return (
      <div className="px-4 py-2 bg-gradient-to-r from-blue-500/10 via-card to-card border-b border-blue-500/20 flex items-center justify-between gap-3 text-left animate-in fade-in duration-150 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="size-8 shrink-0 border border-border">
            <AvatarImage src={postData.author_avatar} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {postData.author_name?.slice(0, 2).toUpperCase() || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Shared Post
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                by {postData.author_name}
              </span>
            </div>
            <p className="text-xs text-foreground/90 truncate max-w-md line-clamp-1 italic">
              "{postData.content.slice(0, 100)}{postData.content.length > 100 ? "…" : ""}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/feed"
            className="text-[11px] font-semibold text-blue-400 hover:underline flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-500/10"
          >
            <span>View Post</span>
            <ExternalLink className="size-3" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return null
}
