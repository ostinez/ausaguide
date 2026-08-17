import { Search, CalendarCheck, Video, Compass } from "lucide-react"
import { HOW_IT_WORKS_STEPS } from "@/lib/constants"
import { GradientText } from "@/components/ui/GradientText"
import { SpotlightCard } from "@/components/ui/SpotlightCard"
import { GlassIcons } from "@/components/ui/GlassIcons"

const icons = [
 <Search className="size-5 text-white" />,
 <CalendarCheck className="size-5 text-white" />,
 <Video className="size-5 text-white" />,
 <Compass className="size-5 text-white" />
]

const colors = ["purple", "teal", "indigo", "pink"]

const stepImages = [
 "/images/home/book_phone.webp", // Step 1: smartphone search
 "/images/home/book_confirm.webp", // Step 2: booking confirmation
 "/images/home/virtual_tour.webp", // Step 3: virtual video call
 "/images/home/physical_tour.webp", // Step 4: physical guided tour
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand/20 bg-brand/10 text-xs font-bold uppercase tracking-wider text-brand mb-3">
            Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
            <GradientText
              colors={["#06363D", "#0D6F73", "#06363D"]}
              animationSpeed={4}
              yoyo={true}
            >
              How It Works
            </GradientText>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed font-medium">
            Four simple steps to your next unforgettable live local experience in Kenya
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step, i) => {
            return (
              <SpotlightCard
                key={step.step}
                className="relative text-left p-8 border border-border bg-card shadow-modern rounded-2xl flex flex-col justify-between min-h-[260px] hover:border-brand/40 transition-all duration-300 group"
              >
                <div className="space-y-6">
                  {/* GlassIcon wrapper */}
                  <div className="flex items-center justify-between">
                    <GlassIcons
                      items={[{
                        icon: icons[i],
                        color: colors[i],
                        label: step.title,
                        active: true
                      }]}
                    />
                    <span className="text-5xl font-black text-foreground/10 group-hover:text-brand/20 transition-colors select-none font-mono">
                      {`0${step.step}`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <img
                      src={stepImages[i]}
                      alt={`Traveler experience: ${step.title}`}
                      className="w-full h-32 object-cover rounded-xl border border-border mb-3"
                    />
                    <h3 className="text-lg font-bold text-foreground group-hover:text-brand transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
export default HowItWorks
