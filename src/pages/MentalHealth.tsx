import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, HeartPulse, ShieldAlert, Plane, Compass, Sun, Heart, Leaf, Waves, Mountain, User, Mail, FileText, ArrowRight, Quote, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { GradientText } from "@/components/ui/GradientText"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { SpotlightCard } from "@/components/ui/SpotlightCard"
import { WaitlistSection } from "@/components/ui/WaitlistSection"
import { StarBorder } from "@/components/ui/StarBorder"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"

const TIERS = [
  {
    icon: <Leaf className="size-6 text-[#2CB67D]" />,
    title: "Day Retreat",
    price: "$50",
    description: "1-day nature escape",
    details: "Includes transport, guided mindfulness hike, and organic meals.",
    color: "2CB67D",
  },
  {
    icon: <Sun className="size-6 text-[#7F5AF0]" />,
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
    url: "/images/mental-health/gallery_naivasha_sunset.png",
    caption: "Sunset peace over Lake Naivasha water sanctuary",
  },
  {
    url: "/images/mental-health/gallery_kilimanjaro_hiking.png",
    caption: "Nature hiking paths along Chyulu Hills highlands",
  },
  {
    url: "/images/mental-health/gallery_lamu_beach.png",
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
    <div className="dark-section relative overflow-hidden min-h-screen text-white flex flex-col items-center">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Ausaguide Mental Health Initiative",
          "url": "https://ausaguide.com/mental-health",
          "description": "Sponsor travel getaways to support mental health for local guides and communities."
        }}
      />
      {/* Decorative Top Accent Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-gradient-to-b from-[#7F5AF0]/10 via-[#7F5AF0]/3 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl w-full px-6 py-16 md:py-24 pt-32 flex flex-col space-y-16">
        
        {/* 1. Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/35 text-[10px] font-black uppercase tracking-wider text-[#7F5AF0]">
              <Brain className="size-3.5" /> Guide Wellness & Escape Network
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              <GradientText
                colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]}
                animationSpeed={6}
                yoyo={true}
              >
                Sponsor a Getaway,
              </GradientText>
              <br />
              <GradientText
                colors={["#2CB67D", "#7F5AF0", "#FFFFFE"]}
                animationSpeed={6}
                yoyo={true}
              >
                Heal a Mind
              </GradientText>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Sometimes all we need is a change of scenery. Sponsor a trip for someone who needs to disconnect, recharge, and find themselves again in nature's healing spaces.
            </p>
          </div>
          <div className="md:col-span-5 relative group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] opacity-25 blur-xl group-hover:opacity-40 transition duration-1000" />
            <img
              src="/images/mental-health/mental_health_hero.png"
              alt="Person sitting peacefully overlooking Watamu beach sunset"
              className="relative w-full h-[280px] rounded-3xl object-cover border border-border shadow-2xl"
            />
          </div>
        </div>

        {/* 2. The Problem & Solution (Why This Matters) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Problem */}
          <div className="md:col-span-6 flex">
            <BorderGlow
              glowColor="ef4444"
              glowIntensity={0.4}
              borderRadius={20}
              backgroundColor="#121214"
              className="w-full flex"
            >
              <div className="p-7 bg-[#121214]/60 border border-border rounded-2xl space-y-4 flex-1 flex flex-col justify-between hover:border-border transition duration-300">
                <div className="space-y-3">
                  <img
                    src="/images/mental-health/problem_nairobi_city.png"
                    alt="Crowded street in Nairobi"
                    className="w-full h-36 object-cover rounded-xl mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-5 text-red-500" />
                    <h3 className="font-extrabold text-sm text-white">
                      <GradientText colors={["#ef4444", "#7F5AF0", "#FFFFFE"]} animationSpeed={4}>
                        Sustained Guide Burnout
                      </GradientText>
                    </h3>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Burnout impacts millions of service sector workers globally. Constant physical exhaustion prevents local Kenyan guides from finding time to properly disconnect and recharge.
                  </p>
                </div>
              </div>
            </BorderGlow>
          </div>

          {/* Solution */}
          <div className="md:col-span-6 flex">
            <BorderGlow
              glowColor="2CB67D"
              glowIntensity={0.4}
              borderRadius={20}
              backgroundColor="#121214"
              className="w-full flex"
            >
              <div className="p-7 bg-[#121214]/60 border border-border rounded-2xl space-y-4 flex-1 flex flex-col justify-between hover:border-border transition duration-300">
                <div className="space-y-3">
                  <img
                    src="/images/mental-health/solution_chyulu_hills.png"
                    alt="Traveler relaxing in nature"
                    className="w-full h-36 object-cover rounded-xl mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <HeartPulse className="size-5 text-[#2CB67D]" />
                    <h3 className="font-extrabold text-sm text-[#2CB67D]">
                      <GradientText colors={["#2CB67D", "#7F5AF0", "#FFFFFE"]} animationSpeed={4}>
                        Mindfulness in Nature
                      </GradientText>
                    </h3>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Scientific research shows that nature-based rest breaks support sustainable work habits, reduce physical stress markers, and restore creative clarity.
                  </p>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>

        {/* 3. Serene Sanctuary Image Banner */}
        <div className="relative rounded-3xl overflow-hidden h-60 border border-border group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />
          <img
            src="/images/mental-health/gallery_waterfall_highlands.png"
            alt="Beautiful sunlight streaming through lush serene forest path"
            className="w-full h-full object-cover z-0"
          />
          <div className="absolute bottom-6 left-6 right-6 z-20 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#2CB67D] block">Natural Sanctuary</span>
            <h4 className="text-xl font-bold text-white">Reconnecting with Tranquility</h4>
            <p className="text-xs text-white/60 max-w-xl">Every sponsored getaway is hosted in certified green spaces to maximize mental recovery.</p>
          </div>
        </div>

        {/* 4. How It Works */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white text-center md:text-left">
            <GradientText colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]} animationSpeed={4}>
              How It Works
            </GradientText>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Plane className="size-5 text-[#7F5AF0]" />, title: "Sponsor a Getaway", desc: "Select a curated wellness getaway tier to sponsor a break." },
              { icon: <Compass className="size-5 text-[#2CB67D]" />, title: "Partner Curation", desc: "We coordinate with local wellness sanctuaries and travel houses." },
              { icon: <Sun className="size-5 text-blue-500" />, title: "Send a Recipient", desc: "A guide or community helper goes on a fully funded retreat." },
              { icon: <Heart className="size-5 text-pink-500" />, title: "Healed & Refreshed", desc: "They return energized with stories of renewal and gratitude." },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-border bg-[#121214]/30 space-y-4 relative overflow-hidden group hover:border-[#7F5AF0]/30 transition-all">
                <div className="p-3 rounded-xl bg-accent/ w-fit group-hover:bg-[#7F5AF0]/10 transition-colors">
                  {item.icon}
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-white">{item.title}</h4>
                  <p className="text-[11px] text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Sponsorship Tiers */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white text-center md:text-left">
            <GradientText colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]} animationSpeed={4}>
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
                backgroundColor="#121214"
              >
                <div className="p-6 bg-[#121214]/60 border border-border rounded-2xl h-full flex flex-col justify-between space-y-4 hover:border-border transition duration-300">
                  <div className="space-y-2">
                    <div className="p-2.5 bg-accent/ rounded-xl w-fit">{tier.icon}</div>
                    <h4 className="font-black text-sm text-white pt-1">{tier.title}</h4>
                    <span className="text-xl font-black text-white">{tier.price}</span>
                    <p className="text-xs font-semibold text-[#7F5AF0]">{tier.description}</p>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed pt-2 border-t border-border">
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
            <h3 className="text-2xl font-bold text-white">
              <GradientText colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]} animationSpeed={4}>
                Commitment to Wellness
              </GradientText>
            </h3>
            <p className="text-xs text-white/40">Help us support local community guides by offering options for physical and mental rest.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpotlightCard className="p-6 border border-border bg-[#121214]/40 rounded-2xl space-y-4 flex flex-col justify-between h-full hover:border-border transition duration-300">
              <div className="space-y-3">
                <Quote className="size-6 text-[#7F5AF0]/30" />
                <p className="text-xs text-white/70 italic leading-relaxed">
                  "Travel has the power to clear the mind, reduce stress, and restore physical energy. Supporting guide wellness means strengthening the local hospitality community."
                </p>
              </div>
            </SpotlightCard>
            <SpotlightCard className="p-6 border border-border bg-[#121214]/40 rounded-2xl space-y-4 flex flex-col justify-between h-full hover:border-border transition duration-300">
              <div className="space-y-3">
                <Quote className="size-6 text-[#7F5AF0]/30" />
                <p className="text-xs text-white/70 italic leading-relaxed">
                  "Every sponsored break enables a guide or community host in Kenya to find time to disconnect and recharge in nature, fostering healthier guide ecosystems."
                </p>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="space-y-6">
          <div className="text-center md:text-left space-y-1.5">
            <div className="flex items-center gap-1.5 justify-center md:justify-start text-[#7F5AF0]">
              <Camera className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Project Gallery</span>
            </div>
            <h3 className="text-2xl font-bold text-white">
              <GradientText colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]} animationSpeed={4}>
                Serene Landscapes
              </GradientText>
            </h3>
            <p className="text-xs text-white/40 font-medium">Glimpses of tranquil retreat destinations and natural sanctuaries in Kenya.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GALLERY.map((img, idx) => (
              <div key={idx} className="group relative rounded-2xl overflow-hidden border border-border bg-[#121214]/50">
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <p className="text-[10px] text-white/70 font-semibold">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Commitment Pledge Form */}
        <SpotlightCard className="p-8 border border-border bg-[#121214]/40 rounded-2xl space-y-6">
          <div className="flex items-center gap-2.5">
            <Compass className="size-6 text-[#7F5AF0]" />
            <h3 className="text-xl font-bold text-white font-accent">
              <GradientText colors={["#7F5AF0", "#2CB67D", "#FFFFFE"]} animationSpeed={4}>
                Commit to Sponsoring a Getaway
              </GradientText>
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-2xl">
            Pledge a virtual commitment today (no payment required). Once we launch the checkout flow, you'll be invited to fund a getaway experience. A digital pledge certificate will be generated upon submission.
          </p>

          <form onSubmit={handlePledgeSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Your Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={pledgeName}
                    onChange={(e) => setPledgeName(e.target.value)}
                    disabled={submittingPledge}
                    required
                    className="pl-10 h-11 bg-black/45 border-border text-xs rounded-xl focus:border-[#7F5AF0] text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={pledgeEmail}
                    onChange={(e) => setPledgeEmail(e.target.value)}
                    disabled={submittingPledge}
                    required
                    className="pl-10 h-11 bg-black/45 border-border text-xs rounded-xl focus:border-[#7F5AF0] text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Dedication (Optional)</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                <Input
                  type="text"
                  placeholder="e.g. Dedicated to local guides in Masai Mara"
                  value={pledgeDedication}
                  onChange={(e) => setPledgeDedication(e.target.value)}
                  disabled={submittingPledge}
                  className="pl-10 h-11 bg-black/45 border-border text-xs rounded-xl focus:border-[#7F5AF0] text-white"
                />
              </div>
            </div>

            <StarBorder
              as="button"
              type="submit"
              disabled={submittingPledge}
              color="#7F5AF0"
              className="w-full rounded-xl overflow-hidden shadow-lg shadow-[#7F5AF0]/10"
            >
              <div className="w-full h-11 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#121214]">
                {submittingPledge ? "Submitting commitment..." : "Commit to Sponsoring a Getaway"}
                <ArrowRight className="size-3.5" />
              </div>
            </StarBorder>
          </form>
        </SpotlightCard>

        {/* 8. Waitlist Section */}
        <WaitlistSection defaultInterest="mental-health-travel" />

      </div>
    </div>
  )
}
