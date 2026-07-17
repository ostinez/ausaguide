import { useState, useEffect, useRef } from "react"
import { MapPin, Globe, Loader2, AlertTriangle } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

interface HostMarker {
  id: string
  name: string
  bio: string | null
  location: string | null
  lat: number
  lng: number
  tour?: string
  isLive?: boolean
}

// Fallback map boundary center
const KENYA_BOUNDS = { lat: -1.2921, lng: 36.8219 }

const COUNTRY_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "kenya": { lat: -1.2921, lng: 36.8219, zoom: 6 },
  "uganda": { lat: 1.3733, lng: 32.2903, zoom: 7 },
  "tanzania": { lat: -6.3690, lng: 34.8888, zoom: 6 },
  "rwanda": { lat: -1.9403, lng: 29.8739, zoom: 8.5 },
  "burundi": { lat: -3.3731, lng: 29.9189, zoom: 8.5 },
  "ethiopia": { lat: 9.1450, lng: 40.4897, zoom: 5.5 },
  "somalia": { lat: 5.1521, lng: 46.1996, zoom: 5.5 },
  "united states": { lat: 37.0902, lng: -95.7129, zoom: 4 },
  "united kingdom": { lat: 55.3781, lng: -3.4360, zoom: 5.5 },
  "canada": { lat: 56.1304, lng: -106.3468, zoom: 4 },
  "germany": { lat: 51.1657, lng: 10.4515, zoom: 6 },
  "france": { lat: 46.2276, lng: 2.2137, zoom: 6 },
  "india": { lat: 20.5937, lng: 78.9629, zoom: 5 },
  "australia": { lat: -25.2744, lng: 133.7751, zoom: 4.5 },
  "south africa": { lat: -30.5595, lng: 22.9375, zoom: 5.5 },
}

export default function MapPage() {
  const [searchParams] = useSearchParams()
  const mapRef = useRef<HTMLDivElement>(null)
  const [hosts, setHosts] = useState<HostMarker[]>([])
  const [selected, setSelected] = useState<HostMarker | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [showVpnBanner, setShowVpnBanner] = useState(false)

  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})

  const fetchHostsAndLocations = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, bio, location, last_location_lat, last_location_lng, last_location_updated")
        .eq("role", "host")
        .eq("share_location", true)

      if (profiles && profiles.length > 0) {
        const mapped: HostMarker[] = []
        profiles.forEach((h) => {
          if (h.last_location_lat !== null && h.last_location_lng !== null) {
            const isLive = h.last_location_updated && (new Date().getTime() - new Date(h.last_location_updated).getTime()) / 1000 < 300

            mapped.push({
              id: h.id,
              name: h.full_name,
              bio: h.bio,
              location: h.location,
              lat: Number(h.last_location_lat),
              lng: Number(h.last_location_lng),
              isLive: !!isLive
            })
          }
        })
        setHosts(mapped)
      } else {
        setHosts([])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchHostsAndLocations()

    // Subscribe to realtime profiles updates
    const channel = supabase
      .channel("public-profiles-locations")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          fetchHostsAndLocations()
        }
      )
      .subscribe()

    // VPN detection check
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          fetch("https://ipinfo.io/json")
            .then((res) => {
              if (!res.ok) throw new Error("CORS or network issue")
              return res.json()
            })
            .then((data) => {
              if (data && data.loc) {
                const [ipLat, ipLng] = data.loc.split(",").map(Number)
                const distance = getHaversineDistance(latitude, longitude, ipLat, ipLng)
                if (distance > 200) {
                  setShowVpnBanner(true)
                }
              }
            })
            .catch((err) => {
              console.warn("[MapPage] IP check failed:", err.message)
            })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }

    // Try load Mapbox
    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"
    script.onload = () => setMapLoaded(true)
    script.onerror = () => setMapError(true)
    document.head.appendChild(script)

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css"
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(script)
      document.head.removeChild(link)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    // @ts-ignore
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoiYXVzYWd1aWRlIiwiYSI6ImNrdzdwIn0.placeholder"

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [KENYA_BOUNDS.lng, KENYA_BOUNDS.lat],
      zoom: 6,
    })
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [mapLoaded])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const queryCountry = searchParams.get("country")
    if (queryCountry) {
      const lower = queryCountry.trim().toLowerCase()
      const match = COUNTRY_COORDS[lower]
      if (match) {
        map.setCenter([match.lng, match.lat])
        map.setZoom(match.zoom)
      } else {
        const token = import.meta.env.VITE_MAPBOX_TOKEN
        if (token && token.startsWith("pk.")) {
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryCountry)}.json?access_token=${token}&limit=1`
          )
            .then((res) => res.json())
            .then((data) => {
              if (data && data.features && data.features.length > 0) {
                const center = data.features[0].center // [lng, lat]
                map.setCenter(center)
                map.setZoom(5)
              }
            })
            .catch((err) => console.warn("Geocoding failed:", err))
        }
      }
    }
  }, [mapLoaded, searchParams])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    // @ts-ignore
    const mapboxgl = window.mapboxgl

    // Clear old markers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove())
    markersRef.current = {}

    hosts.forEach((host) => {
      const el = document.createElement("div")
      el.className = "host-marker"
      el.style.cssText = `
        width: 36px; height: 36px; background: ${host.isLive ? '#2cb67d' : '#7F5AF0'}; border: 2px solid white;
        border-radius: 50%; cursor: pointer; display: flex; align-items: center;
        justify-content: center; font-weight: bold; color: white; font-size: 12px;
        box-shadow: 0 0 0 4px ${host.isLive ? 'rgba(44,182,125,0.3)' : 'rgba(127,90,240,0.3)'}; transition: transform 0.2s;
      `
      el.textContent = host.name.charAt(0)
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)" })
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)" })
      el.addEventListener("click", () => setSelected(host))

      const marker = new mapboxgl.Marker(el)
        .setLngLat([host.lng, host.lat])
        .addTo(map)
      markersRef.current[host.id] = marker
    })
  }, [hosts])

  return (
    <div className="relative min-h-screen bg-background">
      {/* VPN Banner */}
      {showVpnBanner && (
        <div className="absolute top-32 left-1/2 z-40 -translate-x-1/2 w-[90%] max-w-md">
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 backdrop-blur-md px-4 py-3 text-xs text-destructive animate-in fade-in shadow-xl">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">VPN Mismatch Detected</p>
              <p className="text-muted-foreground mt-0.5">For accurate location, please turn off your VPN.</p>
            </div>
            <button onClick={() => setShowVpnBanner(false)} className="text-destructive hover:opacity-85 font-bold ml-2">
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="absolute top-20 left-1/2 z-20 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-5 py-2.5 backdrop-blur-sm shadow-xl">
          <Globe className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Live Host Map</span>
          <span className="ml-2 flex size-2 rounded-full bg-teal animate-pulse" />
          <span className="text-xs text-teal font-medium">{hosts.length} hosts online</span>
        </div>
      </div>

      {/* Map Container */}
      {hosts.length === 0 ? (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center space-y-6 bg-background relative overflow-hidden">
          <div className="absolute top-10 left-1/4 h-[300px] w-[400px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-[350px] w-[450px] rounded-full bg-teal/5 blur-3xl" />
          
          <div className="relative z-10 space-y-6 max-w-md mx-auto">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/20 text-[#7F5AF0]">
              <MapPin className="size-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">No hosts online right now</h1>
            <p className="text-sm text-white/70 leading-relaxed">
              There are currently no hosts sharing their live location. Join the waiting list to get notified when we launch, or join our host waiting list to start hosting!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link
                to="/waitlist"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#7F5AF0] text-white text-sm font-bold shadow-lg hover:bg-[#7F5AF0]/90 transition duration-300"
              >
                Join General Waitlist
              </Link>
              <Link
                to="/host-waitlist"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#2CB67D] text-white text-sm font-bold shadow-lg hover:bg-[#2CB67D]/90 transition duration-300"
              >
                Join Host Waitlist
              </Link>
            </div>
          </div>
        </div>
      ) : mapError ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center">
          <div className="relative w-full max-w-3xl h-[600px] rounded-2xl overflow-hidden border border-border mx-auto bg-card/50">
            {/* Decorative fallback map */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 600">
                <path d="M0,300 Q200,100 400,300 T800,300" stroke="#7F5AF0" strokeWidth="2" fill="none" />
                <path d="M0,200 Q300,400 600,200 T800,400" stroke="#2CB67D" strokeWidth="1" fill="none" />
              </svg>
              {hosts.map((host) => {
                const x = ((host.lng - 34) / 8) * 100
                const y = ((host.lat + 5) / 10) * 100
                return (
                  <button
                    key={host.id}
                    onClick={() => setSelected(selected?.id === host.id ? null : host)}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-primary border-2 border-white text-white text-xs font-bold shadow-lg hover:scale-110 transition-transform"
                  >
                    {host.name.charAt(0)}
                  </button>
                )
              })}
            </div>
            <div className="absolute bottom-4 left-4 rounded-lg bg-card/70 px-3 py-2 backdrop-blur-sm text-xs text-muted-foreground">
              📍 Interactive map requires Mapbox token in .env (VITE_MAPBOX_TOKEN)
            </div>
          </div>
        </div>
      ) : !mapLoaded ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div ref={mapRef} className="h-screen w-full" />
      )}

      {/* Host Popup */}
      {selected && (
        <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 w-[320px] rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white text-lg font-bold">
              {selected.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground">{selected.name}</h3>
              {selected.tour && <p className="text-xs text-primary mt-0.5">{selected.tour}</p>}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="size-3" />{selected.location ?? "Kenya"}
              </div>
              {selected.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{selected.bio}</p>}
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
          <Link
            to={`/host/${selected.id}`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            View Profile
          </Link>
        </div>
      )}
    </div>
  )
}
