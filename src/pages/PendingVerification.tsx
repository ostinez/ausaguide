import { Link, useNavigate } from "react-router-dom"
import { Clock, ArrowLeft, Compass, ShieldCheck, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSEO } from "@/hooks/useSEO"

export default function PendingVerificationPage() {
  const navigate = useNavigate()
  useSEO({
    title: "Verification Pending | Ausaguide",
    description: "Your guide/host application is currently under review by the Ausaguide team.",
  })

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[#091413] text-white overflow-hidden">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] rounded-full bg-[#0D6F73]/20 blur-[140px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[300px] rounded-full bg-[#10b981]/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Card Container */}
        <div className="rounded-3xl border border-[#235E5D]/40 bg-[#0c1a19]/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl shadow-black/60 transition-all">
          {/* Animated Clock Badge */}
          <div className="relative mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0D6F73]/30 via-amber-500/20 to-emerald-500/20 border border-amber-400/40 shadow-lg shadow-amber-500/10">
            <div className="absolute -inset-1 rounded-2xl bg-amber-400/20 blur-md animate-pulse" />
            <Clock className="relative size-10 text-amber-300" aria-hidden="true" />
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-4">
            Verification Pending
          </h1>

          {/* Body */}
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-8 max-w-md mx-auto">
            Your guide/host application is currently under review. You will receive an email as soon as the admin approves your account. In the meantime, you can still explore Ausaguide and book tours as a traveler.
          </p>

          {/* Quick Info Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#142928]/80 border border-[#235E5D]/30">
              <Mail className="size-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-gray-200 block">Email Update</span>
                <span className="text-gray-400">Notification sent upon review</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#142928]/80 border border-[#235E5D]/30">
              <ShieldCheck className="size-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-gray-200 block">TRA Licensing</span>
                <span className="text-gray-400">Strict safety verification</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            {/* Primary Required Button */}
            <Button
              type="button"
              onClick={() => navigate("/")}
              className="w-full sm:w-auto min-w-[180px] bg-gradient-to-r from-[#0D6F73] to-[#10b981] hover:from-[#0a585b] hover:to-[#059669] text-white font-medium py-2.5 px-6 rounded-xl shadow-lg shadow-[#0D6F73]/25 transition-all cursor-pointer"
            >
              <ArrowLeft className="mr-2 size-4" />
              Return to Home
            </Button>

            {/* Traveler exploration option */}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/tours")}
              className="w-full sm:w-auto border-[#235E5D] bg-[#142928]/60 text-gray-200 hover:text-white hover:bg-[#1f3f3e] py-2.5 px-5 rounded-xl cursor-pointer"
            >
              <Compass className="mr-2 size-4 text-primary" />
              Explore Tours
            </Button>
          </div>
        </div>

        {/* Footer help link */}
        <p className="mt-6 text-xs text-gray-500">
          Have urgent questions about your license submission?{" "}
          <Link to="/help" className="text-[#38b2ac] hover:underline underline-offset-2">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}
