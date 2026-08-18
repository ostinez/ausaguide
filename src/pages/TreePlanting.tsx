import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { TreePine, Sprout, Globe, Leaf, TrendingUp, Heart, ShieldCheck, Mail, Building, User, FileText, ArrowRight, Camera, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GradientText } from "@/components/ui/GradientText"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { WaitlistSection } from "@/components/ui/WaitlistSection"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"
import { JsonLd } from "@/components/seo/JsonLd"

import treePlantingHero from "../assets/images/tree-planting/tree-planting-hero.webp"
import meruOakImage from "../assets/images/tree-planting/meru-oak.webp"
import africanTulipImage from "../assets/images/tree-planting/african-tulip.webp"
import crotonImage from "../assets/images/tree-planting/croton.webp"
import treeGallery1 from "../assets/images/tree-planting/tree-gallery-1.webp"
import treeGallery2 from "../assets/images/tree-planting/tree-gallery-2.webp"
import treeGallery3 from "../assets/images/tree-planting/tree-gallery-3.webp"

const TREE_TYPES = [
 {
 name: "Meru Oak (Vitex keniensis)",
 description: "Native to Kenya's highlands. Features a massive canopy offering excellent shade, historically valued for timber and traditional medicine, and plays a vital role in supporting local highland biodiversity.",
 image: meruOakImage,
 color: "2CB67D",
 },
 {
 name: "African Tulip Tree (Spathodea campanulata)",
 description: "Native to tropical Africa including Kenya. Its bright red/orange bell-shaped flowers attract local birds and bees. Fast-growing and resilient, making it highly popular for community reforestation efforts.",
 image: africanTulipImage,
 color: "7F5AF0",
 },
 {
 name: "Croton (Croton megalocarpus)",
 description: "Indigenous to Kenya. Produces oil-rich seeds historically utilized for biofuel. Its expansive canopy provides shade, improves soil fertility, and adapts well across different regions of Kenya.",
 image: crotonImage,
 color: "3b82f6",
 },
]

const GALLERY = [
 {
 url: treeGallery1,
 caption: "Community sapling nurseries in Mount Kenya region",
 },
 {
 url: treeGallery2,
 caption: "Lush native forest canopy restoration",
 },
 {
 url: treeGallery3,
 caption: "Water catchment protection in highlands",
 },
]


export default function TreePlantingPage() {
 useSEO({
 title: "Eco Tree Planting Initiative | Ausaguide",
 description: "Building a network of local reforestation initiatives in Kenya. Support sustainable tree planting and local guide communities.",
 })

 const navigate = useNavigate()

 // Virtual Tree Form State
 const [treeName, setTreeName] = useState("")
 const [dedication, setDedication] = useState("")
 const [fullName, setFullName] = useState("")
 const [treeEmail, setTreeEmail] = useState("")
 const [submittingTree, setSubmittingTree] = useState(false)

 // Partnership form state
 const [orgName, setOrgName] = useState("")
 const [contactName, setContactName] = useState("")
 const [partnerEmail, setPartnerEmail] = useState("")
 const [partnerMessage, setPartnerMessage] = useState("")
 const [submittingPartner, setSubmittingPartner] = useState(false)
 const [partnerSuccess, setPartnerSuccess] = useState(false)

 const handlePlantTree = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!fullName.trim() || !treeEmail.trim()) {
 toast.error("Please enter your name and email.")
 return
 }

 setSubmittingTree(true)
 try {
 let finalTreeId = ""

 // 1. Try to invoke edge function
 try {
 const { data, error } = await supabase.functions.invoke("generate-tree-id", {
 method: "GET"
 })
 if (data && data.tree_id) {
 finalTreeId = data.tree_id
 } else {
 console.warn("Edge function didn't return tree_id:", error)
 }
 } catch (err) {
 console.warn("Failed to call generate-tree-id edge function, falling back to local generation:", err)
 }

 // 2. Client-side fallback if edge function failed/not deployed
 if (!finalTreeId) {
 try {
 const { count, error } = await supabase
 .from("tree_commitments")
 .select("*", { count: "exact", head: true })
 
 if (error) throw error
 
 const nextIndex = (count || 0) + 1
 finalTreeId = `AUS-TREE-${nextIndex.toString().padStart(4, "0")}`
 } catch (dbErr) {
 console.warn("Database count failed, generating random tree ID:", dbErr)
 const randomNum = Math.floor(1000 + Math.random() * 9000)
 finalTreeId = `AUS-TREE-${randomNum}`
 }
 }

 const userId = localStorage.getItem("user_id")

 // 3. Save to database
 const { error } = await supabase
 .from("tree_commitments")
 .insert({
 user_id: userId || null,
 email: treeEmail.trim(),
 name: fullName.trim(),
 tree_name: treeName.trim() || null,
 dedication: dedication.trim() || null,
 tree_id: finalTreeId,
 status: "pending",
 })

 if (error) throw error

 toast.success("Your virtual tree has been planted! Tree ID: " + finalTreeId)
 
 // Redirect to thank you page with state
 navigate("/tree-planted", {
 state: {
 name: fullName.trim(),
 email: treeEmail.trim(),
 treeId: finalTreeId,
 treeName: treeName.trim() || "Unnamed",
 dedication: dedication.trim() || "None",
 date: new Date().toLocaleDateString("en-US", {
 year: "numeric",
 month: "long",
 day: "numeric",
 })
 }
 })
 } catch (err: any) {
 console.error(err)
 toast.error(err.message || "Failed to plant virtual tree. Please try again.")
 } finally {
 setSubmittingTree(false)
 }
 }

 const handlePartnerSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!orgName.trim() || !contactName.trim() || !partnerEmail.trim()) {
 toast.error("Please fill in all required fields.")
 return
 }

 setSubmittingPartner(true)
 try {
 const { error } = await supabase
 .from("partnership_inquiries")
 .insert({
 organization_name: orgName.trim(),
 contact_name: contactName.trim(),
 email: partnerEmail.trim(),
 type: "tree-planting",
 message: partnerMessage.trim(),
 })

 if (error) throw error

 toast.success("Thank you for reaching out! Our team will respond within 48 hours.")
 setPartnerSuccess(true)
 // Reset form
 setOrgName("")
 setContactName("")
 setPartnerEmail("")
 setPartnerMessage("")
 } catch (err: any) {
 console.error(err)
 toast.error(err.message || "Failed to submit. Please try again.")
 } finally {
 setSubmittingPartner(false)
 }
 }  return (
    <div className="relative overflow-hidden min-h-screen bg-background text-foreground flex flex-col items-center">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NGO",
          "name": "Ausaguide Tree Planting",
          "url": "https://ausaguide.com/tree-planting",
          "description": "Contribute to Kenya's reforestation. Ausaguide plants trees on your behalf to restore the environment and support local communities.",
          "areaServed": "KE"
        }}
      />

      <div className="relative z-10 max-w-4xl w-full px-6 py-16 md:py-24 pt-32 flex flex-col space-y-16">
        
        {/* 1. Hero / Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/20 text-[10px] font-black uppercase tracking-wider text-brand">
              <TreePine className="size-3.5" /> Forest Canopy Restoration
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-foreground">
              <GradientText
                colors={["#06363D", "#0D6F73", "#06363D"]}
                animationSpeed={6}
                yoyo={true}
              >
                Plant Trees, Grow Hope
              </GradientText>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium">
              Join us to support local community guides in reforesting native woodland buffers. Together, we work towards restoring Kenya's forests, creating local jobs, and protecting fragile ecosystems.
            </p>
          </div>
          <div className="md:col-span-5 relative group">
            <img
              src={treePlantingHero}
              alt="Community tree planting in Kenya forest restoration"
              loading="lazy"
              className="relative w-full h-[260px] rounded-3xl object-cover border border-border shadow-modern"
            />
          </div>
        </div>

        {/* 2. Impact Section (Vision) */}
        <BorderGlow
          glowColor="183 70 25"
          glowIntensity={0.5}
          borderRadius={16}
          className="w-full"
        >
          <div className="p-8 bg-card shadow-modern border border-border rounded-2xl space-y-6">
            <div className="flex items-center gap-2.5">
              <Globe className="size-6 text-brand" />
              <h2 className="text-xl font-bold text-foreground">
                <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
                  Factual Reforestation in Kenya
                </GradientText>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-foreground/80">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-brand" />
                  <h4 className="font-extrabold text-brand">50,000 Hectares Lost</h4>
                </div>
                <p className="leading-relaxed text-muted-foreground text-[11px] sm:text-xs font-medium">
                  Kenya loses approximately 50,000 hectares of forest annually. Active planting assists in reversing land degradation and securing vital water towers.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Leaf className="size-4 text-brand" />
                  <h4 className="font-extrabold text-brand">11% Forested Land</h4>
                </div>
                <p className="leading-relaxed text-muted-foreground text-[11px] sm:text-xs font-medium">
                  Currently, only about 11% of Kenya's land is forested. Expanding native woodland canopy cover is a critical national biodiversity target.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-brand" />
                  <h4 className="font-extrabold text-brand">22kg CO2 Per Tree</h4>
                </div>
                <p className="leading-relaxed text-muted-foreground text-[11px] sm:text-xs font-medium">
                  Each mature tree absorbs roughly 22kg of CO2 per year. Planting native species establishes permanent carbon sinks that directly offset traveler footprints.
                </p>
              </div>
            </div>
          </div>
        </BorderGlow>

        {/* 3. Tree Types Section */}
        <div className="space-y-6">
          <div className="text-center md:text-left space-y-1.5">
            <h3 className="text-2xl font-bold text-foreground">
              <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
                Real Native Tree Species
              </GradientText>
            </h3>
            <p className="text-xs text-muted-foreground font-medium">We select and plant native trees that thrive in Kenya's unique ecosystems, boosting local biodiversity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TREE_TYPES.map((tree, idx) => (
              <BorderGlow
                key={idx}
                glowColor={tree.color}
                glowIntensity={0.4}
                borderRadius={20}
                className="w-full h-full"
              >
                <div className="bg-card shadow-modern border border-border rounded-2xl overflow-hidden h-full flex flex-col justify-between hover:border-brand/40 transition duration-300">
                  <img
                    src={tree.image}
                    alt={tree.name}
                    loading="lazy"
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Leaf className="size-3.5 text-brand" />
                      <h4 className="font-black text-sm text-foreground">{tree.name}</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                      {tree.description}
                    </p>
                  </div>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>

        {/* 4. Plant a Virtual Tree (Commitment) */}
        <div className="p-8 border border-border bg-card shadow-modern rounded-3xl space-y-6">
          <div className="flex items-center gap-2.5">
            <Sprout className="size-6 text-brand" />
            <h3 className="text-xl font-bold text-foreground font-accent">
              <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
                Commit to Reforestation
              </GradientText>
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium">
            Pledge a virtual tree today at no cost. Give it a name and a dedication message. Once submitted, a unique Tree ID and digital certificate will be generated to certify your commitment to local reforestation in Kenya.
          </p>

          <form onSubmit={handlePlantTree} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Your Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={submittingTree}
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
                    value={treeEmail}
                    onChange={(e) => setTreeEmail(e.target.value)}
                    disabled={submittingTree}
                    required
                    className="pl-10 h-11 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Tree Name (Optional)</label>
                <div className="relative">
                  <TreePine className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="e.g. Acacia Sunrise"
                    value={treeName}
                    onChange={(e) => setTreeName(e.target.value)}
                    disabled={submittingTree}
                    className="pl-10 h-11 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Dedication (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="e.g. In memory of loved ones"
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    disabled={submittingTree}
                    className="pl-10 h-11 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submittingTree}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#0B3037] to-[#0D6F73] hover:from-[#06363D] hover:to-[#0B3037] text-white font-bold shadow-neo-pill border border-white/15 cursor-pointer flex items-center justify-center gap-1.5 text-xs"
            >
              {submittingTree ? "Planting Tree..." : "Plant My Tree"}
              <ArrowRight className="size-3.5" />
            </Button>
          </form>
        </div>

        {/* 5. Aspirational Commitment block */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 relative group">
            <img
              src={treeGallery2}
              alt="Local guides protecting tree saplings"
              loading="lazy"
              className="w-full h-[260px] rounded-3xl object-cover border border-border shadow-modern"
            />
          </div>
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center gap-1.5 text-brand font-bold">
              <Heart className="size-4 fill-current" />
              <span className="text-[10px] uppercase tracking-wider">Aspirational Commitment</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
                Be Part of the Solution
              </GradientText>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic font-medium">
              "Every tree planted today is a forest for tomorrow. Help us plant trees across Kenya to restore native forest canopies, protect local watersheds, and create sustainable jobs."
            </p>
          </div>
        </div>

        {/* 6. Gallery Section */}
        <div className="space-y-6">
          <div className="text-center md:text-left space-y-1.5">
            <div className="flex items-center gap-1.5 justify-center md:justify-start text-brand font-bold">
              <Camera className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Project Gallery</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
                Reforestation in Action
              </GradientText>
            </h3>
            <p className="text-xs text-muted-foreground font-medium">Glances of guide-led tree nurseries and native restoration camps in Kenya.</p>
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

        {/* 7. Partnership Contact Form */}
        <div className="space-y-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-xl font-bold text-foreground">
              <GradientText colors={["#06363D", "#0D6F73", "#06363D"]} animationSpeed={4}>
                Are you a tree-planting organization?
              </GradientText>
            </h3>
            <p className="text-xs text-muted-foreground font-medium">Partner with us to deploy sustainable planting options in local reserves.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Info pane */}
            <div className="md:col-span-4 space-y-6">
              <div className="p-5 rounded-2xl border border-border bg-card shadow-modern space-y-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  We are actively vetting partners in Kenya. If you manage seed nurseries, coordinate community planting, or track forest protection, we would love to connect.
                </p>
                <div className="pt-2">
                  <p className="text-[10px] text-muted-foreground font-semibold">Direct Email:</p>
                  <a href="mailto:welcome@ausaguide.com" className="text-xs font-bold text-brand hover:underline">
                    welcome@ausaguide.com
                  </a>
                </div>
              </div>
            </div>

            {/* Form pane */}
            <div className="md:col-span-8 p-6 rounded-3xl border border-border bg-card shadow-modern">
              {partnerSuccess ? (
                <div className="p-6 text-center space-y-3 bg-card shadow-modern rounded-xl">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand/10 border border-brand/20 text-brand">
                    <ShieldCheck className="size-6" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Thank you for reaching out!
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
                    Our team will respond within 48 hours. We appreciate your interest in partnering with us.
                  </p>
                  <Button
                    onClick={() => setPartnerSuccess(false)}
                    variant="outline"
                    className="h-9 text-xs rounded-xl mt-2 cursor-pointer border-border hover:bg-secondary text-foreground font-semibold"
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePartnerSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Organization Name *</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="e.g. Green Kenya NGO"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          disabled={submittingPartner}
                          required
                          className="pl-9 h-10 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Contact Person Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="e.g. Jane Doe"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          disabled={submittingPartner}
                          required
                          className="pl-9 h-10 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Contact Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="e.g. jane@greenkenya.org"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        disabled={submittingPartner}
                        required
                        className="pl-9 h-10 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">Proposal / Message</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3.5 size-3.5 text-muted-foreground" />
                      <Textarea
                        placeholder="Describe your conservation initiative, location scope, and how you would coordinate planting..."
                        value={partnerMessage}
                        onChange={(e) => setPartnerMessage(e.target.value)}
                        disabled={submittingPartner}
                        rows={4}
                        className="pl-9 bg-secondary/50 border-border text-xs rounded-xl focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground font-medium leading-relaxed resize-none pt-3"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingPartner}
                    className="w-full h-11 rounded-full bg-gradient-to-r from-[#0B3037] to-[#0D6F73] hover:from-[#06363D] hover:to-[#0B3037] text-white font-bold shadow-neo-pill border border-white/15 cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                  >
                    {submittingPartner ? "Submitting Inquiry..." : "Submit Partnership Application"}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </form>
              )}
            </div>

          </div>
        </div>

 {/* 8. Waitlist Signup Section */}
 <WaitlistSection defaultInterest="tree-planting" />

 </div>
 </div>
 )
}
