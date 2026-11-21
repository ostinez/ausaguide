import { useState } from "react"
import { MapPin, Plus, Loader2, ShieldCheck } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface LocationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess?: (coords: { latitude: number; longitude: number }) => void
}

export function LocationPermissionModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: LocationPermissionModalProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported by your browser."
      setErrorMsg(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    setErrorMsg(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          if (userId) {
            // Update profile with coordinates and location sharing
            const { error } = await supabase
              .from("profiles")
              .update({
                latitude,
                longitude,
                share_location: true,
              } as any)
              .eq("id", userId)

            if (error) {
              console.warn("Non-fatal profile location update error:", error.message)
            }

            // Also upsert into location_updates if available
            try {
              await supabase.from("location_updates").upsert(
                {
                  user_id: userId,
                  latitude,
                  longitude,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
              )
            } catch (_) {}

            localStorage.setItem("user_lat", String(latitude))
            localStorage.setItem("user_lng", String(longitude))
            localStorage.setItem("user_share_location", "true")
          }

          toast.success("Location enabled! Nearby travelers can now discover you.")
          setLoading(false)
          onSuccess?.({ latitude, longitude })
          onClose()
        } catch (err: any) {
          console.error("Failed to save location:", err)
          setLoading(false)
          setErrorMsg(err.message || "Failed to save location.")
          toast.error("Failed to save location.")
        }
      },
      (geoErr) => {
        setLoading(false)
        let friendlyErr = "Could not retrieve your location. Please check browser permissions."
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          friendlyErr = "Location permission denied. Please allow location in your browser settings."
        } else if (geoErr.code === geoErr.TIMEOUT) {
          friendlyErr = "Location request timed out. Please try again."
        }
        setErrorMsg(friendlyErr)
        toast.error(friendlyErr)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md bg-card border border-border/80 text-foreground rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
        <DialogHeader className="items-center text-center">
          {/* Location Pin with Orange Plus Icon */}
          <div className="relative mx-auto mb-4 flex size-20 items-center justify-center rounded-3xl bg-teal-500/10 border border-teal-500/20 shadow-inner">
            <MapPin className="size-10 text-teal-600 dark:text-teal-400" />
            <div className="absolute -top-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-[#E87A3D] text-white shadow-md ring-2 ring-card font-black">
              <Plus className="size-4 stroke-[3]" />
            </div>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground text-center">
            Share Your Host Location
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground mt-2 text-center leading-relaxed max-w-xs mx-auto">
            Allow location access so nearby travelers can easily discover you on the live interactive map and book your tours.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mt-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            size="lg"
            onClick={handleAllowLocation}
            disabled={loading}
            className="w-full rounded-2xl bg-[#E87A3D] hover:bg-[#d46a30] text-white font-bold py-3 shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer h-12"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <MapPin className="size-4" />
                <span>Allow Location</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-2xl text-muted-foreground hover:text-foreground text-xs font-semibold h-10"
          >
            Maybe Later
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/75">
          <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
          <span>Your exact location is private and only used to show you in your city/area.</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
