import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { TextType } from "@/components/ui/TextType"
import { DriftWall } from "@/components/ui/DriftWall"
import { useWallItems } from "@/hooks/useWallItems"

export function HeroGlobe() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  )

  const sectionRef = useRef<HTMLElement>(null)
  const [isInViewport, setIsInViewport] = useState(true)

  // Fetch real tours & community posts from Supabase
  const { items: wallItems } = useWallItems()

  // Track responsive screen size for DriftWall props
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

  const columns = isMobile ? 3 : isTablet ? 4 : 5
  const tileWidth = isMobile ? 150 : isTablet ? 180 : 205
  const tileHeight = isMobile ? 100 : isTablet ? 118 : 132
  const gap = isMobile ? 12 : 16

  // Intersection observer for performance
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting)
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.01,
      }
    )

    observer.observe(section)
    return () => {
      if (section) observer.unobserve(section)
    }
  }, [])

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) navigate(`/tours?search=${encodeURIComponent(trimmed)}`)
  }

  const isSearchActive = searchExpanded || isFocused || query.trim().length > 0

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#06363D] w-full"
      style={{ height: isMobile ? "82svh" : "92svh" }}
    >
      {/* Background DriftWall Layer (z-0) */}
      <div className="absolute inset-0 z-0">
        {isInViewport && (
          <DriftWall
            items={wallItems}
            columns={columns}
            tileWidth={tileWidth}
            tileHeight={tileHeight}
            gap={gap}
            radius={14}
            grayscale={true}
            dim={0.55}
            overlayColor="#0D6F73"
            speed={isMobile ? 30 : 38}
            backgroundColor="#06363D"
            fade={true}
          />
        )}
      </div>

      {/* Radial vignette overlay for high contrast readability of foreground text */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(6, 54, 61, 0.72) 0%, rgba(6, 54, 61, 0.88) 55%, rgba(6, 54, 61, 0.98) 100%)",
        }}
      />

      {/* Foreground Hero Content (z-20) */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between items-center px-4 py-8 pointer-events-none">
        {/* Top spacer for navbar */}
        <div className="h-16" />

        {/* Center Tagline / Title */}
        <div className="max-w-2xl text-center space-y-4 pointer-events-auto my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-semibold text-white/90 shadow-sm animate-in fade-in duration-500">
            <span className="size-2 rounded-full bg-[#34e0a1] animate-ping" />
            <span>Live Kenyan Experiences & Authentic Local Hosts</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-md">
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
              className="text-xs sm:text-sm md:text-base font-medium text-white/85 select-none drop-shadow-sm"
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
                  ? "w-[300px] sm:w-[360px] px-4 h-13 border-[#0D6F73]/80 ring-2 ring-[#0D6F73]/30"
                  : isMobile
                  ? "w-13 h-13 justify-center px-0 hover:border-white/40 hover:bg-black/60"
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
        </div>

        {/* Bottom Subtitle / Scroll Prompt */}
        <div className="flex flex-col items-center gap-1 text-center pointer-events-auto pb-4 select-none">
          <p className="text-white/70 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            Your window into authentic Kenya
          </p>
          {isMobile && (
            <div className="flex items-center gap-1 mt-2 text-[10px] uppercase tracking-widest text-[#34e0a1]/90 animate-bounce">
              <span>Scroll to explore</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
