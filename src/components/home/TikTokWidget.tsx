import { Music } from "lucide-react"

const TikTokLogo = () => (
  <svg viewBox="0 0 48 48" fill="none" className="size-10" aria-hidden="true">
    <rect width="48" height="48" rx="12" fill="#010101" />
    <path
      d="M34.1 19.8a10.6 10.6 0 0 1-6.2-2V28a8.4 8.4 0 1 1-8.4-8.4c.3 0 .5 0 .8.02v4.17c-.27-.04-.54-.06-.8-.06a4.27 4.27 0 1 0 4.27 4.27V10h4.1a6.5 6.5 0 0 0 6.2 5.67v4.13Z"
      fill="white"
    />
    <path
      d="M34.1 15.67a10.6 10.6 0 0 1-6.2-2V22a8.4 8.4 0 1 1-8.4-8.4c.3 0 .5 0 .8.02v4.17c-.27-.04-.54-.06-.8-.06a4.27 4.27 0 1 0 4.27 4.27V10h4.1a6.5 6.5 0 0 0 6.2 5.67h.03Z"
      fill="#69C9D0"
    />
    <path
      d="M27.9 21.4V28a8.4 8.4 0 1 1-8.4-8.4c.3 0 .5 0 .8.02v4.17c-.27-.04-.54-.06-.8-.06a4.27 4.27 0 1 0 4.27 4.27V13.8a6.5 6.5 0 0 0 6.2 5.67v4.13a10.62 10.62 0 0 1-6.2-2.2h.13Z"
      fill="#EE1D52"
    />
  </svg>
)

export function TikTokWidget() {
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

        {/* TikTok CTA Card */}
        <div className="flex justify-center w-full mb-8">
          <a
            href="https://www.tiktok.com/@ausaguide"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4 w-full max-w-sm bg-black/80 hover:bg-black border border-white/10 hover:border-white/25 rounded-2xl px-8 py-8 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99]"
          >
            <TikTokLogo />
            <div className="text-center">
              <p className="text-white font-bold text-xl tracking-tight">@ausaguide</p>
              <p className="text-white/60 text-sm mt-1">Real travel. Real Kenya. No fluff.</p>
            </div>
            <div className="flex items-center gap-2 bg-[#EE1D52] hover:bg-[#d41848] text-white text-sm font-bold px-6 py-2.5 rounded-full transition-colors">
              <Music className="size-4" />
              Follow on TikTok
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
