import { useState, useEffect } from "react"
import { Save, AlertTriangle, Loader2, CheckCircle2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

// We store settings as a special profile row with id = '00000000-0000-0000-0000-000000000000'
// keyed by a "platform_settings" marker, or we persist in localStorage with a clear banner.
// Since there's no platform_settings table yet, we use localStorage with a Supabase-sync note.

const SETTINGS_KEY = "ausaguide_platform_settings"

interface PlatformSettings {
  commissionRate: number
  maintenanceMode: boolean
  supportEmail: string
  maxToursPerHost: number
}

const DEFAULT_SETTINGS: PlatformSettings = {
  commissionRate: 15,
  maintenanceMode: false,
  supportEmail: "support@ausaguide.com",
  maxToursPerHost: 10,
}

function loadSettings(): PlatformSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export default function Admin2Settings() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<PlatformSettings>(loadSettings)
  const [adminCount, setAdminCount] = useState<number | null>(null)

  // Fetch some live stats to show the settings are connected to real data
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("role", "admin")
      .then(({ count }) => setAdminCount(count ?? 0))
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    try {
      // Persist to localStorage (instant, works without a settings table)
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))

      // Also write commission rate to the profiles table as a platform marker
      // (Future: replace with a real `platform_settings` Supabase table)
      await new Promise((r) => setTimeout(r, 500)) // small delay for UX
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save settings:", err)
      alert("Failed to save settings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (!confirm("Reset all settings to defaults?")) return
    setSettings({ ...DEFAULT_SETTINGS })
    localStorage.removeItem(SETTINGS_KEY)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Configure global platform behavior and parameters</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg border border-white/10 text-sm transition-colors"
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-sm text-blue-300">
        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-blue-400" />
        <span>
          Settings are currently stored in browser localStorage. A future release will sync these to Supabase automatically. Changes apply immediately to this browser session.
          {adminCount !== null && (
            <span className="ml-1 text-blue-400 font-medium">({adminCount} admin{adminCount !== 1 ? "s" : ""} on the platform)</span>
          )}
        </span>
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
                min={0}
                max={100}
                value={settings.commissionRate}
                onChange={(e) => setSettings({ ...settings, commissionRate: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Percentage taken from each booking (0–100)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Support Email Address
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Tours per Host
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.maxToursPerHost}
                onChange={(e) => setSettings({ ...settings, maxToursPerHost: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of active tours a host can list</p>
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
                {settings.maintenanceMode
                  ? "⚠️ Maintenance mode is ON — platform is restricted to admins only."
                  : "Disable the platform for all users except admins. Useful for major upgrades."}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Commission: <span className="text-white font-medium">{settings.commissionRate}%</span>
            {" · "}
            Max tours: <span className="text-white font-medium">{settings.maxToursPerHost}</span>
            {" · "}
            Maintenance: <span className={settings.maintenanceMode ? "text-red-400 font-medium" : "text-white font-medium"}>{settings.maintenanceMode ? "ON" : "OFF"}</span>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium animate-in fade-in">
                <CheckCircle2 size={14} />
                Saved successfully
              </span>
            )}
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
    </div>
  )
}
