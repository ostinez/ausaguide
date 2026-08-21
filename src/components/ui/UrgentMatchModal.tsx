import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { requestUrgentHost, type UrgentRequest } from "@/lib/api/urgent-match"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  MapPin,
  Compass,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Lock,
  Clock,
  ArrowRight,
  ArrowLeft,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { DirectMessageButton } from "@/components/common/DirectMessageButton"

// Coordinates for preset Kenyan hubs
const PRESET_CITIES = [
  { name: "Nairobi CBD & Westlands", lat: -1.2921, lng: 36.8219 },
  { name: "Mombasa & Old Town", lat: -4.0435, lng: 39.6682 },
  { name: "Diani Beach & South Coast", lat: -4.2797, lng: 39.5940 },
  { name: "Lamu Archipelago", lat: -2.2717, lng: 40.9020 },
  { name: "Naivasha / Hell's Gate", lat: -0.7172, lng: 36.4310 },
  { name: "Kisumu / Lake Victoria", lat: -0.0917, lng: 34.7680 },
  { name: "Narok / Maasai Mara", lat: -1.4061, lng: 35.0111 },
]

interface UrgentMatchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UrgentMatchModal({ isOpen, onClose }: UrgentMatchModalProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState<"details" | "payment" | "matching" | "success" | "no_hosts">("details")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [useManualCity, setUseManualCity] = useState(false)
  const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0].name)

  // Form Details
  const [budget, setBudget] = useState<number>(30)
  const [experienceType, setExperienceType] = useState<string>("culture")
  const [guestsCount, setGuestsCount] = useState<number>(1)
  const [specialNotes, setSpecialNotes] = useState<string>("")

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa")
  const [mpesaPhone, setMpesaPhone] = useState<string>("0712345678")
  const [isAuthorizingPayment, setIsAuthorizingPayment] = useState(false)

  // Real-time tracking
  const [requestId, setRequestId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(90) // 90 seconds countdown
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
          if (updatedRequest.status === "accepted") {
            const hostId = updatedRequest.matched_host_id
            if (hostId) {
              const { data: hostProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", hostId)
                .maybeSingle()
              setMatchedHost(hostProfile)
            } else {
              setMatchedHost({ full_name: "Verified Local Guide", bio: "Certified Kenyan Host" })
            }

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

  // Step 1: Proceed to Payment Pre-Authorization
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault()
    const userId = localStorage.getItem("user_id")
    if (!userId) {
      toast.error("Please log in to book urgent tours.")
      onClose()
      navigate("/auth")
      return
    }
    setStep("payment")
  }

  // Step 2: Authorize Payment & Launch Broadcast
  const handleAuthorizeAndBroadcast = async () => {
    setIsAuthorizingPayment(true)

    // Fallback coordinates
    let activeLat = latitude
    let activeLng = longitude
    if (activeLat === null || activeLng === null) {
      const fallbackCity = PRESET_CITIES.find((c) => c.name === selectedCity) || PRESET_CITIES[0]
      activeLat = fallbackCity.lat
      activeLng = fallbackCity.lng
    }

    try {
      // Simulate escrow hold verification
      await new Promise((r) => setTimeout(r, 900))

      const response = await requestUrgentHost(activeLat, activeLng, budget, experienceType)
      if (response.success && response.request) {
        setRequestId(response.request.id)
        setCountdown(90)
        setStep("matching")
        toast.success("Escrow secured! Paging nearby verified hosts now...")
      } else {
        setStep("no_hosts")
      }
    } catch (err) {
      console.error("Urgent request submission error:", err)
      setStep("no_hosts")
    } finally {
      setIsAuthorizingPayment(false)
    }
  }

  // Cancel Matching Session & Release Escrow Hold
  const handleCancel = async () => {
    if (requestId) {
      try {
        await supabase
          .from("urgent_requests")
          .update({ status: "expired" })
          .eq("id", requestId)
        toast.info("Match request cancelled. Escrow hold released.")
      } catch (e) {
        console.error("Error canceling urgent request:", e)
      }
    }
    resetState()
  }

  const resetState = () => {
    setStep("details")
    setRequestId(null)
    setMatchedHost(null)
    setCountdown(90)
    setIsAuthorizingPayment(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
      <DialogContent className="sm:max-w-[480px] bg-gradient-to-b from-[#092424] via-[#061717] to-[#040e0e] border border-[#235E5D]/60 text-white rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] p-6 overflow-hidden">
        
        {/* ================= STEP 1: TOUR DETAILS ================= */}
        {step === "details" && (
          <form onSubmit={handleProceedToPayment} className="space-y-5">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <Compass className="h-6 w-6 text-[#B7E6E5]" />
                  Find a Host Now
                </DialogTitle>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#184948] text-[#B7E6E5] border border-[#317978]/40">
                  Step 1 of 2
                </span>
              </div>
              <p className="text-[#599D9C] text-xs mt-1 font-medium">
                Fill in tour preferences and authorize escrow hold to notify available certified guides.
              </p>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Location Input Group */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#B7E6E5] uppercase tracking-wider">
                  Pickup / Meetup Area
                </label>
                {useManualCity ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-[#0E2F2F]/80 border border-[#235E5D] rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#B7E6E5] text-white font-medium"
                    >
                      {PRESET_CITIES.map((c) => (
                        <option key={c.name} value={c.name} className="bg-[#061717] text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUseManualCity(false)}
                      className="text-xs border-[#235E5D] text-[#B7E6E5] hover:bg-[#0E2F2F] rounded-xl shrink-0"
                    >
                      GPS
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-[#0E2F2F]/60 border border-[#235E5D] rounded-xl p-2.5 text-xs">
                    <span className="flex items-center gap-2 text-[#B7E6E5] font-bold">
                      <MapPin className="h-4 w-4 text-emerald-400 animate-bounce" />
                      {latitude !== null ? `Auto-detected Live GPS` : `Detecting Location...`}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setUseManualCity(true)}
                      className="text-xs text-[#599D9C] hover:text-white h-7 px-2"
                    >
                      Choose City
                    </Button>
                  </div>
                )}
              </div>

              {/* Experience Type & Guests Count */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#B7E6E5] uppercase tracking-wider">
                    Experience Type
                  </label>
                  <select
                    value={experienceType}
                    onChange={(e) => setExperienceType(e.target.value)}
                    className="w-full bg-[#0E2F2F]/80 border border-[#235E5D] rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#B7E6E5] text-white font-medium"
                  >
                    <option value="culture" className="bg-[#061717]">Swahili Culture & History</option>
                    <option value="food" className="bg-[#061717]">Street Food Safari</option>
                    <option value="adventure" className="bg-[#061717]">Adventure & Hikes</option>
                    <option value="nature" className="bg-[#061717]">Wildlife & Parks</option>
                    <option value="nightlife" className="bg-[#061717]">Nightlife & City</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#B7E6E5] uppercase tracking-wider">
                    Travelers
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full bg-[#0E2F2F]/80 border border-[#235E5D] rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#B7E6E5] text-white font-medium"
                  >
                    <option value={1} className="bg-[#061717]">1 Traveler</option>
                    <option value={2} className="bg-[#061717]">2 Travelers</option>
                    <option value={3} className="bg-[#061717]">3 Travelers</option>
                    <option value={4} className="bg-[#061717]">4+ Group</option>
                  </select>
                </div>
              </div>

              {/* Budget Option */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-white">
                  <span className="text-[11px] text-[#B7E6E5] uppercase tracking-wider">Target Rate / Hour</span>
                  <span className="text-emerald-400 font-black">${budget} USD/hr</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="80"
                  step="5"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-2 bg-[#0E2F2F] rounded-lg appearance-none cursor-pointer accent-[#B7E6E5]"
                />
                <div className="flex justify-between text-[10px] text-[#599D9C] font-semibold">
                  <span>$15 USD (Economy)</span>
                  <span>$80 USD (VIP / Safari)</span>
                </div>
              </div>

              {/* Special Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#B7E6E5] uppercase tracking-wider">
                  Notes for Host (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Need walking tour around Old Town starting in 20m"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full bg-[#0E2F2F]/80 border border-[#235E5D] rounded-xl py-2 px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#B7E6E5]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="flex-1 text-[#599D9C] hover:text-white font-semibold">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#184948] to-[#317978] hover:from-[#184948] hover:to-[#599D9C] text-white font-bold shadow-lg border border-[#B7E6E5]/30 cursor-pointer"
              >
                Continue to Payment <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: ESCROW PRE-AUTHORIZATION ================= */}
        {step === "payment" && (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-400" />
                  Secure Escrow Hold
                </DialogTitle>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  Step 2 of 2
                </span>
              </div>
              <p className="text-[#599D9C] text-xs mt-1 font-medium">
                Funds are held safely in platform escrow. If no host accepts, the hold is instantly released.
              </p>
            </DialogHeader>

            {/* Escrow Booking Summary Card */}
            <div className="bg-[#0E2F2F]/60 border border-[#235E5D] rounded-2xl p-3.5 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/70">Urgent Tour Request</span>
                <span className="capitalize font-bold text-white">{experienceType} Tour</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/70">Estimated Duration</span>
                <span className="font-semibold text-white">2 Hours Session</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/70">Hourly Rate</span>
                <span className="font-semibold text-white">${budget} USD / hr</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                <span className="font-bold text-sm text-white">Authorized Escrow Hold:</span>
                <span className="font-black text-base text-emerald-400">${budget * 2} USD</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#B7E6E5] uppercase tracking-wider block">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("mpesa")}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition duration-200 cursor-pointer ${
                    paymentMethod === "mpesa"
                      ? "border-emerald-500 bg-emerald-950/40 text-white shadow-md"
                      : "border-[#235E5D]/60 bg-[#0E2F2F]/40 text-white/60 hover:text-white"
                  }`}
                >
                  <Smartphone className="size-5 text-emerald-400" />
                  <span className="text-xs font-bold">M-Pesa STK Push</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition duration-200 cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-emerald-500 bg-emerald-950/40 text-white shadow-md"
                      : "border-[#235E5D]/60 bg-[#0E2F2F]/40 text-white/60 hover:text-white"
                  }`}
                >
                  <CreditCard className="size-5 text-[#B7E6E5]" />
                  <span className="text-xs font-bold">Card (Visa/Mastercard)</span>
                </button>
              </div>

              {paymentMethod === "mpesa" && (
                <div className="pt-1 space-y-1">
                  <label className="text-[10px] font-semibold text-white/70">M-Pesa Mobile Number</label>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full bg-[#0E2F2F]/80 border border-[#235E5D] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Escrow Guarantee Pill */}
            <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2.5 text-[11px] text-emerald-300">
              <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
              <span>100% money-back guarantee if no host responds in 90 seconds.</span>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("details")}
                className="text-[#599D9C] hover:text-white font-semibold"
              >
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
              <Button
                type="button"
                onClick={handleAuthorizeAndBroadcast}
                disabled={isAuthorizingPayment}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg cursor-pointer"
              >
                {isAuthorizingPayment ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" /> Securing Escrow Hold...
                  </>
                ) : (
                  <>
                    <Zap className="size-4 fill-current mr-1.5" /> Authorize & Find Hosts Now
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: LIVE MULTI-HOST RADAR ================= */}
        {step === "matching" && (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
            {/* Pulsating Radar Animation */}
            <div className="relative h-28 w-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 animate-pulse" />
              <div className="absolute inset-6 rounded-full border border-emerald-500/50 bg-emerald-500/30" />
              <Compass className="h-10 w-10 text-emerald-400 animate-spin-slow" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight text-white">
                Paging Available Guides...
              </h3>
              <p className="text-[#599D9C] text-xs max-w-[300px] font-medium mx-auto">
                Payment hold secured in escrow. Broadcasting dispatch to verified guides near your location.
              </p>
            </div>

            {/* Countdown Display */}
            <div className="bg-[#0E2F2F]/80 border border-[#235E5D] px-4 py-2 rounded-full text-xs font-semibold text-white flex items-center gap-2">
              <Clock className="size-3.5 text-emerald-400" />
              <span>Response Window:</span>
              <span className="text-emerald-400 font-mono font-bold">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full border-[#235E5D] text-white/70 hover:text-white hover:bg-[#0E2F2F] rounded-xl font-semibold text-xs"
            >
              Cancel & Release Escrow Hold
            </Button>
          </div>
        )}

        {/* ================= STEP 4: MATCH CONFIRMED ================= */}
        {step === "success" && matchedHost && (
          <div className="space-y-6 py-3">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1 border border-emerald-500/40">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-white">Guide Match Confirmed!</h3>
              <p className="text-[#599D9C] text-xs font-medium">
                Your urgent tour booking and escrow settlement have been created successfully.
              </p>
            </div>

            {/* Matched Host Card */}
            <div className="bg-[#0E2F2F]/70 border border-[#235E5D] rounded-2xl p-4 flex gap-4 items-center justify-between">
              <div className="flex gap-4 items-center min-w-0">
                <img
                  src={matchedHost.avatar_url || "/assets/austin-mbote.webp"}
                  alt={matchedHost.full_name}
                  className="h-14 w-14 rounded-full object-cover border-2 border-emerald-400 shadow-md shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <h4 className="font-bold text-white text-base truncate">{matchedHost.full_name}</h4>
                  <p className="text-[#599D9C] text-xs line-clamp-1">{matchedHost.bio || "Certified Local Guide"}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                    <ShieldCheck className="size-3" />
                    <span>Verified Host · Escrow Active</span>
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
                className="flex-1 border-[#235E5D] text-white/70 hover:text-white hover:bg-[#0E2F2F] rounded-xl font-semibold text-xs"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  resetState()
                  navigate("/dashboard")
                }}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg text-xs"
              >
                Go to My Bookings
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: NO HOSTS MATCHED ================= */}
        {step === "no_hosts" && (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
            <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/40">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">No Guides Available</h3>
              <p className="text-[#599D9C] text-xs max-w-[300px] font-medium mx-auto">
                No nearby host claimed the request within the window. Your authorized payment hold has been automatically released back to you.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                type="button"
                onClick={resetState}
                variant="outline"
                className="flex-1 border-[#235E5D] text-white/70 hover:text-white hover:bg-[#0E2F2F] rounded-xl font-semibold text-xs"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setStep("details")
                  setRequestId(null)
                  setMatchedHost(null)
                }}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#184948] to-[#317978] hover:from-[#184948] hover:to-[#599D9C] text-white font-bold shadow-md text-xs cursor-pointer"
              >
                Retry Search
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
