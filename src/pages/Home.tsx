import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUser } from "@/hooks/useUser"
import { HeroSection } from "@/components/landing/HeroSection"
import { UrgentMatchModal } from "@/components/ui/UrgentMatchModal"
import { ToursPreview } from "@/components/landing/tours-preview"
import { DiscoverToursStack } from "@/components/landing/discover-tours-stack"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ImpactPreview } from "@/components/landing/impact-preview"
import { CTASection } from "@/components/landing/cta-section"
import { TikTokWidget } from "@/components/home/TikTokWidget"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"
import ProfileCard from "@/components/ui/ProfileCard"
import founderPhoto from "../assets/images/founder/austin-mbote.webp"
import { ArrowRight } from "lucide-react"

export default function Home() {
  const navigate = useNavigate()
  const { role, loading: userLoading } = useUser()
  const [urgentMatchOpen, setUrgentMatchOpen] = useState(false)

  // Redirect hosts and admins directly to their dedicated workspaces
  useEffect(() => {
    if (!userLoading && role) {
      if (role === "host") {
        navigate("/host/dashboard", { replace: true })
      } else if (role === "admin") {
        navigate("/admin2", { replace: true })
      }
    }
  }, [role, userLoading, navigate])

  useSEO({
    title: "Stop Wasting Money on Tourist Traps — Ausaguide Kenya",
    description:
      "Explore Kenya through a local's eyes before you book. Connect with vetted guides for live video tours and discover authentic local experiences.",
    keywords: "Kenya tours, local guides Kenya, Nairobi tours, live video tours, try before you fly, Kenya safaris, Maasai Mara, Mombasa travel, virtual tours",
    url: "https://ausaguide.com",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Ausaguide",
      "url": "https://ausaguide.com",
      "image": "https://ausaguide.com/og-image.png",
      "thumbnailUrl": "https://ausaguide.com/logo-mark.png",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://ausaguide.com/tours?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  })

  return (
    <div className="relative overflow-hidden min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "name": "Ausaguide",
          "url": "https://ausaguide.com",
          "logo": "https://ausaguide.com/logo-mark.png",
          "description": "See destinations live before you book. Connect with real locals in Kenya for unfiltered virtual tours.",
          "image": "https://ausaguide.com/og-image.png",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "KE"
          }
        }}
      />
      <div id="hero" className="w-full bg-transparent">
        <HeroSection />
      </div>

      {/* Action Selector Section */}
      <section className="bg-transparent py-20 px-6 relative overflow-hidden flex flex-col items-center border-b border-[#235E5D]/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#317978]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">What are you looking for?</h2>
            <p className="text-sm text-[#599D9C] max-w-md mx-auto leading-relaxed">
              Explore planned local journeys or match instantly with an active guide nearby.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Find a Tour Card */}
            <Link 
              to="/tours" 
              className="group relative rounded-2xl p-8 tactile-glow-card flex flex-col justify-between h-48 cursor-pointer"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-[#B7E6E5] transition-colors">Find a Tour</h3>
                <p className="text-xs text-[#599D9C] leading-relaxed">
                  Browse immersive virtual and in-person experiences led by certified guides.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B7E6E5] group-hover:underline">
                <span>Browse Tours</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Find a Host Card */}
            <button 
              type="button"
              onClick={() => setUrgentMatchOpen(true)}
              className="group relative rounded-2xl p-8 tactile-glow-card flex flex-col justify-between h-48 cursor-pointer text-left w-full"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-[#B7E6E5] transition-colors">Find a Host Now</h3>
                <p className="text-xs text-[#599D9C] leading-relaxed">
                  Connect live and matching with nearby hosts for real-time guidance.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B7E6E5] group-hover:underline">
                <span>Match Instantly</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </div>
      </section>

      <UrgentMatchModal isOpen={urgentMatchOpen} onClose={() => setUrgentMatchOpen(false)} />

      <div className="defer-render">
        <ToursPreview />
      </div>
      <div className="defer-render">
        <DiscoverToursStack />
      </div>
      <div className="defer-render">
        <HowItWorks />
      </div>
      <div className="defer-render">
        <ImpactPreview />
      </div>
      <div className="defer-render">
        <TikTokWidget />
      </div>
      <div className="defer-render">
        <CTASection />
      </div>

      {/* Founder Section */}
      <section className="bg-transparent py-20 px-6 border-t border-[#235E5D]/40 relative overflow-hidden flex flex-col items-center">
        {/* Subtle background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#317978]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Meet the Founder</h2>
          <p className="text-[#599D9C] mt-2 text-sm sm:text-base font-semibold">Built for connection, powered by people</p>
        </div>
        
        <div className="flex justify-center w-full max-w-sm relative z-10">
          <ProfileCard
            name="Austin M. Mbote"
            title="Founder & Lead Developer"
            status="Building connections"
            contactText="Let's Connect"
            avatarUrl={founderPhoto}
            showUserInfo={true}
            enableTilt={true}
            enableMobileTilt={true}
            behindGlowEnabled={true}
            behindGlowColor="rgba(49, 121, 120, 0.4)"
            innerGradient="linear-gradient(145deg, rgba(24, 73, 72, 0.8), rgba(17, 59, 58, 0.9))"
            onContactClick={() => window.open('https://www.linkedin.com/in/austin-murithi-5343aa402', '_blank')}
            onAvatarClick={() => window.location.href = '/about#founder-story'}
          />
        </div>
      </section>
    </div>
  )
}
