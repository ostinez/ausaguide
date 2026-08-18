import { useEffect, useState } from "react"
import { Sparkles, ExternalLink, ShieldCheck, Play, Eye, Heart } from "lucide-react"

export function TikTokWidget() {
  const [activeTab, setActiveTab] = useState<"profile" | "stories">("profile")

  useEffect(() => {
    // Dynamically inject official TikTok embed script if not already present
    const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
    if (!existingScript) {
      const script = document.createElement("script")
      script.src = "https://www.tiktok.com/embed.js"
      script.async = true
      document.body.appendChild(script)
    } else {
      // Trigger TikTok embed parser if window.tiktokEmbed exists
      if ((window as any).tiktokEmbed?.load) {
        (window as any).tiktokEmbed.load()
      }
    }
  }, [activeTab])

  return (
    <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-card/50 to-background border-t border-border/40 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-[140px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="size-3.5 text-primary" />
            <span>🎬 Real Stories · Real Travelers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
            We expose the scams so you don't fall for them.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Follow <strong className="text-foreground">@ausaguide</strong> on TikTok for weekly Kenya travel insights, scam warnings, and verified local guide breakdowns.
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex p-1 rounded-full bg-card border border-border/80 shadow-md mt-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🎵 Official TikTok Profile
            </button>
            <button
              onClick={() => setActiveTab("stories")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "stories"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🛡️ Featured Scam Breakdowns
            </button>
          </div>
        </div>

        {/* Tab 1: Official TikTok Profile Embed */}
        {activeTab === "profile" && (
          <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
            <div className="w-full max-w-[620px] rounded-3xl overflow-hidden p-2 sm:p-4 bg-card/80 border border-border/70 shadow-2xl backdrop-blur-md flex justify-center">
              <blockquote
                className="tiktok-embed"
                cite="https://www.tiktok.com/@ausaguide"
                data-unique-id="ausaguide"
                data-type="profile"
                style={{
                  maxWidth: "605px",
                  minWidth: "300px",
                  width: "100%",
                  margin: "0 auto",
                }}
              >
                <section>
                  <a
                    target="_blank"
                    href="https://www.tiktok.com/@ausaguide"
                    rel="noopener noreferrer"
                    className="text-primary font-bold hover:underline"
                  >
                    @ausaguide on TikTok
                  </a>
                </section>
              </blockquote>
            </div>

            {/* Follow Button */}
            <div className="text-center pt-2">
              <a
                href="https://www.tiktok.com/@ausaguide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-black hover:bg-neutral-900 text-white rounded-2xl font-bold text-sm sm:text-base transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] border border-white/20 min-h-[48px]"
              >
                <span>🎵 Follow @ausaguide on TikTok</span>
                <ExternalLink className="size-4 text-white/80" />
              </a>
              <p className="text-xs text-muted-foreground mt-3">
                See real travel stories, scam warnings, and verified Kenya insights
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Featured Scam Breakdowns */}
        {activeTab === "stories" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in duration-300">
            {[
              {
                title: "Maasai Mara Fake Safari Scam Exposed",
                tagline: "Unlicensed agents charging $900 for non-existent permits.",
                category: "Scam Warning",
                views: "142.8K",
                likes: "18.4K",
                img: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
                badge: "bg-red-500/90",
              },
              {
                title: "$300 Airport Taxi Extortion vs Verified Pickup",
                tagline: "How unregistered arrival touts trap tourists at JKIA.",
                category: "Safety Guide",
                views: "98.3K",
                likes: "12.1K",
                img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
                badge: "bg-amber-500/90 text-black",
              },
              {
                title: "Virtual Recon: Saved $1,200 on Mombasa Villa",
                tagline: "15-minute live camera walk exposed noisy construction.",
                category: "Reconnaissance",
                views: "215.4K",
                likes: "29.7K",
                img: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
                badge: "bg-primary/90",
              },
              {
                title: "Secret Food Alleys & Hidden Coffee Co-ops",
                tagline: "What guidebooks won't tell you about downtown Nairobi.",
                category: "Local Tip",
                views: "76.2K",
                likes: "9.8K",
                img: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
                badge: "bg-emerald-500/90",
              },
            ].map((story, i) => (
              <a
                key={i}
                href="https://www.tiktok.com/@ausaguide"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[9/16] rounded-3xl overflow-hidden border border-border/70 bg-card shadow-xl hover:border-primary/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block"
              >
                <img
                  src={story.img}
                  alt={story.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${story.badge}`}>
                    {story.category}
                  </span>
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-[10px] text-white">
                    <Eye className="size-3 text-white/70" />
                    <span>{story.views}</span>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:bg-primary transition-all">
                    <Play className="size-5 fill-white ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-4 space-y-1.5 z-10">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <ShieldCheck className="size-3.5" />
                    <span>Ausaguide Scam Defense</span>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-teal-300">
                    {story.title}
                  </h3>
                  <p className="text-xs text-white/70 line-clamp-2">
                    {story.tagline}
                  </p>
                  <div className="pt-1 text-[10px] text-white/60 flex items-center gap-1">
                    <Heart className="size-3 text-red-400 fill-red-400" />
                    <span>{story.likes}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
