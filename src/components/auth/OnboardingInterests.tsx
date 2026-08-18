import { useState, useEffect } from "react"
import { Check, Sparkles, Compass, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DEFAULT_INTERESTS, saveUserInterests, fetchUserInterests } from "@/lib/api/interests"
import { toast } from "sonner"

interface OnboardingInterestsProps {
  userId?: string | null
  onComplete: (selectedInterests: string[]) => void
  onSkip?: () => void
  isModal?: boolean
}

export function OnboardingInterests({
  userId,
  onComplete,
  onSkip,
  isModal = false,
}: OnboardingInterestsProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(false)

  useEffect(() => {
    if (userId) {
      setLoadingInitial(true)
      fetchUserInterests(userId)
        .then((existing) => {
          if (existing && existing.length > 0) {
            setSelected(existing)
          }
        })
        .finally(() => setLoadingInitial(false))
    }
  }, [userId])

  const toggleInterest = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (selected.length < 3) {
      toast.error("Please select at least 3 interests to personalize your recommendations.")
      return
    }

    setSaving(true)
    try {
      if (userId) {
        await saveUserInterests(userId, selected)
      }
      toast.success("Traveler profile personalized! 🌍")
      onComplete(selected)
    } catch (err: any) {
      console.error("Save interests error:", err)
      onComplete(selected)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`w-full ${isModal ? "p-0" : "max-w-2xl mx-auto py-4"}`}>
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-1">
          <Compass className="size-6 animate-spin-slow" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          What kind of traveler are you?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Select at least 3 interests so we can curate Kenya experiences tailored to your travel style.
        </p>
      </div>

      {loadingInitial ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Interests Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {DEFAULT_INTERESTS.map((interest) => {
              const isSelected = selected.includes(interest.id) || selected.includes(interest.name)
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  className={`group relative flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all duration-200 min-h-[58px] cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/15 text-foreground shadow-md shadow-primary/10 ring-1 ring-primary/40"
                      : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-xl sm:text-2xl shrink-0 select-none">
                    {interest.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {interest.name.replace(/^[^\s]+\s*/, "")}
                    </p>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground/80 tracking-wider">
                      {interest.category}
                    </span>
                  </div>

                  <div className={`size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "bg-primary border-primary text-white" : "border-border/80"
                  }`}>
                    {isSelected && <Check className="size-2.5 text-white stroke-[3]" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Bottom Controls */}
          <div className="pt-2 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold">
              <Sparkles className="size-3.5 text-amber-400" />
              <span className={selected.length >= 3 ? "text-primary font-bold" : "text-muted-foreground"}>
                {selected.length} of 3+ selected
              </span>
            </div>

            <Button
              onClick={handleSave}
              disabled={selected.length < 3 || saving}
              className="w-full py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#0D6F73] to-teal-500 hover:from-[#095255] hover:to-teal-600 text-white shadow-lg min-h-[46px] gap-2 transition duration-200"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Personalizing recommendations...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition underline-offset-2 hover:underline pt-1"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
