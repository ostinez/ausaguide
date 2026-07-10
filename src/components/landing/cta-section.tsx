import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Globe, Users } from "lucide-react"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { GlareHover } from "@/components/ui/GlareHover"
import { StarBorder } from "@/components/ui/StarBorder"

export function CTASection() {

  const showBecomeHost = false

  return (
    <section className="py-20 bg-[#16161A]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className={showBecomeHost ? "grid grid-cols-1 gap-8 md:grid-cols-2" : "flex justify-center"}>
          
          {/* Card 1: Find Your Experience */}
          <div className={`relative rounded-3xl border border-primary/20 bg-card overflow-hidden p-8 flex flex-col justify-between min-h-[320px] ${!showBecomeHost ? "max-w-lg w-full" : ""}`}>
            {/* Background image & overlay */}
            <div 
              role="img"
              aria-label="Kenyan travelers enjoying a peaceful moment in Kenya's coastal region near Watamu at sunset"
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105" 
              style={{ backgroundImage: "url('/images/home/cta_coast.png')" }} 
            />
            <div className="absolute inset-0 bg-black/80 backdrop-blur-[1px]" />

            {/* Content */}
            <div className="relative z-10 space-y-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <Globe className="size-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  Find Your Experience
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Browse hundreds of unique tours led by verified local guides across Kenya.
                  Virtual or in-person -- your adventure awaits.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-6">
              <Link to="/tours">
                <GlareHover style={{ borderRadius: "9999px", display: "inline-block" }}>
                  <StarBorder
                    as="div"
                    color="#7F5AF0"
                    speed="4s"
                    thickness={2}
                    className="rounded-full inline-block"
                  >
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold px-6 py-5">
                      Explore Tours
                      <ArrowRight className="size-4" />
                    </Button>
                  </StarBorder>
                </GlareHover>
              </Link>
            </div>
          </div>

          {/* Card 2: Share Your World */}
          {showBecomeHost && (
            <BorderGlow
              edgeSensitivity={30}
              glowColor="260 70 60"
              backgroundColor="#16161A"
              borderRadius={28}
              glowRadius={40}
              glowIntensity={0.8}
              coneSpread={25}
              animated={false}
              colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
              className="w-full min-h-[320px]"
            >
              <div className="relative p-8 h-full flex flex-col justify-between overflow-hidden rounded-3xl">
                {/* Background image & overlay */}
                <div 
                  role="img"
                  aria-label="A Kenyan community planting trees in a reforestation project near Rift Valley"
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105" 
                  style={{ backgroundImage: "url('/images/home/cta_tree.png')" }} 
                />
                <div className="absolute inset-0 bg-black/80 backdrop-blur-[1px]" />

                {/* Content */}
                <div className="relative z-10 space-y-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-teal/10 border border-teal/20 backdrop-blur-sm">
                    <Users className="size-6 text-teal" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">
                      Share Your World
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      Turn your local knowledge into income. Join our community of hosts and
                      share your unique corner of Kenya with the world.
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-6">
                  <Link to="/host/signup">
                    <GlareHover style={{ borderRadius: "9999px", display: "inline-block" }}>
                      <StarBorder
                        as="div"
                        color="#2CB67D"
                        speed="4s"
                        thickness={2}
                        className="rounded-full inline-block"
                      >
                        <Button className="bg-teal text-teal-foreground hover:bg-teal/90 rounded-full font-bold px-6 py-5">
                          Become a Host
                          <ArrowRight className="size-4" />
                        </Button>
                      </StarBorder>
                    </GlareHover>
                  </Link>
                </div>
              </div>
            </BorderGlow>
          )}

        </div>
      </div>
    </section>
  )
}
export default CTASection
