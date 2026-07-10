import { useState, useEffect, useRef } from "react"
import { MapPin, AlertTriangle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface LocationToggleProps {
  userId: string
  className?: string
}

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

export function LocationToggle({ userId, className }: LocationToggleProps) {
  const [sharing, setSharing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVpnWarning, setShowVpnWarning] = useState(false)
  const intervalRef = useRef<any>(null)

  const stopSharing = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setSharing(false)
    setShowVpnWarning(false)
    setLoading(true)
    try {
      // Remove location update entry on toggle-off
      await supabase.from("location_updates").delete().eq("user_id", userId)
      await supabase.from("profiles").update({
        share_location: false,
        last_location_lat: null,
        last_location_lng: null,
        last_location_updated: null,
      }).eq("id", userId)
    } catch (err) {
      console.error("Failed to delete location on stop:", err)
    } finally {
      setLoading(false)
    }
  }

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      return
    }

    setLoading(true)
    setError(null)

    // Request initial position to check permissions
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          await supabase.from("profiles").update({
            share_location: true
          }).eq("id", userId)
          await upsertLocation(latitude, longitude)
          setSharing(true)
          setLoading(false)

          // Fetch IP location and compare
          fetch("https://ipinfo.io/json")
            .then((res) => {
              if (!res.ok) throw new Error("CORS or network issue")
              return res.json()
            })
            .then((data) => {
              if (data && data.loc) {
                const [ipLat, ipLng] = data.loc.split(",").map(Number)
                const distance = getHaversineDistance(latitude, longitude, ipLat, ipLng)
                console.log(`[LocationToggle] GPS coords: ${latitude}, ${longitude}; IP coords: ${ipLat}, ${ipLng}; Distance: ${distance} km`)
                if (distance > 200) {
                  setShowVpnWarning(true)
                } else {
                  setShowVpnWarning(false)
                }
              }
            })
            .catch((err) => {
              console.warn("[LocationToggle] IP check failed:", err.message)
            })

          // Start the 5-second interval loop
          intervalRef.current = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                upsertLocation(pos.coords.latitude, pos.coords.longitude)
              },
              (err) => {
                console.error("Interval geolocation error:", err.message)
                setError(`Location error: ${err.message}`)
              },
              { enableHighAccuracy: true, timeout: 5000 }
            )
          }, 5000)
        } catch (err: any) {
          setError(err.message || "Failed to update location in database.")
          setLoading(false)
        }
      },
      (err) => {
        let msg = "Permission denied or location unavailable."
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Permission denied. Please enable location access in your browser."
        }
        setError(msg)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const upsertLocation = async (lat: number, lng: number) => {
    try {
      // Update profiles
      await supabase.from("profiles").update({
        last_location_lat: lat,
        last_location_lng: lng,
        last_location_updated: new Date().toISOString(),
      }).eq("id", userId)

      // Also upsert to location_updates
      const { data: existing } = await supabase
        .from("location_updates")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from("location_updates")
          .update({
            latitude: lat,
            longitude: lng,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
      } else {
        await supabase
          .from("location_updates")
          .insert({
            user_id: userId,
            latitude: lat,
            longitude: lng,
            updated_at: new Date().toISOString(),
          })
      }
    } catch (err) {
      console.error("Upsert location error:", err)
    }
  }

  const handleToggle = (checked: boolean) => {
    if (checked) {
      startSharing()
    } else {
      stopSharing()
    }
  }

  // Load initial location sharing state and cleanup on unmount
  useEffect(() => {
    async function checkInitialState() {
      if (!userId) return
      try {
        const { data } = await supabase
          .from("profiles")
          .select("share_location")
          .eq("id", userId)
          .maybeSingle()
        if (data && data.share_location) {
          startSharing()
        }
      } catch (e) {
        console.warn("Failed to fetch initial sharing status:", e)
      }
    }
    checkInitialState()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [userId])

  return (
    <div className={`rounded-xl border border-border/80 bg-card/60 p-4 backdrop-blur-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex size-9 items-center justify-center rounded-lg ${sharing ? "bg-teal-500/10 text-teal" : "bg-primary/10 text-primary"}`}>
            <MapPin className="size-4 animate-pulse" />
          </div>
          <div>
            <Label htmlFor="live-location" className="font-semibold text-sm cursor-pointer select-none">
              Share my location on the map
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Let travelers see your live location on the host map
            </p>
          </div>
        </div>
        <Switch
          id="live-location"
          checked={sharing}
          disabled={loading}
          onCheckedChange={handleToggle}
        />
      </div>

      {/* Status indicator */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-xs">
        <span className="text-muted-foreground">Status:</span>
        {sharing ? (
          <span className="flex items-center gap-1 font-semibold text-teal">
            <CheckCircle className="size-3.5 fill-teal/10" />
            Sharing location (updating every 5s)
          </span>
        ) : (
          <span className="text-muted-foreground font-medium">Location sharing off</span>
        )}
      </div>

      {showVpnWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-500 leading-normal animate-in fade-in">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          <span><strong>VPN Warning:</strong> For accurate location, please turn off your VPN. Mismatch of &gt; 200 km between GPS and your network IP.</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-[11px] text-destructive leading-normal">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-normal mt-2">
        <strong>Privacy Notice:</strong> Your location is only shared while active and is shown exclusively to customers with confirmed upcoming bookings.
      </p>
    </div>
  )
}
