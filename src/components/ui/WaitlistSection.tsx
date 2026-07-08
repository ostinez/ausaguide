import { useState } from "react"
import { Mail, User, ArrowRight, ShieldCheck, TreePine, HeartPulse } from "lucide-react"
import { SpotlightCard } from "@/components/ui/SpotlightCard"
import { StarBorder } from "@/components/ui/StarBorder"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface WaitlistSectionProps {
  defaultInterest?: "tree-planting" | "mental-health-travel"
}

export function WaitlistSection({ defaultInterest }: WaitlistSectionProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [treePlanting, setTreePlanting] = useState(defaultInterest === "tree-planting" || !defaultInterest)
  const [mentalHealth, setMentalHealth] = useState(defaultInterest === "mental-health-travel" || !defaultInterest)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    const interests: string[] = []
    if (treePlanting) interests.push("tree-planting")
    if (mentalHealth) interests.push("mental-health-travel")

    if (interests.length === 0) {
      toast.error("Please select at least one area of interest.")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({
          name: name.trim(),
          email: email.trim(),
          interest: interests,
        })

      if (error) {
        if (error.code === "23505") {
          toast.info("You've already signed up with this email! Thank you.")
          setSuccess(true)
          return
        }
        throw error
      }

      toast.success("✅ You're on the list! We'll notify you when we launch.")
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SpotlightCard className="p-8 border border-border bg-[#121214]/40 rounded-2xl space-y-6">
      <div className="flex items-center gap-2.5">
        <Mail className="size-6 text-[#7F5AF0]" />
        <h3 className="text-xl font-bold text-white font-accent">Get Notified When We Launch</h3>
      </div>
      <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-2xl">
        Support our mission early. Leave your details below and we will notify you the moment our full donation flow goes live.
      </p>

      {success ? (
        <div className="p-6 rounded-2xl bg-[#2CB67D]/10 border border-[#2CB67D]/20 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#2CB67D]/15 text-[#2CB67D] border border-[#2CB67D]/30">
            <ShieldCheck className="size-6 animate-bounce" />
          </div>
          <h4 className="text-sm font-bold text-white">✅ You're on the list!</h4>
          <p className="text-xs text-white/50 leading-relaxed max-w-sm mx-auto font-medium">
            We'll notify you when we launch. Thank you for your early support!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                <Input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  required
                  className="pl-10 h-11 bg-black/45 border-border text-xs rounded-xl focus:border-primary text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                <Input
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                  className="pl-10 h-11 bg-black/45 border-border text-xs rounded-xl focus:border-primary text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Areas of Interest</label>
            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group text-xs text-white/70 select-none">
                <input
                  type="checkbox"
                  checked={treePlanting}
                  onChange={(e) => setTreePlanting(e.target.checked)}
                  disabled={submitting}
                  className="size-4 rounded border-border bg-black/45 text-primary focus:ring-primary accent-[#7F5AF0]"
                />
                <span className="group-hover:text-white transition-colors flex items-center gap-1.5">
                  <TreePine className="size-3.5 text-[#2CB67D]" /> Reforestation & Tree Planting
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer group text-xs text-white/70 select-none">
                <input
                  type="checkbox"
                  checked={mentalHealth}
                  onChange={(e) => setMentalHealth(e.target.checked)}
                  disabled={submitting}
                  className="size-4 rounded border-border bg-black/45 text-primary focus:ring-primary accent-[#7F5AF0]"
                />
                <span className="group-hover:text-white transition-colors flex items-center gap-1.5">
                  <HeartPulse className="size-3.5 text-[#7F5AF0]" /> Guide Mental Health Sponsorships
                </span>
              </label>
            </div>
          </div>

          <StarBorder
            as="button"
            type="submit"
            disabled={submitting}
            color="#7F5AF0"
            className="w-full rounded-xl overflow-hidden shadow-lg shadow-primary/10"
          >
            <div className="w-full h-11 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#121214]">
              {submitting ? "Adding you to waitlist..." : "Notify Me When We Launch"}
              <ArrowRight className="size-3.5" />
            </div>
          </StarBorder>
        </form>
      )}
    </SpotlightCard>
  )
}
