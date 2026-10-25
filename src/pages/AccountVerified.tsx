import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ShieldCheck, ArrowRight, Compass, Sparkles, CheckCircle2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSEO } from "@/hooks/useSEO"
import { motion } from "framer-motion"

export default function AccountVerifiedPage() {
  const navigate = useNavigate()
  const [navigating, setNavigating] = useState(false)

  useSEO({
    title: "Account Verified | Ausaguide",
    description: "Your local host account is verified! Welcome to Ausaguide.",
  })

  const handleGoToDashboard = () => {
    setNavigating(true)
    navigate("/host-dashboard", { replace: true })
  }

  return (
    <div className="relative min-h-[88vh] flex items-center justify-center px-4 py-16 bg-[#091413] text-white overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] rounded-full bg-[#0D6F73]/25 blur-[150px] animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[350px] rounded-full bg-[#10b981]/15 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl text-center">
        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-3xl border border-[#235E5D]/50 bg-[#0c1a19]/95 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl shadow-black/70"
        >
          {/* Animated Verified Shield Icon */}
          <div className="relative mx-auto mb-6 flex size-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#0D6F73]/30 via-emerald-500/25 to-teal-400/20 border border-emerald-400/50 shadow-xl shadow-emerald-500/20">
            <div className="absolute -inset-1.5 rounded-3xl bg-emerald-400/20 blur-md animate-pulse" />
            <ShieldCheck className="relative size-12 text-emerald-400" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-[#091413] ring-4 ring-[#0c1a19]">
              <CheckCircle2 className="size-4 stroke-[3]" />
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
            Your account is verified! Welcome to Ausaguide.
          </h1>

          {/* Body description */}
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-8 max-w-md mx-auto">
            Your identity has been confirmed and your host account is fully activated. You are now ready to publish tours, share hidden gems, and welcome curious travelers to authentic Kenya experiences.
          </p>

          {/* Quick Perks Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
            <div className="flex flex-col gap-1 p-3.5 rounded-2xl bg-[#142928]/80 border border-[#235E5D]/30">
              <Sparkles className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold text-gray-200">Instant Hosting</span>
              <span className="text-[11px] text-gray-400">Publish your tours right away</span>
            </div>
            <div className="flex flex-col gap-1 p-3.5 rounded-2xl bg-[#142928]/80 border border-[#235E5D]/30">
              <ShieldCheck className="size-4 text-teal-400" />
              <span className="text-xs font-semibold text-gray-200">Verified Badge</span>
              <span className="text-[11px] text-gray-400">Build trust with explorers</span>
            </div>
            <div className="flex flex-col gap-1 p-3.5 rounded-2xl bg-[#142928]/80 border border-[#235E5D]/30">
              <MapPin className="size-4 text-amber-400" />
              <span className="text-xs font-semibold text-gray-200">Live Kenya Map</span>
              <span className="text-[11px] text-gray-400">Visible to global guests</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-center">
            {/* Primary Action Button */}
            <Button
              id="go-to-host-dashboard-btn"
              type="button"
              disabled={navigating}
              onClick={handleGoToDashboard}
              className="w-full sm:w-auto min-w-[200px] bg-gradient-to-r from-[#0D6F73] to-[#10b981] hover:from-[#0a585b] hover:to-[#059669] text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-[#0D6F73]/30 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="size-4" />
            </Button>

            {/* Secondary Action Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/tours")}
              className="w-full sm:w-auto border-[#235E5D] bg-[#142928]/60 text-gray-200 hover:text-white hover:bg-[#1f3f3e] py-3 px-6 rounded-xl text-sm cursor-pointer"
            >
              <Compass className="mr-2 size-4 text-primary" />
              Explore Tours
            </Button>
          </div>
        </motion.div>

        {/* Footer Support Notice */}
        <p className="mt-6 text-xs text-gray-500">
          Need tips on creating your first tour?{" "}
          <Link to="/help" className="text-[#38b2ac] hover:underline underline-offset-2">
            Visit Host Help Center
          </Link>
        </p>
      </div>
    </div>
  )
}
