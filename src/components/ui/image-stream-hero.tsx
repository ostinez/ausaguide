import { useState, useRef } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Sparkles,
  XCircle,
  CheckCircle2,
  ShieldCheck,
  Video,
  DollarSign,
  Users,
  Pause,
  Play,
  Maximize2,
  Compass,
  AlertTriangle,
  Check,
  X,
  SlidersHorizontal,
} from "lucide-react"
import "./image-stream-hero.css"

export interface ScenarioPair {
  id: string
  category: "beach" | "safari" | "waterfall" | "pets" | "pricing"
  categoryLabel: string
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
    id: "beach",
    category: "beach",
    categoryLabel: "Beach & Coast",
    trap: {
      title: "Overcrowded Tourist Trap Beach",
      scenario: "Commercial Noise & Clutter",
      image: "/images/corridor/trap_beach.jpg",
      location: "Generic Commercial Strip, Mombasa Coast",
      problem: "Packed shoulder-to-shoulder with aggressive touts, littered sand, and overpriced staged beach stalls.",
      badge: "Overrun & Noisy",
      details: [
        "Unfiltered photos hid the massive overcrowding",
        "Persistent touts and aggressive vendors every 2 minutes",
        "Littered sand with zero quiet relaxation space",
        "Wasted full vacation day and transport fees",
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
    categoryLabel: "Pet Policies",
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
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [isPaused, setIsPaused] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<ScenarioPair | null>(null)
  const corridorRef = useRef<HTMLDivElement>(null)

  const filteredScenarios =
    activeCategory === "all"
      ? SCENARIO_PAIRS
      : SCENARIO_PAIRS.filter((s) => s.category === activeCategory)

  // Duplicate list to achieve continuous infinite looping stream
  const displayScenarios = [...filteredScenarios, ...filteredScenarios]

  const categories = [
    { id: "all", label: "All Scenarios" },
    { id: "beach", label: "Beach Disasters" },
    { id: "safari", label: "Safari Breakdowns" },
    { id: "waterfall", label: "Fake Waterfalls" },
    { id: "pets", label: "Pet Restrictions" },
    { id: "pricing", label: "Hidden Fees" },
  ]

  return (
    <section className="relative overflow-hidden w-full bg-[#06363D] text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-[#134E5E]">
      {/* Ambient Soft Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-[#0B3037]/60 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 h-[450px] w-[450px] rounded-full bg-[#134E5E]/50 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10 sm:space-y-14">
        {/* ── Header & Headline ── */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neumorph-pill-green text-[#84BABF] text-xs sm:text-sm font-semibold">
            <Sparkles className="size-4 text-[#0D6F73]" />
            <span>Try Kenya Live Before You Fly</span>
          </div>

          {/* Main H1 Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.12] font-headline">
            Stop Wasting Money on <br className="hidden sm:inline" />
            <span className="text-[#ff6b6b] line-through decoration-[#ff5252] decoration-wavy decoration-2 sm:decoration-4">
              Tourist Traps.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#84BABF] text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-normal">
            Explore Kenya through a local's eyes before you book. Live video reconnaissance tours with vetted local guides. Skip the scams.
          </p>

          {/* CTA Buttons with Apple-style Neumorphic Emerald styling */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/waitlist"
              className="w-full sm:w-auto px-8 py-3.5 neumorph-btn-emerald font-bold rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <Sparkles className="size-4" />
              <span>Join Early Waitlist</span>
            </Link>
            <Link
              to="/tours"
              className="w-full sm:w-auto px-8 py-3.5 neumorph-btn-secondary font-bold rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <Compass className="size-4 text-[#0D6F73]" />
              <span>Explore Live Tours</span>
              <ArrowRight className="size-4 text-[#84BABF]" />
            </Link>
          </div>
        </div>

        {/* ── Interactive Scenario Filter Tabs & Play/Pause Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-5xl mx-auto border-b border-[#134E5E] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#84BABF] uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <SlidersHorizontal className="size-3.5 text-[#0D6F73]" />
              Compare:
            </span>
            {categories.map((cat) => {
              const active = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    active ? "neumorph-tab-active" : "neumorph-tab-inactive"
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neumorph-pill-green text-xs font-semibold text-[#84BABF] hover:text-white cursor-pointer"
              title={isPaused ? "Resume streaming" : "Pause streaming"}
            >
              {isPaused ? <Play className="size-3.5 text-[#0D6F73]" /> : <Pause className="size-3.5 text-[#84BABF]" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </button>
          </div>
        </div>

        {/* ── 3D Image Stream Corridor (Two Perspective Rails) ── */}
        <div
          ref={corridorRef}
          className={`corridor-container relative overflow-hidden rounded-3xl p-4 sm:p-6 bg-[#06363D] border border-[#134E5E] shadow-[inset_0_4px_16px_#030f12] ${
            isPaused ? "corridor-paused" : ""
          }`}
          style={{ maxHeight: "680px" }}
        >
          {/* Corridor Top & Bottom Fade Gradients (Teal Depth) */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#06363D] via-[#06363D]/80 to-transparent z-20" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#06363D] via-[#06363D]/80 to-transparent z-20" />

          {/* Column Header Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 relative z-30">
            {/* Left Header */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0B3037] border border-[#3a1a1a] shadow-[4px_4px_12px_#030f12]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                  <XCircle className="size-4" />
                </div>
                <span className="font-extrabold text-sm sm:text-base text-red-400 font-headline">
                  The Tourist Trap (Unvetted)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold uppercase tracking-wider">
                Avoid
              </span>
            </div>

            {/* Right Header */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0B3037] border border-[#134E5E] shadow-[4px_4px_12px_#030f12]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#0D6F73]/20 text-[#0D6F73]">
                  <CheckCircle2 className="size-4" />
                </div>
                <span className="font-extrabold text-sm sm:text-base text-[#84BABF] font-headline">
                  The Smart Way (Ausaguide)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0D6F73]/20 border border-[#0D6F73]/40 text-[#84BABF] text-[10px] font-bold uppercase tracking-wider">
                Verified Local
              </span>
            </div>
          </div>

          {/* Rails Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Left Rail — Scrolling Up (The Tourist Trap) */}
            <div className="corridor-rail-left overflow-hidden">
              <div className="corridor-scroll-up flex flex-col gap-6">
                {displayScenarios.map((item, idx) => (
                  <div
                    key={`trap-${item.id}-${idx}`}
                    onClick={() => setSelectedScenario(item)}
                    className="neumorph-card-trap p-4 sm:p-5 cursor-pointer group"
                  >
                    <div className="space-y-3">
                      {/* Scenario Top Info */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5 text-red-400" />
                          {item.trap.scenario}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-200 text-[10px] font-bold">
                          {item.trap.badge}
                        </span>
                      </div>

                      {/* Image Thumbnail */}
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-red-500/30 shadow-md">
                        <img
                          src={item.trap.image}
                          alt={item.trap.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#06363D]/90 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                            {item.trap.title}
                          </p>
                          <p className="text-[10px] text-red-300/80 truncate">
                            {item.trap.location}
                          </p>
                        </div>
                      </div>

                      {/* Problem Description */}
                      <p className="text-xs text-[#84BABF]/90 line-clamp-2 leading-relaxed">
                        {item.trap.problem}
                      </p>

                      {/* Inspect Indicator */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#3a1a1a]/60 text-[10px] text-red-400/80">
                        <span className="flex items-center gap-1">
                          <XCircle className="size-3" /> Click to compare
                        </span>
                        <Maximize2 className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Rail — Scrolling Down (The Smart Way) */}
            <div className="corridor-rail-right overflow-hidden">
              <div className="corridor-scroll-down flex flex-col gap-6">
                {displayScenarios.map((item, idx) => (
                  <div
                    key={`smart-${item.id}-${idx}`}
                    onClick={() => setSelectedScenario(item)}
                    className="neumorph-card-green p-4 sm:p-5 cursor-pointer group"
                  >
                    <div className="space-y-3">
                      {/* Scenario Top Info */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#84BABF] flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-[#0D6F73]" />
                          {item.smart.scenario}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#0B3037] border border-[#0D6F73]/40 text-[#84BABF] text-[10px] font-bold">
                          {item.smart.badge}
                        </span>
                      </div>

                      {/* Image Thumbnail */}
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-[#134E5E] shadow-md">
                        <img
                          src={item.smart.image}
                          alt={item.smart.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#06363D]/90 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                            {item.smart.title}
                          </p>
                          <p className="text-[10px] text-[#84BABF] truncate">
                            {item.smart.location}
                          </p>
                        </div>
                      </div>

                      {/* Solution Description */}
                      <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                        {item.smart.solution}
                      </p>

                      {/* Inspect Indicator */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#134E5E] text-[10px] text-[#0D6F73]">
                        <span className="flex items-center gap-1">
                          <Check className="size-3" /> Ausaguide Solution
                        </span>
                        <Maximize2 className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#84BABF]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Neumorphic Trust Badges Bar ── */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[#0B3037] border border-[#134E5E] shadow-[6px_6px_16px_#030f12,-4px_-4px_12px_#06363D] max-w-5xl mx-auto">
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
                  <div className="p-2.5 rounded-2xl bg-[#134E5E] border border-[#0D6F73]/40 text-[#0D6F73] shadow-[3px_3px_8px_#030f12,-2px_-2px_6px_#0B3037]">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white mt-1">{badge.label}</span>
                  <span className="text-[11px] text-[#84BABF]">{badge.desc}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Interactive Scenario Comparison Modal ── */}
      {selectedScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#06363D] border border-[#134E5E] p-6 sm:p-8 shadow-[12px_12px_36px_#030f12] space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#134E5E] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0D6F73]">
                  Scenario Breakdown: {selectedScenario.categoryLabel}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white font-headline">
                  Tourist Trap vs. Ausaguide Solution
                </h3>
              </div>
              <button
                onClick={() => setSelectedScenario(null)}
                className="p-2 rounded-xl neumorph-pill-green text-[#84BABF] hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trap Side */}
              <div className="neumorph-card-trap p-5 space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                  <XCircle className="size-5" />
                  <h4>{selectedScenario.trap.title}</h4>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden border border-red-500/30">
                  <img
                    src={selectedScenario.trap.image}
                    alt={selectedScenario.trap.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-[#84BABF] leading-relaxed">
                  {selectedScenario.trap.problem}
                </p>
                <ul className="space-y-2 pt-2 border-t border-[#3a1a1a]/60">
                  {selectedScenario.trap.details.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-200">
                      <XCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Smart Side */}
              <div className="neumorph-card-green p-5 space-y-4">
                <div className="flex items-center gap-2 text-[#84BABF] font-bold text-base">
                  <CheckCircle2 className="size-5 text-[#0D6F73]" />
                  <h4>{selectedScenario.smart.title}</h4>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden border border-[#134E5E]">
                  <img
                    src={selectedScenario.smart.image}
                    alt={selectedScenario.smart.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-white leading-relaxed">
                  {selectedScenario.smart.solution}
                </p>
                <ul className="space-y-2 pt-2 border-t border-[#134E5E]">
                  {selectedScenario.smart.details.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#84BABF]">
                      <Check className="size-3.5 text-[#0D6F73] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Bottom Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#134E5E]">
              <p className="text-xs text-[#84BABF]">
                Ready to experience Kenya without tourist traps?
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <Link
                  to="/waitlist"
                  onClick={() => setSelectedScenario(null)}
                  className="w-full sm:w-auto px-6 py-2.5 neumorph-btn-emerald text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  Join Early Waitlist
                </Link>
                <Link
                  to="/tours"
                  onClick={() => setSelectedScenario(null)}
                  className="w-full sm:w-auto px-6 py-2.5 neumorph-btn-secondary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Compass className="size-3.5 text-[#0D6F73]" />
                  Explore Tours
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default ImageStreamHero
