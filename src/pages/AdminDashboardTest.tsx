import { Link } from "react-router-dom"
import { Shield, ArrowLeft } from "lucide-react"

export default function AdminDashboardTest() {
  return (
    <div className="min-h-screen bg-[#0F0F12] text-white flex items-center justify-center p-6">
      {/* Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 mx-auto">
          <Shield className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Admin Dashboard Test</h1>
          <p className="text-sm text-white/50">This is a mock dashboard with no Supabase queries or realtime connections.</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-left text-xs font-mono space-y-1 text-white/80">
          <p>📍 Path: /admin/dashboard-test</p>
          <p>🔒 Access: Public Test</p>
          <p>🚀 Status: Active (No Crash)</p>
        </div>
        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="size-3.5" />
            Home
          </Link>
          <Link to="/admin/dashboard" className="text-xs text-purple-400 hover:underline font-semibold">
            Real Admin Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
