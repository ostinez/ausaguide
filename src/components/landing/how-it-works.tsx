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
  "/src/assets/images/home/book_phone.png", // Step 1: smartphone search
  "/src/assets/images/home/book_confirm.png", // Step 2: booking confirmation
  "/src/assets/images/home/virtual_tour.png", // Step 3: virtual video call
  "/src/assets/images/home/physical_tour.png", // Step 4: physical guided tour
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[600px] rounded-full bg-[#7F5AF0]/3 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#7F5AF0]/30 bg-[#7F5AF0]/10 text-xs font-bold uppercase tracking-wider text-[#7F5AF0] mb-3">
            Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            <GradientText
              colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
              animationSpeed={4}
              yoyo={true}
            >
              How It Works
            </GradientText>
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Four simple steps to your next unforgettable live local experience in Kenya
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step, i) => {
            return (
              <SpotlightCard
                key={step.step}
                className="relative text-left p-8 border border-border bg-[#16161A]/40 rounded-2xl flex flex-col justify-between min-h-[260px] hover:border-primary/20 transition-all duration-300 group"
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
                    <span className="text-5xl font-black text-white/5 group-hover:text-primary/10 transition-colors select-none font-mono">
                      {`0${step.step}`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <img
                      src={stepImages[i]}
                      alt={`Traveler experience: ${step.title}`}
                      className="w-full h-32 object-cover rounded-xl border border-border mb-3"
                    />
                    <h3 className="text-lg font-bold text-white group-hover:text-[#2CB67D] transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
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
