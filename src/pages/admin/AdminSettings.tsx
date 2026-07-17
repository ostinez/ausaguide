import { useState } from "react"
import { Settings, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    return localStorage.getItem("system_maintenance_mode") === "true"
  })
  const [commissionRate, setCommissionRate] = useState<number>(() => {
    return Number(localStorage.getItem("system_commission_rate") || "10")
  })
  const [stripeMode, setStripeMode] = useState<string>(() => {
    return localStorage.getItem("system_stripe_mode") || "test"
  })
  const [diditAddress, setDiditAddress] = useState<string>(() => {
    return localStorage.getItem("system_didit_address") || "0x44Fe8507be060C9e84C1C4a4237dFeBE6FA8a83f"
  })

  const handleSave = () => {
    localStorage.setItem("system_maintenance_mode", String(maintenanceMode))
    localStorage.setItem("system_commission_rate", String(commissionRate))
    localStorage.setItem("system_stripe_mode", stripeMode)
    localStorage.setItem("system_didit_address", diditAddress)
    
    // Dispatch a storage event so other components receive immediate updates
    window.dispatchEvent(new Event("storage"))
    alert("Settings updated successfully.")
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Settings className="size-8 text-purple-400" />
          System Settings
        </h1>
        <p className="text-xs text-white/40 font-medium">Configure global platform attributes, credentials and modes</p>
      </div>

      <div className="border border-white/5 rounded-2xl bg-[#0D0D11]/40 p-6 space-y-6 backdrop-blur-md">
        {/* Commission Rate */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-white/40 uppercase tracking-wider font-mono font-bold">Commission Rate (%)</label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              className="border-white/5 bg-white/5 focus:border-purple-500/30 text-white rounded-xl text-xs h-10 w-32"
            />
            <span className="text-xs text-white/50">Percentage deducted from bookings.</span>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="space-y-2">
          <label className="text-[10px] text-white/40 uppercase tracking-wider font-mono font-bold">System Operations</label>
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/2">
            <div>
              <p className="text-xs font-bold text-white">Maintenance Mode</p>
              <p className="text-[10px] text-white/40 mt-0.5">Toggle maintenance mode to restrict traveler checkouts.</p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                ${maintenanceMode ? "bg-red-500" : "bg-white/10"}
              `}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${maintenanceMode ? "translate-x-5" : "translate-x-0"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Stripe Mode */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-white/40 uppercase tracking-wider font-mono font-bold">Stripe Payment Gateway</label>
          <select
            value={stripeMode}
            onChange={(e) => setStripeMode(e.target.value)}
            className="w-full border border-white/5 bg-white/5 focus:border-purple-500/30 text-white rounded-xl text-xs h-10 px-3 bg-[#0F0F12]"
          >
            <option value="test">Test Mode (Mock Transactions)</option>
            <option value="live">Live Production Mode</option>
          </select>
        </div>

        {/* Didit Address */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-white/40 uppercase tracking-wider font-mono font-bold">Didit Smart Contract Address</label>
          <Input
            value={diditAddress}
            onChange={(e) => setDiditAddress(e.target.value)}
            placeholder="0x..."
            className="border-white/5 bg-white/5 focus:border-purple-500/30 text-white rounded-xl text-xs h-10 font-mono"
          />
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-white/5 flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xs h-10 px-5 flex items-center gap-1.5"
          >
            <Save className="size-4" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  )
}
