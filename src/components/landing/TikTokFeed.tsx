import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  ShieldCheck, 
  Eye, 
  Heart, 
  ExternalLink, 
  Sparkles, 
  X, 
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface TikTokStory {
  id: string
  title: string
  tagline: string
  category: "Scam Warning" | "Reconnaissance" | "Local Tip" | "Safety Guide"
  views: string
  likes: string
  duration: string
  thumbnailUrl: string
  videoUrl?: string
  lesson: string
  hostName: string
}

const STORIES: TikTokStory[] = [
  {
    id: "story-1",
    title: "Maasai Mara Fake Safari Scam Exposed",
    tagline: "Unlicensed agents charging $900 for non-existent park permits.",
    category: "Scam Warning",
    views: "142.8K",
    likes: "18.4K",
    duration: "0:58",
    thumbnailUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    lesson: "Always verify TRA licenses and book directly with certified local guides on Ausaguide.",
    hostName: "Austin & Team Ausaguide",
  },
  {
    id: "story-2",
    title: "$300 Airport Taxi Extortion vs Verified Pickup",
    tagline: "How unregistered arrival touts trap first-time tourists at JKIA.",
    category: "Safety Guide",
    views: "98.3K",
    likes: "12.1K",
    duration: "1:14",
    thumbnailUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    lesson: "Pre-arranged vetted guide pickups protect your budget and safety before leaving the gate.",
    hostName: "David K. · Nairobi Guide",
  },
  {
    id: "story-3",
    title: "Virtual Recon: Saved $1,200 on Mombasa Villa",
    tagline: "15-minute live camera walk exposed noisy construction next door.",
    category: "Reconnaissance",
    views: "215.4K",
    likes: "29.7K",
    duration: "0:45",
    thumbnailUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
    lesson: "Try Before You Fly: A 15-min virtual scout lets you inspect real conditions in real time.",
    hostName: "Sarah M. · Coastal Specialist",
  },
  {
    id: "story-4",
    title: "Secret Food Alleys & Hidden Coffee Co-ops",
    tagline: "What guidebooks won't tell you about downtown Nairobi markets.",
    category: "Local Tip",
    views: "76.2K",
    likes: "9.8K",
    duration: "1:02",
    thumbnailUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    lesson: "Connect directly with local food artisans for authentic tastings at true local prices.",
    hostName: "Mercy W. · Cultural Host",
  },
]

export function TikTokFeed() {
  const [activeStory, setActiveStory] = useState<TikTokStory | null>(null)

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-card/40 to-background border-t border-border/40 overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="size-3.5 text-primary" />
            <span>Real Stories · Real Travelers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
            We expose the scams so you travel <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-400 to-emerald-400">with absolute confidence</span>.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            From travel horror stories to Try-Before-You-Fly virtual reconnaissance — watch how Ausaguide's vetted local guides protect your journey and budget across Kenya.
          </p>
        </div>

        {/* Story Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STORIES.map((story, idx) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              onClick={() => setActiveStory(story)}
              className="group relative aspect-[9/16] rounded-3xl overflow-hidden border border-border/60 bg-card shadow-xl cursor-pointer hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-1.5"
            >
              {/* Background Thumbnail */}
              <img
                src={story.thumbnailUrl}
                alt={story.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out brightness-[0.85] group-hover:brightness-95"
                loading="lazy"
              />

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60" />

              {/* Top Bar: Category & Views */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                  story.category === "Scam Warning"
                    ? "bg-red-500/80 text-white"
                    : story.category === "Reconnaissance"
                    ? "bg-primary/80 text-white"
                    : "bg-amber-500/80 text-black font-bold"
                }`}>
                  {story.category}
                </span>

                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold text-white/90">
                  <Eye className="size-3 text-white/70" />
                  <span>{story.views}</span>
                </div>
              </div>

              {/* Center Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="size-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                  <Play className="size-6 fill-white ml-0.5" />
                </div>
              </div>

              {/* Bottom Content */}
              <div className="absolute bottom-0 inset-x-0 p-4 space-y-2 z-10">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                  <ShieldCheck className="size-3.5 shrink-0" />
                  <span className="truncate">{story.hostName}</span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-teal-300 transition-colors">
                  {story.title}
                </h3>

                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                  {story.tagline}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[10px] text-white/60">
                  <span className="flex items-center gap-1">
                    <Heart className="size-3 text-red-400 fill-red-400/50" />
                    {story.likes}
                  </span>
                  <span className="font-mono">{story.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl border border-primary/20 bg-gradient-to-r from-card via-primary/5 to-card backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 border border-white/20 shadow-md">
              <span className="font-black text-lg">TT</span>
            </div>
            <div>
              <p className="font-bold text-foreground text-base">Watch weekly Kenya travel breakdowns on TikTok</p>
              <p className="text-xs text-muted-foreground mt-0.5">Scam alerts, live virtual tour clips, and vetted local guides.</p>
            </div>
          </div>

          <a
            href="https://www.tiktok.com/@ausaguide"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-black hover:bg-neutral-900 text-white font-bold text-xs tracking-wide shadow-lg hover:shadow-xl transition-all active:scale-[0.98] border border-white/15 shrink-0"
          >
            <span>Follow @ausaguide on TikTok</span>
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      {/* Story Video Modal Preview */}
      <AnimatePresence>
        {activeStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5"
            >
              <button
                onClick={() => setActiveStory(null)}
                className="absolute top-4 right-4 size-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition"
              >
                <X className="size-4" />
              </button>

              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-border">
                <img
                  src={activeStory.thumbnailUrl}
                  alt={activeStory.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <a
                    href="https://www.tiktok.com/@ausaguide"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:scale-105 transition"
                  >
                    <Play className="size-6 fill-white ml-0.5" />
                  </a>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono">
                  {activeStory.duration}
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                  {activeStory.category}
                </div>
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {activeStory.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeStory.tagline}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  How Ausaguide Solves This
                </p>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {activeStory.lesson}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href="https://www.tiktok.com/@ausaguide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-center font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <span>Watch on TikTok</span>
                  <ExternalLink className="size-3.5" />
                </a>
                <Button
                  variant="outline"
                  onClick={() => setActiveStory(null)}
                  className="rounded-full text-xs"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
