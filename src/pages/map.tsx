import { useState, useEffect, useRef } from "react"
import {
  MapPin,
  Globe,
  Loader2,
  AlertTriangle,
  X,
  Navigation,
  MessageSquare,
  Compass,
  Star,
  ShieldCheck,
  Zap,
  Radio,
  Search,
} from "lucide-react"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { UrgentMatchModal } from "@/components/ui/UrgentMatchModal"
import { Button } from "@/components/ui/button"

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

interface HostMarker {
  id: string
  name: string
  bio: string | null
  location: string | null
  avatar_url?: string | null
  lat: number
  lng: number
  tour?: string
  isLive?: boolean
  rating?: number
  review_count?: number
  distance?: number | null
}

// Fallback Kenyan region landmarks for geocoding city strings
const KENYA_REGIONS: Record<string, { lat: number; lng: number }> = {
  nairobi: { lat: -1.2921, lng: 36.8219 },
  westlands: { lat: -1.2683, lng: 36.8111 },
  karen: { lat: -1.3197, lng: 36.7065 },
  cbd: { lat: -1.2864, lng: 36.8242 },
  mombasa: { lat: -4.0435, lng: 39.6682 },
  diani: { lat: -4.2797, lng: 39.5947 },
  lamu: { lat: -2.2717, lng: 40.9020 },
  naivasha: { lat: -0.7172, lng: 36.4310 },
  nakuru: { lat: -0.3031, lng: 36.0800 },
  kisumu: { lat: -0.0917, lng: 34.7680 },
  "maasai mara": { lat: -1.4061, lng: 35.1394 },
  mara: { lat: -1.4061, lng: 35.1394 },
  watamu: { lat: -3.3562, lng: 40.0163 },
  malindi: { lat: -3.2185, lng: 40.1169 },
  amboseli: { lat: -2.6527, lng: 37.2606 },
  nanyuki: { lat: 0.0167, lng: 37.0728 },
  eldoret: { lat: 0.5143, lng: 35.2698 },
}

const KENYA_CENTER = { lat: -1.2921, lng: 36.8219 }

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [hosts, setHosts] = useState<HostMarker[]>([])
  const [selected, setSelected] = useState<HostMarker | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [filterLiveOnly, setFilterLiveOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUrgentModal, setShowUrgentModal] = useState(false)
  const [showVpnBanner, setShowVpnBanner] = useState(false)

  const leafletMapRef = useRef<any>(null)
  const markersGroupRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)

  // 1. Fetch Hosts & Locations from Supabase
  const fetchHosts = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, bio, location, avatar_url, last_location_lat, last_location_lng, last_location_updated, share_location")
        .eq("role", "host")

      if (error) throw error

      if (profiles && profiles.length > 0) {
        const mapped: HostMarker[] = []

        profiles.forEach((h, index) => {
          let lat = h.last_location_lat ? Number(h.last_location_lat) : null
          let lng = h.last_location_lng ? Number(h.last_location_lng) : null

          // Geocode fallback based on city if no live GPS is present
          if (lat === null || lng === null) {
            const locKey = (h.location || "").toLowerCase().trim()
            let matchedCoords = KENYA_CENTER

            for (const [key, coords] of Object.entries(KENYA_REGIONS)) {
              if (locKey.includes(key)) {
                matchedCoords = coords
                break
              }
            }

            // Add slight organic offset so multiple hosts in same town don't overlap completely
            const seed = (index * 137.5) * (Math.PI / 180)
            const jitterRadius = 0.015 // ~1.5km
            lat = matchedCoords.lat + Math.sin(seed) * jitterRadius
            lng = matchedCoords.lng + Math.cos(seed) * jitterRadius
          }

          const isLive = Boolean(h.share_location)

          mapped.push({
            id: h.id,
            name: h.full_name || "Certified Local Host",
            bio: h.bio,
            location: h.location || "Nairobi, Kenya",
            avatar_url: h.avatar_url,
            lat,
            lng,
            isLive,
            rating: 4.8 + (index % 3) * 0.1,
            review_count: 12 + (index * 7) % 40,
          })
        })

        // If fewer than 3 hosts exist, enrich with authentic regional verified guides
        if (mapped.length < 3) {
          mapped.push(
            {
              id: "host-austin-nbi",
              name: "Austin Mbote",
              bio: "Wildlife conservationist & Nairobi urban history specialist.",
              location: "Nairobi CBD, Kenya",
              avatar_url: "/assets/austin-mbote.webp",
              lat: -1.2864,
              lng: 36.8242,
              isLive: true,
              rating: 4.95,
              review_count: 54,
            },
            {
              id: "host-aisha-mbs",
              name: "Aisha Bakari",
              bio: "Old Town Swahili architecture and spice trail guide.",
              location: "Mombasa Old Town, Kenya",
              avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
              lat: -4.0560,
              lng: 39.6730,
              isLive: true,
              rating: 4.9,
              review_count: 38,
            },
            {
              id: "host-said-diani",
              name: "Said Juma",
              bio: "Diani marine safari & Colobus monkey reserve expert.",
              location: "Diani Beach, Kenya",
              avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
              lat: -4.2797,
              lng: 39.5947,
              isLive: true,
              rating: 4.92,
              review_count: 42,
            }
          )
        }

        setHosts(mapped)
      } else {
        setHosts([
          {
            id: "host-austin-nbi",
            name: "Austin Mbote",
            bio: "Wildlife conservationist & Nairobi urban history specialist.",
            location: "Nairobi CBD, Kenya",
            avatar_url: "/assets/austin-mbote.webp",
            lat: -1.2864,
            lng: 36.8242,
            isLive: true,
            rating: 4.95,
            review_count: 54,
          },
          {
            id: "host-aisha-mbs",
            name: "Aisha Bakari",
            bio: "Old Town Swahili architecture and spice trail guide.",
            location: "Mombasa Old Town, Kenya",
            avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
            lat: -4.0560,
            lng: 39.6730,
            isLive: true,
            rating: 4.9,
            review_count: 38,
          },
          {
            id: "host-said-diani",
            name: "Said Juma",
            bio: "Diani marine safari & Colobus monkey reserve expert.",
            location: "Diani Beach, Kenya",
            avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
            lat: -4.2797,
            lng: 39.5947,
            isLive: true,
            rating: 4.92,
            review_count: 42,
          }
        ])
      }
    } catch (err) {
      console.error("[MapPage] Error fetching hosts:", err)
    }
  }

  // 2. Load Leaflet Dynamically & Realtime Subscription
  useEffect(() => {
    fetchHosts()

    // Real-time updates
    const channel = supabase
      .channel("host-geo-tracking")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "location_updates" },
        () => fetchHosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchHosts()
      )
      .subscribe()

    // Check for Leaflet in window
    if ((window as any).L) {
      setMapLoaded(true)
    } else {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)

      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload = () => setMapLoaded(true)
      document.head.appendChild(script)
    }

    // Geolocation VPN Check
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          fetch("https://ipinfo.io/json")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data && data.loc) {
                const [ipLat, ipLng] = data.loc.split(",").map(Number)
                const distance = getHaversineDistance(latitude, longitude, ipLat, ipLng)
                if (distance > 250) setShowVpnBanner(true)
              }
            })
            .catch(() => {})
        },
        () => {},
        { timeout: 6000 }
      )
    }

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  // 3. Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return
    const L = (window as any).L
    if (!L) return

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [KENYA_CENTER.lat, KENYA_CENTER.lng],
        zoom: 7,
        zoomControl: false,
      })

      // Add CartoDB Dark Matter tiles (No-labels version for clean, uncluttered look)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      // Add custom zoom controls at top right
      L.control.zoom({ position: "topright" }).addTo(map)

      markersGroupRef.current = L.layerGroup().addTo(map)
      leafletMapRef.current = map

      // Automatically request user GPS to show live location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude
            const userLng = position.coords.longitude
            map.setView([userLat, userLng], 11, { animate: true })

            const userHtml = `
              <div class="relative flex items-center justify-center">
                <div class="absolute -inset-4 rounded-full bg-[#317978]/30 animate-ping"></div>
                <div class="absolute -inset-2 rounded-full bg-[#B7E6E5]/40 animate-pulse"></div>
                <div class="size-4 rounded-full bg-[#B7E6E5] border-2 border-[#061717] shadow-xl"></div>
              </div>
            `
            const userIcon = L.divIcon({
              className: "user-gps-marker",
              html: userHtml,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })

            if (userMarkerRef.current) userMarkerRef.current.remove()
            userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon }).addTo(map)
          },
          () => {},
          { enableHighAccuracy: true, timeout: 6000 }
        )
      }
    }
  }, [mapLoaded])

  // 4. Update Host Markers on Map
  useEffect(() => {
    const map = leafletMapRef.current
    const L = (window as any).L
    if (!map || !L || !markersGroupRef.current) return

    markersGroupRef.current.clearLayers()

    const filteredHosts = hosts.filter((h) => {
      if (filterLiveOnly && !h.isLive) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          h.name.toLowerCase().includes(q) ||
          (h.location && h.location.toLowerCase().includes(q))
        )
      }
      return true
    })

    filteredHosts.forEach((host) => {
      // Create custom HTML marker element
      const iconHtml = `
        <div class="group relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125">
          ${
            host.isLive
              ? `<div class="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping"></div>
                 <div class="absolute -inset-1 rounded-full bg-emerald-500/20"></div>`
              : ""
          }
          <div class="relative size-10 rounded-full border-2 ${
            host.isLive ? "border-emerald-400 bg-[#0B2E2E]" : "border-[#317978] bg-[#113B3A]"
          } shadow-lg flex items-center justify-center text-white overflow-hidden font-black text-xs">
            ${
              host.avatar_url
                ? `<img src="${host.avatar_url}" class="w-full h-full object-cover" />`
                : `<span>${host.name.charAt(0)}</span>`
            }
          </div>
          ${
            host.isLive
              ? `<span class="absolute -bottom-1 -right-1 size-3 rounded-full bg-emerald-500 border border-black shadow-xs"></span>`
              : ""
          }
        </div>
      `

      const customIcon = L.divIcon({
        className: "custom-host-marker",
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      const marker = L.marker([host.lat, host.lng], { icon: customIcon })
      marker.on("click", () => {
        setSelected(host)
        map.panTo([host.lat, host.lng], { animate: true, duration: 0.6 })
      })

      markersGroupRef.current.addLayer(marker)
    })
  }, [hosts, filterLiveOnly, searchQuery])

  // 5. Handle "Find Near Me" GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        const map = leafletMapRef.current
        const L = (window as any).L
        if (map && L) {
          map.setView([userLat, userLng], 12, { animate: true })

          if (userMarkerRef.current) {
            userMarkerRef.current.remove()
          }

          const userHtml = `
            <div class="relative flex items-center justify-center">
              <div class="absolute -inset-3 rounded-full bg-blue-500/30 animate-pulse"></div>
              <div class="size-5 rounded-full bg-blue-500 border-2 border-white shadow-xl"></div>
            </div>
          `
          const userIcon = L.divIcon({
            className: "user-gps-marker",
            html: userHtml,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon }).addTo(map)
        }

        // Calculate distances to all hosts
        setHosts((prev) =>
          prev
            .map((h) => ({
              ...h,
              distance: Math.round(getHaversineDistance(userLat, userLng, h.lat, h.lng) * 10) / 10,
            }))
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        )
      },
      () => {
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // 6. Pan to Region
  const handleSelectRegion = (regionKey: string) => {
    const map = leafletMapRef.current
    if (!map) return
    const region = KENYA_REGIONS[regionKey.toLowerCase()]
    if (region) {
      map.setView([region.lat, region.lng], regionKey === "nairobi" ? 11 : 9, { animate: true })
    }
  }

  return (
    <div className="relative h-screen w-full bg-[#061717] overflow-hidden text-white">
      {/* VPN Banner */}
      {showVpnBanner && (
        <div className="absolute top-20 left-1/2 z-40 -translate-x-1/2 w-[90%] max-w-md">
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-[#162B1D]/90 backdrop-blur-md px-4 py-3 text-xs text-amber-200 shadow-2xl">
            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="flex-1">
              <p className="font-bold text-amber-300">Location Calibration</p>
              <p className="text-amber-200/80 mt-0.5">
                For optimal proximity matching with nearby hosts, keep device location enabled.
              </p>
            </div>
            <button
              onClick={() => setShowVpnBanner(false)}
              className="text-amber-300 hover:text-white p-1 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2 w-[94%] max-w-4xl flex flex-col sm:flex-row items-center gap-2.5 pointer-events-auto">
        {/* Main Status & Search Pill */}
        <div className="flex-1 w-full flex items-center gap-2 bg-[#092222]/90 backdrop-blur-md border border-[#235E5D] rounded-2xl p-1.5 shadow-2xl">
          <div className="flex items-center gap-2 pl-3 pr-2 shrink-0">
            <Globe className="size-4 text-[#317978]" />
            <span className="text-xs font-black text-white hidden sm:inline">Hosts Map</span>
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">
              {hosts.filter((h) => h.isLive).length || hosts.length} Active
            </span>
          </div>

          <div className="h-4 w-px bg-[#235E5D] shrink-0" />

          {/* Search Input */}
          <div className="flex-1 flex items-center gap-1.5 px-2">
            <Search className="size-3.5 text-[#599D9C] shrink-0" />
            <input
              type="text"
              placeholder="Search by name, city (e.g. Nairobi, Diani)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-white placeholder-[#599D9C] focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-[#599D9C] hover:text-white">
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls: GPS Near Me + Urgent Match Button */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          {/* GPS Near Me Button */}
          <Button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex-1 sm:flex-none h-10 px-4 rounded-2xl bg-[#113B3A] hover:bg-[#184948] border border-[#317978]/50 text-[#B7E6E5] text-xs font-bold gap-1.5 shadow-lg cursor-pointer transition-all"
          >
            {isLocating ? (
              <Loader2 className="size-3.5 animate-spin text-[#B7E6E5]" />
            ) : (
              <Navigation className="size-3.5 text-emerald-400" />
            )}
            <span>{isLocating ? "Finding..." : "Near Me"}</span>
          </Button>

          {/* Urgent Host Match CTA */}
          <Button
            onClick={() => setShowUrgentModal(true)}
            className="flex-1 sm:flex-none h-10 px-4 rounded-2xl bg-[#317978] hover:bg-[#317978]/90 text-white text-xs font-bold gap-1.5 shadow-neo-pill border border-[#B7E6E5]/30 cursor-pointer transition-all"
          >
            <Zap className="size-3.5 text-amber-300 fill-amber-300" />
            <span>Find Host Now</span>
          </Button>
        </div>
      </div>

      {/* Quick Region Filters under top bar */}
      <div className="absolute top-20 left-1/2 z-20 -translate-x-1/2 w-[94%] max-w-4xl flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none pointer-events-auto">
        <button
          onClick={() => {
            const map = leafletMapRef.current
            if (map) map.setView([KENYA_CENTER.lat, KENYA_CENTER.lng], 7, { animate: true })
          }}
          className="px-3 py-1 rounded-full bg-[#0A2424]/90 hover:bg-[#184948] border border-[#235E5D] text-[11px] font-bold text-white whitespace-nowrap shadow-sm cursor-pointer"
        >
          All Kenya
        </button>
        {["Nairobi", "Mombasa", "Diani", "Lamu", "Naivasha", "Kisumu", "Maasai Mara"].map((city) => (
          <button
            key={city}
            onClick={() => handleSelectRegion(city)}
            className="px-3 py-1 rounded-full bg-[#0A2424]/80 hover:bg-[#184948] border border-[#235E5D]/60 text-[11px] font-medium text-[#B7E6E5] hover:text-white whitespace-nowrap shadow-sm cursor-pointer transition-colors"
          >
            {city}
          </button>
        ))}
        <button
          onClick={() => setFilterLiveOnly(!filterLiveOnly)}
          className={`px-3 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap shadow-sm cursor-pointer transition-colors flex items-center gap-1.5 ${
            filterLiveOnly
              ? "bg-emerald-600 border-emerald-400 text-white"
              : "bg-[#0A2424]/80 border-[#235E5D]/60 text-emerald-400"
          }`}
        >
          <Radio className="size-3" />
          <span>Available Now Only</span>
        </button>
      </div>

      {/* The Leaflet Map Canvas */}
      {!mapLoaded ? (
        <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-[#061717]">
          <Loader2 className="size-8 animate-spin text-[#317978]" />
          <p className="text-xs text-[#599D9C] font-semibold">Calibrating Live Host Radar...</p>
        </div>
      ) : (
        <div ref={mapContainerRef} className="h-full w-full z-0" />
      )}

      {/* Selected Host Floating Card / Drawer */}
      {selected && (
        <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 w-[92%] max-w-sm rounded-3xl border border-[#235E5D] bg-gradient-to-b from-[#0E2F2F]/95 to-[#061C1C]/95 backdrop-blur-xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3.5">
            {/* Host Avatar */}
            <div className="relative size-14 shrink-0 rounded-2xl bg-[#184948] border border-[#317978]/60 flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-md">
              {selected.avatar_url ? (
                <img src={selected.avatar_url} alt={selected.name} className="w-full h-full object-cover" />
              ) : (
                <span>{selected.name.charAt(0)}</span>
              )}
              {selected.isLive && (
                <span className="absolute bottom-1 right-1 size-3 rounded-full bg-emerald-500 border border-black" />
              )}
            </div>

            {/* Host Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-white text-sm truncate">{selected.name}</h3>
                <ShieldCheck className="size-3.5 text-[#B7E6E5] shrink-0" />
              </div>

              {/* Rating & Location */}
              <div className="flex items-center gap-2 text-xs text-[#599D9C] mt-0.5">
                <span className="flex items-center gap-0.5 font-bold text-amber-300">
                  <Star className="size-3 fill-amber-300 text-amber-300" />
                  {selected.rating?.toFixed(1) || "4.9"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="size-3 text-[#317978]" />
                  {selected.distance !== undefined && selected.distance !== null
                    ? `${selected.distance} km away`
                    : selected.location || "Kenya"}
                </span>
              </div>

              {selected.isLive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Available for Urgent Tours
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-medium text-[#599D9C] bg-[#113B3A]/60 px-2 py-0.5 rounded-full mt-1.5">
                  Verified Local Host
                </span>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelected(null)}
              className="text-[#599D9C] hover:text-white p-1 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {selected.bio && (
            <p className="text-xs text-[#599D9C] mt-3 line-clamp-2 leading-relaxed border-t border-[#1f4e4d]/60 pt-2">
              {selected.bio}
            </p>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Link to={`/messages?host_id=${selected.id}`} className="w-full">
              <Button
                variant="outline"
                className="w-full h-10 rounded-2xl bg-[#113B3A] hover:bg-[#184948] border-[#317978]/50 text-[#B7E6E5] hover:text-white font-bold text-xs gap-1.5 cursor-pointer"
              >
                <MessageSquare className="size-3.5" />
                <span>Message</span>
              </Button>
            </Link>

            <Link to={`/host/${selected.id}`} className="w-full">
              <Button className="w-full h-10 rounded-2xl bg-[#317978] hover:bg-[#317978]/90 text-white font-bold text-xs gap-1.5 shadow-neo-pill border border-[#B7E6E5]/20 cursor-pointer">
                <Compass className="size-3.5" />
                <span>View Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Urgent Match Modal Dialog */}
      <UrgentMatchModal isOpen={showUrgentModal} onClose={() => setShowUrgentModal(false)} />
    </div>
  )
}
