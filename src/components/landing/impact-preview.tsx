import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { TreePine, Heart, ArrowRight } from "lucide-react"
import { GradientText } from "@/components/ui/GradientText"
import { BorderGlow } from "@/components/ui/BorderGlow"

export function ImpactPreview() {
  return (
    <section className="py-24 bg-[#16161A] relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 h-[400px] w-[500px] rounded-full bg-[#2CB67D]/2 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2CB67D]/35 bg-[#2CB67D]/10 text-xs font-bold uppercase tracking-wider text-[#2CB67D] mb-3">
            Sustain & Restore
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            <GradientText
              colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
              animationSpeed={4}
              yoyo={true}
            >
              Donation & Sponsorship
            </GradientText>
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Every booking fuels real-world change. Partner with local hosts to restore deforested reserves or sponsor mental health initiatives across Kenya.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          
          {/* Card 1: Tree Planting Initiative */}
          <BorderGlow
            glowColor="160 70 45" // Teal/green color code proxy
            glowIntensity={0.7}
            borderRadius={16}
            backgroundColor="#121214"
            colors={["#2CB67D", "#2CB67D", "#FFFFFE"]}
          >
            <div className="flex flex-col h-full bg-[#121214]/80 border border-border rounded-2xl overflow-hidden group">
              {/* Image header */}
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80"
                  alt="Tree seedling planting"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121214] to-transparent" />
                <span className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] bg-[#2CB67D]/20 text-[#2CB67D] border border-[#2CB67D]/30 px-3 py-1 rounded-full font-black tracking-wider uppercase">
                  <span className="size-1.5 rounded-full bg-[#2CB67D] animate-ping" />
                  BETA
                </span>
              </div>

              {/* Body */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TreePine className="size-5 text-[#2CB67D]" />
                    <h3 className="text-xl font-bold text-white group-hover:text-[#2CB67D] transition-colors">
                      Tree Planting Initiative
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                    Offset the carbon footprint of your Kenyan travels. For every sponsored package, we work hand-in-hand with local conservation communities to plant indigenous saplings in degraded forests.
                  </p>
                </div>

                <Link to="/tree-planting" className="inline-block self-start w-full sm:w-auto">
                  <Button className="bg-[#2CB67D] text-[#16161A] hover:bg-[#2CB67D]/95 gap-1.5 font-bold rounded-xl px-6 py-2.5 text-xs cursor-pointer shadow-lg w-full sm:w-auto">
                    Plant Trees
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </BorderGlow>

          {/* Card 2: Mental Health Sponsorship */}
          <BorderGlow
            glowColor="260 70 60" // Purple color code proxy
            glowIntensity={0.7}
            borderRadius={16}
            backgroundColor="#121214"
            colors={["#7F5AF0", "#7F5AF0", "#FFFFFE"]}
          >
            <div className="flex flex-col h-full bg-[#121214]/80 border border-border rounded-2xl overflow-hidden group">
              {/* Image header */}
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80"
                  alt="Yoga meditation in green forest"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121214] to-transparent" />
                <span className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] bg-[#7F5AF0]/20 text-[#7F5AF0] border border-[#7F5AF0]/30 px-3 py-1 rounded-full font-black tracking-wider uppercase">
                  <span className="size-1.5 rounded-full bg-[#7F5AF0] animate-ping" />
                  LIVE
                </span>
              </div>

              {/* Body */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="size-5 text-[#7F5AF0]" />
                    <h3 className="text-xl font-bold text-white group-hover:text-[#7F5AF0] transition-colors">
                      Mental Health Sponsorship
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                    Sponsor healing retreats for local community helpers and guides. Your sponsorship supports holistic mental health wellness journeys that allow local caregivers to heal, recharge, and connect in nature.
                  </p>
                </div>

                <Link to="/mental-health" className="inline-block self-start w-full sm:w-auto">
                  <Button className="bg-[#7F5AF0] text-white hover:bg-[#7F5AF0]/95 gap-1.5 font-bold rounded-xl px-6 py-2.5 text-xs cursor-pointer shadow-lg w-full sm:w-auto">
                    Sponsor Mental Health
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </BorderGlow>

        </div>
      </div>
    </section>
  )
}
export default ImpactPreview
