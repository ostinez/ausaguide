import { useState } from "react"
import { toast } from "sonner"
import { supabase } from "../lib/supabase"
import { sendGeneralWaitlistEmail } from "@/lib/api/emails"
import { Loader2, CheckCircle2, User, Mail, Sparkles, MapPin, AlignLeft } from "lucide-react"

export default function WaitlistPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"traveler" | "host" | "both">("traveler")
  const [location, setLocation] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    if ((role === "host" || role === "both") && (!location.trim() || !reason.trim())) {
      toast.error("Please fill in the location and why you want to host.")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({
          name: name.trim(),
          email: email.trim(),
          role: role,
          location: (role === "host" || role === "both") ? location.trim() : null,
          reason: (role === "host" || role === "both") ? reason.trim() : null,
        })

      if (error) {
        if (error.code === "23505") {
          toast.info("You've already signed up with this email! Thank you.")
          setSuccess(true)
          return
        }
        throw error
      }

      // Send Brevo confirmation email
      await sendGeneralWaitlistEmail(email.trim(), name.trim(), role)

      toast.success("🎉 You're on the list!")
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center justify-center py-20 px-6">
      {/* Background blobs */}
      <div className="absolute top-10 left-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute bottom-10 right-1/4 h-[400px] w-[400px] rounded-full bg-teal/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-lg">
        {success ? (
          <div className="rounded-3xl border border-white/10 p-8 backdrop-blur-xl bg-[#121214]/50 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-teal/10 border border-teal/20 text-[#2CB67D]">
              <CheckCircle2 className="size-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">🎉 You're on the list!</h1>
              <p className="text-sm text-white/70 leading-relaxed">
                Thank you for joining the waiting list for Ausaguide. We have successfully registered <span className="text-[#7F5AF0] font-semibold">{email}</span> and will notify you when we launch!
              </p>
            </div>
            <button
              onClick={() => window.location.href = "/"}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-sm font-bold shadow-lg hover:shadow-[0_4px_20px_rgba(127,90,240,0.4)] transition duration-300"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 p-8 backdrop-blur-xl bg-[#121214]/50 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/20 text-xs font-semibold text-[#7F5AF0] mb-2">
                <Sparkles className="size-3.5" />
                <span>Join our early waiting list</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Ausaguide Waiting List</h1>
              <p className="text-xs sm:text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                Be the first to explore local experiences. Join now and get early access when we launch in 90 days.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-[#121214]/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#7F5AF0] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#121214]/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#7F5AF0] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider">I want to join as a: *</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["traveler", "host", "both"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        role === r
                          ? "border-[#7F5AF0] bg-[#7F5AF0]/10 text-white"
                          : "border-white/10 bg-[#121214]/40 text-white/60 hover:border-white/20"
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {(role === "host" || role === "both") && (
                <>
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Where are you located? *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Nairobi, Narok, Lamu"
                        className="w-full bg-[#121214]/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#7F5AF0] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Why do you want to host? *</label>
                    <div className="relative">
                      <AlignLeft className="absolute left-4 top-4 size-4 text-white/40" />
                      <textarea
                        required
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Share details about the heritage or tours you want to guide..."
                        className="w-full bg-[#121214]/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#7F5AF0] transition-colors resize-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-sm font-bold shadow-lg hover:shadow-[0_4px_20px_rgba(127,90,240,0.4)] disabled:opacity-50 transition duration-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Adding to Waitlist...</span>
                  </>
                ) : (
                  <span>Join the Waitlist</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
