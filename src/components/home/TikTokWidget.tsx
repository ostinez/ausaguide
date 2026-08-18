import { useEffect } from "react"

export function TikTokWidget() {
  useEffect(() => {
    // Load TikTok embed script if not already loaded
    if (!document.querySelector('script[src="https://www.tiktok.com/embed.js"]')) {
      const script = document.createElement("script")
      script.src = "https://www.tiktok.com/embed.js"
      script.async = true
      document.body.appendChild(script)
    } else if ((window as any).tiktokEmbed?.load) {
      (window as any).tiktokEmbed.load()
    }
  }, [])

  return (
    <section className="py-14 sm:py-16 px-4 bg-card/40 border-t border-border/40 overflow-hidden relative">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          Real Stories. Real Travelers.
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-2 mb-8 max-w-md mx-auto">
          Follow us for real travel stories, scam warnings, and Kenya insights.
        </p>

        {/* TikTok Profile Embed */}
        <div className="flex justify-center w-full">
          <div className="w-full max-w-[605px] min-w-[280px]">
            <blockquote
              className="tiktok-embed"
              cite="https://www.tiktok.com/@ausaguide"
              data-unique-id="ausaguide"
              data-type="profile"
              style={{
                maxWidth: "605px",
                minWidth: "280px",
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
                  @ausaguide
                </a>
              </section>
            </blockquote>
          </div>
        </div>

        {/* Follow Button */}
        <div className="mt-7">
          <a
            href="https://www.tiktok.com/@ausaguide"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-black hover:bg-neutral-900 text-white rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-white/20 min-h-[44px]"
          >
            🎵 Follow @ausaguide on TikTok
          </a>
        </div>
      </div>
    </section>
  )
}
