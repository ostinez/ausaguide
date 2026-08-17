import { useState, useEffect } from "react"
import { toast } from "sonner"
import { supabase } from "../lib/supabase"
import { checkRateLimit } from "@/lib/api/rate-limit"
import { sendGeneralWaitlistEmail } from "@/lib/api/emails"
import {
 Loader2, CheckCircle2, User, Mail, Sparkles, MapPin,
 AlignLeft, Share2, PartyPopper, Rocket,
} from "lucide-react"
import { CountdownTimer } from "@/components/ui/CountdownTimer"

function XIcon({ className }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
 </svg>
 )
}

const LAUNCH_DATE = new Date("2026-10-10T00:00:00Z")
const LS_KEY = "waitlist_confirmed_email"
const LS_NAME_KEY = "waitlist_confirmed_name"

type WaitlistStatus = "loading" | "not_on_list" | "confirmed"

// ── Share helpers ────────────────────────────────────────────────────────────
const SHARE_TEXT = encodeURIComponent(
 "I just joined the Ausaguide waitlist — the platform that connects travellers with authentic local guides in Kenya. Launching October 10, 2026! Join me:"
)
const SHARE_URL = encodeURIComponent("https://ausaguide.com/waitlist")

function ShareButtons() {
 return (
 <div className="flex flex-col gap-3 w-full">
 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
 Share with friends
 </p>
 <div className="flex gap-3 justify-center">
 {/* Twitter / X */}
 <a
 href={`https://twitter.com/intent/tweet?text=${SHARE_TEXT}&url=${SHARE_URL}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] text-xs font-bold hover:bg-[#1DA1F2]/20 transition-colors"
 >
 <XIcon className="size-3.5" />
 Twitter
 </a>
 {/* WhatsApp */}
 <a
 href={`https://wa.me/?text=${SHARE_TEXT}%20https%3A%2F%2Fausaguide.com%2Fwaitlist`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-colors"
 >
 <Share2 className="size-3.5" />
 WhatsApp
 </a>
 {/* LinkedIn */}
 <a
 href={`https://www.linkedin.com/sharing/share-offsite/?url=${SHARE_URL}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] text-xs font-bold hover:bg-[#0A66C2]/20 transition-colors"
 >
 <Share2 className="size-3.5" />
 LinkedIn
 </a>
 </div>
 </div>
 )
}

// ── Celebration panel ────────────────────────────────────────────────────────
function CelebrationPanel({ name, email }: { name: string; email: string }) {
 return (
 <div className="w-full space-y-6 animate-in fade-in zoom-in duration-500">
 {/* Countdown */}
 <CountdownTimer targetDate={LAUNCH_DATE} />

 {/* Celebration card */}
 <div className="rounded-3xl border border-border p-8 bg-card shadow-modern text-center space-y-6">
 {/* Confetti emoji burst */}
 <div className="flex justify-center">
 <div className="relative size-20 flex items-center justify-center">
 <div className="absolute inset-0 rounded-full bg-brand/20 animate-ping opacity-30" />
 <div className="relative size-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-3xl shadow-sm">
 <PartyPopper className="size-8 text-brand" />
 </div>
 </div>
 </div>

 <div className="space-y-3">
 <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center justify-center gap-3">
 <Rocket className="size-7 text-brand" />
 You're on the list!
 </h1>
 <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto font-medium">
 {name ? `Hey ${name}! ` : ""}We'll notify{" "}
 <span className="text-brand font-bold">{email}</span> when
 Ausaguide launches on{" "}
 <span className="text-foreground font-bold">October 10, 2026</span>.
 </p>
 </div>

 {/* Divider */}
 <div className="h-px bg-border" />

 <ShareButtons />
 </div>
 </div>
 )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
 const [status, setStatus] = useState<WaitlistStatus>("loading")
 const [confirmedEmail, setConfirmedEmail] = useState("")
 const [confirmedName, setConfirmedName] = useState("")

 // Form state
 const [name, setName] = useState("")
 const [email, setEmail] = useState("")
 const [role, setRole] = useState<"traveler" | "host" | "both">("traveler")
 const [location, setLocation] = useState("")
 const [reason, setReason] = useState("")
 const [submitting, setSubmitting] = useState(false)

 // ── Status check flow ──────────────────────────────────────────────────────
 useEffect(() => {
 async function init() {
 // 1. Check if user already joined via localStorage
 const savedEmail = localStorage.getItem(LS_KEY)
 if (savedEmail) {
 const { data: row } = await supabase
 .from("waitlist")
 .select("name")
 .eq("email", savedEmail)
 .maybeSingle()
 setConfirmedEmail(savedEmail)
 setConfirmedName(row?.name ?? localStorage.getItem(LS_NAME_KEY) ?? "")
 setStatus("confirmed")
 return
 }

 // 2. Check if logged-in user's email is on the waitlist
 const { data: { user } } = await supabase.auth.getUser()
 if (user?.email) {
 const { data: row } = await supabase
 .from("waitlist")
 .select("name")
 .eq("email", user.email)
 .maybeSingle()
 if (row) {
 localStorage.setItem(LS_KEY, user.email)
 if (row.name) localStorage.setItem(LS_NAME_KEY, row.name)
 setConfirmedEmail(user.email)
 setConfirmedName(row.name ?? "")
 setStatus("confirmed")
 return
 }
 }

 // 3. Default: New visitor
 setStatus("not_on_list")
 }

 init()
 }, [])

 // ── Form submit ───────────────────────────────────────────────────────────
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!name.trim() || !email.trim()) { toast.error("Please fill in all required fields."); return }
 if ((role === "host" || role === "both") && (!location.trim() || !reason.trim())) {
 toast.error("Please fill in the location and why you want to host."); return
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
 // Insert row directly
 const { error } = await supabase
 .from("waitlist")
 .insert({
 name: name.trim(),
 email: email.trim(),
 role,
 location: (role === "host" || role === "both") ? location.trim() : null,
 reason: (role === "host" || role === "both") ? reason.trim() : null,
 confirmed: true,
 })

 if (error && error.code !== "23505") {
 throw error
 }

 // Send welcoming waitlist email
 await sendGeneralWaitlistEmail(
 email.trim(),
 name.trim(),
 role
 )

 localStorage.setItem(LS_KEY, email.trim())
 localStorage.setItem(LS_NAME_KEY, name.trim())
 setConfirmedEmail(email.trim())
 setConfirmedName(name.trim())
 setStatus("confirmed")
 toast.success("Welcome to the Ausaguide community! Email sent.")
 } catch (err: any) {
 console.error(err)
 toast.error(err.message || "Failed to submit. Please try again.")
 } finally {
 setSubmitting(false)
 }
 }

 // ── Render ────────────────────────────────────────────────────────────────
 return (
 <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
 <div className="relative z-10 w-full max-w-lg">

 {/* ── Loading ── */}
 {status === "loading" && (
 <div className="flex flex-col items-center gap-4 py-20">
 <Loader2 className="size-8 text-brand animate-spin" />
 <p className="text-sm text-muted-foreground font-medium">Checking your status…</p>
 </div>
 )}

 {/* ── Confirmed ── */}
 {status === "confirmed" && (
 <CelebrationPanel email={confirmedEmail} name={confirmedName} />
 )}

 {/* ── Not On List (Signup Form) ── */}
 {status === "not_on_list" && (
 <div className="space-y-6">
 {/* Countdown always visible */}
 <CountdownTimer targetDate={LAUNCH_DATE} />

 {/* Form card */}
 <div className="rounded-3xl border border-border p-8 bg-card shadow-modern space-y-6">
 <div className="text-center space-y-2">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-xs font-bold text-brand mb-2">
 <Sparkles className="size-3.5" />
 <span>Join our early waiting list</span>
 </div>
 <h1 className="text-3xl font-black text-foreground tracking-tight">Ausaguide Waiting List</h1>
 <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
 Be the first to explore local experiences. Join now and get early access when we launch on{" "}
 <span className="text-foreground font-bold">October 10, 2026</span>.
 </p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4">
 {/* Full Name */}
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Full Name *</label>
 <div className="relative">
 <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
 <input
 type="text"
 required
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Enter your full name"
 className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors font-medium"
 />
 </div>
 </div>

 {/* Email */}
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Email Address *</label>
 <div className="relative">
 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="you@example.com"
 className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors font-medium"
 />
 </div>
 </div>

 {/* Role picker */}
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">I want to join as a: *</label>
 <div className="grid grid-cols-3 gap-3">
 {(["traveler", "host", "both"] as const).map((r) => (
 <button
 key={r}
 type="button"
 onClick={() => setRole(r)}
 className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
 role === r
 ? "border-[#06363D] bg-[#06363D] text-white shadow-md"
 : "border-border bg-secondary/60 text-foreground hover:border-brand/40"
 }`}
 >
 {r.toUpperCase()}
 </button>
 ))}
 </div>
 </div>

 {/* Host-only fields */}
 {(role === "host" || role === "both") && (
 <>
 <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
 <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Where are you located? *</label>
 <div className="relative">
 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
 <input
 type="text"
 required
 value={location}
 onChange={(e) => setLocation(e.target.value)}
 placeholder="e.g. Nairobi, Narok, Lamu"
 className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors font-medium"
 />
 </div>
 </div>

 <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
 <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Why do you want to host? *</label>
 <div className="relative">
 <AlignLeft className="absolute left-4 top-4 size-4 text-muted-foreground" />
 <textarea
 required
 rows={3}
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 placeholder="Share details about the heritage or tours you want to guide..."
 className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors resize-none font-medium"
 />
 </div>
 </div>
 </>
 )}

 <button
 type="submit"
 disabled={submitting}
 className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-[#0D6F73] to-[#0D6F73] text-white text-sm font-bold shadow-lg hover:shadow-[0_4px_20px_rgba(13, 111, 115,0.4)] disabled:opacity-50 transition duration-300 flex items-center justify-center gap-2"
 >
 {submitting ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 <span>Adding to Waitlist…</span>
 </>
 ) : (
 <>
 <CheckCircle2 className="size-4" />
 <span>Join the Waitlist</span>
 </>
 )}
 </button>
 </form>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}
