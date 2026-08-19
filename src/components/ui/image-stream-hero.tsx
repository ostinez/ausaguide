import { useState, useRef, useCallback, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  ShieldCheck,
  Video,
  DollarSign,
  Users,
  Compass,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Umbrella,
  Droplets,
  Heart,
  CreditCard,
  Mountain,
} from "lucide-react"
import "./image-stream-hero.css"

export interface ScenarioPair {
  id: string
  category: "mountain" | "beach" | "safari" | "waterfall" | "pets" | "pricing"
  categoryLabel: string
  icon: React.ComponentType<{ className?: string }>
  trap: {
    title: string
    scenario: string
    image: string
    location: string
    problem: string
    badge: string
    details: string[]
  }
  smart: {
    title: string
    scenario: string
    image: string
    location: string
    solution: string
    badge: string
    details: string[]
  }
}

export const SCENARIO_PAIRS: ScenarioPair[] = [
  {
    id: "mountain",
    category: "mountain",
    categoryLabel: "Mountain & Weather",
    icon: Mountain,
    trap: {
      title: "Zero-Visibility Rain & Fog Trap",
      scenario: "Unchecked Monsoon Weather",
      image: "/images/hero/option_c_foggy.jpg",
      location: "Mount Kenya Alpine Tarn · Freezing Monsoon Fog Trap",
      problem: "Hiker booked without local weather verification. The entire peak was swallowed in freezing torrential rain, zero visibility, and impenetrable fog.",
      badge: "Fogged Out & Ruined",
      details: [
        "Unverified forecast missed high-altitude localized monsoon",
        "Impassable knee-deep mud ruts trapped transport vehicles",
        "0% visibility with freezing rain ruining the entire trek",
        "No live local host to advise postponing to the clear window",
      ],
    },
    smart: {
      title: "Crystal-Clear Golden Sunrise Summit",
      scenario: "Scouted Local Weather Window",
      image: "/images/hero/option_c_sunrise.jpg",
      location: "Mount Kenya Alpine Tarn · Crystal Sunrise Clarity",
      solution: "Local verified reconnaissance confirmed crystal-clear skies, dry alpine trails, and radiant golden sunrise illumination.",
      badge: "Scouted Sunrise Clarity",
      details: [
        "Verified summit visibility & dry ridge conditions by resident alpine scout",
        "Breathtaking 360° views of Batian & Nelion peaks in golden sunlight",
        "Optimal morning departure scheduled according to micro-climate patterns",
        "100% confidence before spending thousands on summit permits and gear",
      ],
    },
  },
  {
    id: "beach",
    category: "beach",
    categoryLabel: "Beach & Coast",
    icon: Umbrella,
    trap: {
      title: "Overcrowded Tourist Trap Beach",
      scenario: "Commercial Noise & Trash",
      image: "/images/corridor/trap_beach.jpg",
      location: "Commercial Strip, Mombasa Coast",
      problem: "Packed shoulder-to-shoulder with aggressive touts, littered sand, and overpriced staged beach stalls.",
      badge: "Overrun & Noisy",
      details: [
        "Unfiltered marketing photos hid the massive overcrowding",
        "Persistent touts and aggressive vendors every 2 minutes",
        "Littered sand with zero quiet relaxation space",
        "Wasted full vacation day and heavy transport costs",
      ],
    },
    smart: {
      title: "Private Secluded Watamu Cove",
      scenario: "Live-Verified Hidden Paradise",
      image: "/images/corridor/smart_beach.jpg",
      location: "Watamu Marine Sanctuary, Kenya",
      solution: "Discovered via live host video scouting. Pristine turquoise waters, quiet sands, and an authentic dhow sailboat.",
      badge: "Verified Secluded",
      details: [
        "Verified uncrowded via live host video stream",
        "Direct connection with authentic local dhow captains",
        "100% crystal turquoise water and clean coral sands",
        "Zero vendor harassment and total peace of mind",
      ],
    },
  },
  {
    id: "safari",
    category: "safari",
    categoryLabel: "Wildlife Safari",
    icon: Compass,
    trap: {
      title: "Failed Safari Van Breakdown",
      scenario: "Unvetted Budget Safari Trap",
      image: "/images/corridor/trap_safari_breakdown.jpg",
      location: "Maasai Mara Hinterland Dirt Road",
      problem: "Budget operator used a dilapidated minivan that overheated and broke down in the mud with no backup support.",
      badge: "Stranded 5+ Hours",
      details: [
        "Fake online reviews hid poorly maintained vehicles",
        "Stranded in the midday heat with no cell reception",
        "Missed the annual wildebeest river crossing",
        "Unlicensed operator refused to issue a refund",
      ],
    },
    smart: {
      title: "Reliable Certified 4x4 Safari Cruiser",
      scenario: "Certified Local Maasai Guide",
      image: "/images/corridor/smart_safari_guide.jpg",
      location: "Maasai Mara National Reserve, Kenya",
      solution: "Vetted 4x4 Land Cruiser with an experienced certified local guide tracking animal movements in real time.",
      badge: "Vetted & Certified",
      details: [
        "Custom heavy-duty 4x4 with open safari roof",
        "Licensed Maasai naturalist guide with 10+ years experience",
        "Live radio coordination for rare big cat sightings",
        "Ausaguide trip guarantee & breakdown replacement coverage",
      ],
    },
  },
  {
    id: "waterfall",
    category: "waterfall",
    categoryLabel: "Highland Waterfalls",
    icon: Droplets,
    trap: {
      title: "Misleading 'Hidden Falls' Trickle",
      scenario: "Bait-and-Switch Fake Photos",
      image: "/images/corridor/trap_waterfall.jpg",
      location: "Dry Highway Roadside, Rural Kenya",
      problem: "Advertised as a secluded tropical paradise, but was actually a dirty roadside runoff trickle behind a rusty fence.",
      badge: "Bait & Switch",
      details: [
        "Stock photos from 10 years ago used in marketing",
        "Located right next to a noisy, dusty highway",
        "Paid entry fee to an unauthorized roadside tout",
        "Disappointing dry season trickle with muddy puddle",
      ],
    },
    smart: {
      title: "Breathtaking Aberdare Forest Falls",
      scenario: "Exact Reconnaissance Delivered",
      image: "/images/corridor/smart_waterfall.jpg",
      location: "Aberdare Rainforest Canopy, Kenya",
      solution: "Live video reconnaissance verified the real current water flow and trail condition before paying a cent.",
      badge: "Live Recon Verified",
      details: [
        "Current water volume verified 24 hours in advance",
        "Guided rainforest trek along pristine moss-covered paths",
        "Magnificent cascading emerald pool swimming experience",
        "Accurate difficulty rating & genuine local insights",
      ],
    },
  },
  {
    id: "pets",
    category: "pets",
    categoryLabel: "Pet-Friendly Stay",
    icon: Heart,
    trap: {
      title: "Turned Away at Lodge Gate",
      scenario: "False 'Pet-Friendly' Listing",
      image: "/images/corridor/trap_no_pets.jpg",
      location: "Mara River Safari Lodge Entrance Gate",
      problem: "Website claimed 'pets welcome', but armed gate security strictly denied entry due to outdated online rules.",
      badge: "Entry Denied",
      details: [
        "Misleading portal filter with unverified pet rules",
        "Forced to pay an emergency boarding fee 40km away",
        "Vacation ruined before check-in even began",
        "Non-refundable upfront payment lost completely",
      ],
    },
    smart: {
      title: "Warmly Welcomed at Eco-Lodge",
      scenario: "Host-Confirmed Pet Policy",
      image: "/images/corridor/smart_pet_friendly.jpg",
      location: "Eco-Lodge Veranda, Great Rift Valley",
      solution: "Local host double-checked pet amenities, designated dog trails, and fresh water bowls directly with the lodge.",
      badge: "Host-Confirmed",
      details: [
        "Host directly contacted lodge manager before confirmation",
        "Dedicated pet-friendly terrace with fresh water bowl",
        "Safe walking trails mapped away from wildlife zones",
        "Zero awkward surprises at check-in gate",
      ],
    },
  },
  {
    id: "pricing",
    category: "pricing",
    categoryLabel: "Pricing & Flexibility",
    icon: CreditCard,
    trap: {
      title: "Surprise Cash Fees Argument",
      scenario: "Hidden Charges & Shady Operators",
      image: "/images/corridor/trap_extra_fees.jpg",
      location: "Roadside Booking Office, Kenya",
      problem: "Shady operator demanded 40% extra cash at the curb for 'fuel surcharges' and 'park entrance' not included in base fare.",
      badge: "+40% Surprise Fees",
      details: [
        "Hidden terms buried in fine print at checkout",
        "Aggressive curb extortion right before departure",
        "No digital paper trail or dispute mechanism",
        "Stressful argument ruined travel group mood",
      ],
    },
    smart: {
      title: "100% Transparent Zero-Fee Flexibility",
      scenario: "Transparent Direct Pricing",
      image: "/images/corridor/smart_flex_booking.jpg",
      location: "Fair Travel Kenya Cafe, Naivasha",
      solution: "All-inclusive pricing with digital Escrow via IntaSend. Free date switches and seamless itinerary tweaks.",
      badge: "Zero Hidden Fees",
      details: [
        "100% all-inclusive pricing with complete breakdown",
        "Funds held securely in escrow until tour completes",
        "Free date modifications up to 24 hours prior",
        "Direct in-app messaging with your verified guide",
      ],
    },
  },
]

export function ImageStreamHero() {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number>(0)
  const [sliderPosition, setSliderPosition] = useState<number>(50)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [showDetails, setShowDetails] = useState<boolean>(false)

  const sliderRef = useRef<HTMLDivElement>(null)
  const currentScenario = SCENARIO_PAIRS[activeScenarioIndex]

  // Handle Drag / Pointer Movement on the Before-After Slider
  const handleMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percent)
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return
      handleMove(e.touches[0].clientX)
    },
    [isDragging, handleMove]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      handleMove(e.clientX)
    },
    [isDragging, handleMove]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handlePointerUp)
      window.addEventListener("touchmove", handleTouchMove)
      window.addEventListener("touchend", handlePointerUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handlePointerUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handlePointerUp)
    }
  }, [isDragging, handleMouseMove, handlePointerUp, handleTouchMove])

  const nextScenario = () => {
    setActiveScenarioIndex((prev) => (prev + 1) % SCENARIO_PAIRS.length)
  }

  const prevScenario = () => {
    setActiveScenarioIndex((prev) => (prev - 1 + SCENARIO_PAIRS.length) % SCENARIO_PAIRS.length)
  }

  return (
    <section className="relative overflow-hidden w-full bg-[#113B3A] text-white py-6 sm:py-10 px-3 sm:px-6 lg:px-8 border-b border-[#235E5D]">
      {/* Ambient Deep Teal Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[#184948]/70 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 h-[350px] w-[450px] rounded-full bg-[#235E5D]/30 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* ── 1. Balanced Widescreen Hero Canvas ── */}
        <div className="bento-card-main overflow-hidden rounded-2xl sm:rounded-3xl border border-[#235E5D] shadow-2xl">
          <div
            ref={sliderRef}
            className="hero-widescreen-container relative w-full cursor-ew-resize select-none overflow-hidden"
            onMouseDown={(e) => {
              setIsDragging(true)
              handleMove(e.clientX)
            }}
            onTouchStart={(e) => {
              setIsDragging(true)
              handleMove(e.touches[0].clientX)
            }}
          >
            {/* ── Right Layer: Scouted Reality (Golden Sunrise & Mountain) ── */}
            <img
              src={currentScenario.smart.image}
              alt={currentScenario.smart.title}
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />

            {/* ── Left Layer: Unchecked Monsoon/Fog Trap (Clipped seamlessly via clipPath) ── */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
              <img
                src={currentScenario.trap.image}
                alt={currentScenario.trap.title}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>


            {/* Top Right Label (Sunrise) */}
            <div className="absolute top-3 right-3 sm:top-5 sm:right-6 z-25 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-black tracking-wider uppercase drop-shadow-lg">
                <Check className="size-3 text-[#B7E6E5]" />
                <span>SCOUTED SUNRISE · 100% CLARITY</span>
              </span>
            </div>

            {/* Top Left Label (Fog Trap) */}
            <div className="absolute top-3 left-3 sm:top-5 sm:left-6 z-25 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-red-500/40 text-red-200 text-[11px] sm:text-xs font-black tracking-wider uppercase drop-shadow-lg">
                <AlertTriangle className="size-3 text-red-400" />
                <span>UNCHECKED · FOG & RAIN TRAP</span>
              </span>
            </div>

            {/* ── Center Metallic Slider Handle ── */}
            <div className="slider-handle-line" style={{ left: `${sliderPosition}%` }}>
              <div className="slider-handle-button" aria-label="Drag to compare before and after">
                <div className="flex items-center gap-0.5">
                  <ChevronLeft className="size-3.5 text-slate-800 stroke-[3]" />
                  <ChevronRight className="size-3.5 text-slate-800 stroke-[3]" />
                </div>
              </div>
            </div>

            {/* ── Center Floating Action Overlay ── */}
            <div className="absolute inset-x-0 bottom-10 sm:bottom-12 z-25 flex flex-col items-center justify-center text-center pointer-events-none px-4 space-y-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                PREMIUM KENYAN ADVENTURES
              </h2>

              <div className="pointer-events-auto">
                <Link to="/tours" className="hero-pill-cta">
                  <span>EXPLORE LIVE TOURS</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <p className="text-[10px] sm:text-[11px] text-[#B7E6E5]/90 font-medium tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                ↔ Drag dial to compare real-time weather & conditions
              </p>
            </div>

            {/* ── Bottom Integrated Intel Bar ── */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0d2a29]/95 via-[#113B3A]/80 to-transparent pt-4 pb-2 px-3 sm:px-6 z-25 flex items-center justify-between gap-3 border-t border-[#235E5D]/30 backdrop-blur-xs">
              <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#B7E6E5]">
                <Link to="/" className="hover:text-white transition-colors">HOME</Link>
                <Link to="/tours" className="hover:text-white transition-colors">TOURS</Link>
                <Link to="/hosts" className="hover:text-white transition-colors">LOCAL HOSTS</Link>
                <Link to="/journal" className="hover:text-white transition-colors">JOURNAL</Link>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#184948]/80 border border-[#235E5D] text-[10px] sm:text-[11px] font-bold text-[#B7E6E5] hover:text-white transition-colors cursor-pointer"
              >
                <Info className="size-3 text-[#317978]" />
                <span>{showDetails ? "Hide Intel" : "View Intel"}</span>
              </button>
            </div>
          </div>

          {/* Optional Story Intel Drawer */}
          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6 bg-[#113B3A] border-t border-[#235E5D] animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-[#184948]/50 border border-red-500/30 space-y-2">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">The Weather Disappointment:</p>
                <p className="text-xs text-red-200 leading-relaxed">{currentScenario.trap.problem}</p>
                <ul className="space-y-1 pt-1">
                  {currentScenario.trap.details.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-300/80">
                      <AlertTriangle className="size-3 text-red-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#184948]/50 border border-[#317978]/40 space-y-2">
                <p className="text-xs font-bold text-[#B7E6E5] uppercase tracking-wider">The Scouted Local Reality:</p>
                <p className="text-xs text-white leading-relaxed">{currentScenario.smart.solution}</p>
                <ul className="space-y-1 pt-1">
                  {currentScenario.smart.details.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#B7E6E5]">
                      <Check className="size-3 text-[#317978] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Scenario Carousel Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-[#143f3e] border-t border-[#235E5D]">
            <div className="flex flex-wrap items-center gap-2">
              {SCENARIO_PAIRS.map((item, idx) => {
                const active = activeScenarioIndex === idx
                const TabIcon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveScenarioIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      active ? "bento-tab-active" : "bento-tab-inactive"
                    }`}
                  >
                    <TabIcon className="size-3.5" />
                    <span>{item.categoryLabel}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={prevScenario}
                className="p-1.5 rounded-xl bento-pill text-[#B7E6E5] hover:text-white cursor-pointer"
                title="Previous Scenario"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={nextScenario}
                className="p-1.5 rounded-xl bento-pill text-[#B7E6E5] hover:text-white cursor-pointer"
                title="Next Scenario"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Primary Call to Action Bar ── */}
        <div className="bento-card-main p-6 sm:p-8 text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-headline max-w-2xl mx-auto">
            Stop Wasting Money on Tourist Traps.{" "}
            <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-[#B7E6E5] via-[#88C2C1] to-[#317978]">
              Preview Kenya Live With Real Locals.
            </span>
          </h1>

          <p className="text-[#599D9C] text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Connect live with vetted Kenyan hosts who verify the weather, inspect summits, scout private beaches, and secure authentic journeys.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 max-w-md mx-auto">
            <Link
              to="/waitlist"
              className="w-full sm:w-auto px-7 py-3 bento-btn-primary font-bold rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <ShieldCheck className="size-4 text-[#B7E6E5]" />
              <span>Get Early Access</span>
              <ArrowRight className="size-4 text-[#B7E6E5]" />
            </Link>
            <Link
              to="/tours"
              className="w-full sm:w-auto px-7 py-3 bento-btn-secondary font-bold rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <Compass className="size-4 text-[#317978]" />
              <span>Explore Live Tours</span>
            </Link>
          </div>
        </div>

        {/* ── Trust Badges Row ── */}
        <div className="bento-card-main p-4 sm:p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            {[
              { icon: ShieldCheck, label: "Vetted Local Guides", desc: "100% background checked" },
              { icon: Video, label: "Live Video Recon", desc: "See it real-time before paying" },
              { icon: DollarSign, label: "Zero Hidden Fees", desc: "Transparent escrow pricing" },
              { icon: Users, label: "1,200+ Smart Travelers", desc: "Saved from vacation scams" },
            ].map((badge, idx) => {
              const Icon = badge.icon
              return (
                <div key={idx} className="flex flex-col items-center justify-center gap-1 p-2">
                  <div className="p-2 rounded-2xl bg-[#113B3A] border border-[#235E5D] text-[#317978] shadow-md">
                    <Icon className="size-4 sm:size-5" />
                  </div>
                  <span className="text-xs font-bold text-white mt-0.5">{badge.label}</span>
                  <span className="text-[11px] text-[#599D9C]">{badge.desc}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ImageStreamHero

