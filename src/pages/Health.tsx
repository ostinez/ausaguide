import { useEffect, useState } from "react"
import { CheckCircle2, Server, Globe, ShieldCheck } from "lucide-react"

export default function HealthPage() {
  const [timestamp, setTimestamp] = useState("")

  useEffect(() => {
    setTimestamp(new Date().toISOString())
  }, [])

  return (
    <div className="min-h-screen bg-[#06363D] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
        <div className="size-14 rounded-2xl bg-[#34e0a1]/10 border border-[#34e0a1]/20 flex items-center justify-center mx-auto text-[#34e0a1]">
          <CheckCircle2 className="size-8 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">System Operational</h1>
          <p className="text-xs text-white/70">Ausaguide client application is responding normally.</p>
        </div>

        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-xs font-mono text-left space-y-2 text-white/80">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white/60"><Server className="size-3.5" /> Status:</span>
            <span className="text-[#34e0a1] font-bold">200 OK</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white/60"><Globe className="size-3.5" /> Domain:</span>
            <span>{typeof window !== "undefined" ? window.location.hostname : "unknown"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white/60"><ShieldCheck className="size-3.5" /> Protocol:</span>
            <span>{typeof window !== "undefined" ? window.location.protocol : "https:"}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-white/50">
            <span>Checked:</span>
            <span>{timestamp}</span>
          </div>
        </div>

        <a
          href="/"
          className="inline-flex items-center justify-center w-full py-3 rounded-full bg-gradient-to-r from-[#0D6F73] to-[#06363D] hover:from-[#0B3037] hover:to-[#0D6F73] text-white text-xs font-bold border border-white/20 transition-all duration-200"
        >
          Return to Ausaguide
        </a>
      </div>
    </div>
  )
}
