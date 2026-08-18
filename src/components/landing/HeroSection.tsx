import {
  useState,
  type FormEvent,
} from "react"
import { useNavigate, Link } from "react-router-dom"
import { Search, Compass, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { TextType } from "@/components/ui/TextType"
import { RippleGrid } from "@/components/ui/RippleGrid"

export function HeroSection() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) navigate(`/tours?search=${encodeURIComponent(trimmed)}`)
  }

  const isSearchActive = searchExpanded || isFocused || query.trim().length > 0

  return (
    <section className="relative overflow-hidden bg-[#06363D] w-full min-h-[580px] sm:min-h-[640px] md:min-h-[700px] flex flex-col justify-between items-center px-4 py-8 select-none">
      {/* Background Interactive RippleGrid (WebGL) */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <RippleGrid
          enableRainbow={false}
          gridColor="#0D6F73"
          rippleIntensity={0.06}
          gridSize={12}
          gridThickness={18}
          fadeDistance={1.8}
          vignetteStrength={2.5}
          glowIntensity={0.15}
          opacity={0.85}
          mouseInteraction={true}
          mouseInteractionRadius={1.5}
        />
      </div>

      {/* Subtle radial depth gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-5"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(6, 54, 61, 0.4) 0%, rgba(6, 54, 61, 0.75) 70%, rgba(6, 54, 61, 0.95) 100%)",
        }}
      />

      {/* Top spacer for navbar */}
      <div className="h-14 relative z-10" />

      {/* Center Tagline, Title, Typing Animation, Search & CTAs */}
      <div className="relative z-10 max-w-3xl text-center space-y-6 pointer-events-auto my-auto py-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-semibold text-white/95 shadow-sm animate-in fade-in duration-500">
          <span className="size-2 rounded-full bg-[#34e0a1] animate-ping" />
          <span>Live Kenyan Experiences & Verified Local Hosts</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-lg">
          Be a Local.{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#34e0a1] via-[#0D6F73] to-[#80e5e9]">
            Share Your World.
          </span>
        </h1>

        <div className="flex items-center justify-center min-h-[32px]">
          <TextType
            text={[
              "Discover hidden gems with verified Maasai guides.",
              "Live street food walks through Nairobi's culture hubs.",
              "Explore Diani, Lamu, and Serengeti off the beaten path.",
            ]}
            typingSpeed={50}
            pauseDuration={2400}
            deletingSpeed={25}
            loop={true}
            textColors={["#ffffff", "#34e0a1", "#80e5e9"]}
            showCursor={true}
            cursorCharacter="|"
            className="text-xs sm:text-sm md:text-base font-medium text-white/90 drop-shadow-sm"
          />
        </div>

        {/* Expandable Search Bar */}
        <form
          onSubmit={handleSearch}
          className="relative w-full flex justify-center pt-2 pb-1 items-center"
        >
          <div
            className={cn(
              "flex items-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out overflow-hidden cursor-pointer",
              isSearchActive
                ? "w-[300px] sm:w-[380px] px-4 h-13 border-[#0D6F73]/80 ring-2 ring-[#0D6F73]/30 bg-black/60"
                : "w-13 h-13 justify-center px-0 hover:border-white/40 hover:bg-black/60"
            )}
            onMouseEnter={() => setSearchExpanded(true)}
            onMouseLeave={() => setSearchExpanded(false)}
            onClick={() => {
              document.getElementById("hero-search-input")?.focus()
            }}
          >
            <Search
              className={cn(
                "size-5 text-white/80 shrink-0",
                isSearchActive ? "mr-3 text-[#34e0a1]" : ""
              )}
            />
            <input
              id="hero-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search safaris, food walks, cultural tours..."
              className={cn(
                "bg-transparent text-white placeholder:text-white/50 focus:outline-none text-sm transition-all duration-300 ease-in-out border-none p-0 focus:ring-0",
                isSearchActive ? "w-full opacity-100" : "w-0 opacity-0 pointer-events-none"
              )}
            />
          </div>
        </form>

        {/* Quick Action CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/tours"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#0D6F73] to-[#06363D] hover:from-[#0B3037] hover:to-[#0D6F73] text-white text-xs sm:text-sm font-bold shadow-lg border border-white/20 transition-all duration-200 transform hover:scale-105"
          >
            <Compass className="size-4" />
            <span>Explore Tours</span>
          </Link>
          <Link
            to="/onboarding?become-host=true"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold backdrop-blur-md border border-white/20 transition-all duration-200"
          >
            <Users className="size-4" />
            <span>Become a Host</span>
          </Link>
        </div>
      </div>

      {/* Bottom Scroll Prompt */}
      <div className="relative z-10 flex flex-col items-center gap-1 text-center pb-2 select-none">
        <p className="text-white/70 text-xs sm:text-sm font-semibold tracking-wide uppercase">
          Your window into authentic Kenya
        </p>
      </div>
    </section>
  )
}

export default HeroSection
