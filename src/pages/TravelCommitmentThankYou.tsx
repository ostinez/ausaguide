import { useLocation, Link } from "react-router-dom"
import { ShieldCheck, Printer, ArrowLeft, Heart, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"

export default function TravelCommitmentThankYouPage() {
  useSEO({
    title: "Travel Commitment Pledge | Ausaguide",
    description: "Thank you for your commitment to sponsor a wellness getaway. View and print your pledge certificate.",
  })

  const location = useLocation()
  
  // Retrieve state or fallback to placeholder data
  const {
    name = "Travel Supporter",
    commitmentId = "AUS-TRAVEL-XXXX",
    dedication = "For the wellness of Kenyan guides",
    date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  } = location.state || {}

  const handlePrint = async () => {
    toast.info("Generating your certificate...")
    
    try {
      // 1. Try to call generate-certificate edge function
      const { data, error } = await supabase.functions.invoke("generate-certificate", {
        body: { name, tree_id: commitmentId, tree_name: "Wellness Getaway Pledge", dedication, date }
      })

      if (data && data.html) {
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(data.html)
          printWindow.document.close()
          printWindow.focus()
          setTimeout(() => {
            printWindow.print()
          }, 600)
          return
        }
      } else {
        console.warn("Edge function didn't return html:", error)
      }
    } catch (err) {
      console.warn("Failed to call generate-certificate edge function, falling back to local print template:", err)
    }

    // 2. Client-side fallback: Open local template for printing
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const localHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Ausaguide Wellness Commitment Certificate</title>
  <style>
    body { background: #16161A; color: #FFFFFE; font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
    .cert-card { text-align: center; border: 2px solid #0D6F73; border-radius: 20px; padding: 50px 30px; max-width: 650px; background: #121214; }
    h1 { color: #0D6F73; font-size: 28px; margin-bottom: 20px; text-transform: uppercase; }
    .name { font-size: 32px; font-weight: bold; margin: 15px 0; color: #FFFFFE; }
    .meta { margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; }
    .meta-item { font-size: 13px; }
    .meta-label { color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 10px; }
    .meta-val { font-weight: bold; }
    @media print {
      body { background: white; color: black; }
      .cert-card { border: 2px solid black; background: white; color: black; }
      h1, .name, .meta-val { color: black; }
      .meta-label { color: #555; }
      .meta { border-top: 1px solid black; }
    }
  </style>
</head>
<body>
  <div class="cert-card">
    <div style="font-size: 12px; letter-spacing: 2px; color: #0D6F73; font-weight: bold; text-transform: uppercase;">Certificate of Commitment</div>
    <h1>Ausaguide Wellness Initiative</h1>
    <p>This certifies that</p>
    <div class="name">${name}</div>
    <p style="color: rgba(255,255,255,0.6);">has committed to sponsoring a wellness getaway experience, contributing to guide wellness and sustainable tourism in Kenya.</p>
    <div class="meta">
      <div class="meta-item"><div class="meta-label">Commitment ID</div><div class="meta-val" style="color:#0D6F73;">${commitmentId}</div></div>
      <div class="meta-item"><div class="meta-label">Date</div><div class="meta-val">${date}</div></div>
      <div class="meta-item"><div class="meta-label">Experience</div><div class="meta-val">Travel Getaway Sponsorship</div></div>
      <div class="meta-item"><div class="meta-label">Dedication</div><div class="meta-val">${dedication}</div></div>
    </div>
  </div>
</body>
</html>
      `
      printWindow.document.write(localHtml)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  return (
    <div className="relative overflow-hidden min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 max-w-2xl w-full px-6 py-16 md:py-24 pt-32 flex flex-col space-y-8 items-center text-center">
        
        {/* Success Header */}
        <div className="space-y-3">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-md">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Pledge Registered!
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your commitment has been saved in our database. We've reserved commitment ID <span className="font-bold text-primary">{commitmentId}</span> for you!
          </p>
        </div>

        {/* Certificate Display on Screen */}
        <BorderGlow
          glowColor="127 90 240"
          glowIntensity={0.5}
          borderRadius={24}
          backgroundColor="#121214"
          className="w-full shadow-modern"
        >
          <div className="p-8 sm:p-12 bg-radial-gradient border border-white/10 rounded-3xl space-y-8 text-center relative overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-2">
              <Sun className="size-10 text-amber-400 mx-auto mb-1" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#84BABF]">
                Ausaguide Conservation & Wellness Network
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Getaway Sponsorship Pledge
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-white/50 italic">This certifies that</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight py-2 font-accent">
                {name}
              </p>
              <p className="text-xs text-white/70 leading-relaxed max-w-md mx-auto">
                has pledged to sponsor a getaway experience, empowering Kenyan tour guides with wellness retreats and sustainable livelihood support.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-6 border-t border-white/10 text-left max-w-md mx-auto">
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Unique Pledge ID</span>
                <span className="block text-xs font-bold text-[#84BABF] font-mono">{commitmentId}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Pledge Date</span>
                <span className="block text-xs font-medium text-white/90">{date}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Program</span>
                <span className="block text-xs font-semibold text-white/90 truncate">Guide Wellness Getaway</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Dedicated To</span>
                <span className="block text-xs font-semibold text-white/90 truncate">{dedication}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handlePrint}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-modern-glow flex items-center gap-2"
              >
                <Printer className="size-4" />
                Print Certificate
              </Button>
              <Link to="/mental-health">
                <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 flex items-center gap-2">
                  <Heart className="size-4 text-primary" />
                  Make Another Pledge
                </Button>
              </Link>
            </div>
          </div>
        </BorderGlow>

        <div className="pt-6">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
