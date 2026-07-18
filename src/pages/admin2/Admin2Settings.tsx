import { useState } from "react"
import { Save, AlertTriangle } from "lucide-react"

export default function Admin2Settings() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    commissionRate: 15,
    maintenanceMode: false,
    supportEmail: "support@ausaguide.com",
    maxToursPerHost: 10
  })

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      alert("Settings saved successfully (Simulated)")
    }, 1000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure global platform behavior and parameters</p>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
        
        {/* General Settings */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">General Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Platform Commission Rate (%)
              </label>
              <input
                type="number"
                value={settings.commissionRate}
                onChange={(e) => setSettings({...settings, commissionRate: parseInt(e.target.value) || 0})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Percentage taken from each booking</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Support Email Address
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Tours per Host
              </label>
              <input
                type="number"
                value={settings.maxToursPerHost}
                onChange={(e) => setSettings({...settings, maxToursPerHost: parseInt(e.target.value) || 0})}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 bg-red-500/5">
          <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> Danger Zone
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-black/50 border border-red-500/20 rounded-lg">
            <div>
              <h3 className="text-white font-medium">Maintenance Mode</h3>
              <p className="text-sm text-gray-400 mt-1">
                Disable the platform for all users except admins. Useful for major upgrades.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
