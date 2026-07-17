import { useState, useEffect, useRef } from "react"
import { Info, Navigation, WifiOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface LiveLocationMapProps {
  hostId: string
  hostName: string
  tourLatitude: number
  tourLongitude: number
  tourTitle: string
  className?: string
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // metres
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function LiveLocationMap({
  hostId,
  hostName,
  tourLatitude,
  tourLongitude,
  tourTitle,
  className,
}: LiveLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [hostCoords, setHostCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>("Host is not sharing location")

  // Load Mapbox GL JS library
  useEffect(() => {
    let script: HTMLScriptElement
    let link: HTMLLinkElement

    try {
      script = document.createElement("script")
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"
      script.onload = () => setScriptsLoaded(true)
      script.onerror = () => setError("Failed to load map scripts.")
      document.head.appendChild(script)

      link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css"
      document.head.appendChild(link)
    } catch (e) {
      setError("Failed to initialize Mapbox dependencies.")
    }

    return () => {
      if (script) document.head.removeChild(script)
      if (link) document.head.removeChild(link)
    }
  }, [])

  // Fetch initial host location and subscribe to realtime updates
  useEffect(() => {
    if (!hostId) return

    const loadInitialLocation = async () => {
      try {
        const { data, error } = await supabase
          .from("location_updates")
          .select("latitude, longitude, updated_at")
          .eq("user_id", hostId)
          .maybeSingle()

        if (error) throw error

        if (data) {
          const updateTime = new Date(data.updated_at)
          const secondsDiff = (new Date().getTime() - updateTime.getTime()) / 1000

          // If the update is older than 25 seconds, we consider sharing off/inactive
          if (secondsDiff < 25) {
            setHostCoords({ lat: data.latitude, lng: data.longitude })
            setLastUpdate(updateTime)
            setIsSharing(true)
          }
        }
      } catch (err) {
        console.error("Error loading host initial location:", err)
      }
    }

    loadInitialLocation()

    // Subscribe to realtime location updates
    const interval = setInterval(loadInitialLocation, 10000)
    /*
    const channel = supabase
      .channel(`host-location-${hostId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "location_updates",
          filter: `user_id=eq.${hostId}`,
        },
        (payload: any) => {
          if (payload.eventType === "DELETE") {
            setHostCoords(null)
            setIsSharing(false)
            setLastUpdate(null)
          } else if (payload.new) {
            const newCoords = { lat: payload.new.latitude, lng: payload.new.longitude }
            setHostCoords(newCoords)
            setLastUpdate(new Date(payload.new.updated_at))
            setIsSharing(true)
          }
        }
      )
      .subscribe()
    */

    return () => {
      clearInterval(interval)
      // supabase.removeChannel(channel)
    }
  }, [hostId])

  // Periodically check if the host went offline (i.e. no update for 25s)
  useEffect(() => {
    const checkOffline = () => {
      if (lastUpdate && isSharing) {
        const secondsDiff = (new Date().getTime() - lastUpdate.getTime()) / 1000
        if (secondsDiff >= 25) {
          setIsSharing(false)
          setHostCoords(null)
        }
      }
    }

    const timer = setInterval(checkOffline, 5000)
    return () => clearInterval(timer)
  }, [lastUpdate, isSharing])

  // Calculate traveler status message
  useEffect(() => {
    if (!isSharing || !hostCoords) {
      setStatusMessage("Host is not sharing location")
      return
    }

    const dist = getDistanceMeters(
      hostCoords.lat,
      hostCoords.lng,
      tourLatitude,
      tourLongitude
    )

    if (dist <= 150) {
      setStatusMessage("Host is at the location")
    } else {
      setStatusMessage(`Host is on the way (${(dist / 1000).toFixed(1)} km away)`)
    }
  }, [isSharing, hostCoords, tourLatitude, tourLongitude])

  // Initialize and update Mapbox map
  useEffect(() => {
    if (!scriptsLoaded || !mapContainerRef.current) return
    // @ts-ignore
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    mapboxgl.accessToken =
      import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoiYXVzYWd1aWRlIiwiYSI6ImNrdzdwIn0.placeholder"

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [tourLongitude, tourLatitude],
      zoom: 14,
    })

    mapRef.current = map

    // Custom Canvas Pulsing Dot symbol
    const size = 100
    const pulsingDot: any = {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),

      onAdd: function () {
        const canvas = document.createElement("canvas")
        canvas.width = this.width
        canvas.height = this.height
        this.context = canvas.getContext("2d")
      },

      render: function () {
        const duration = 1200
        const t = (performance.now() % duration) / duration

        const radius = (size / 2) * 0.25
        const outerRadius = (size / 2) * 0.65 * t + radius
        const context = this.context
        if (!context) return false

        context.clearRect(0, 0, this.width, this.height)

        // Outer pulsing glow
        context.beginPath()
        context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2)
        context.fillStyle = `rgba(127, 90, 240, ${0.8 * (1 - t)})`
        context.fill()

        // Inner solid core
        context.beginPath()
        context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2)
        context.fillStyle = "#7F5AF0"
        context.strokeStyle = "white"
        context.lineWidth = 2 + 2 * (1 - t)
        context.fill()
        context.stroke()

        this.data = context.getImageData(0, 0, this.width, this.height).data
        map.triggerRepaint()
        return true
      },
    }

    map.on("load", () => {
      setMapLoaded(true)

      // Add canvas image to map
      map.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 })

      // Create Tour Start Location marker
      const tourPin = document.createElement("div")
      tourPin.className = "tour-start-marker"
      tourPin.innerHTML = `
        <div style="background: #2cb67d; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.4); cursor: pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `
      
      // Popup tooltip for Tour Pin
      const popup = new mapboxgl.Popup({ offset: 10 }).setHTML(
        `<div style="color: black; font-family: sans-serif; font-size: 11px; padding: 2px;"><strong>Starting Point</strong><br/>${tourTitle}</div>`
      )

      new mapboxgl.Marker(tourPin)
        .setLngLat([tourLongitude, tourLatitude])
        .setPopup(popup)
        .addTo(map)

      // Add Host source & symbol layer
      map.addSource("host-location", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      })

      map.addLayer({
        id: "host-symbol",
        type: "symbol",
        source: "host-location",
        layout: {
          "icon-image": "pulsing-dot",
          "icon-allow-overlap": true,
          "text-field": `${hostName.split(" ")[0]} (Host)`,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-size": 11,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#111216",
          "text-halo-width": 1.5,
        },
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [scriptsLoaded, tourLatitude, tourLongitude, tourTitle, hostName])

  // Update Host marker coordinate inside the Mapbox source
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current

    const source = map.getSource("host-location")
    if (!source) return

    if (hostCoords && isSharing) {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [hostCoords.lng, hostCoords.lat],
            },
            properties: {
              title: "Host",
            },
          },
        ],
      })

      // Zoom out/pan to fit both host and tour start location
      // @ts-ignore
      const mapboxgl = window.mapboxgl
      const bounds = new mapboxgl.LngLatBounds()
      bounds.extend([tourLongitude, tourLatitude])
      bounds.extend([hostCoords.lng, hostCoords.lat])

      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15,
        duration: 2000,
      })
    } else {
      // Clear data
      source.setData({
        type: "FeatureCollection",
        features: [],
      })

      // Reset center on tour location
      map.easeTo({
        center: [tourLongitude, tourLatitude],
        zoom: 14,
        duration: 1000,
      })
    }
  }, [mapLoaded, hostCoords, isSharing, tourLatitude, tourLongitude])

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center">
        <WifiOff className="size-8 text-destructive animate-pulse mb-2" />
        <p className="text-sm font-semibold text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border/80 bg-card/40 backdrop-blur shadow-lg", className)}>
      {/* Map display */}
      <div ref={mapContainerRef} className="w-full h-72 md:h-96" />

      {/* Floating location status bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2 rounded-xl border border-border/80 bg-background/95 p-3.5 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className={cn("size-4 animate-bounce", isSharing ? "text-teal" : "text-muted-foreground")} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Tracking</span>
          </div>
          {isSharing ? (
            <span className="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold text-teal animate-pulse">
              <span className="size-1.5 rounded-full bg-teal" />
              Live
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Offline
            </span>
          )}
        </div>

        <h3 className="font-bold text-sm text-foreground">{statusMessage}</h3>

        <div className="flex items-start gap-1.5 text-[10.5px] text-muted-foreground leading-normal border-t border-border/40 pt-2">
          <Info className="size-3 shrink-0 mt-0.5" />
          <span>
            {isSharing
              ? `Host is sharing position. Keep this page open to track their real-time progress to the meeting point.`
              : `Host starting point: ${tourTitle}. Real-time tracking will activate once the host turns on location sharing.`}
          </span>
        </div>
      </div>

      {/* Loading cover */}
      {!scriptsLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card z-20 gap-3">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">Initializing live tracking map...</p>
        </div>
      )}
    </div>
  )
}
