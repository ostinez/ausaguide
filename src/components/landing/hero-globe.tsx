import {
  useCallback,
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


// Lazy-load the heavy WebGL globe so it never blocks initial render
const Globe = lazy(() => import("react-globe.gl"))

const PURPLE = "#7F5AF0"
const TEAL = "#2CB67D"

// Use explicit HTTPS to avoid protocol-relative URL issues
const COUNTRIES_GEOJSON_URL =
  "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson"

interface CountryProperties {
  ADMIN: string
  ISO_A2: string
}

interface CountryFeature {
  type: string
  properties: CountryProperties
  geometry: unknown
}

interface CountriesGeoJSON {
  features: CountryFeature[]
}

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
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: "80%",
          maxWidth: 700,
          aspectRatio: "1",
          background: `radial-gradient(ellipse at center, ${PURPLE}22 0%, transparent 70%)`,
          border: `1px solid ${PURPLE}33`,
        }}
      >
        <svg viewBox="0 0 200 200" width="60%" height="60%" opacity={0.3}>
          <circle cx="100" cy="100" r="90" fill="none" stroke={PURPLE} strokeWidth="1" />
          <ellipse cx="100" cy="100" rx="90" ry="35" fill="none" stroke={PURPLE} strokeWidth="0.5" />
          <ellipse cx="100" cy="100" rx="60" ry="90" fill="none" stroke={PURPLE} strokeWidth="0.5" />
          <ellipse cx="100" cy="100" rx="25" ry="90" fill="none" stroke={PURPLE} strokeWidth="0.5" />
          <line x1="10" y1="100" x2="190" y2="100" stroke={PURPLE} strokeWidth="0.5" />
          <line x1="100" y1="10" x2="100" y2="190" stroke={PURPLE} strokeWidth="0.5" />
        </svg>
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

// ── WebGL Globe ──────────────────────────────────────────────────────────────

function GlobeVisual() {
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null)
  const [userCountryCode, setUserCountryCode] = useState<string | null>(null)
  const [globeSize, setGlobeSize] = useState(600)
  const isMobile = window.innerWidth < 768

  // Detect user's country code via IP
  useEffect(() => {
    fetch("https://ipinfo.io/json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (data && data.country) {
          const code = data.country.toUpperCase()
          setUserCountryCode(code)
        } else {
          throw new Error("No country returned in ipinfo data")
        }
      })
      .catch((err) => {
        console.warn("[HeroGlobe] IP country detection failed, trying navigator language fallback:", err.message)
        try {
          const navLang = navigator.language
          const code = navLang?.split("-")[1]?.toUpperCase()
          if (code && code.length === 2) {
            console.log("[HeroGlobe] Detected user country via navigator fallback:", code)
            setUserCountryCode(code)
          } else {
            throw new Error("Invalid or missing country code in navigator.language")
          }
        } catch (fallbackErr) {
          console.warn("[HeroGlobe] Fallbacks failed, defaulting to KE:", (fallbackErr as Error).message)
          setUserCountryCode("KE")
        }
      })
  }, [])

  // Fetch GeoJSON country polygons
  useEffect(() => {
    const controller = new AbortController()

    fetch(COUNTRIES_GEOJSON_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<CountriesGeoJSON>
      })
      .then((data) => {
        // Filter out Antarctica
        setCountries(data.features.filter((f) => f.properties.ISO_A2 !== "AQ"))
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("[HeroGlobe] GeoJSON fetch failed:", err.message)
        }
      })

    return () => controller.abort()
  }, [])

  // Measure container and set globe size (debounced)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let rafId: number
    const measure = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()
        const size = Math.max(400, Math.min(rect.width, rect.height, 900))
        setGlobeSize(size)
      })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => { ro.disconnect(); cancelAnimationFrame(rafId) }
  }, [])

  // Start auto-rotate once the globe is ready
  const handleGlobeReady = useCallback(() => {
    const controls = globeRef.current?.controls?.()
    if (!controls) return
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.1
    controls.enableZoom = false
    // Start centred on Africa
    globeRef.current?.pointOfView?.({ lat: -1, lng: 37, altitude: 1.8 }, 0)
  }, [])

  const handlePolygonClick = useCallback((polygon: any) => {
    const countryName = polygon?.properties?.name || polygon?.properties?.ADMIN
    if (countryName) {
      navigate(`/map?country=${encodeURIComponent(countryName)}`)
    } else {
      navigate("/map")
    }
  }, [navigate])

  const handlePolygonHover = useCallback((polygon: object | null) => {
    setHoveredCountry(polygon as CountryFeature | null)
  }, [])

  const isHovered = useCallback(
    (f: CountryFeature) => {
      return hoveredCountry && f.properties.ISO_A2 === hoveredCountry.properties.ISO_A2
    },
    [hoveredCountry]
  )

  const isOwn = useCallback(
    (f: CountryFeature) => {
      return userCountryCode && f.properties.ISO_A2 === userCountryCode
    },
    [userCountryCode]
  )

  const polygonAltitude = useCallback(
    (f: object) => {
      const feat = f as CountryFeature
      if (isOwn(feat) && isHovered(feat)) return 0.08
      if (isHovered(feat)) return 0.06
      if (isOwn(feat)) return 0.02
      return 0.01
    },
    [isOwn, isHovered]
  )

  const polygonCapColor = useCallback(
    (f: object) => {
      const feat = f as CountryFeature
      if (isOwn(feat) && isHovered(feat)) return `${TEAL}E6` // 90% opacity
      if (isHovered(feat)) return `${PURPLE}CC` // 80% opacity
      if (isOwn(feat)) return `${TEAL}80` // 50% opacity
      return `${PURPLE}55`
    },
    [isOwn, isHovered]
  )

  const polygonSideColor = useCallback(
    (f: object) => {
      const feat = f as CountryFeature
      if (isOwn(feat) || (isOwn(feat) && isHovered(feat))) return `${TEAL}33`
      return `${PURPLE}22`
    },
    [isOwn, isHovered]
  )

  const polygonStrokeColor = useCallback(
    (f: object) => {
      const feat = f as CountryFeature
      if (isOwn(feat) || (isOwn(feat) && isHovered(feat))) return TEAL
      if (isHovered(feat)) return PURPLE
      return `${PURPLE}99`
    },
    [isOwn, isHovered]
  )

  const polygonLabel = useCallback((f: object) => {
    const { ADMIN } = (f as CountryFeature).properties
    return `<div style="background:#16161A;border:1px solid #7F5AF0;border-radius:8px;padding:8px 12px;color:#FFFFFE;font-family:Inter,sans-serif;font-size:13px;font-weight:500;pointer-events:none;">${ADMIN}</div>`
  }, [])

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center">
      <div className="relative" style={{ width: globeSize, height: globeSize }}>
        {/* Vignette overlay to blend edges into background */}
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, #16161A 80%)",
          }}
        />
        <Globe
          ref={globeRef}
          width={globeSize}
          height={globeSize}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
          bumpImageUrl={isMobile ? undefined : "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"}
          lineHoverPrecision={0}
          polygonsData={countries}
          polygonAltitude={polygonAltitude}
          polygonCapColor={polygonCapColor}
          polygonSideColor={polygonSideColor}
          polygonStrokeColor={polygonStrokeColor}
          polygonLabel={polygonLabel}
          onPolygonHover={handlePolygonHover}
          onPolygonClick={handlePolygonClick}
          polygonsTransitionDuration={isMobile ? 0 : 300}
          onGlobeReady={handleGlobeReady}
          atmosphereColor={PURPLE}
          atmosphereAltitude={isMobile ? 0.08 : 0.15}
          rendererConfig={{
            precision: isMobile ? "lowp" : "mediump",
            antialias: false,
            powerPreference: isMobile ? "low-power" : "high-performance"
          }}
        />
      </div>
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

  // Intersection Observer to track if the hero section is visible in the viewport
  const sectionRef = useRef<HTMLElement>(null)
  const [isInViewport, setIsInViewport] = useState(true)

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
    <section ref={sectionRef} className="relative overflow-hidden bg-[#16161A] w-full" style={{ height: "100svh" }}>
      {/* Layer 3: Magic Rings background (z-[1]) - Only renders when in viewport to save CPU/GPU */}
      <div className="absolute inset-0 z-[1]">
        {isInViewport && (
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
      {/* On mobile we skip the heavy WebGL globe for performance */}
      <div className="absolute inset-0 z-[2] pointer-events-none flex items-center justify-center">
        <div className="pointer-events-auto w-full h-full">
          {isInViewport ? (
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
      </div>
    </section>
  )
}



