import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, HeartPulse, ShieldAlert, Plane, Compass, Sun, Heart, Leaf, Waves, Mountain, User, Mail, FileText, ArrowRight, Quote, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/GradientText"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { WaitlistSection } from "@/components/ui/WaitlistSection"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"

import mentalHealthHero from "../assets/images/mental-health/mental-health-hero.webp"
import mentalGallery1 from "../assets/images/mental-health/mental-gallery-1.webp"
import mentalGallery2 from "../assets/images/mental-health/mental-gallery-2.webp"
import mentalGallery3 from "../assets/images/mental-health/mental-gallery-3.webp"
import mentalGallery4 from "../assets/images/mental-health/mental-gallery-4.webp"

const TIERS = [
 {
 icon: <Leaf className="size-6 text-[#0D6F73]" />,
 title: "Day Retreat",
 price: "$50",
 description: "1-day nature escape",
 details: "Includes transport, guided mindfulness hike, and organic meals.",
 color: "2CB67D",
 },
 {
 icon: <Sun className="size-6 text-[#0D6F73]" />,
 title: "Weekend Getaway",
 price: "$100",
 description: "2-day wellness retreat",
 details: "Includes accommodation, meditation class, and forest walking activities.",
 color: "7F5AF0",
 },
 {
 icon: <Waves className="size-6 text-blue-500" />,
 title: "Cultural Immersion",
 price: "$250",
 description: "5-day Swahili Coast break",
 details: "Full local community stay, coastal sailing, and traditional healing foods.",
 color: "3b82f6",
 },
 {
 icon: <Mountain className="size-6 text-pink-500" />,
 title: "Healing Journey",
 price: "$500",
 description: "7-day Mount Kenya retreat",
 details: "All-inclusive mountain lodge, professional guide wellness sessions, and scenic hikes.",
 color: "ec4899",
 },
]

const GALLERY = [
 {
 url: mentalGallery1,
 caption: "Sunset peace over Lake Naivasha water sanctuary",
 },
 {
 url: mentalGallery2,
 caption: "Nature hiking paths along Chyulu Hills highlands",
 },
 {
 url: mentalGallery4,
 caption: "Quiet ocean relaxation on Watamu beaches",
 },
]


export default function MentalHealthPage() {
 useSEO({
 title: "Sponsor a Getaway, Heal a Mind | Ausaguide",
 description: "Sponsor therapeutic travel experiences and getaways for local guides and community members in Kenya to combat burnout and recharge.",
 })

 const navigate = useNavigate()

 // Virtual Commitment state
 const [pledgeName, setPledgeName] = useState("")
 const [pledgeEmail, setPledgeEmail] = useState("")
 const [pledgeDedication, setPledgeDedication] = useState("")
 const [submittingPledge, setSubmittingPledge] = useState(false)

 const handlePledgeSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!pledgeName.trim() || !pledgeEmail.trim()) {
 toast.error("Please enter your name and email.")
 return
 }

 setSubmittingPledge(true)
 try {
 let finalCommitmentId = ""

 // 1. Try to invoke edge function
 try {
 const { data, error } = await supabase.functions.invoke("generate-travel-commitment-id", {
 method: "GET"
 })
 if (data && data.commitment_id) {
 finalCommitmentId = data.commitment_id
 } else {
 console.warn("Edge function didn't return commitment_id:", error)
 }
 } catch (err) {
 console.warn("Failed to call generate-travel-commitment-id, falling back to local generation:", err)
 }

 // 2. Client fallback
 if (!finalCommitmentId) {
 try {
 const { count, error } = await supabase
 .from("travel_commitments")
 .select("*", { count: "exact", head: true })
 
 if (error) throw error
 
 const nextIndex = (count || 0) + 1
 finalCommitmentId = `AUS-TRAVEL-${nextIndex.toString().padStart(4, "0")}`
 } catch (dbErr) {
 console.warn("Database query failed, generating random commitment ID:", dbErr)
 const randomNum = Math.floor(1000 + Math.random() * 9000)
 finalCommitmentId = `AUS-TRAVEL-${randomNum}`
 }
 }

 const userId = localStorage.getItem("user_id")

 // 3. Save to database
 const { error } = await supabase
 .from("travel_commitments")
 .insert({
 user_id: userId || null,
 email: pledgeEmail.trim(),
 name: pledgeName.trim(),
 dedication: pledgeDedication.trim() || null,
 commitment_id: finalCommitmentId,
 status: "pending",
 })

 if (error) throw error

 toast.success("🌅 Your travel getaway commitment has been registered! Commitment ID: " + finalCommitmentId)

 // Redirect to thank you page with state
 navigate("/travel-commitment-thank-you", {
 state: {
 name: pledgeName.trim(),
 email: pledgeEmail.trim(),
 commitmentId: finalCommitmentId,
 dedication: pledgeDedication.trim() || "For the wellness of Kenyan guides",
 date: new Date().toLocaleDateString("en-US", {
 year: "numeric",
 month: "long",
 day: "numeric",
 })
 }
 })
 } catch (err: any) {
 console.error(err)
 toast.error(err.message || "Failed to submit commitment. Please try again.")
 } finally {
 setSubmittingPledge(false)
 }
 }

 return (
    <div className="relative overflow-hidden min-h-screen bg-background text-foreground flex flex-col items-center">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          "name": "Ausaguide Mental Health & Guide Wellness",
          "url": "https://ausaguide.com/mental-health",
          "description": "Sponsor wellness retreats for local guides in Kenya to foster holistic mental recovery and rest.",
          "areaServed": "KE"
        }}
      />

      <div className="relative z-10 max-w-4xl w-full px-6 py-16 md:py-24 pt-32 flex flex-col space-y-16">
        
        {/* 1. Hero / Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/20 text-[10px] font-black uppercase tracking-wider text-brand">
              <Brain className="size-3.5" /> Guide Wellness & Recovery
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-foreground">
              Sponsor a Trip, <br />
              <GradientText
                colors={["#06363D", "#0D6F73", "#06363D"]}
                animationSpeed={6}
                yoyo={true}
              >
                Heal a Mind
              </GradientText>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium">
              Sometimes all we need is a change of scenery. Sponsor a trip for someone who needs to disconnect, recharge, and find themselves again in nature's healing spaces.
            </p>
          </div>
          <div className="md:col-span-5 relative group">
            <img
              src={mentalHealthHero}
              alt="Person sitting peacefully overlooking Watamu beach sunset"
              loading="lazy"
              className="relative w-full h-[280px] rounded-3xl object-cover border border-border shadow-modern"
            />
          </div>
        </div>

        {/* 2. The Problem & Solution (Why This Matters) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Problem */}
          <div className="md:col-span-6 flex">
            <BorderGlow
              glowColor="239 68 68"
              glowIntensity={0.4}
              borderRadius={20}
              className="w-full flex"
            >
              <div className="p-7 bg-card shadow-modern border border-border rounded-2xl space-y-4 flex-1 flex flex-col justify-between hover:border-border transition duration-300">
                <div className="space-y-3">
                  <img
                    src="/images/mental-health/problem_nairobi_city.webp"
                    alt="Crowded street in Nairobi"
                    loading="lazy"
                    className="w-full h-36 object-cover rounded-xl mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-5 text-rose-500" />
                    <h3 className="font-extrabold text-sm text-foreground">
                      Sustained Guide Burnout
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Burnout impacts millions of service sector workers globally. Constant physical exhaustion prevents local Kenyan guides from finding time to properly disconnect and recharge.
                  </p>
                </div>
              </div>
            </BorderGlow>
          </div>

          {/* Solution */}
          <div className="md:col-span-6 flex">
            <BorderGlow
              glowColor="183 70 25"
              glowIntensity={0.4}
              borderRadius={20}
              className="w-full flex"
            >
              <div className="p-7 bg-card shadow-modern border border-border rounded-2xl space-y-4 flex-1 flex flex-col justify-between hover:border-border transition duration-300">
                <div className="space-y-3">
                  <img
                    src="/images/mental-health/solution_chyulu_hills.webp"
                    alt="Traveler relaxing in nature"
                    loading="lazy"
                    className="w-full h-36 object-cover rounded-xl mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <HeartPulse className="size-5 text-brand" />
                    <h3 className="font-extrabold text-sm text-brand">
                      Mindfulness in Nature
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Scientific research shows that nature-based rest breaks support sustainable work habits, reduce physical stress markers, and restore creative clarity.
                  </p>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>

        {/* 3. Serene Sanctuary Image Banner */}
        <div className="relative rounded-3xl overflow-hidden h-60 border border-border group shadow-modern">
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />
          <img
            src={mentalGallery3}
            alt="Beautiful sunlight streaming through lush serene forest path"
            loading="lazy"
            className="w-full h-full object-cover z-0"
          />
          <div className="absolute bottom-6 left-6 right-6 z-20 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-light block">Natural Sanctuary</span>
            <h4 className="text-xl font-bold text-white">Reconnecting with Tranquility</h4>
            <p className="text-xs text-white/80 max-w-xl font-medium">Every sponsored getaway is hosted in certified green spaces to maximize mental recovery.</p>
          </div>
        </div>

        {/* 4. How It Works */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-foreground text-center md:text-left">
            <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
              How It Works
            </GradientText>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Plane className="size-5 text-brand" />, title: "Sponsor a Getaway", desc: "Select a curated wellness getaway tier to sponsor a break." },
              { icon: <Compass className="size-5 text-brand" />, title: "Partner Curation", desc: "We coordinate with local wellness sanctuaries and travel houses." },
              { icon: <Sun className="size-5 text-brand" />, title: "Send a Recipient", desc: "A guide or community helper goes on a fully funded retreat." },
              { icon: <Heart className="size-5 text-brand" />, title: "Healed & Refreshed", desc: "They return energized with stories of renewal and gratitude." },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-border bg-card shadow-modern space-y-4 relative overflow-hidden group hover:border-brand/40 transition-all">
                <div className="p-3 rounded-xl bg-brand/10 text-brand w-fit">
                  {item.icon}
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Sponsorship Tiers */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-foreground text-center md:text-left">
            <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
              Sponsorship Tiers
            </GradientText>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {TIERS.map((tier, idx) => (
              <BorderGlow
                key={idx}
                glowColor={tier.color}
                glowIntensity={0.4}
                borderRadius={16}
                className="w-full h-full"
              >
                <div className="p-6 bg-card shadow-modern border border-border rounded-2xl h-full flex flex-col justify-between space-y-4 hover:border-brand/40 transition duration-300">
                  <div className="space-y-2">
                    <div className="p-2.5 bg-brand/10 text-brand rounded-xl w-fit">{tier.icon}</div>
                    <h4 className="font-black text-sm text-foreground pt-1">{tier.title}</h4>
                    <span className="text-xl font-black text-foreground">{tier.price}</span>
                    <p className="text-xs font-semibold text-brand">{tier.description}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border font-medium">
                    {tier.details}
                  </p>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>

        {/* 6. Honest Aspirational Statements */}
        <div className="space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-2xl font-bold text-foreground">
              <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
                Commitment to Wellness
              </GradientText>
            </h3>
            <p className="text-xs text-muted-foreground font-medium">Help us support local community guides by offering options for physical and mental rest.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border border-border bg-card shadow-modern rounded-2xl space-y-4 flex flex-col justify-between h-full hover:border-border transition duration-300">
              <div className="space-y-3">
                <Quote className="size-6 text-brand/40" />
                <p className="text-xs text-foreground/80 italic leading-relaxed font-medium">
                  "Travel has the power to clear the mind, reduce stress, and restore physical energy. Supporting guide wellness means strengthening the local hospitality community."
                </p>
              </div>
            </div>
            <div className="p-6 border border-border bg-card shadow-modern rounded-2xl space-y-4 flex flex-col justify-between h-full hover:border-border transition duration-300">
              <div className="space-y-3">
                <Quote className="size-6 text-brand/40" />
                <p className="text-xs text-foreground/80 italic leading-relaxed font-medium">
                  "Every sponsored break enables a guide or community host in Kenya to find time to disconnect and recharge in nature, fostering healthier guide ecosystems."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="space-y-6">
          <div className="text-center md:text-left space-y-1.5">
            <div className="flex items-center gap-1.5 justify-center md:justify-start text-brand font-bold">
              <Camera className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Project Gallery</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
                Serene Landscapes
              </GradientText>
            </h3>
            <p className="text-xs text-muted-foreground font-medium">Glimpses of tranquil retreat destinations and natural sanctuaries in Kenya.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GALLERY.map((img, idx) => (
              <div key={idx} className="group relative rounded-2xl overflow-hidden border border-border bg-card shadow-modern">
                <img
                  src={img.url}
                  alt={img.caption}
                  loading="lazy"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <p className="text-[10px] text-white/90 font-semibold">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Commitment Pledge Form */}
        <div className="p-8 border border-border bg-card shadow-modern rounded-3xl space-y-6">
          <div className="flex items-center gap-2.5">
            <Compass className="size-6 text-brand" />
            <h3 className="text-xl font-bold text-foreground font-accent">
              <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
                Commit to Sponsoring a Getaway
              </GradientText>
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium">
            Pledge a virtual commitment today (no payment required). Once we launch the checkout flow, you'll be invited to fund a getaway experience. A digital pledge certificate will be generated upon submission.
          </p>

          <form onSubmit={handlePledgeSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Your Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={pledgeName}
                    onChange={(e) => setPledgeName(e.target.value)}
                    disabled={submittingPledge}
                    required
                    className="pl-10 h-11 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={pledgeEmail}
                    onChange={(e) => setPledgeEmail(e.target.value)}
                    disabled={submittingPledge}
                    required
                    className="pl-10 h-11 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Dedication (Optional)</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="e.g. Dedicated to local guides in Masai Mara"
                  value={pledgeDedication}
                  onChange={(e) => setPledgeDedication(e.target.value)}
                  disabled={submittingPledge}
                  className="pl-10 h-11 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submittingPledge}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#0B3037] to-[#0D6F73] hover:from-[#06363D] hover:to-[#0B3037] text-white font-bold shadow-neo-pill border border-white/15 cursor-pointer flex items-center justify-center gap-1.5 text-xs"
            >
              {submittingPledge ? "Submitting commitment..." : "Commit to Sponsoring a Getaway"}
              <ArrowRight className="size-3.5" />
            </Button>
          </form>
        </div>

        {/* 8. Waitlist Section */}
        <WaitlistSection defaultInterest="mental-health-travel" />

      </div>
    </div>
 )
}
