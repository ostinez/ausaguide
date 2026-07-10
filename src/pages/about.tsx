import { useEffect } from "react"
import { Link } from "react-router-dom"
import { Compass, Users, Globe, Heart, Shield, CheckCircle, ArrowRight } from "lucide-react"
import { GradientText } from "@/components/ui/GradientText"
import { SpotlightCard } from "@/components/ui/SpotlightCard"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { StarBorder } from "@/components/ui/StarBorder"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"
import founderPhoto from "../assets/images/founder/austin-mbote.jpg"

export default function AboutPage() {
  useSEO({
    title: "About Us — Discover Local Experiences",
    description: "Learn how Ausaguide connects travelers with local Kenyan hosts for authentic, immersive tours.",
    url: "https://ausaguide.com/about",
  })

  useEffect(() => {
    if (window.location.hash) {
      const element = document.getElementById(window.location.hash.slice(1))
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    }
  }, [])

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
        
        {/* Simple Heading */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            About <span className="text-[#7F5AF0]">Ausaguide</span>
          </h1>
          <p className="text-sm sm:text-base text-white/70 leading-relaxed">
            Connecting curious global travelers with passionate local hosts in Kenya for authentic, off-the-beaten-path experiences.
          </p>
        </div>

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
                src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80"
                alt="Beautiful Kenyan landscape sunset"
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

        {/* Founder Story Section */}
        <section id="founder-story" className="space-y-12 scroll-mt-24">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              <GradientText
                colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
                animationSpeed={4}
                yoyo={true}
              >
                The Story Behind Ausaguide
              </GradientText>
            </h2>
            <p className="text-white/60 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              A journey born out of childhood anticipation, Nairobi water slides, and a commitment to protect traveler expectations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <SpotlightCard className="p-8 border border-border bg-[#121214]/40 rounded-2xl space-y-3 flex flex-col justify-between hover:border-[#7F5AF0]/40 transition duration-300">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7F5AF0]">
                  ✧ The Memory
                </span>
                <p className="text-xs text-white/70 leading-relaxed font-medium">
                  "I remember it like it was yesterday. As a toddler, I would beg my mother to take us to Village Market — a mall in Nairobi that had incredible recreational activities, including the famous water slides I'd heard so much about. I'd seen pictures of my older siblings having the time of their lives there. It became my dream destination. For years, I waited."
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-8 border border-border bg-[#121214]/40 rounded-2xl space-y-3 flex flex-col justify-between hover:border-[#7F5AF0]/40 transition duration-300">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7F5AF0]">
                  ✧ The Disappointment
                </span>
                <p className="text-xs text-white/70 leading-relaxed font-medium">
                  "On my 11th birthday, my mother finally said yes. I packed my swimming kit with so much excitement I could barely sleep the night before. I imagined the stories I'd tell my friends — the best day of my life. We took the matatu. We arrived. I was buzzing with energy. But as we approached the entrance, I noticed my mother's mood shift. She spoke quietly to the security guard, then turned to me with a look I'll never forget. 'The recreational activities are closed. They're upgrading the mall.' Just like that, my dream day crumbled. There was nothing else to do. We headed home in silence. All I could think was: If only there was a way to know..."
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-8 border border-border bg-[#121214]/40 rounded-2xl space-y-3 flex flex-col justify-between hover:border-[#7F5AF0]/40 transition duration-300">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7F5AF0]">
                  ✧ The Idea
                </span>
                <p className="text-xs text-white/70 leading-relaxed font-medium">
                  "That feeling stayed with me. In 2025, the idea resurfaced. What if I could build something that saves people from that same disappointment? Something that prevents wasted time and money — a tool anyone could use to discover authentic, up‑to‑date experiences, while also giving locals a way to earn extra income. I did my research and realized this could become a real economic boost for tourist destinations — helping both locals and travelers, creating real connections."
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-8 border border-border bg-[#121214]/40 rounded-2xl space-y-3 flex flex-col justify-between hover:border-[#7F5AF0]/40 transition duration-300">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7F5AF0]">
                  ✧ The Mission
                </span>
                <p className="text-xs text-white/70 leading-relaxed font-medium">
                  "That's why I built Ausaguide. Not just a booking platform, but a way to protect people's expectations. A way to empower locals to share their world. A way to turn disappointment into discovery."
                </p>
              </div>
            </SpotlightCard>
          </div>

          <div className="text-center max-w-xl mx-auto pt-4 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-[#7F5AF0]/40 to-transparent" />
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium italic pt-8">
              "I'm Austin M. Mbote. And I believe the best way to see the world is through the people who live there."
            </p>
            <div className="mt-4">
              <a
                href="https://www.linkedin.com/in/austin-murithi-5343aa402"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7F5AF0] hover:text-[#7F5AF0]/80 hover:underline transition duration-300"
              >
                Connect with me on LinkedIn
              </a>
            </div>
          </div>
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

        {/* Founder Section */}
        <section className="w-full">
          <BorderGlow
            glowColor="7F5AF0"
            glowIntensity={0.5}
            borderRadius={24}
            backgroundColor="#121214"
          >
            <div className="p-8 sm:p-10 bg-[#121214]/60 border border-border rounded-3xl flex flex-col md:flex-row items-center gap-8 md:gap-10 hover:border-border transition duration-300">
              {/* Photo Column */}
              <div className="relative shrink-0">
                <div className="size-32 sm:size-40 rounded-full p-1 bg-gradient-to-br from-[#7F5AF0] via-[#7F5AF0]/50 to-[#2CB67D] shadow-[0_0_20px_rgba(127,90,240,0.25)]">
                  <img
                    src={founderPhoto}
                    alt="Austin M. Mbote"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              {/* Message Column */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7F5AF0]">
                    Founder & Lead Developer
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Austin M. Mbote
                  </h2>
                </div>

                <div className="text-xs sm:text-sm text-white/70 space-y-3 leading-relaxed font-medium">
                  <p>
                    I'm Austin M. Mbote.
                  </p>
                  <p>
                    I believe the best way to see the world is through the people who live there.
                  </p>
                  <p>
                    Ausaguide is built to create real connections — between travelers and locals, cultures and experiences.
                  </p>
                  <p>
                    Whether you're exploring or hosting, this is your space.
                  </p>
                  <p className="font-semibold text-white">
                    Join me. 🚀
                  </p>
                </div>
              </div>
            </div>
          </BorderGlow>
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
                style={{ backgroundImage: "url('/images/home/cta_coast.png')" }} 
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
