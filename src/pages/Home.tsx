import { HeroGlobe } from "@/components/landing/hero-globe"
import { ToursPreview } from "@/components/landing/tours-preview"
import { DiscoverToursStack } from "@/components/landing/discover-tours-stack"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ImpactPreview } from "@/components/landing/impact-preview"
import { CTASection } from "@/components/landing/cta-section"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"

export default function Home() {
  useSEO({
    title: "Live tours with real locals in Kenya",
    description:
      "See destinations live before you book. Connect with real locals in Kenya for unfiltered virtual tours.",
    image: "https://ausaguide.com/og-image.png",
    url: "https://ausaguide.com/",
  })

  return (
    <div className="relative overflow-hidden min-h-screen bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "name": "Ausaguide",
          "url": "https://ausaguide.com",
          "description": "See destinations live before you book. Connect with real locals in Kenya for unfiltered virtual tours.",
          "image": "https://ausaguide.com/og-image.png",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "KE"
          }
        }}
      />
      <div className="dark-section">
        <HeroGlobe />
      </div>
      <ToursPreview />
      <DiscoverToursStack />
      <HowItWorks />
      <ImpactPreview />
      <CTASection />
    </div>
  )
}
