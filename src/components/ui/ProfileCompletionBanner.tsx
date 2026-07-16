import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { UserCircle, X, ChevronRight, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface ProfileField {
  key: string
  label: string
}

const HOST_FIELDS: ProfileField[] = [
  { key: "avatar_url", label: "Profile photo" },
  { key: "bio", label: "Bio" },
  { key: "location", label: "Location" },
  { key: "phone", label: "Phone number" },
  { key: "languages", label: "Languages" },
]

const TRAVELER_FIELDS: ProfileField[] = [
  { key: "avatar_url", label: "Profile photo" },
  { key: "bio", label: "Bio" },
  { key: "location", label: "Location" },
]

function computeCompletion(profile: Record<string, any>, fields: ProfileField[]) {
  const missing = fields.filter((f) => {
    const val = profile[f.key]
    if (Array.isArray(val)) return val.length === 0
    return !val || String(val).trim() === ""
  })
  const pct = Math.round(((fields.length - missing.length) / fields.length) * 100)
  return { pct, missing }
}

const DISMISS_KEY = "profile_banner_dismissed_until"

export function ProfileCompletionBanner() {
  const [profile, setProfile] = useState<Record<string, any> | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  const DISMISS_HOURS = 24

  const checkDismissed = useCallback(() => {
    const until = localStorage.getItem(DISMISS_KEY)
    if (until && Date.now() < Number(until)) {
      setDismissed(true)
    } else {
      setDismissed(false)
    }
  }, [])

  useEffect(() => {
    checkDismissed()
  }, [checkDismissed])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("profiles")
        .select("role, avatar_url, bio, location, phone, languages")
        .eq("id", user.id)
        .maybeSingle()
      if (data) setProfile(data)
    }
    load()
  }, [])

  useEffect(() => {
    if (!profile || dismissed) {
      setVisible(false)
      return
    }
    const role = profile.role as string
    if (role === "admin") { setVisible(false); return }

    const fields = role === "host" ? HOST_FIELDS : TRAVELER_FIELDS
    const { pct } = computeCompletion(profile, fields)
    // Only show if profile is less than 100% complete
    setVisible(pct < 100)
  }, [profile, dismissed])

  const handleDismiss = () => {
    const until = Date.now() + DISMISS_HOURS * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, String(until))
    setDismissed(true)
    setVisible(false)
  }

  if (!visible || !profile) return null

  const role = profile.role as string
  const fields = role === "host" ? HOST_FIELDS : TRAVELER_FIELDS
  const { pct, missing } = computeCompletion(profile, fields)
  const nextField = missing[0]

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[90] px-4 pb-4 pointer-events-none",
        "animate-in slide-in-from-bottom-4 duration-500"
      )}
    >
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#1a1a24]/90 backdrop-blur-xl">
          {/* Progress bar */}
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            {/* Icon */}
            <div className="shrink-0 size-9 rounded-full bg-[#7F5AF0]/20 flex items-center justify-center">
              <UserCircle className="size-5 text-[#7F5AF0]" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white leading-tight">
                Your profile is {pct}% complete
              </p>
              {nextField && (
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  Add your <span className="text-white/80 font-medium">{nextField.label}</span> to get more {role === "host" ? "bookings" : "trip recommendations"}
                </p>
              )}
            </div>

            {/* CTA */}
            <Link
              to="/profile/edit"
              className="shrink-0 flex items-center gap-1 rounded-full bg-[#7F5AF0] hover:bg-[#6b47d6] text-white text-[11px] font-semibold px-3 py-1.5 transition-colors"
            >
              Complete <ChevronRight className="size-3" />
            </Link>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
              aria-label="Dismiss for 24 hours"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Checklist dots */}
          <div className="flex items-center gap-2 px-4 pb-3">
            {fields.map((f) => {
              const done = !missing.find(m => m.key === f.key)
              return (
                <div key={f.key} className="flex items-center gap-1">
                  <CheckCircle2
                    className={cn(
                      "size-3 transition-colors",
                      done ? "text-[#2CB67D]" : "text-white/20"
                    )}
                  />
                  <span className={cn("text-[10px]", done ? "text-white/50" : "text-white/25")}>
                    {f.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
