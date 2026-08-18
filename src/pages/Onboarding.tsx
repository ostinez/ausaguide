import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Stepper } from "@/components/ui/Stepper"
import { supabase } from "@/lib/supabase"
import { validateName, validateUsername } from "@/lib/validation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { sendGuideApplicationNotification } from "@/lib/api/emails"
import { OnboardingInterests } from "@/components/auth/OnboardingInterests"
import { 
 Loader2, 
 Globe, 
 Sparkles, 
 Shield, 
 UserCheck, 
 RefreshCw, 
 Search, 
 Compass, 
 Home, 
 Award, 
 ArrowRight,
 PartyPopper,
 Check,
 FileCheck
} from "lucide-react"


// ── Types ──────────────────────────────────────────────
type Role = "traveler" | "host"

// ── Confetti particle ──────────────────────────────────
interface Particle {
 id: number
 x: number
 y: number
 color: string
 size: number
 rotation: number
 delay: number
}

function useConfetti(active: boolean): Particle[] {
 const [particles, setParticles] = useState<Particle[]>([])
 useEffect(() => {
 if (!active) return
 const colors = ["#0D6F73", "#0D6F73", "#FFD700", "#FF6B6B", "#4ECDC4", "#a78bfa", "#34d399"]
 setParticles(
 Array.from({ length: 48 }, (_, i) => ({
 id: i,
 x: Math.random() * 100,
 y: Math.random() * 100,
 color: colors[i % colors.length],
 size: 6 + Math.random() * 8,
 rotation: Math.random() * 360,
 delay: Math.random() * 0.8,
 }))
 )
 }, [active])
 return particles
}

// ── Step 1: Welcome ─────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 px-2 w-full">
      {/* Animated Lucide globe */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="select-none text-primary"
        aria-hidden
      >
        <Globe className="size-16 animate-pulse" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="space-y-3"
      >
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
          Welcome to Ausaguide!
          <Sparkles className="size-6 text-primary shrink-0 animate-bounce" />
        </h1>
        <p className="text-base sm:text-lg text-primary font-bold tracking-wide">
          Be a Local. Share Your World.
        </p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          You're about to join a community of real local hosts and curious global travellers. Let's set you up.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Button
          id="onboarding-welcome-next"
          size="lg"
          onClick={onNext}
          className="rounded-full px-10 bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-bold shadow-md transition-all duration-300 flex items-center gap-2"
        >
          Let's get started
          <ArrowRight className="size-4" />
        </Button>
      </motion.div>
    </div>
  )
}

// ── Step 2: Choose Role ──────────────────────────────────
interface RoleCard {
  id: Role
  title: string
  subtitle: string
  description: string
  color: string
}

const ROLE_CARDS: RoleCard[] = [
  {
    id: "traveler",
    title: "Traveler",
    subtitle: "Explore Kenya live with locals",
    description: "Book immersive tours, meet real locals, and experience authentic culture.",
    color: "border-primary bg-primary/10",
  },
  {
    id: "host",
    title: "Host",
    subtitle: "Share your world and earn",
    description: "Turn your local knowledge into income. Share Kenya's hidden gems.",
    color: "border-primary bg-primary/10",
  },
]

function StepRole({
  selectedRole,
  onSelect,
  onNext,
}: {
  selectedRole: Role | null
  onSelect: (r: Role) => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 px-2 w-full max-w-md mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          How do you plan to use Ausaguide?
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose your primary role. You can always switch or explore both later.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {ROLE_CARDS.map((c) => {
          const isSelected = selectedRole === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                "flex flex-col text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative",
                isSelected
                  ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                  : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-foreground">{c.title}</span>
                {isSelected && <Check className="size-4 text-primary" />}
              </div>
              <p className="text-xs font-semibold text-primary mb-1">{c.subtitle}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
            </button>
          )
        })}
      </div>

      <Button
        size="lg"
        disabled={!selectedRole}
        onClick={onNext}
        className="rounded-full px-10 bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-bold shadow-md transition-all duration-300 flex items-center gap-2"
      >
        Continue
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}

// ── Step 3: Tell Us About You ─────────────────────────────
function StepProfile({
  role,
  userId: propUserId,
  onComplete,
}: {
  role: Role
  userId: string
  onComplete: (name: string, realUserId: string) => void
}) {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [communityBio, setCommunityBio] = useState("")
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState(propUserId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          setEmail(user.email || "")

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

          if (profile) {
            setName(profile.full_name || user.user_metadata?.full_name || "")
            setUsername(profile.username || user.user_metadata?.username || "")
            setCommunityBio(profile.bio || "")
          } else {
            setName(user.user_metadata?.full_name || "")
            setUsername(user.user_metadata?.username || "")
          }
        }
      } catch (err) {
        console.error("Error checking active session:", err)
      }
    }
    checkUser()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const nameErr = validateName(name)
    if (nameErr) { setError(nameErr); return }
    const userErr = validateUsername(username)
    if (userErr) { setError(userErr); return }
    if (role === "host" && communityBio.trim().length < 10) {
      setError("Please tell us a bit more about your community (at least 10 characters).")
      return
    }

    setLoading(true)
    try {
      // Check if username is taken by anyone else
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim().toLowerCase())
        .maybeSingle()

      if (checkError) throw checkError
      if (existingUser && existingUser.id !== userId) {
        setError("This username is already taken.")
        setLoading(false)
        return
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: email.trim(),
            full_name: name.trim(),
            username: username.trim().toLowerCase(),
            role: role,
            languages: role === "host" ? ["English", "Swahili"] : ["English"],
            bio: role === "host" ? communityBio.trim() : null,
          },
          { onConflict: "id" }
        )

      if (upsertError) throw upsertError

      // Save role & ID to localStorage
      localStorage.setItem("user_id", userId)
      localStorage.setItem("user_role", role)

      if (role === "host") {
        await supabase
          .from("hosts")
          .upsert(
            {
              user_id: userId,
              full_name: name.trim(),
              email: email.trim(),
              city: "Nairobi",
              host_type: "local_host",
              bio: communityBio.trim() || "New host registered on Ausaguide.",
            },
            { onConflict: "user_id" }
          )
      }

      toast.success("Profile details saved!")
      onComplete(name.trim(), effectiveId)
    } catch (err: any) {
      console.error("[StepProfile] Error updating profile:", err)
      setError(err.message || "Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const effectiveId = userId || propUserId

  return (
    <div className="flex flex-col items-center gap-6 py-4 px-2 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Tell us about yourself
        </h2>
        <p className="text-sm text-muted-foreground">
          {role === "host"
            ? "Your host profile helps travelers get to know and trust you."
            : "Complete your basic traveler profile to get started."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="onboarding-full-name" className="text-xs font-semibold text-foreground">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="onboarding-full-name"
            type="text"
            placeholder="e.g. Jane Wanjiku"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-border/80 text-foreground placeholder:text-muted-foreground/50 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onboarding-username" className="text-xs font-semibold text-foreground">
            Username <span className="text-destructive">*</span>
          </Label>
          <Input
            id="onboarding-username"
            type="text"
            placeholder="e.g. janew"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="border-border/80 text-foreground placeholder:text-muted-foreground/50 text-sm"
          />
        </div>

        {role === "host" && (
          <div className="space-y-1.5">
            <Label htmlFor="onboarding-bio" className="text-xs font-semibold text-foreground">
              About Your Tours & Local Passion <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="onboarding-bio"
              rows={3}
              placeholder="Tell travelers what makes your experiences special..."
              value={communityBio}
              onChange={(e) => setCommunityBio(e.target.value)}
              className="w-full rounded-xl border border-border/80 bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
          >
            {loading ? <Spinner className="size-4 animate-spin mr-2" /> : null}
            Save Profile & Continue
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Step 3.5: Identity Verification (Hosts Only) ──────────────
function StepVerifyID({
 userId,
 onComplete,
}: {
 userId: string
 onComplete: () => void
}) {
 const [loading, setLoading] = useState(false)
 const [polling, setPolling] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [dots, setDots] = useState("")
 const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
 const pollingStarted = useRef(false)

 useEffect(() => {
 if (!polling) return
 const interval = setInterval(() => {
 setDots((d) => (d.length >= 3 ? "" : d + "."))
 }, 600)
 return () => clearInterval(interval)
 }, [polling])

 useEffect(() => {
 const params = new URLSearchParams(window.location.search)
 const isDoneRedirect = params.get("didit_done") === "true"
 // Auto-start polling when we return from Didit redirect.
 // Guard with pollingStarted ref so re-renders don't fire it twice.
 if (isDoneRedirect && userId && !pollingStarted.current) {
 pollingStarted.current = true
 startPolling()
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [userId])

 // Check if user is already verified on mount/load
 useEffect(() => {
 let active = true
 async function checkVerification() {
 if (!userId) return
 try {
 const { data, error: err } = await supabase
 .from("profiles")
 .select("id_verified, verification_status")
 .eq("id", userId)
 .single()
 if (err) throw err
 if (active && (data?.id_verified || data?.verification_status === "approved")) {
 toast.success("Identity already verified!")
 onComplete()
 }
 } catch (e) {
 console.error("Error during initial verification check:", e)
 }
 }
 checkVerification()
 return () => {
 active = false
 }
 }, [userId, onComplete])

 async function startVerification() {
 setLoading(true)
 setError(null)
 try {
 const redirectUrl = `${window.location.origin}/onboarding?didit_done=true&role=host&user_id=${userId}`
 
 const { data, error: functionErr } = await supabase.functions.invoke("verify-identity", {
 body: { userId, redirectUrl }
 })

 if (functionErr) throw functionErr
 if (!data?.url) throw new Error("Verification URL was not returned.")

 setVerificationUrl(data.url)
 
 // Open in a new tab to avoid iframe blocking and support standard browser camera access
 const newWindow = window.open(data.url, "_blank")
 if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
 console.warn("Popup blocked, showing direct link button...")
 }

 setLoading(false)
 startPolling()
 } catch (err: any) {
 setError(err?.message || "Failed to start identity verification. Please try again.")
 setLoading(false)
 }
 }

 async function checkStatus() {
 setLoading(true)
 setError(null)
 try {
 const { data, error: functionErr } = await supabase.functions.invoke("verify-identity", {
 body: { userId, action: "check-status" }
 })
 if (functionErr) throw functionErr

 if (data?.verified || data?.status === "approved") {
 toast.success("Identity verified successfully!")
 onComplete()
 } else if (data?.status === "declined") {
 setError("Verification was declined. Please re-check your document and try again.")
 } else if (data?.status === "failed") {
 setError("Something went wrong during verification. Please contact support.")
 } else {
 toast.info("Verification status: " + (data?.status || "started"))
 pollingStarted.current = false
 startPolling()
 }
 } catch (err: any) {
 console.error("Manual status check error:", err)
 setError(err?.message || "Failed to check status. Please try again.")
 } finally {
 setLoading(false)
 }
 }

 async function startPolling() {
 setPolling(true)
 setError(null)
 let attempts = 0
 const maxAttempts = 120 // 120 * 3s = 360s = 6 minutes

 const interval = setInterval(async () => {
 attempts++
 try {
 const { data, error: queryErr } = await supabase
 .from("profiles")
 .select("id_verified, verification_status")
 .eq("id", userId)
 .single()

 if (queryErr) throw queryErr

 if (data?.id_verified || data?.verification_status === "approved") {
 clearInterval(interval)
 setPolling(false)
 toast.success("Identity verified successfully!")
 onComplete()
 return
 }

 if (data?.verification_status === "declined") {
 clearInterval(interval)
 setPolling(false)
 setError("Verification was declined. Please re-check your document and try again.")
 return
 }

 if (data?.verification_status === "failed") {
 clearInterval(interval)
 setPolling(false)
 setError("Something went wrong during verification. Please contact support.")
 return
 }
 } catch (err) {
 console.error("Polling error:", err)
 }

 if (attempts >= maxAttempts) {
 clearInterval(interval)
 setPolling(false)
 setError("timed_out")
 }
 }, 3000)
 }

 return (
 <div className="flex flex-col items-center text-center gap-6 py-4 px-2 w-full">
 <motion.div
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: "spring", stiffness: 200, damping: 14 }}
 className="flex size-20 items-center justify-center rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/10 border border-[#0D6F73]/30 shadow-lg shadow-[#0D6F73]/10 text-white"
 >
 <Shield className="size-10 text-[#0D6F73]" />
 </motion.div>

 <div className="space-y-2">
 <h2 className="text-2xl sm:text-3xl font-black text-white">Verify Your Identity</h2>
 <p className="text-sm text-white/60 max-w-sm mx-auto">
 To build trust and keep the community safe, we partner with Didit to verify your identity. This takes less than a minute.
 </p>
 </div>

 {/* Error state */}
 {error && !polling && (
 <div className="flex flex-col items-center gap-3 w-full max-w-sm">
 {error === "timed_out" ? (
 <>
 <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-400 w-full text-center">
 Verification is processing — this may take a few seconds. Click below to check again.
 </div>
 <Button
 id="onboarding-verify-check-status"
 size="lg"
 disabled={loading}
 onClick={checkStatus}
 className="rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon hover:bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/90 text-white border-0 font-bold shadow-lg shadow-[#0D6F73]/30 w-full animate-bounce flex items-center justify-center gap-2"
 >
 {loading ? <Spinner className="size-4" /> : <Check className="size-4" />}
 Check My Status
 </Button>
 <Button
 id="onboarding-verify-retry"
 size="lg"
 variant="ghost"
 onClick={startVerification}
 className="rounded-full text-white/60 hover:text-white hover:bg-card shadow-modern font-semibold w-full flex items-center justify-center gap-2"
 >
 Restart Verification <RefreshCw className="size-4" />
 </Button>
 </>
 ) : (
 <>
 <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400 w-full text-center">
 {error}
 </div>
 <Button
 id="onboarding-verify-retry"
 size="lg"
 onClick={startVerification}
 className="rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon hover:bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/90 text-white border-0 font-bold shadow-lg shadow-[#0D6F73]/30 w-full flex items-center justify-center gap-2"
 >
 Retry Verification <RefreshCw className="size-4" />
 </Button>
 </>
 )}
 </div>
 )}

 <div className="flex flex-col gap-3 w-full max-w-xs">
 {polling ? (
 <div className="flex flex-col items-center gap-3 w-full">
 <Spinner className="size-6 text-[#0D6F73]" />
 <p className="text-sm font-semibold text-[#0D6F73] animate-pulse">
 Verifying your details{dots}
 </p>
 <p className="text-xs text-white/40 max-w-xs mx-auto">
 Please complete verification in the opened window. This page will update automatically when done.
 </p>
 {verificationUrl && (
 <a
 href={verificationUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs text-[#a78bfa] hover:text-[#0D6F73] underline font-semibold transition-colors mt-1"
 >
 Verification page did not open? Click here ↗
 </a>
 )}
 <Button
 id="onboarding-verify-force-check"
 size="sm"
 variant="outline"
 disabled={loading}
 onClick={checkStatus}
 className="mt-2 rounded-full border-white/20 text-white hover:bg-card shadow-modern font-semibold text-xs py-1 flex items-center justify-center gap-1.5"
 >
 {loading ? "Checking..." : "Force Check Status"} <Search className="size-3.5" />
 </Button>
 </div>
 ) : (
 !error && (
 <Button
 id="onboarding-verify-start"
 size="lg"
 disabled={loading}
 onClick={startVerification}
 className="rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon hover:bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/90 text-white border-0 font-bold shadow-lg shadow-[#0D6F73]/30 flex items-center justify-center gap-2"
 >
 {loading ? <Spinner className="size-4" /> : "Verify with Didit"} <UserCheck className="size-4" />
 </Button>
 )
 )}

 {import.meta.env.DEV && (
 <button
 onClick={onComplete}
 className="text-xs text-white/30 hover:text-white/60 underline font-semibold transition-colors mt-2"
 >
 Skip Verification (Dev Mode)
 </button>
 )}
 </div>
 </div>
 )
}

function StepDone({ name, role, hostTier }: { name: string; role: Role; hostTier?: string | null }) {
 const navigate = useNavigate()
 const particles = useConfetti(true)
 const [navigating, setNavigating] = useState(false)

 const handleNavigate = (path: string) => {
 setNavigating(true)
 navigate(path, { replace: true })
 }

 return (
 <div className="relative flex flex-col items-center text-center gap-6 py-4 px-2 w-full overflow-hidden">
 <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
 {particles.map((p) => (
 <motion.span
 key={p.id}
 className="absolute block rounded-sm"
 style={{
 left: `${p.x}%`,
 top: "-5%",
 width: p.size,
 height: p.size,
 backgroundColor: p.color,
 rotate: p.rotation,
 }}
 animate={{
 y: ["0%", "110vh"],
 rotate: [p.rotation, p.rotation + 360],
 opacity: [1, 0.8, 0],
 }}
 transition={{
 duration: 2.2 + Math.random() * 1.2,
 delay: p.delay,
 ease: "easeIn",
 repeat: 0,
 }}
 />
 ))}
 </div>

 <motion.div
 initial={{ scale: 0, rotate: -30 }}
 animate={{ scale: 1, rotate: 0 }}
 transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.2 }}
 className="flex size-20 items-center justify-center rounded-full bg-linear-to-br from-[#0D6F73] to-[#0D6F73] shadow-2xl shadow-[#0D6F73]/40 text-white"
 >
 <PartyPopper className="size-10" />
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4, duration: 0.5 }}
 className="space-y-2"
 >
 <h2 className="text-2xl sm:text-3xl font-black text-white">
 Welcome to Ausaguide, {name}!
 </h2>
 <p className="text-sm text-white/60 max-w-md mx-auto leading-relaxed">
 {role === "host"
 ? hostTier === "certified_guide"
 ? "Your Certified Guide application is under review. You can start hosting now as a Local Host. Once approved, you'll be upgraded to a Certified Guide with a blue Verified Guide badge."
 : "Your host profile is being reviewed. You can start exploring tours in the meantime."
 : "Your adventure starts now. Discover authentic local experiences in Kenya."}
 </p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.6, duration: 0.4 }}
 className="flex flex-col sm:flex-row gap-3"
 >
 {role === "traveler" ? (
 <>
 <Button
 id="onboarding-done-primary"
 size="lg"
 disabled={navigating}
 onClick={() => handleNavigate("/tours")}
 className="rounded-full px-8 bg-linear-to-r from-[#0D6F73] to-[#0D6F73] hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-[#0D6F73]/30 flex items-center justify-center gap-2"
 >
 {navigating ? <Loader2 className="size-4 animate-spin" /> : "Start Exploring"} <Compass className="size-4" />
 </Button>
 <Button
 id="onboarding-done-secondary"
 size="lg"
 variant="outline"
 disabled={navigating}
 onClick={() => handleNavigate("/dashboard")}
 className="rounded-full px-8 border-border text-white/80 hover:bg-accent/ hover:text-white font-semibold"
 >
 Go to Dashboard
 </Button>
 </>
 ) : (
 <>
 <Button
 id="onboarding-done-primary"
 size="lg"
 disabled={navigating}
 onClick={() => handleNavigate("/host/dashboard")}
 className="rounded-full px-8 bg-linear-to-r from-[#0D6F73] to-[#0D6F73] hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-[#0D6F73]/30 flex items-center justify-center gap-2"
 >
 {navigating ? <Loader2 className="size-4 animate-spin" /> : "Start Hosting"} <Home className="size-4" />
 </Button>
 <Button
 id="onboarding-done-secondary"
 size="lg"
 variant="outline"
 disabled={navigating}
 onClick={() => handleNavigate("/tours")}
 className="rounded-full px-8 border-border text-white/80 hover:bg-accent/ hover:text-white font-semibold"
 >
 Explore Tours
 </Button>
 </>
 )}
 </motion.div>
 </div>
 )
}



// ── Step: Host Tier & Verification ──────────────────
function StepHostTier({
 userId,
 userEmail,
 userName,
 onComplete,
}: {
 userId: string
 userEmail: string
 userName: string
 onComplete: (tier: "certified_guide" | "local_host") => void
}) {
 const [tier, setTier] = useState<"certified_guide" | "local_host" | null>(null)
 const [traNumber, setTraNumber] = useState("")
 const [kpsga, setKpsga] = useState("")
 const [licenseExpiry, setLicenseExpiry] = useState("")
 const [licenseFile, setLicenseFile] = useState<File | null>(null)
 const [agreed, setAgreed] = useState(false)
 const [uploading, setUploading] = useState(false)
 const [uploadProgressMsg, setUploadProgressMsg] = useState("")
 const fileRef = useRef<HTMLInputElement>(null)

 const handleContinue = async () => {
 if (!tier) return

 if (tier === "certified_guide") {
 // Validate Guide fields
 if (!traNumber.trim() || !licenseFile || !agreed) {
 toast.error("Please complete all required fields and wait for the file to upload.")
 return
 }

 setUploading(true)
 setUploadProgressMsg("Uploading your file... Please wait.")
 try {
 // Upload certificate to Supabase Storage
 const ext = licenseFile.name.split(".").pop()
 const path = `${userId}/cert-${Date.now()}.${ext}`
 const { error: upErr } = await supabase.storage.from("licenses").upload(path, licenseFile)
 if (upErr) throw upErr
 const { data: { publicUrl } } = supabase.storage.from("licenses").getPublicUrl(path)

 // Save to profile
 const updateData: any = {
 tra_number: traNumber.trim(),
 kpsga_number: kpsga.trim() || null,
 certificate_url: publicUrl,
 verified_guide: false,
 rejected_as_guide: false,
 license_status: "pending",
 host_tier: "local_host", // Save as local_host (temporarily)
 }
 if (licenseExpiry) updateData.license_expiry = licenseExpiry

 const { error: updateErr } = await supabase
 .from("profiles")
 .update(updateData)
 .eq("id", userId)
 if (updateErr) throw updateErr

 // Create Admin Notification (In-App)
 try {
 const { data: admins } = await supabase
 .from("profiles")
 .select("id")
 .eq("role", "admin")
 if (admins && admins.length > 0) {
 const notificationsToInsert = admins.map((admin) => ({
 user_id: admin.id,
 message: `New Certified Guide Application from ${userName} (TRA: ${traNumber})`,
 type: "guide_application",
 read: false,
 }))
 await supabase.from("notifications").insert(notificationsToInsert)
 }
 } catch (notifErr) {
 console.error("Failed to create admin in-app notification:", notifErr)
 }

 // Notify admin via Email
 sendGuideApplicationNotification(
 "ausaguides@gmail.com",
 userName,
 userEmail,
 traNumber.trim(),
 kpsga.trim() || null,
 publicUrl
 ).catch(console.error)

 toast.success("Your Certified Guide application has been submitted for review. You can now start hosting as a Local Host.")
 onComplete(tier)
 } catch (err: any) {
 console.error(err)
 toast.error("Please complete all required fields and wait for the file to upload.")
 } finally {
 setUploading(false)
 setUploadProgressMsg("")
 }
 } else {
 // Local Host chosen
 setUploading(true)
 try {
 const { error } = await supabase
 .from("profiles")
 .update({
 host_tier: "local_host",
 verified_guide: false,
 } as any)
 .eq("id", userId)
 if (error) error

 toast.success("Host tier updated successfully.")
 onComplete(tier)
 } catch (err: any) {
 console.error(err)
 toast.error("Failed to update host tier.")
 } finally {
 setUploading(false)
 }
 }
 }

 return (
 <div className="flex flex-col gap-6 py-4 w-full">
 <div className="text-center space-y-2">
 <Award className="size-12 mx-auto text-[#FFD700] animate-bounce" />
 <h2 className="text-2xl font-black text-white">What kind of host are you?</h2>
 <p className="text-sm text-white/60">This helps travelers find the right experience for them.</p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {([
 { value: "certified_guide" as const, label: "Certified Guide", desc: "I hold a government-issued tour guide license or certification.", color: "border-[#0D6F73]", icon: <Award className="size-8 text-[#0D6F73] mb-2" /> },
 { value: "local_host" as const, label: "Local Host", desc: "I'm a passionate local sharing my knowledge and hidden gems.", color: "border-[#0D6F73]", icon: <Home className="size-8 text-[#0D6F73] mb-2" /> },
 ]).map(({ value, label, desc, color, icon }) => (
 <button
 key={value}
 type="button"
 onClick={() => setTier(value)}
 className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
 tier === value ? `${color} bg-card shadow-modern` : "border-white/10 bg-card shadow-modern hover:border-white/20"
 }`}
 >
 {icon}
 <p className="font-bold text-white text-base">{label}</p>
 <p className="text-xs text-white/50 mt-1 leading-relaxed">{desc}</p>
 </button>
 ))}
 </div>

 {tier === "certified_guide" && (
 <div className="space-y-4 animate-in fade-in duration-300">
 <div className="space-y-1.5">
 <Label htmlFor="tra-number" className="text-white/85 text-xs font-semibold">TRA Number (required)</Label>
 <Input
 id="tra-number"
 type="text"
 placeholder="Tourism Regulatory Authority license number"
 value={traNumber}
 onChange={(e) => setTraNumber(e.target.value)}
 className="border-white/20 bg-card shadow-modern text-white placeholder:text-white/30 h-10 text-xs rounded-xl"
 required
 />
 </div>

 <div className="space-y-1.5">
 <Label htmlFor="kpsga-number" className="text-white/85 text-xs font-semibold">KPSGA Number (optional)</Label>
 <Input
 id="kpsga-number"
 type="text"
 placeholder="Kenya Professional Safari Guides Association number"
 value={kpsga}
 onChange={(e) => setKpsga(e.target.value)}
 className="border-white/20 bg-card shadow-modern text-white placeholder:text-white/30 h-10 text-xs rounded-xl"
 />
 </div>

 <div className="space-y-1.5">
 <Label htmlFor="license-expiry" className="text-white/85 text-xs font-semibold">License Expiry Date (optional)</Label>
 <Input
 id="license-expiry"
 type="date"
 value={licenseExpiry}
 onChange={(e) => setLicenseExpiry(e.target.value)}
 className="border-white/20 bg-card shadow-modern text-white placeholder:text-white/30 h-10 text-xs rounded-xl scheme-dark"
 />
 </div>

 <div className="space-y-2">
 <Label className="text-white/85 text-xs font-semibold">Upload your tour guide license / certification (required)</Label>
 <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
 onChange={e => { if (e.target.files?.[0]) setLicenseFile(e.target.files[0]); e.target.value = "" }} />
 <button
 type="button"
 onClick={() => fileRef.current?.click()}
 className="w-full py-3 rounded-xl border border-dashed border-[#0D6F73]/40 text-sm text-[#a78bfa] hover:border-[#0D6F73] hover:bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/5 transition-colors"
 >
 <span className="flex items-center justify-center gap-2">
 {licenseFile ? (
 <>
 <FileCheck className="size-4 text-[#0D6F73]" /> {licenseFile.name}
 </>
 ) : (
 "Click to upload license / certificate"
 )}
 </span>
 </button>
 <p className="text-[11px] text-white/30">PDF or image (JPG/PNG). This will be reviewed by our team.</p>
 </div>

 <label className="flex items-start gap-3 cursor-pointer group pt-2 select-none">
 <div
 onClick={() => setAgreed(!agreed)}
 className={cn(
 "mt-0.5 size-5 shrink-0 rounded border-2 flex items-center justify-center transition-all",
 agreed ? "bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon border-[#0D6F73]" : "border-white/20 hover:border-[#0D6F73]/50"
 )}
 >
 {agreed && <Check className="size-3 text-white" />}
 </div>
 <p className="text-xs text-white/60 leading-relaxed">
 I confirm that the information provided is accurate and I am a licensed tour guide under Kenyan law. I understand that providing false information may result in account suspension.
 </p>
 </label>
 </div>
 )}

 <Button
 size="lg"
 disabled={!tier || uploading}
 onClick={handleContinue}
 className="w-full rounded-full bg-gradient-to-r from-[#0D6F73] to-[#0D6F73] hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-[#0D6F73]/30 transition-all duration-300 flex items-center justify-center gap-2"
 >
 {uploading ? (
 <>
 <Loader2 className="size-4 animate-spin mr-2" />
 {uploadProgressMsg || "Processing..."}
 </>
 ) : (
 <>
 Continue
 <ArrowRight className="size-4" />
 </>
 )}
 </Button>
 </div>
 )
}

// ── Main page ──────────────────────────────────────────
export default function OnboardingPage() {
 const navigate = useNavigate()
 const [step, setStep] = useState(0)
 const [role, setRole] = useState<Role | null>(() => {
 try {
 const params = new URLSearchParams(window.location.search)
 if (params.get("become-host") === "true") {
 return "host"
 }
 const isBecomeHost = sessionStorage.getItem("become_host") === "true"
 if (isBecomeHost) {
 sessionStorage.removeItem("become_host")
 return "host"
 }
 } catch (e) {
 console.error("Failed to read become_host from sessionStorage:", e)
 }
 return null
 })
 const [completedName, setCompletedName] = useState("")
 const [userId, setUserId] = useState(() => {
 try {
 return crypto.randomUUID()
 } catch {
 return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
 var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
 return v.toString(16);
 });
 }
 })

 // Guard and initialization: sync active Supabase user session
 useEffect(() => {
 const params = new URLSearchParams(window.location.search)
 if (params.get("didit_done") === "true") {
 const uId = params.get("user_id") || ""
 const r = params.get("role") as Role || "host"
 
 setUserId(uId)
 setRole(r)
 setStep(3)
 return
 }

 async function syncSession() {
 try {
 const { data: { user } } = await supabase.auth.getUser()
 if (user) {
 setUserId(user.id)

 // ADMIN BYPASS: If this is the super-admin email, never show onboarding
 const ADMIN_EMAIL = 'ausaguides@gmail.com'
 if (user.email === ADMIN_EMAIL) {
 localStorage.setItem("user_id", user.id)
 localStorage.setItem("user_role", "admin")
 navigate("/admin2", { replace: true })
 return
 }

 const { data: profile } = await supabase
 .from("profiles")
 .select("role, host_tier")
 .eq("id", user.id)
 .maybeSingle()

 if (profile) {
 const isHostOnboarded = profile.role === "host" && profile.host_tier !== null;
 const isTravelerOnboarded = profile.role === "traveler";
 const isAdminOnboarded = profile.role === "admin";

 if (isHostOnboarded || isTravelerOnboarded || isAdminOnboarded) {
 localStorage.setItem("user_id", user.id)
 localStorage.setItem("user_role", profile.role)
 if (profile.role === "admin") {
 navigate("/admin2", { replace: true })
 } else if (profile.role === "host") {
 navigate("/host/dashboard", { replace: true })
 } else {
 navigate("/dashboard", { replace: true })
 }
 }
 }
 } else {
 localStorage.removeItem("user_id")
 localStorage.removeItem("user_role")
 }
 } catch (err) {
 console.error("Error syncing session in onboarding:", err)
 }
 }
 syncSession()
 }, [navigate])


 const [hostTierSelected, setHostTierSelected] = useState<"certified_guide" | "local_host" | null>(null)
 const [userEmail, setUserEmail] = useState("")

 // Load email for guide notification
 useEffect(() => {
 supabase.auth.getUser().then(({ data: { user } }) => {
 if (user?.email) setUserEmail(user.email)
 })
 }, [])

 // Stepper steps computed dynamically based on role and tier
 const steps = [
 { label: "Welcome" },
 { label: "Role" },
 { label: "Profile" },
 ...(role === "host"
 ? [
 { label: "Verify ID" },
 { label: "Host Type" },
 ]
 : [
 { label: "Interests" },
 ]),
 { label: "Done" },
 ]

 return (
 <div className="min-h-screen bg-[#0d0d12] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
 {/* Background glow blobs */}
 <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
 <div className="absolute top-1/4 left-1/4 w-[500px] h-[400px] rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/8 blur-[120px] animate-pulse" />
 <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/6 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
 </div>

 <div className="relative z-10 w-full max-w-2xl">
 {/* Card shell */}
 <div className="rounded-3xl border border-white/8 bg-card shadow-modern shadow-2xl shadow-black/50 p-6 sm:p-10">
 <Stepper steps={steps} currentStep={step}>
 {step === 0 && <StepWelcome onNext={() => setStep(1)} />}

 {step === 1 && (
 <StepRole
 selectedRole={role}
 onSelect={setRole}
 onNext={() => setStep(2)}
 />
 )}

 {step === 2 && (
 <StepProfile
 role={role ?? "traveler"}
 userId={userId}
 onComplete={(name, realUserId) => {
 setCompletedName(name)
 setUserId(realUserId)
 setStep(3)
 }}
 />
 )}

 {role === "host" ? (
 <>
 {step === 3 && (
 <StepVerifyID
 userId={userId}
 onComplete={() => setStep(4)}
 />
 )}
 {step === 4 && (
 <StepHostTier
 userId={userId}
 userEmail={userEmail}
 userName={completedName || "Guide"}
 onComplete={(tier) => {
 setHostTierSelected(tier)
 setStep(5) // go directly to done
 }}
 />
 )}
 {step === 5 && (
 <StepDone
 name={completedName || "Explorer"}
 role={role}
 hostTier={hostTierSelected}
 />
 )}
 </>
 ) : (
 <>
 {step === 3 && (
 <div className="py-2">
 <OnboardingInterests
 userId={userId}
 onComplete={() => setStep(4)}
 onSkip={() => setStep(4)}
 />
 </div>
 )}
 {step === 4 && (
 <StepDone
 name={completedName || "Explorer"}
 role={role ?? "traveler"}
 />
 )}
 </>
 )}
 </Stepper>
 </div>

 {/* Footer */}
 <p className="text-center text-xs text-white/25 mt-5">
 Already have an account?{" "}
 <button
 onClick={() => navigate("/auth")}
 className="text-[#0D6F73] hover:underline font-semibold"
 >
 Log in
 </button>
 </p>
 </div>
 </div>
 )
}
