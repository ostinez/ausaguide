import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import Globe from "react-globe.gl"

const PURPLE = "#7F5AF0"
const TEAL = "#2CB67D"

// 1x1 dark pixel data URI to serve as a 0KB flat dark texture on mobile
const DARK_TEXTURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

const COUNTRIES_GEOJSON_URL =
  "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson"

interface CountryProperties {
  ADMIN: string
  ISO_A2: string
  POP_EST?: number
}

interface CountryFeature {
  type: string
  properties: CountryProperties
  geometry: unknown
}

interface CountriesGeoJSON {
  features: CountryFeature[]
}

export default function GlobeVisual() {
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
        console.warn("[GlobeVisual] IP country detection failed, trying navigator language fallback:", err.message)
        try {
          const navLang = navigator.language
          const code = navLang?.split("-")[1]?.toUpperCase()
          if (code && code.length === 2) {
            setUserCountryCode(code)
          } else {
            throw new Error("Invalid or missing country code in navigator.language")
          }
        } catch (fallbackErr) {
          console.warn("[GlobeVisual] Fallbacks failed, defaulting to KE:", (fallbackErr as Error).message)
          setUserCountryCode("KE")
        }
      })
  }, [])

  // Fetch GeoJSON country polygons with optimization for mobile
  useEffect(() => {
    const controller = new AbortController()

    fetch(COUNTRIES_GEOJSON_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<CountriesGeoJSON>
      })
      .then((data) => {
        // Filter out Antarctica
        let features = data.features.filter((f) => f.properties.ISO_A2 !== "AQ")
        
        // Reduce polygon count on mobile
        if (isMobile) {
          features = features.filter((f) => {
            const code = f.properties.ISO_A2
            if (code === "KE") return true
            // Filter out minor territories to reduce vertex load
            const pop = f.properties.POP_EST || 0
            return pop > 5000000
          })
        }
        setCountries(features)
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("[GlobeVisual] GeoJSON fetch failed:", err.message)
        }
      })

    return () => controller.abort()
  }, [isMobile])

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
    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafId)
    }
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
    <div ref={containerRef} className="flex h-full w-full items-center justify-center" style={{ touchAction: "pan-y" }}>
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
          // Mobile Texture size optimization: flat base color, no heavy image texture download!
          globeImageUrl={isMobile ? DARK_TEXTURE : "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"}
          showGlobe={true}
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
            powerPreference: "high-performance",
          }}
        />
      </div>
    </div>
  )
}
