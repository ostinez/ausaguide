import { Link } from "react-router-dom"
import { Compass, Users, Globe, Sparkles, Heart, Shield, CheckCircle, ArrowRight } from "lucide-react"
import { GradientText } from "@/components/ui/GradientText"
import { SpotlightCard } from "@/components/ui/SpotlightCard"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { StarBorder } from "@/components/ui/StarBorder"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"

export default function AboutPage() {
  useSEO({
    title: "About Us — Discover Local Experiences",
    description: "Learn how Ausaguide connects travelers with local Kenyan hosts for authentic, immersive tours.",
    url: "https://ausaguide.com/about",
  })

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Ausaguide",
          "url": "https://ausaguide.com/about",
          "description": "Learn how Ausaguide connects travelers with local Kenyan hosts for authentic, immersive tours."
        }}
      />
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-1/4 h-[400px] w-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse duration-[8s]" />
        <div className="absolute bottom-20 right-1/4 h-[500px] w-[600px] rounded-full bg-teal/5 blur-3xl animate-pulse duration-[12s]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 pt-32 flex flex-col space-y-16">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/20 text-xs font-semibold text-[#7F5AF0] mb-2">
            <Sparkles className="size-4 animate-spin-slow text-[#2CB67D]" />
            <span>Discover Ausaguide</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            <GradientText colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]} animationSpeed={4} yoyo={true}>
              Be a Local. Share Your World.
            </GradientText>
          </h1>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl mx-auto">
            Connecting curious global travelers with passionate local hosts in Kenya for authentic, off-the-beaten-path experiences that support community livelihoods.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <StarBorder as={Link} to="/host/signup" color="#7F5AF0" className="w-full sm:w-auto rounded-full overflow-hidden shadow-lg shadow-primary/15">
              <div className="px-8 py-3 text-sm font-bold text-white bg-[#121214] flex items-center justify-center gap-1.5">
                Become a Host
                <ArrowRight className="size-4" />
              </div>
            </StarBorder>

            <StarBorder as={Link} to="/tours" color="#2CB67D" className="w-full sm:w-auto rounded-full overflow-hidden">
              <div className="px-8 py-3 text-sm font-bold text-white bg-[#121214] flex items-center justify-center gap-1.5">
                Explore Tours
                <ArrowRight className="size-4" />
              </div>
            </StarBorder>
          </div>
        </section>

        {/* Aspirational Milestones Section with SpotlightCards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <SpotlightCard className="p-8 border border-border bg-[#121214]/40 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#7F5AF0]/10 text-[#7F5AF0]">
                <Users className="size-6" />
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                Empower 100+ local hosts
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Empowering local guides and community hosts throughout Kenya to generate direct travel revenue.
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-8 border border-border bg-[#121214]/40 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#2CB67D]/10 text-[#2CB67D]">
                <Compass className="size-6" />
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                Authentic Experiences
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Creating custom tours, virtual streams, and cultural safaris led entirely by neighborhood experts.
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-8 border border-border bg-[#121214]/40 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent/ text-white">
                <Globe className="size-6" />
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                Global Connections
              </h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Designing a global platform built on transparent economics, deep connection, and community respect.
              </p>
            </div>
          </SpotlightCard>
        </section>

        {/* Mission & Vision Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2CB67D]/10 border border-[#2CB67D]/20 text-xs font-semibold text-[#2CB67D]">
              <Heart className="size-3.5" />
              <span>Our Purpose</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              <GradientText
                colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
                animationSpeed={4}
                yoyo={true}
              >
                Bridging Communities
              </GradientText>
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              At Ausaguide, we believe travel should be mutually transformative. Our platform allows global explorers to skip generic tourist trap trails and experience destinations through the eyes of the people who call them home. 
            </p>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              At the same time, we serve as an economic catalyst by providing local guides and hosts with direct access to global markets, empowering them to earn fair wages while sharing their rich cultural heritage and natural landscapes.
            </p>
          </div>
          
          <BorderGlow
            glowColor="7F5AF0"
            glowIntensity={0.5}
            borderRadius={20}
            backgroundColor="#121214"
          >
            <div className="bg-[#121214]/60 border border-border rounded-2xl overflow-hidden relative">
              <img
                src="/src/assets/images/home/explore_rift.png"
                alt="Kenyan local guides welcoming travelers"
                className="w-full h-44 object-cover"
              />
              <div className="p-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7F5AF0]/15 text-[#7F5AF0]">
                    <CheckCircle className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Empowering Local Economies</h4>
                    <p className="text-[11px] text-white/50 leading-relaxed">We bypass corporate middle layers, ensuring the majority of your tour booking goes directly into the hands of local hosts.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2CB67D]/15 text-[#2CB67D]">
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Authentic Cultural Exchange</h4>
                    <p className="text-[11px] text-white/50 leading-relaxed">Every experience is designed to respect local traditions, promote mutual understanding, and create lifelong memories.</p>
                  </div>
                </div>
              </div>
            </div>
          </BorderGlow>
        </section>

        {/* How It Works Section */}
        <section className="space-y-12 text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            <GradientText
              colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
              animationSpeed={4}
              yoyo={true}
            >
              How Ausaguide Works
            </GradientText>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <SpotlightCard className="flex flex-col items-center p-6 border border-border bg-[#121214]/40 rounded-2xl">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/20 text-[#7F5AF0] text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Find a Tour</h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Filter and browse curated experiences led by local guides and hosts.
              </p>
            </SpotlightCard>

            <SpotlightCard className="flex flex-col items-center p-6 border border-border bg-[#121214]/40 rounded-2xl">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#2CB67D]/10 border border-[#2CB67D]/20 text-[#2CB67D] text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Book Your Experience</h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Securely pay through our stripe-guaranteed portal with custom time slots and host communication.
              </p>
            </SpotlightCard>

            <SpotlightCard className="flex flex-col items-center p-6 border border-border bg-[#121214]/40 rounded-2xl">
              <div className="flex size-14 items-center justify-center rounded-full bg-accent/ border border-border text-white text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Explore Kenya Live</h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Meet your host, learn traditional cooking, witness wildlife tours, and experience authentic local culture.
              </p>
            </SpotlightCard>
          </div>
        </section>

        {/* Call to Action Section with BorderGlow */}
        <section className="w-full">
          <BorderGlow
            glowColor="7F5AF0"
            glowIntensity={0.6}
            borderRadius={28}
            backgroundColor="#121214"
          >
            <div className="p-8 sm:p-12 border border-border rounded-3xl text-center space-y-6 relative overflow-hidden min-h-[320px] flex flex-col justify-center items-center">
              <div 
                role="img"
                aria-label="Kenyan travelers enjoying a peaceful sunset on Watamu beach"
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105" 
                style={{ backgroundImage: "url('/src/assets/images/home/cta_coast.png')" }} 
              />
              <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px]" />
              
              <h2 className="relative z-10 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                <GradientText
                  colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
                  animationSpeed={4}
                  yoyo={true}
                >
                  Ready to Begin Your Journey?
                </GradientText>
              </h2>
              <p className="relative z-10 text-xs sm:text-sm text-white/65 max-w-xl mx-auto">
                Whether you want to discover the real Kenya or share your home city as a local host, Ausaguide has a place for you.
              </p>
              
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <StarBorder as={Link} to="/host/signup" color="#7F5AF0" className="w-full sm:w-auto rounded-full overflow-hidden">
                  <div className="px-8 py-3 text-sm font-bold text-white bg-[#121214] flex items-center justify-center gap-1.5">
                    Become a Host
                    <ArrowRight className="size-4" />
                  </div>
                </StarBorder>
                
                <StarBorder as={Link} to="/tours" color="#2CB67D" className="w-full sm:w-auto rounded-full overflow-hidden">
                  <div className="px-8 py-3 text-sm font-bold text-white bg-[#121214] flex items-center justify-center gap-1.5">
                    Browse Tours
                    <ArrowRight className="size-4" />
                  </div>
                </StarBorder>
              </div>
            </div>
          </BorderGlow>
        </section>
        
      </div>
    </div>
  )
}
