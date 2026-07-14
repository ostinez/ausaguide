import { useState } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { sendHostWaitlistEmail } from "@/lib/api/emails"
import { checkRateLimit } from "@/lib/api/rate-limit"
import { Loader2, CheckCircle2, User, Mail, Phone, MapPin, AlignLeft, Sparkles } from "lucide-react"

export default function HostWaitlistPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !location.trim() || !reason.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    setSubmitting(true)

    // Rate limit check: max 3 waitlist submissions per hour per IP
    let ipAddress = "local"
    try {
      const res = await fetch("https://api.ipify.org?format=json")
      if (res.ok) {
        const data = await res.json()
        if (data && data.ip) ipAddress = data.ip
      }
    } catch (err) {
      console.warn("IP fetch failed, falling back to local identifier", err)
    }

    try {
      const rateLimitKey = `waitlist:${ipAddress}`
      const limitResult = await checkRateLimit(rateLimitKey, { max: 3, windowMs: 60 * 60 * 1000 })
      if (!limitResult.allowed) {
        toast.error("Too many waitlist submissions. Please try again later.")
        setSubmitting(false)
        return
      }
    } catch (limitErr) {
      console.error("Rate check failed, proceeding anyway", limitErr)
    }

    try {
      const { error } = await supabase
        .from("host_waitlist")
        .insert({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          location: location.trim(),
          reason: reason.trim(),
        })

      if (error) {
        if (error.code === "23505") {
          toast.info("You are already on the host waiting list!")
          setSuccess(true)
          return
        }
        throw error
      }

      // Dispatch Brevo email confirmation (simulated or real depending on edge keys)
      await sendHostWaitlistEmail(email.trim(), name.trim())

      toast.success("Welcome to the list! Check your email for confirmation.")
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to join waitlist. Please try again.")
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
              <h1 className="text-2xl font-black text-white tracking-tight">You're on the Waiting List!</h1>
              <p className="text-sm text-white/70 leading-relaxed">
                Thank you for applying to host with us! We have sent a confirmation email to <span className="text-[#7F5AF0] font-semibold">{email}</span>. We'll be in touch as soon as we launch hosting in your area.
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
                <span>Join local guides</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Become an Ausaguide Host</h1>
              <p className="text-xs sm:text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                Share your heritage, local knowledge, or favorite secret spots. Join the list to begin hosting.
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
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                    className="w-full bg-[#121214]/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#7F5AF0] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Where are you located? *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nairobi, Lamu, Narok"
                    className="w-full bg-[#121214]/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#7F5AF0] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Why do you want to host? *</label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-4 size-4 text-white/40" />
                  <textarea
                    required
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us about the experiences or heritage you want to share..."
                    className="w-full bg-[#121214]/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#7F5AF0] transition-colors resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-sm font-bold shadow-lg hover:shadow-[0_4px_20px_rgba(127,90,240,0.4)] disabled:opacity-50 transition duration-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
