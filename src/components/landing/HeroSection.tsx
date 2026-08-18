import { Link } from "react-router-dom"
import { ArrowRight, Sparkles, XCircle, CheckCircle2, ShieldCheck, Video, DollarSign, Users } from "lucide-react"
import touristTrapBeach from "@/assets/images/hero/tourist_trap_beach.jpg"
import peacefulLocalBeach from "@/assets/images/hero/peaceful_local_beach.jpg"

export function HeroSection() {
  const touristTrapPoints = [
    "Overpriced tours with hidden fees",
    "Disappointing, staged experiences",
    "No way to verify quality before booking",
    "Wasted vacation time and money",
  ]

  const smartWayPoints = [
    "Live video reconnaissance tour",
    "See exactly what you're booking",
    "Vetted and certified local hosts",
    "Transparent pricing — zero surprises",
  ]

  const trustBadges = [
    { icon: ShieldCheck, label: "Vetted Local Hosts" },
    { icon: Video, label: "Live Video Reconnaissance" },
    { icon: DollarSign, label: "No Hidden Fees" },
    { icon: Users, label: "1,200+ Smart Travelers" },
  ]

  return (
    <section className="relative overflow-hidden bg-[#0f172a] text-white w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#334155]">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-12 sm:space-y-16">
        {/* Top Tag & Main Headline */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-semibold">
            <Sparkles className="size-4" />
            <span>Try Kenya Live Before You Fly</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.12] font-headline">
            Stop Wasting Money on <br className="hidden sm:inline" />
            <span className="text-red-400 line-through decoration-red-500/60 decoration-wavy decoration-2 sm:decoration-4">
              Tourist Traps.
            </span>
          </h1>

          <p className="text-[#94a3b8] text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-normal">
            Explore Kenya through a local's eyes before you book. Live video reconnaissance tours with vetted local guides. Skip the scams.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/tours"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm sm:text-base transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <span>Explore Live Tours</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/waitlist"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] hover:border-blue-500/40 font-bold rounded-xl text-sm sm:text-base transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <Sparkles className="size-4 text-blue-400" />
              <span>Join Early Waitlist</span>
            </Link>
          </div>
        </div>

        {/* Visual Split-Screen Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {/* Left: The Tourist Trap */}
          <div className="rounded-3xl bg-[#1e293b] border-2 border-red-500/40 p-6 sm:p-8 flex flex-col justify-between shadow-2xl space-y-6 relative overflow-hidden group hover:border-red-500/70 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                    <XCircle className="size-5" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-red-400 font-headline">
                    The Tourist Trap
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider">
                  Outdated
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-video border border-red-500/20 shadow-md">
                <img
                  src={touristTrapBeach}
                  alt="Crowded chaotic tourist trap beach with overpriced commercial clutter"
                  loading="eager"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b]/90 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs text-red-200 font-semibold bg-red-950/80 px-2.5 py-1 rounded-lg w-fit border border-red-500/30">
                    Crowded • Overpriced • Staged
                  </p>
                </div>
              </div>

              <ul className="space-y-3 pt-2">
                {touristTrapPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#cbd5e1]">
                    <XCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: The Smart Way */}
          <div className="rounded-3xl bg-[#1e293b] border-2 border-green-500/50 p-6 sm:p-8 flex flex-col justify-between shadow-2xl space-y-6 relative overflow-hidden group hover:border-green-400 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-green-500/20 text-green-400">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-green-400 font-headline">
                    The Smart Way
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold uppercase tracking-wider">
                  Ausaguide
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-video border border-green-500/30 shadow-md">
                <img
                  src={peacefulLocalBeach}
                  alt="Peaceful serene hidden local beach in Kenya with authentic dhow boat"
                  loading="eager"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b]/90 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs text-green-200 font-semibold bg-green-950/80 px-2.5 py-1 rounded-lg w-fit border border-green-500/40">
                    Authentic • Live Verified • Local-Led
                  </p>
                </div>
              </div>

              <ul className="space-y-3 pt-2">
                {smartWayPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-white font-medium">
                    <CheckCircle2 className="size-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Trust Badges Bar */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4 sm:p-6 max-w-5xl mx-auto shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon
              return (
                <div key={idx} className="flex flex-col items-center justify-center gap-2 p-2">
                  <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#cbd5e1]">{badge.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
