import { useEffect } from "react"
import { Link } from "react-router-dom"
import {
  MapPin,
  Sparkles,
  Video,
  Compass,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Globe2,
  CheckCircle2,
} from "lucide-react"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"
import { Button } from "@/components/ui/button"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { SpotlightCard } from "@/components/ui/SpotlightCard"
import founderPhoto from "@/assets/images/founder/austin-mbote.webp"

// Custom crisp SVG icons for social platforms
function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 0 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74V9.89H5.06v8.61h2.8z" />
    </svg>
  )
}

function TwitterXIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export default function FounderPage() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Austin Murithi Mbote",
    "jobTitle": "Founder & CEO",
    "worksFor": {
      "@type": "Organization",
      "name": "Ausaguide Limited",
    },
    "url": "https://ausaguide.com/founder",
    "sameAs": [
      "https://www.linkedin.com/in/austin-murithi-5343aa402",
      "https://twitter.com/ausaguide",
      "https://instagram.com/ausaguide",
      "https://www.linkedin.com/in/yourprofile",
      "https://twitter.com/yourhandle",
    ],
  }

  // SEO configuration with JSON-LD Person schema in <head>
  useSEO({
    title: "Austin Murithi Mbote — Founder & CEO | Ausaguide",
    description:
      "Austin is a 23-year-old entrepreneur based in Nairobi, Kenya, building the future of authentic travel. He founded Ausaguide to connect global travelers with local Kenyan hosts through live video.",
    url: "https://ausaguide.com/founder",
    image: "https://ausaguide.com/images/founder/austin-mbote.webp",
    jsonLd: personSchema,
  })

  // Ensure JSON-LD Person schema is explicitly present in <head>
  useEffect(() => {
    const existing = document.head.querySelector('script[data-schema="founder-person"]')
    if (existing) {
      existing.remove()
    }

    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.setAttribute("data-schema", "founder-person")
    script.textContent = JSON.stringify(personSchema, null, 2)
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#071313] text-foreground relative overflow-hidden flex flex-col items-center">
      {/* Fallback JSON-LD for static crawlers */}
      <JsonLd data={personSchema} />

      {/* Atmospheric Background Glows matching brand colors: Deep Teal, Cream, Warm Orange */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[750px] rounded-full bg-[#0D6F73]/20 blur-[130px] animate-pulse duration-[10s]" />
        <div className="absolute top-[35%] -left-32 h-[450px] w-[500px] rounded-full bg-[#113B3A]/30 blur-[120px]" />
        <div className="absolute top-[55%] -right-32 h-[500px] w-[550px] rounded-full bg-[#F97316]/10 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 h-[400px] w-[450px] rounded-full bg-[#235E5D]/25 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 pt-24 sm:pt-32 space-y-16 sm:space-y-24">
        {/* ── Breadcrumb & Editorial Tag ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#235E5D]/40 pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#599D9C]">
            <Link to="/" className="hover:text-[#B7E6E5] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/about" className="hover:text-[#B7E6E5] transition-colors">About</Link>
            <span>/</span>
            <span className="text-[#B7E6E5]">Founder</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-3.5 py-1 text-xs font-semibold text-[#F97316]">
            <Sparkles className="size-3.5 text-[#F97316]" />
            <span>Leadership & Vision</span>
          </div>
        </div>

        {/* ── Hero Profile Showcase (Editorial Card) ── */}
        <BorderGlow
          glowColor="183 70 25"
          glowIntensity={0.55}
          borderRadius={32}
          backgroundColor="#0B1A1A"
        >
          <div className="rounded-[30px] border border-[#235E5D]/60 bg-[#0B1A1A]/95 p-6 sm:p-10 md:p-12 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 md:gap-12 items-center">
              {/* Photo Column */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="size-60 sm:size-72 rounded-3xl p-1.5 bg-gradient-to-tr from-[#0D6F73] via-[#B7E6E5]/40 to-[#F97316]/60 shadow-[0_15px_35px_rgba(13,111,115,0.35)] transition-transform duration-500 group-hover:scale-[1.02]">
                    <img
                      src={founderPhoto}
                      alt="Austin Murithi Mbote — Founder & CEO"
                      className="w-full h-full object-cover rounded-[22px] bg-[#0A1616]"
                      loading="eager"
                      onError={(e) => {
                        // Fallback to public folder path if bundled asset fails
                        const target = e.currentTarget
                        if (target.src !== `${window.location.origin}/images/founder/austin-mbote.webp`) {
                          target.src = "/images/founder/austin-mbote.webp"
                        }
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0A5F5F] border border-[#B7E6E5]/40 px-3.5 py-1 text-[11px] font-bold text-white shadow-lg flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-[#B7E6E5]" />
                    <span>Verified Founder</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-[#599D9C]">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-[#F97316]" /> Nairobi, Kenya
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3.5 text-[#B7E6E5]" /> Ausaguide Limited
                  </span>
                </div>
              </div>

              {/* Bio & Details Column */}
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#F97316]">
                    <span>Founder Spotlight</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-headline">
                    Austin Murithi Mbote — Founder &amp; CEO
                  </h1>
                  <p className="text-sm font-semibold text-[#B7E6E5]/90">
                    Ausaguide Limited · Nairobi, Kenya
                  </p>
                </div>

                {/* Short Bio (Primary Requirement) */}
                <div className="rounded-2xl border-l-4 border-l-[#F97316] bg-[#113B3A]/40 border border-[#235E5D]/50 p-5 sm:p-6">
                  <p className="text-base sm:text-lg text-white font-medium leading-relaxed font-body">
                    "Austin is a 23-year-old entrepreneur based in Nairobi, Kenya, building the future of authentic travel. He founded Ausaguide to connect global travelers with local Kenyan hosts through live video."
                  </p>
                </div>

                {/* Key Facts Pill Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="rounded-xl border border-[#235E5D]/60 bg-[#143232]/50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#599D9C] flex items-center gap-1">
                      <Calendar className="size-3 text-[#F97316]" /> Age
                    </span>
                    <p className="text-sm font-bold text-white mt-0.5">23 Years Old</p>
                  </div>
                  <div className="rounded-xl border border-[#235E5D]/60 bg-[#143232]/50 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#599D9C] flex items-center gap-1">
                      <MapPin className="size-3 text-[#0D6F73]" /> HQ
                    </span>
                    <p className="text-sm font-bold text-white mt-0.5">Nairobi, Kenya</p>
                  </div>
                  <div className="rounded-xl border border-[#235E5D]/60 bg-[#143232]/50 p-3 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#599D9C] flex items-center gap-1">
                      <Globe2 className="size-3 text-[#B7E6E5]" /> Innovation
                    </span>
                    <p className="text-sm font-bold text-white mt-0.5">Live Video Travel</p>
                  </div>
                </div>

                {/* Social Links Bar */}
                <div className="pt-2 space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#599D9C]">
                    Connect with Austin
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* LinkedIn */}
                    <a
                      href="https://www.linkedin.com/in/austin-murithi-5343aa402"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0077B5]/15 hover:bg-[#0077B5]/25 border border-[#0077B5]/40 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm hover:scale-[1.03]"
                      title="Connect with Austin Murithi on LinkedIn"
                    >
                      <LinkedInIcon className="size-4 text-[#0077B5]" />
                      <span>LinkedIn</span>
                      <ExternalLink className="size-3 opacity-60 ml-0.5" />
                    </a>

                    {/* X (Twitter) */}
                    <a
                      href="https://twitter.com/ausaguide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm hover:scale-[1.03]"
                      title="Follow Austin Murithi on X (Twitter)"
                    >
                      <TwitterXIcon className="size-3.5 text-white" />
                      <span>X (Twitter)</span>
                      <ExternalLink className="size-3 opacity-60 ml-0.5" />
                    </a>

                    {/* Instagram */}
                    <a
                      href="https://instagram.com/ausaguide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#E1306C]/15 hover:bg-[#E1306C]/25 border border-[#E1306C]/40 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm hover:scale-[1.03]"
                      title="Follow Ausaguide on Instagram"
                    >
                      <InstagramIcon className="size-4 text-[#E1306C]" />
                      <span>Instagram</span>
                      <ExternalLink className="size-3 opacity-60 ml-0.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BorderGlow>

        {/* ── Editorial Story: The Ausaguide Story ── */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#F97316]">
              The Origin Story
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-headline">
              Why I Built Ausaguide
            </h2>
            <p className="text-sm text-[#599D9C] leading-relaxed">
              Transforming childhood disappointment into a nationwide movement for unfiltered travel and local creator empowerment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SpotlightCard className="p-7 rounded-2xl border border-[#235E5D]/60 bg-[#0C1E1E]/80 shadow-md space-y-4 flex flex-col justify-between hover:border-[#317978] transition duration-300">
              <div className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316]">
                  <Compass className="size-5" />
                </div>
                <h3 className="text-base font-bold text-white font-headline">The 11th Birthday Spark</h3>
                <p className="text-xs text-[#B7E6E5]/80 leading-relaxed font-body">
                  "On my 11th birthday, my mother took me on a long matatu ride for a swim I had dreamed about for weeks. When we arrived, the venue was shut down for renovations. That quiet ride home in disappointment made me realize: there had to be a way to verify experiences before you expend time and money."
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#F97316]">The Genesis &rarr;</span>
            </SpotlightCard>

            <SpotlightCard className="p-7 rounded-2xl border border-[#235E5D]/60 bg-[#0C1E1E]/80 shadow-md space-y-4 flex flex-col justify-between hover:border-[#317978] transition duration-300">
              <div className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#0D6F73]/20 border border-[#0D6F73]/40 text-[#B7E6E5]">
                  <Video className="size-5" />
                </div>
                <h3 className="text-base font-bold text-white font-headline">Try Before You Fly</h3>
                <p className="text-xs text-[#B7E6E5]/80 leading-relaxed font-body">
                  "In 2025, that memory transformed into Ausaguide. Why should travelers gamble thousands of dollars on staged photos? By putting live video directly into the hands of local guides, travelers can preview Kenyan destinations in real time with unfiltered honesty."
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#B7E6E5]">The Solution &rarr;</span>
            </SpotlightCard>

            <SpotlightCard className="p-7 rounded-2xl border border-[#235E5D]/60 bg-[#0C1E1E]/80 shadow-md space-y-4 flex flex-col justify-between hover:border-[#317978] transition duration-300">
              <div className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#235E5D]/30 border border-[#317978]/50 text-[#599D9C]">
                  <ShieldCheck className="size-5" />
                </div>
                <h3 className="text-base font-bold text-white font-headline">Direct Local Wealth</h3>
                <p className="text-xs text-[#B7E6E5]/80 leading-relaxed font-body">
                  "Most tourism revenue leaves Kenya through overseas booking conglomerates. Ausaguide redirects income directly to local youth, licensed guides, and community elders through direct M-Pesa payouts and transparent local bookings."
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#599D9C]">The Mission &rarr;</span>
            </SpotlightCard>
          </div>
        </section>

        {/* ── Key Company & Mission Pillars ── */}
        <section className="rounded-3xl border border-[#235E5D]/50 bg-[#0A1A1A]/90 p-8 sm:p-12 space-y-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#235E5D]/40 pb-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#F97316]">
                Guiding Principles
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Ausaguide's Core Pillars
              </h2>
            </div>
            <p className="text-xs text-[#599D9C] max-w-sm">
              Built on transparency, community uplift, and modern technology right here in Nairobi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <CheckCircle2 className="size-4 text-[#F97316]" />
                <span>Live Video First</span>
              </div>
              <p className="text-xs text-[#599D9C] leading-relaxed">
                Interactive real-time previews eliminate travel anxiety and provide total authenticity.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <CheckCircle2 className="size-4 text-[#B7E6E5]" />
                <span>Direct M-Pesa Rails</span>
              </div>
              <p className="text-xs text-[#599D9C] leading-relaxed">
                Native Safaricom Daraja STK Push ensures seamless instant payments across East Africa.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <CheckCircle2 className="size-4 text-[#F97316]" />
                <span>Ecological Impact</span>
              </div>
              <p className="text-xs text-[#599D9C] leading-relaxed">
                Tree planting commitments built directly into bookings help restore indigenous Kenyan forests.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <CheckCircle2 className="size-4 text-[#B7E6E5]" />
                <span>Verified Guides</span>
              </div>
              <p className="text-xs text-[#599D9C] leading-relaxed">
                Rigorous KYC verification ensures travelers are always paired with trusted, certified locals.
              </p>
            </div>
          </div>
        </section>

        {/* ── Quote Spotlight ── */}
        <section className="text-center max-w-3xl mx-auto space-y-4 px-4">
          <div className="mx-auto w-16 h-1 rounded-full bg-gradient-to-r from-[#0D6F73] via-[#F97316] to-[#0D6F73]" />
          <blockquote className="text-lg sm:text-2xl font-bold text-white italic leading-relaxed font-body">
            "I believe the best way to see the world isn't through glossy travel brochures—it's through the eyes and voices of the people who actually live there."
          </blockquote>
          <p className="text-xs uppercase tracking-widest font-semibold text-[#599D9C]">
            — Austin Murithi Mbote, Founder &amp; CEO
          </p>
        </section>

        {/* ── Call to Action: Explore Ausaguide ── */}
        <div className="rounded-3xl border border-[#235E5D] bg-gradient-to-r from-[#0D6F73]/30 via-[#113B3A]/40 to-[#F97316]/15 p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Experience Kenya Live with Ausaguide
          </h2>
          <p className="text-sm text-[#B7E6E5]/90 max-w-xl mx-auto leading-relaxed">
            Discover unfiltered live tours, book experiences with verified Kenyan guides, or join our community of hosts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              asChild
              className="h-12 px-6 font-bold bg-[#F97316] hover:bg-[#EA580C] text-white shadow-lg gap-2"
            >
              <Link to="/tours">
                <span>Browse Live Tours</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 px-6 font-semibold border-[#235E5D] hover:bg-[#113B3A] text-white"
            >
              <Link to="/waitlist">
                Join Early Access Waitlist
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-12 px-6 font-semibold text-[#B7E6E5] hover:text-white hover:bg-white/5"
            >
              <Link to="/onboarding?become-host=true">
                Become a Local Host
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
