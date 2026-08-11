import {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  Component,
  type ReactNode,
  type FormEvent,
} from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import MagicRings from "@/components/ui/MagicRings"
import { TextType } from "@/components/ui/TextType"


// Lazy-load the optimized WebGL globe visual component so it is completely code-split
const GlobeVisual = lazy(() => import("./GlobeVisual"))

const PURPLE = "#7F5AF0"

// ── Error boundary ───────────────────────────────────────────────────────────

class GlobeErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { crashed: boolean; error: string | null }
> {
  state = { crashed: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { crashed: true, error: error.message }
  }

  render() {
    return this.state.crashed ? this.props.fallback : this.props.children
  }
}

// ── Static SVG fallback ──────────────────────────────────────────────────────

function GlobeFallback() {
  return (
    <div 
      className="flex h-full w-full items-center justify-center select-none animate-in fade-in duration-700"
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="relative flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: "min(85%, 600px)",
          aspectRatio: "1",
          boxShadow: `0 0 80px rgba(127, 90, 240, 0.15)`,
          border: `1px solid rgba(255, 255, 255, 0.08)`,
          background: `rgba(255, 255, 255, 0.02)`,
          backdropFilter: "blur(4px)"
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=600&q=80"
          alt="Ausaguide Earth View"
          loading="lazy"
          className="w-full h-full object-cover rounded-full opacity-50 animate-pulse duration-10000"
          style={{
            mixBlendMode: "lighten",
            filter: "brightness(0.9) contrast(1.1) saturate(0.8)"
          }}
        />
        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            background: "radial-gradient(circle at center, transparent 35%, #16161A 95%)"
          }}
        />
      </div>
    </div>
  )
}

// ── Loading placeholder ──────────────────────────────────────────────────────

function GlobeLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="rounded-full"
        style={{
          width: "min(80%, 700px)",
          aspectRatio: "1",
          background: `radial-gradient(ellipse at center, ${PURPLE}22 0%, transparent 70%)`,
          border: `1px solid ${PURPLE}22`,
          animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        }}
      />
    </div>
  )
}

// ── Public export ────────────────────────────────────────────────────────────

export function HeroGlobe() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hasWebGLSupport, setHasWebGLSupport] = useState(true)

  // Intersection Observer to track if the hero section is visible in the viewport
  const sectionRef = useRef<HTMLElement>(null)
  const [isInViewport, setIsInViewport] = useState(true)

  // Detect WebGL support once
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas")
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      )
      setHasWebGLSupport(support)
    } catch (e) {
      setHasWebGLSupport(false)
    }
  }, [])

  // Track responsive screen size for props
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting)
      },
      {
        root: null,
        rootMargin: "100px", // pre-load / keep alive 100px offset
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
      className="relative overflow-hidden bg-[#16161A] w-full" 
      style={{ height: isMobile ? "80svh" : "100svh" }}
    >
      {/* Layer 3: Magic Rings background (z-[1]) - Only renders when in viewport to save CPU/GPU */}
      <div className="absolute inset-0 z-[1]">
        {isInViewport && !isMobile && (
          <MagicRings
            color="#7F5AF0"
            colorTwo="#2CB67D"
            ringCount={isMobile ? 4 : 6}
            speed={0.5}
            attenuation={10}
            opacity={isMobile ? 0.5 : 0.7}
            followMouse={true}
            mouseInfluence={0.2}
            clickBurst={true}
            blur={0}
            lineThickness={2}
            baseRadius={0.35}
            radiusStep={0.17}
            scaleRate={0.1}
            noiseAmount={0.05}
            rotation={0}
            ringGap={1.5}
            fadeIn={0.7}
            fadeOut={0.5}
            hoverScale={1.2}
            parallax={0.05}
          />
        )}
      </div>

      {/* Subtle radial gradient overlay behind the globe for contrast (z-[1]) */}
      <div 
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: "radial-gradient(circle at center, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 45%, transparent 75%)"
        }}
      />

      {/* Layer 4: Globe centered in the hero area (z-[2]) - Only renders when in viewport */}
      <div className="absolute inset-0 z-[2] pointer-events-none flex items-center justify-center">
        <div className="pointer-events-auto w-full h-full">
          {isInViewport && hasWebGLSupport ? (
            <GlobeErrorBoundary fallback={<GlobeFallback />}>
              <Suspense fallback={<GlobeLoading />}>
                <GlobeVisual />
              </Suspense>
            </GlobeErrorBoundary>
          ) : (
            <GlobeFallback />
          )}
        </div>
      </div>

      {/* Layer 5: Foreground - Bottom (z-20) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 w-full max-w-[640px] px-5 flex flex-col items-center text-center pointer-events-auto gap-3 pb-8 sm:pb-10">
        {/* Typewriter tagline – sits above everything on mobile */}
        <div className="w-full text-left sm:text-left">
          <TextType
            text={["Be a Local.", "Share Your World.", "Explore Kenya live."]}
            typingSpeed={60}
            pauseDuration={2000}
            deletingSpeed={30}
            loop={true}
            textColors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
            showCursor={true}
            cursorCharacter="|"
            className="text-xs sm:text-sm md:text-base font-medium opacity-70 text-white select-none pointer-events-none"
          />
        </div>

        {/* Expandable Search Bar */}
        <form
          onSubmit={handleSearch}
          className="relative w-full flex justify-center py-1 h-14 items-center"
        >
          <div
            className={cn(
              "flex items-center rounded-full border border-border bg-[#16161A]/40 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-in-out overflow-hidden cursor-pointer",
              isSearchActive
                ? "w-[250px] px-4 h-12"
                : isMobile
                  ? "w-14 h-14 justify-center px-0 hover:border-[#7F5AF0]/40"
                  : "w-12 h-12 justify-center px-0 hover:border-[#7F5AF0]/40"
            )}
            onMouseEnter={() => setSearchExpanded(true)}
            onMouseLeave={() => setSearchExpanded(false)}
            onClick={() => {
              document.getElementById("hero-search-input")?.focus()
            }}
          >
            <Search className={cn("size-5 text-white/70 shrink-0", isSearchActive ? "mr-3" : "")} />
            <input
              id="hero-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search tours..."
              className={cn(
                "bg-transparent text-white placeholder:text-white/40 focus:outline-none text-sm transition-all duration-300 ease-in-out border-none p-0 focus:ring-0",
                isSearchActive ? "w-full opacity-100" : "w-0 opacity-0 pointer-events-none"
              )}
            />
          </div>
        </form>
        {/* Subtitles & Tagline */}
        <div className="flex flex-col gap-1 select-none">
          <p className="text-[#2CB67D] text-xs sm:text-sm md:text-base font-bold tracking-wide uppercase">
            your window into their world
          </p>
        </div>
        
        {/* Subtle scroll indicator on mobile */}
        {isMobile && (
          <div className="flex flex-col items-center gap-1 mt-3 text-[10px] uppercase tracking-widest text-[#7F5AF0]/80 animate-bounce">
            <span>Scroll down to explore</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        )}
      </div>
    </section>
  )
}



