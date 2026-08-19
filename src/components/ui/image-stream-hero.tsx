import { useState, useRef, useCallback, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  XCircle,
  CheckCircle2,
  ShieldCheck,
  Video,
  DollarSign,
  Users,
  Compass,
  AlertTriangle,
  Check,
  Columns,
  SplitSquareHorizontal,
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
      image: "/images/corridor/trap_mount_kenya.jpg",
      location: "Mount Kenya Slopes · Wrong Season",
      problem: "Hiker booked without local weather verification. The entire peak was swallowed in freezing torrential rain, zero visibility, and impassable mud tracks.",
      badge: "Fogged Out & Ruined",
      details: [
        "Unverified forecast missed high-altitude localized monsoon",
        "Impassable knee-deep mud ruts trapped transport vehicles",
        "0% visibility with freezing rain ruining the entire trek",
        "No live local host to advise postponing to the clear window",
      ],
    },
    smart: {
      title: "Crystal-Clear Golden Hour Summit",
      scenario: "Scouted Local Weather Window",
      image: "/images/corridor/smart_mount_kenya.jpg",
      location: "Mount Kenya Batian Ridge · Peak Clarity",
      solution: "Local verified reconnaissance confirmed crystal-clear skies, dry alpine trails, and radiant golden hour illumination.",
      badge: "Scouted Perfect Timing",
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
  const [viewMode, setViewMode] = useState<"slider" | "split">("slider")
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
    <section className="relative overflow-hidden w-full bg-[#113B3A] text-white py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#235E5D]">
      {/* Ambient Deep Teal Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[750px] rounded-full bg-[#184948]/80 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[350px] w-[350px] rounded-full bg-[#235E5D]/40 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* ── Main Suggestion 2 Hero Card: Interactive Depth Slider ── */}
        <div className="bento-card-main p-3 sm:p-5 lg:p-6 space-y-4">
          {/* Header Bar with Category & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#113B3A] border border-[#235E5D] text-[#317978] shadow-sm">
                <currentScenario.icon className="size-4 sm:size-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#113B3A] border border-[#235E5D] text-[#B7E6E5] text-[11px] font-semibold mb-0.5">
                  <Compass className="size-3 text-[#317978] shrink-0" />
                  <span>Interactive Live Comparison</span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white font-headline">
                  {currentScenario.categoryLabel}
                </h2>
              </div>
            </div>

            {/* View Mode & Details Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === "slider" ? "split" : "slider")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bento-pill text-xs font-semibold text-[#B7E6E5] hover:text-white cursor-pointer"
                title="Toggle between Interactive Slider and Side-by-Side View"
              >
                {viewMode === "slider" ? (
                  <>
                    <Columns className="size-3.5 text-[#317978]" />
                    <span className="hidden sm:inline">Dual View</span>
                  </>
                ) : (
                  <>
                    <SplitSquareHorizontal className="size-3.5 text-[#317978]" />
                    <span className="hidden sm:inline">Slider View</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  showDetails ? "bento-tab-active" : "bento-pill text-[#B7E6E5] hover:text-white"
                }`}
                title="Toggle detailed point-by-point breakdown"
              >
                <Info className="size-3.5" />
                <span className="hidden sm:inline">Details</span>
              </button>
            </div>
          </div>

          {/* ── Centerpiece: Suggestion 2 Interactive Depth Slider Canvas ── */}
          {viewMode === "slider" ? (
            <div
              ref={sliderRef}
              className="slider-compare-container relative aspect-[16/11] sm:aspect-[16/9] md:aspect-[21/10] w-full cursor-ew-resize select-none overflow-hidden rounded-2xl border border-[#235E5D] shadow-2xl"
              onMouseDown={(e) => {
                setIsDragging(true)
                handleMove(e.clientX)
              }}
              onTouchStart={(e) => {
                setIsDragging(true)
                handleMove(e.touches[0].clientX)
              }}
            >
              {/* 1. Right Layer: Scouted Reality (Full Width Background) */}
              <img
                src={currentScenario.smart.image}
                alt={currentScenario.smart.title}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />

              {/* 2. Giant Depth Typography Layer (Smart / Right side) */}
              <div className="absolute inset-x-0 top-1/4 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none z-10 opacity-30 sm:opacity-40">
                <span className="hero-giant-typography text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                  AUSAGUIDE
                </span>
              </div>

              {/* 3. Right Overlay Tag (Suggestion 2 styling) */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 pointer-events-none">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#113B3A]/90 border border-[#317978] shadow-lg text-[#B7E6E5] text-xs sm:text-sm font-extrabold tracking-wide uppercase backdrop-blur-md">
                  <CheckCircle2 className="size-4 text-[#317978]" />
                  <span>LOCAL SCOUTED · PERFECT CONDITIONS</span>
                </div>
              </div>

              {/* 4. Left Layer: Unchecked Bad Weather / Trap (Clipped by Slider) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none z-15"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={currentScenario.trap.image}
                  alt={currentScenario.trap.title}
                  className="absolute inset-0 h-full object-cover select-none pointer-events-none"
                  style={{
                    width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : "100%",
                    maxWidth: "none",
                  }}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />

                {/* Giant Depth Typography Layer (Trap / Left side) */}
                <div className="absolute inset-x-0 top-1/4 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none opacity-25">
                  <span className="hero-giant-typography text-slate-300 drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                    AUSAGUIDE
                  </span>
                </div>

                {/* Left Overlay Tag (Suggestion 2 styling) */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1a0808]/90 border border-red-500/80 shadow-lg text-red-300 text-xs sm:text-sm font-extrabold tracking-wide uppercase backdrop-blur-md">
                    <XCircle className="size-4 text-red-400" />
                    <span>UNCHECKED BOOKING · RAIN & FOG TRAP</span>
                  </div>
                </div>
              </div>

              {/* 5. Center Metallic Slider Knob (Suggestion 2 exact metallic dial) */}
              <div className="slider-handle-line" style={{ left: `${sliderPosition}%` }}>
                <div className="slider-handle-button" aria-label="Drag to compare before and after">
                  <div className="flex items-center gap-0.5">
                    <ChevronLeft className="size-3.5 text-slate-800 stroke-[3]" />
                    <ChevronRight className="size-3.5 text-slate-800 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* 6. Bottom Center Instruction Pill */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <span className="px-4 py-1.5 rounded-full bg-[#113B3A]/95 border border-[#235E5D] text-xs font-bold text-[#B7E6E5] shadow-2xl backdrop-blur-md">
                  Drag slider to compare weather & reality
                </span>
              </div>
            </div>
          ) : (
            /* Mode 2: Side-by-Side Dual View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Card: Tourist Trap */}
              <div className="bento-card-inset p-4 sm:p-5 border border-red-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <XCircle className="size-3.5 text-red-400" />
                    {currentScenario.trap.scenario}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-200 text-[10px] font-bold">
                    {currentScenario.trap.badge}
                  </span>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden border border-red-500/20 shadow-md">
                  <img
                    src={currentScenario.trap.image}
                    alt={currentScenario.trap.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-[#113B3A]/95 p-1.5 rounded-lg border border-red-500/30">
                    <p className="text-[11px] font-bold text-white truncate">{currentScenario.trap.title}</p>
                    <p className="text-[10px] text-red-300/80 truncate">{currentScenario.trap.location}</p>
                  </div>
                </div>
                <p className="text-xs text-[#599D9C] leading-relaxed">{currentScenario.trap.problem}</p>
              </div>

              {/* Right Card: The Smart Way */}
              <div className="bento-card-inset p-4 sm:p-5 border border-[#235E5D] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B7E6E5] flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-[#317978]" />
                    {currentScenario.smart.scenario}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#184948] border border-[#317978]/40 text-[#B7E6E5] text-[10px] font-bold">
                    {currentScenario.smart.badge}
                  </span>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden border border-[#235E5D] shadow-md">
                  <img
                    src={currentScenario.smart.image}
                    alt={currentScenario.smart.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-[#113B3A]/95 p-1.5 rounded-lg border border-[#235E5D]">
                    <p className="text-[11px] font-bold text-white truncate">{currentScenario.smart.title}</p>
                    <p className="text-[10px] text-[#B7E6E5] truncate">{currentScenario.smart.location}</p>
                  </div>
                </div>
                <p className="text-xs text-white leading-relaxed">{currentScenario.smart.solution}</p>
              </div>
            </div>
          )}

          {/* ── Optional Point-by-Point Details Drawer ── */}
          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#235E5D] animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-[#113B3A] border border-red-500/20 space-y-2">
                <p className="text-xs font-bold text-red-400">Why travelers get trapped:</p>
                <ul className="space-y-1.5">
                  {currentScenario.trap.details.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-200">
                      <AlertTriangle className="size-3 text-red-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#113B3A] border border-[#235E5D] space-y-2">
                <p className="text-xs font-bold text-[#B7E6E5]">How Ausaguide protects you:</p>
                <ul className="space-y-1.5">
                  {currentScenario.smart.details.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white">
                      <Check className="size-3 text-[#317978] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── Scenario Switcher Carousel Pills ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {SCENARIO_PAIRS.map((item, idx) => {
                const active = activeScenarioIndex === idx
                const TabIcon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveScenarioIndex(idx)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
                className="p-2 rounded-xl bento-pill text-[#B7E6E5] hover:text-white cursor-pointer"
                title="Previous Scenario"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={nextScenario}
                className="p-2 rounded-xl bento-pill text-[#B7E6E5] hover:text-white cursor-pointer"
                title="Next Scenario"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Hero Headline & Action Callout Bar ── */}
        <div className="bento-card-main p-6 sm:p-8 text-center space-y-5">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-headline max-w-3xl mx-auto">
            Stop Wasting Money on Tourist Traps.{" "}
            <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-[#B7E6E5] via-[#88C2C1] to-[#317978]">
              Preview Kenya Live With Real Locals.
            </span>
          </h1>

          <p className="text-[#599D9C] text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Connect directly with verified local Kenyan hosts who inspect the weather, check the summit trails, scout secluded beaches, and verify uncrowded spots in real-time. Zero surprises.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <Link
              to="/waitlist"
              className="w-full sm:w-auto px-7 py-3.5 bento-btn-primary font-bold rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
            >
              <ShieldCheck className="size-4 text-[#B7E6E5]" />
              <span>Get Early Access</span>
              <ArrowRight className="size-4 text-[#B7E6E5]" />
            </Link>
            <Link
              to="/tours"
              className="w-full sm:w-auto px-7 py-3.5 bento-btn-secondary font-bold rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
            >
              <Compass className="size-4 text-[#317978]" />
              <span>Explore Live Tours</span>
            </Link>
          </div>
        </div>

        {/* ── Tactile Trust Badges Row ── */}
        <div className="bento-card-main p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {[
              { icon: ShieldCheck, label: "Vetted Local Guides", desc: "100% background checked" },
              { icon: Video, label: "Live Video Recon", desc: "See it real-time before paying" },
              { icon: DollarSign, label: "Zero Hidden Fees", desc: "Transparent escrow pricing" },
              { icon: Users, label: "1,200+ Smart Travelers", desc: "Saved from vacation scams" },
            ].map((badge, idx) => {
              const Icon = badge.icon
              return (
                <div key={idx} className="flex flex-col items-center justify-center gap-1.5 p-2">
                  <div className="p-2.5 rounded-2xl bg-[#113B3A] border border-[#235E5D] text-[#317978] shadow-md">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white mt-1">{badge.label}</span>
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
