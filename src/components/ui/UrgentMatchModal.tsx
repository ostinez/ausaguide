import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { requestUrgentHost, type UrgentRequest } from "@/lib/api/urgent-match"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Compass, CheckCircle2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { DirectMessageButton } from "@/components/common/DirectMessageButton"

// Coordinates for preset cities
const PRESET_CITIES = [
 { name: "Nairobi", lat: -1.2921, lng: 36.8219 },
 { name: "Mombasa", lat: -4.0435, lng: 39.6682 },
 { name: "Kisumu", lat: -0.0917, lng: 34.7680 },
 { name: "Diani Beach", lat: -4.2797, lng: 39.5940 },
 { name: "Lamu Old Town", lat: -2.2717, lng: 40.9020 },
 { name: "Narok / Maasai Mara", lat: -1.4061, lng: 35.0111 },
]

interface UrgentMatchModalProps {
 isOpen: boolean
 onClose: () => void
}

export function UrgentMatchModal({ isOpen, onClose }: UrgentMatchModalProps) {
 const navigate = useNavigate()
 const [step, setStep] = useState<"form" | "matching" | "success" | "no_hosts">("form")
 const [loading, setLoading] = useState(false)
 const [latitude, setLatitude] = useState<number | null>(null)
 const [longitude, setLongitude] = useState<number | null>(null)
 const [useManualCity, setUseManualCity] = useState(false)
 const [selectedCity, setSelectedCity] = useState("Nairobi")

 // Form Fields
 const [budget, setBudget] = useState<number>(25)
 const [experienceType, setExperienceType] = useState<string>("culture")

 // Real-time tracking
 const [requestId, setRequestId] = useState<string | null>(null)
 const [countdown, setCountdown] = useState<number>(120) // 2 minutes countdown
 const [matchedHost, setMatchedHost] = useState<any | null>(null)

 // Detect Geolocation on mount or when opening
 useEffect(() => {
 if (isOpen && !useManualCity) {
 detectLocation()
 }
 }, [isOpen, useManualCity])

 const detectLocation = () => {
 if (!navigator.geolocation) {
 setUseManualCity(true)
 return
 }

 navigator.geolocation.getCurrentPosition(
 (position) => {
 setLatitude(position.coords.latitude)
 setLongitude(position.coords.longitude)
 },
 (_error) => {
 console.warn("Geolocation access denied or failed, falling back to manual city selection.")
 setUseManualCity(true)
 },
 { timeout: 5000 }
 )
 }

 // Handle City Change
 useEffect(() => {
 if (useManualCity) {
 const city = PRESET_CITIES.find((c) => c.name === selectedCity)
 if (city) {
 setLatitude(city.lat)
 setLongitude(city.lng)
 }
 }
 }, [selectedCity, useManualCity])

 // Countdown timer for matching
 useEffect(() => {
 if (step !== "matching" || countdown <= 0) {
 if (countdown <= 0 && step === "matching") {
 setStep("no_hosts")
 }
 return
 }

 const timer = setTimeout(() => {
 setCountdown((prev) => prev - 1)
 }, 1000)

 return () => clearTimeout(timer)
 }, [step, countdown])

 // Supabase Real-time Subscription for request match updates
 useEffect(() => {
 if (!requestId || step !== "matching") return

 const channel = supabase
 .channel(`urgent_request_channel_${requestId}`)
 .on(
 "postgres_changes",
 {
 event: "UPDATE",
 schema: "public",
 table: "urgent_requests",
 filter: `id=eq.${requestId}`,
 },
 async (payload: any) => {
 const updatedRequest = payload.new as UrgentRequest
 if (updatedRequest.status === "accepted" && updatedRequest.matched_host_id) {
 // Retrieve matched host details
 const { data: hostProfile } = await supabase
 .from("profiles")
 .select("*")
 .eq("id", updatedRequest.matched_host_id)
 .single()

 setMatchedHost(hostProfile)
 setStep("success")
 channel.unsubscribe()
 } else if (updatedRequest.status === "expired" || updatedRequest.status === "declined") {
 setStep("no_hosts")
 channel.unsubscribe()
 }
 }
 )
 .subscribe()

 return () => {
 channel.unsubscribe()
 supabase.removeChannel(channel)
 }
 }, [requestId, step])

 // Submit Request
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 
 // Check if user is logged in
 const userId = localStorage.getItem("user_id")
 if (!userId) {
 toast.error("Please log in to match with local hosts.")
 onClose()
 navigate("/auth")
 return
 }

 setLoading(true)

 // Fallback if coordinates are not resolved
 let activeLat = latitude
 let activeLng = longitude
 if (activeLat === null || activeLng === null) {
 const fallbackCity = PRESET_CITIES.find((c) => c.name === selectedCity) || PRESET_CITIES[0]
 activeLat = fallbackCity.lat
 activeLng = fallbackCity.lng
 }

 try {
 const response = await requestUrgentHost(activeLat, activeLng, budget, experienceType)
 if (response.success && response.request) {
 setRequestId(response.request.id)
 setCountdown(120) // Reset to 2 minutes
 setStep("matching")
 } else {
 setStep("no_hosts")
 }
 } catch (err) {
 console.error("Urgent request submission error:", err)
 setStep("no_hosts")
 } finally {
 setLoading(false)
 }
 }

 // Cancel Matching Session
 const handleCancel = async () => {
 if (requestId) {
 await supabase
 .from("urgent_requests")
 .update({ status: "expired" })
 .eq("id", requestId)
 }
 resetState()
 }

 const resetState = () => {
 setStep("form")
 setRequestId(null)
 setMatchedHost(null)
 setCountdown(120)
 setLoading(false)
 onClose()
 }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
      <DialogContent className="sm:max-w-[450px] bg-card border border-border text-foreground rounded-3xl shadow-modern p-6 overflow-hidden">
        
        {/* Step 1: Request Form */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Compass className="h-6 w-6 text-brand" />
                Find a Host Now
              </DialogTitle>
              <p className="text-muted-foreground text-xs mt-1 font-medium">
                Need a certified guide or local host within 5km? Submit a request to available hosts instantly.
              </p>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Location Input Group */}
              <div className="space-y-2">
                <label htmlFor="preset-city-select" className="text-xs font-bold text-foreground block uppercase tracking-wider">Match Location</label>
                {useManualCity ? (
                  <div className="flex gap-2">
                    <select
                      id="preset-city-select"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-secondary/60 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-foreground font-medium"
                    >
                      {PRESET_CITIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUseManualCity(false)}
                      className="text-xs border-border text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl"
                    >
                      GPS
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl p-3 text-sm">
                    <span className="flex items-center gap-2 text-brand font-bold">
                      <MapPin className="h-4 w-4 text-brand animate-bounce" />
                      {latitude !== null ? `Auto-detected GPS Location` : `Detecting Location...`}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setUseManualCity(true)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Use preset city
                    </Button>
                  </div>
                )}
              </div>

              {/* Budget Option */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-foreground">
                  <label htmlFor="hourly-budget-input" className="uppercase tracking-wider">Hourly Budget (USD)</label>
                  <span className="text-brand font-black">${budget} USD/hr</span>
                </div>
                <input
                  id="hourly-budget-input"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-brand"
                  aria-label="Hourly Budget (USD)"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                  <span>$10 USD</span>
                  <span>$100 USD</span>
                </div>
              </div>

              {/* Experience Type Option */}
              <div className="space-y-2">
                <label htmlFor="experience-type-select" className="text-xs font-bold text-foreground block uppercase tracking-wider">Required Experience Type</label>
                <select
                  id="experience-type-select"
                  value={experienceType}
                  onChange={(e) => setExperienceType(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-foreground font-medium"
                >
                  <option value="culture">Swahili Culture & History</option>
                  <option value="food">Local Food & Dining Safaris</option>
                  <option value="adventure">Outdoor Adventure & Hikes</option>
                  <option value="nature">Wildlife & Conservation</option>
                  <option value="nightlife">City Walks & Nightlife</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="flex-1 text-muted-foreground hover:text-foreground font-semibold">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading} className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#0B3037] to-[#0D6F73] hover:from-[#06363D] hover:to-[#0B3037] text-white font-bold shadow-neo-pill border border-white/15">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Match Me Now
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Matching Radar Loader */}
        {step === "matching" && (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
            {/* Pulsating Radar Animation */}
            <div className="relative h-28 w-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-brand/30 bg-brand/15 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-brand/30 bg-brand/15 animate-pulse" />
              <div className="absolute inset-6 rounded-full border border-brand/30 bg-brand/15" />
              <Compass className="h-10 w-10 text-brand animate-spin-slow" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight text-foreground">Paging Available Hosts...</h3>
              <p className="text-muted-foreground text-xs max-w-[280px] font-medium">
                Matching with guides within 5km specializing in <span className="text-brand font-bold">{experienceType}</span>.
              </p>
            </div>

            {/* Countdown Display */}
            <div className="bg-secondary/60 border border-border px-4 py-2 rounded-full text-sm font-semibold text-foreground">
              Response limit: <span className="text-brand font-mono font-bold">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full border-border text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl font-semibold"
            >
              Cancel Match Request
            </Button>
          </div>
        )}

        {/* Step 3: Match Success */}
        {step === "success" && matchedHost && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2 border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-foreground">Guide Match Confirmed!</h3>
              <p className="text-muted-foreground text-xs font-medium">
                Your direct booking has been created successfully.
              </p>
            </div>

            {/* Matched Host Card */}
            <div className="bg-secondary/40 border border-border rounded-2xl p-4 flex gap-4 items-center justify-between">
              <div className="flex gap-4 items-center min-w-0">
                <img
                  src={matchedHost.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"}
                  alt={matchedHost.full_name}
                  className="h-14 w-14 rounded-full object-cover border border-brand/30 shadow-sm shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <h4 className="font-bold text-foreground text-base truncate">{matchedHost.full_name}</h4>
                  <p className="text-muted-foreground text-xs line-clamp-1">{matchedHost.bio || "Local expert guide"}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                    <span>Languages: {matchedHost.languages?.join(", ") || "English"}</span>
                  </div>
                </div>
              </div>
              <DirectMessageButton
                hostId={matchedHost.id}
                hostName={matchedHost.full_name}
                variant="pill"
                label="Chat"
                className="shrink-0"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={resetState}
                variant="outline"
                className="flex-1 border-border text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl font-semibold"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  resetState()
                  navigate("/dashboard") // Go to booking lists
                }}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#0B3037] to-[#0D6F73] hover:from-[#06363D] hover:to-[#0B3037] text-white font-bold shadow-neo-pill border border-white/15"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: No Hosts Matched / Expired */}
        {step === "no_hosts" && (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-foreground">No Guides Available</h3>
              <p className="text-muted-foreground text-xs max-w-[280px] font-medium">
                Sorry, no matching hosts accepted your request in your area within the timeframe. Please try increasing your budget or changing the experience type.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                type="button"
                onClick={resetState}
                variant="outline"
                className="flex-1 border-border text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl font-semibold"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setStep("form")
                  setRequestId(null)
                  setMatchedHost(null)
                }}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#0B3037] to-[#0D6F73] hover:from-[#06363D] hover:to-[#0B3037] text-white font-bold shadow-neo-pill border border-white/15"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
 )
}
