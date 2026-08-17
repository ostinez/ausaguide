import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { TreePine, Heart, ArrowRight } from "lucide-react"
import { GradientText } from "@/components/ui/GradientText"
import { BorderGlow } from "@/components/ui/BorderGlow"

export function ImpactPreview() {
  return (
    <section className="py-24 bg-background relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand/20 bg-brand/10 text-xs font-bold uppercase tracking-wider text-brand mb-3">
            Sustain & Restore
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
            <GradientText
              colors={["#06363D", "#0D6F73", "#06363D"]}
              animationSpeed={4}
              yoyo={true}
            >
              Donation & Sponsorship
            </GradientText>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed font-medium">
            Every booking fuels real-world change. Partner with local hosts to restore deforested reserves or sponsor mental health initiatives across Kenya.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          
          {/* Card 1: Tree Planting Initiative */}
          <BorderGlow
            glowColor="183 70 25"
            glowIntensity={0.5}
            borderRadius={16}
            className="w-full h-full"
          >
            <div className="flex flex-col h-full bg-card shadow-modern border border-border rounded-2xl overflow-hidden group">
              {/* Image header */}
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80"
                  alt="Tree seedling planting"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] bg-brand/90 text-white px-3 py-1 rounded-full font-black tracking-wider uppercase shadow">
                  <span className="size-1.5 rounded-full bg-white animate-ping" />
                  BETA
                </span>
              </div>

              {/* Body */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TreePine className="size-5 text-brand" />
                    <h3 className="text-xl font-bold text-foreground group-hover:text-brand transition-colors">
                      Tree Planting Initiative
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Offset the carbon footprint of your Kenyan travels. For every sponsored package, we work hand-in-hand with local conservation communities to plant indigenous saplings in degraded forests.
                  </p>
                </div>

                <Link to="/tree-planting" className="inline-block self-start w-full sm:w-auto">
                  <Button className="h-10 px-6 rounded-full bg-gradient-to-r from-[#0B3037] to-[#0D6F73] hover:from-[#06363D] hover:to-[#0B3037] text-white font-bold shadow-neo-pill border border-white/15 gap-1.5 text-xs transition cursor-pointer w-full sm:w-auto">
                    Plant Trees
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </BorderGlow>

          {/* Card 2: Mental Health Sponsorship */}
          <BorderGlow
            glowColor="183 70 25"
            glowIntensity={0.5}
            borderRadius={16}
            className="w-full h-full"
          >
            <div className="flex flex-col h-full bg-card shadow-modern border border-border rounded-2xl overflow-hidden group">
              {/* Image header */}
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80"
                  alt="Yoga meditation in green forest"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] bg-brand/90 text-white px-3 py-1 rounded-full font-black tracking-wider uppercase shadow">
                  <span className="size-1.5 rounded-full bg-white animate-ping" />
                  LIVE
                </span>
              </div>

              {/* Body */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="size-5 text-brand" />
                    <h3 className="text-xl font-bold text-foreground group-hover:text-brand transition-colors">
                      Mental Health Sponsorship
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Sponsor healing retreats for local community helpers and guides. Your sponsorship supports holistic mental health wellness journeys that allow local caregivers to heal, recharge, and connect in nature.
                  </p>
                </div>

                <Link to="/mental-health" className="inline-block self-start w-full sm:w-auto">
                  <Button className="h-10 px-6 rounded-full bg-gradient-to-r from-[#0B3037] to-[#0D6F73] hover:from-[#06363D] hover:to-[#0B3037] text-white font-bold shadow-neo-pill border border-white/15 gap-1.5 text-xs transition cursor-pointer w-full sm:w-auto">
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
