import { HowItWorks } from "@/components/landing/how-it-works"
import { useSEO } from "@/hooks/useSEO"
import { Link } from "react-router-dom"
import { ArrowLeft, Sparkles } from "lucide-react"

export default function HowItWorksPage() {
  useSEO({
    title: "How It Works | Ausaguide",
    description: "Discover how Ausaguide connects travelers with verified local guides in Kenya through live video, authentic cultural tours, and instant booking.",
  })

  return (
    <div className="min-h-screen bg-background pt-20 pb-20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[400px] rounded-full bg-[#0D6F73]/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Navigation back link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide">
            <Sparkles className="size-3.5" />
            Simple & Transparent
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight font-headline">
            How Ausaguide Works
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Whether you want to explore Nairobi virtually before booking a flight, or share your hometown and earn as a local guide — here is how it works.
          </p>
        </div>

        {/* Interactive Component */}
        <div className="w-full">
          <HowItWorks />
        </div>
      </div>
    </div>
  )
}
