import { useLocation, Link } from "react-router-dom"
import { ShieldCheck, Printer, ArrowLeft, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useSEO } from "@/hooks/useSEO"

export default function TreePlantedPage() {
  useSEO({
    title: "Virtual Tree Planted! | Ausaguide",
    description: "Thank you for committing to plant a tree with Ausaguide. View and print your commitment certificate.",
  })

  const location = useLocation()
  
  // Retrieve state or fallback to placeholder data
  const {
    name = "Eco Supporter",
    treeId = "AUS-TREE-XXXX",
    treeName = "Unnamed",
    dedication = "For the future of Kenya",
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
        body: { name, tree_id: treeId, tree_name: treeName, dedication, date }
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
          <title>Ausaguide Tree Commitment Certificate</title>
          <style>
            body { background: #16161A; color: #FFFFFE; font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .cert-card { text-align: center; border: 2px solid #2CB67D; border-radius: 20px; padding: 50px 30px; max-width: 650px; background: #121214; }
            h1 { color: #2CB67D; font-size: 28px; margin-bottom: 20px; text-transform: uppercase; }
            .name { font-size: 32px; font-weight: bold; margin: 15px 0; color: #FFFFFE; }
            .meta { margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; display: grid; grid-template-cols: 1fr 1fr; gap: 15px; text-align: left; }
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
            <div style="font-size: 50px; margin-bottom: 15px;">🌳</div>
            <div style="font-size: 12px; letter-spacing: 2px; color: #2CB67D; font-weight: bold; text-transform: uppercase;">Certificate of Commitment</div>
            <h1>Ausaguide Tree Initiative</h1>
            <p>This certifies that</p>
            <div class="name">${name}</div>
            <p style="color: rgba(255,255,255,0.6);">has committed to planting and caring for a virtual tree, contributing to the forest canopy restoration and ecological sustainability efforts in Kenya.</p>
            <div class="meta">
              <div class="meta-item"><div class="meta-label">Tree ID</div><div class="meta-val" style="color:#2CB67D;">${treeId}</div></div>
              <div class="meta-item"><div class="meta-label">Date</div><div class="meta-val">${date}</div></div>
              <div class="meta-item"><div class="meta-label">Tree Name</div><div class="meta-val">${treeName}</div></div>
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
    <div className="relative overflow-hidden min-h-screen bg-[#16161A] text-white flex flex-col items-center">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-gradient-to-b from-[#2CB67D]/10 via-[#7F5AF0]/3 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 max-w-2xl w-full px-6 py-16 md:py-24 pt-32 flex flex-col space-y-8 items-center text-center">
        
        {/* Success Header */}
        <div className="space-y-3">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#2CB67D]/10 text-[#2CB67D] border border-[#2CB67D]/20 shadow-[0_0_15px_rgba(44,182,125,0.2)]">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-[#2CB67D] via-[#7F5AF0] to-[#FFFFFE] bg-clip-text text-transparent">
            Virtual Tree Planted!
          </h1>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            Your commitment has been saved in our database. We've reserved tree ID <span className="font-bold text-[#2CB67D]">{treeId}</span> for you!
          </p>
        </div>

        {/* Certificate Display on Screen */}
        <BorderGlow
          glowColor="44 182 125"
          glowIntensity={0.5}
          borderRadius={24}
          backgroundColor="#121214"
          className="w-full"
        >
          <div className="p-8 sm:p-12 bg-radial-gradient border border-border rounded-3xl space-y-8 text-center relative overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#2CB67D]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-2">
              <span className="text-3xl">🌳</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#2CB67D]">
                Ausaguide Conservation & Wellness Network
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Tree Commitment Certificate
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-white/40 italic">This certifies that</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight py-2 font-accent">
                {name}
              </p>
              <p className="text-xs text-white/50 leading-relaxed max-w-md mx-auto">
                has committed to planting and caring for a virtual tree, supporting local guide wellness and reforestation initiatives in Kenya.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-6 border-t border-border text-left max-w-md mx-auto">
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/40">Unique Tree ID</span>
                <span className="block text-xs font-bold text-[#2CB67D] font-mono">{treeId}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/40">Commitment Date</span>
                <span className="block text-xs font-medium text-white/80">{date}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/40">Tree Name</span>
                <span className="block text-xs font-semibold text-white/90 truncate">{treeName}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/40">Dedicated To</span>
                <span className="block text-xs font-semibold text-white/90 truncate">{dedication}</span>
              </div>
            </div>
          </div>
        </BorderGlow>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Button
            onClick={handlePrint}
            className="flex-1 h-11 bg-primary hover:opacity-90 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer text-white"
          >
            <Printer className="size-4" />
            Print/Download Certificate
          </Button>

          <Link to="/tree-planting" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-11 border-border hover:bg-accent/ text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Back to Initiative
            </Button>
          </Link>
        </div>

        {/* Support Note */}
        <p className="text-[11px] text-white/40 max-w-sm flex items-center justify-center gap-1">
          <Heart className="size-3 text-red-500 fill-red-500" />
          Thank you for making a difference. We will notify you when you can sponsor this tree in reality.
        </p>

      </div>
    </div>
  )
}
