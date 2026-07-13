import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Stepper } from "@/components/ui/Stepper"
import { supabase } from "@/lib/supabase"
import { validateName, validateEmail, validatePassword, validateUsername } from "@/lib/validation"
import { identifyUser, trackEvent } from "@/lib/posthog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { sendWelcomeEmail } from "@/lib/api/emails"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"

/** Map Supabase auth errors to user-friendly messages */
function friendlySignUpError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("user already registered") || m.includes("already exists") || m.includes("already been registered"))
    return "An account with this email already exists. Please log in instead."
  if (m.includes("weak_password") || m.includes("at least 8"))
    return "Password must be at least 8 characters."
  if (m.includes("invalid email") || m.includes("email address"))
    return "Please enter a valid email address."
  if (m.includes("network") || m.includes("fetch"))
    return "Network error — please check your connection and try again."
  return message
}

// ── Types ──────────────────────────────────────────────
type Role = "traveler" | "host"

interface OnboardingData {
  name: string
  email: string
  username?: string
  password: string
  subscribeNewsletter?: boolean
}

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
    const colors = ["#7F5AF0", "#2CB67D", "#FFD700", "#FF6B6B", "#4ECDC4", "#a78bfa", "#34d399"]
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
      {/* Animated emoji globe */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="text-7xl select-none"
        aria-hidden
      >
        🌍
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="space-y-3"
      >
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Welcome to Ausaguide! 🎉
        </h1>
        <p className="text-base sm:text-lg text-[#2CB67D] font-semibold tracking-wide">
          Be a Local. Share Your World.
        </p>
        <p className="text-sm text-white/60 max-w-xs mx-auto leading-relaxed">
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
          className="rounded-full px-10 bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-[#7F5AF0]/30 transition-all duration-300"
        >
          Let's get started →
        </Button>
      </motion.div>
    </div>
  )
}

// ── Step 2: Choose Role ──────────────────────────────────
interface RoleCard {
  id: Role
  emoji: string
  title: string
  subtitle: string
  description: string
  color: string
  shadow: string
}

const ROLE_CARDS: RoleCard[] = [
  {
    id: "traveler",
    emoji: "🧭",
    title: "Traveler",
    subtitle: "Explore Kenya live with locals",
    description: "Book immersive tours, meet real locals, and experience authentic culture.",
    color: "border-[#2CB67D] shadow-[#2CB67D]/30",
    shadow: "0 0 0 2px #2CB67D, 0 8px 32px rgba(44,182,125,0.25)",
  },
  {
    id: "host",
    emoji: "🏡",
    title: "Host",
    subtitle: "Share your world and earn",
    description: "Turn your local knowledge into income. Share Kenya's hidden gems.",
    color: "border-[#7F5AF0] shadow-[#7F5AF0]/30",
    shadow: "0 0 0 2px #7F5AF0, 0 8px 32px rgba(127,90,240,0.25)",
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
    <div className="flex flex-col items-center gap-6 py-4 px-2 w-full">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black text-white">Choose Your Role</h2>
        <p className="text-sm text-[#2CB67D] font-semibold">Choose carefully. Your role cannot be changed once selected.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {ROLE_CARDS.map((card) => {
          const isSelected = selectedRole === card.id
          return (
            <button
              key={card.id}
              id={`onboarding-role-${card.id}`}
              onClick={() => onSelect(card.id)}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left",
                "bg-[#16161A]/60 backdrop-blur-xl hover:bg-[#16161A]/80",
                isSelected
                  ? card.color + " scale-[1.03]"
                  : "border-border hover:border-border"
              )}
              style={isSelected ? { boxShadow: card.shadow } : {}}
            >
              <span className="text-4xl" aria-hidden>{card.emoji}</span>
              <div className="text-center space-y-1">
                <p className="text-lg font-black text-white">{card.title}</p>
                <p className={cn("text-xs font-semibold", isSelected ? "text-white/80" : "text-white/50")}>
                  {card.subtitle}
                </p>
                <p className="text-xs text-white/40 leading-relaxed hidden sm:block">
                  {card.description}
                </p>
              </div>
              {isSelected && (
                <motion.span
                  layoutId="role-check"
                  className="text-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.span>
              )}
            </button>
          )
        })}
      </div>

      <Button
        id="onboarding-role-next"
        size="lg"
        disabled={!selectedRole}
        onClick={onNext}
        className={cn(
          "rounded-full px-10 font-bold transition-all duration-300",
          selectedRole
            ? "bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white border-0 shadow-lg shadow-[#7F5AF0]/30 hover:opacity-90"
            : "bg-accent/ text-white/30 border border-border cursor-not-allowed"
        )}
      >
        Continue →
      </Button>
    </div>
  )
}

// ── Step 3: Tell Us About You ─────────────────────────────
function StepProfile({
  role,
  userId: _userId,
  prefill,
  onComplete,
}: {
  role: Role
  userId: string
  prefill: OnboardingData
  onComplete: (name: string, userId: string) => void
}) {
  const [name, setName] = useState(prefill.name)
  const [email, setEmail] = useState(prefill.email)
  const [username, setUsername] = useState(prefill.username || "")
  const [password, setPassword] = useState(prefill.password)
  const [showPassword, setShowPassword] = useState(false)
  const [communityBio, setCommunityBio] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOAuthUser, setIsOAuthUser] = useState(false)

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsOAuthUser(true)
          if (!name) setName(user.user_metadata?.full_name || "")
          if (!email) setEmail(user.email || "")
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
    const emailErr = validateEmail(email)
    if (emailErr) { setError(emailErr); return }
    const userErr = validateUsername(username)
    if (userErr) { setError(userErr); return }
    if (!isOAuthUser) {
      const passErr = validatePassword(password)
      if (passErr) { setError(passErr); return }
    }
    if (role === "host" && communityBio.trim().length < 10) {
      setError("Please tell us a bit more about your community (at least 10 characters).")
      return
    }

    setLoading(true)
    try {
      let realUserId: string
      let emailConfirmed = false

      // Check username availability
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim().toLowerCase())
        .maybeSingle()

      if (checkError) throw checkError
      if (existingUser && existingUser.id !== _userId) {
        setError("This username is already taken.")
        return
      }

      if (isOAuthUser) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error("No active user session found.")
        }
        realUserId = user.id
        emailConfirmed = !!user.email_confirmed_at
      } else {
        // ✅ Step 1: Create the real Supabase Auth user
        let { data: signUpData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              role,
              username: username.trim().toLowerCase(),
            },
          },
        })

        if (authError) {
          const errMsg = authError.message.toLowerCase()
          if (errMsg.includes("already registered") || errMsg.includes("already exists")) {
            // Attempt to sign in instead
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            })
            if (signInError) {
              setError(friendlySignUpError(authError.message))
              return
            }
            signUpData = signInData
          } else {
            setError(friendlySignUpError(authError.message))
            return
          }
        }

        if (!signUpData.user) {
          setError("Account creation failed — no user returned. Please try again.")
          return
        }
        realUserId = signUpData.user.id
        emailConfirmed = !!signUpData.user.email_confirmed_at
      }

      // If updates opt-in was checked, save to database table
      if (prefill.subscribeNewsletter) {
        supabase
          .from("newsletter_subscribers")
          .insert({ email: email.trim(), name: name.trim() })
          .then(({ error: subError }) => {
            if (subError) console.error("Failed to subscribe to newsletter database table:", subError)
          })
      }

      // Brief pause: give the on_auth_user_created trigger time to insert
      // the profile row before we upsert over it with the real full_name.
      await new Promise((r) => setTimeout(r, 350))

      if (role === "host") {
        // Upsert profile with explicit conflict target on 'id'
        const { data: profileData, error: upsertError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: realUserId,
              email: email.trim(),
              full_name: name.trim(),
              username: username.trim().toLowerCase(),
              role: "host",
              languages: ["English", "Swahili"],
            },
            { onConflict: "id" }
          )
          .select("id, email, role")
          .single()

        // Non-fatal: log but don't block — auth session is already created
        if (upsertError) {
          console.error("[StepProfile] Profile upsert error (non-fatal):", upsertError)
        }

        const { error: hostErr } = await supabase.from("hosts").insert({
          user_id: realUserId,
          full_name: name.trim(),
          email: email.trim(),
          city: "Nairobi",
          host_type: "local_host",
          bio: communityBio.trim() || "New host registered on Ausaguide.",
          status: "pending",
        })
        if (hostErr) console.error("Failed to create host record:", hostErr)

        localStorage.setItem("user_id", realUserId)
        localStorage.setItem("user_role", profileData?.role ?? "host")
        trackEvent("user_signed_up", { email: email.trim(), role: "host" })
        identifyUser(realUserId, { email: email.trim(), role: "host" })
        sendWelcomeEmail(email.trim(), name.trim(), prefill.subscribeNewsletter)
          .catch(err => console.error("Failed to send welcome email:", err))
        
        if (emailConfirmed) {
          toast.success("Account profile completed successfully!")
        } else {
          toast.success("Account created! Check your inbox to confirm your email.")
        }
        onComplete(name.trim(), realUserId)
      } else {
        // Upsert profile with explicit conflict target on 'id'
        const { data: profileData, error: upsertError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: realUserId,
              email: email.trim(),
              full_name: name.trim(),
              username: username.trim().toLowerCase(),
              role: "traveler",
              languages: ["English"],
            },
            { onConflict: "id" }
          )
          .select("id, email, role")
          .single()

        // Non-fatal: if trigger already created the row and upsert fails due
        // to RLS, we still have a valid auth session — proceed gracefully.
        if (upsertError) {
          console.error("[StepProfile] Profile upsert error (non-fatal):", upsertError)
        }

        localStorage.setItem("user_id", realUserId)
        localStorage.setItem("user_role", profileData?.role ?? "traveler")
        trackEvent("user_signed_up", { email: email.trim(), role: "traveler" })
        identifyUser(realUserId, { email: email.trim(), role: "traveler" })
        sendWelcomeEmail(email.trim(), name.trim(), prefill.subscribeNewsletter)
          .catch(err => console.error("Failed to send welcome email:", err))
        
        if (emailConfirmed) {
          toast.success("Account profile completed successfully!")
        } else {
          toast.success("Account created! Check your inbox to confirm your email.")
        }
        onComplete(name.trim(), realUserId)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? friendlySignUpError(err.message) : "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4 px-2 w-full">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black text-white">Tell Us About You</h2>
        <p className="text-sm text-white/50">
          {role === "host" ? "Almost there — let's set up your host profile." : "Quick setup and you're in!"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="ob-name" className="text-white/70 text-xs font-semibold uppercase tracking-wide">
            Full Name
          </Label>
          <Input
            id="ob-name"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-[#16161A]/60 border-border text-white placeholder:text-white/30 focus:border-[#7F5AF0]/60 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ob-username" className="text-white/70 text-xs font-semibold uppercase tracking-wide">
            Username
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50">@</span>
            <Input
              id="ob-username"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              className="pl-7 bg-[#16161A]/60 border-border text-white placeholder:text-white/30 focus:border-[#7F5AF0]/60 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ob-email" className="text-white/70 text-xs font-semibold uppercase tracking-wide">
            Email
          </Label>
          <Input
            id="ob-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isOAuthUser}
            className="bg-[#16161A]/60 border-border text-white placeholder:text-white/30 focus:border-[#7F5AF0]/60 rounded-xl disabled:opacity-70"
          />
        </div>

        {!isOAuthUser && (
          <div className="space-y-1.5">
            <Label htmlFor="ob-password" className="text-white/70 text-xs font-semibold uppercase tracking-wide">
              Password
            </Label>
            <div className="relative">
              <Input
                id="ob-password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#16161A]/60 border-border text-white placeholder:text-white/30 focus:border-[#7F5AF0]/60 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        )}

        {role === "host" && (
          <div className="space-y-1.5">
            <Label htmlFor="ob-bio" className="text-white/70 text-xs font-semibold uppercase tracking-wide">
              Tell us about your community
            </Label>
            <textarea
              id="ob-bio"
              placeholder="What makes your area unique? What experiences can you offer?"
              value={communityBio}
              onChange={(e) => setCommunityBio(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-[#16161A]/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7F5AF0]/60 resize-none transition-colors"
            />
          </div>
        )}

        <Button
          id="onboarding-profile-submit"
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-[#7F5AF0]/30 transition-all duration-300"
        >
          {loading ? <Spinner className="size-4 animate-spin" /> : (isOAuthUser ? "Save Profile" : "Create Account")}
        </Button>
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

      const { DiditSdk } = await import("@didit-protocol/sdk-web")
      
      DiditSdk.shared.onComplete = (result: any) => {
        console.log("flow finished client-side:", result.status)
        if (result.status === "completed") {
          startPolling()
        } else if (result.status === "failed") {
          setError("Verification failed client-side. Please try again.")
        }
      }
      
      DiditSdk.shared.startVerification({ url: data.url })
      setLoading(false)
    } catch (err: any) {
      console.warn("Didit Web SDK modal failed, falling back to direct redirect...", err)
      const redirectUrl = `${window.location.origin}/onboarding?didit_done=true&role=host&user_id=${userId}`
      try {
        const { data, error: functionErr } = await supabase.functions.invoke("verify-identity", {
          body: { userId, redirectUrl }
        })
        if (functionErr) throw functionErr
        if (!data?.url) throw new Error("Verification URL was not returned.")
        window.location.href = data.url
      } catch (innerErr: any) {
        setError(innerErr?.message || "Failed to start identity verification. Please try again.")
        setLoading(false)
      }
    }
  }

  async function startPolling() {
    setPolling(true)
    setError(null)
    let attempts = 0
    const maxAttempts = 10

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
        className="flex size-20 items-center justify-center rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/30 shadow-lg shadow-[#7F5AF0]/10"
      >
        <span className="text-4xl text-[#7F5AF0]">🛡️</span>
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
                onClick={() => { pollingStarted.current = false; startPolling() }}
                className="rounded-full bg-[#2CB67D] hover:bg-[#2CB67D]/90 text-white border-0 font-bold shadow-lg shadow-[#2CB67D]/30 w-full"
              >
                Check My Status ✓
              </Button>
              <Button
                id="onboarding-verify-retry"
                size="lg"
                variant="ghost"
                onClick={startVerification}
                className="rounded-full text-white/60 hover:text-white hover:bg-white/5 font-semibold w-full"
              >
                Restart Verification 🔄
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
                className="rounded-full bg-[#7F5AF0] hover:bg-[#7F5AF0]/90 text-white border-0 font-bold shadow-lg shadow-[#7F5AF0]/30 w-full"
              >
                Retry Verification 🔄
              </Button>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {polling ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner className="size-6 text-[#7F5AF0]" />
            <p className="text-sm font-semibold text-[#7F5AF0] animate-pulse">
              Verifying your details{dots}
            </p>
            <p className="text-xs text-white/40">
              Verification is processing — this may take a few seconds.
            </p>
          </div>
        ) : (
          !error && (
            <Button
              id="onboarding-verify-start"
              size="lg"
              disabled={loading}
              onClick={startVerification}
              className="rounded-full bg-[#7F5AF0] hover:bg-[#7F5AF0]/90 text-white border-0 font-bold shadow-lg shadow-[#7F5AF0]/30"
            >
              {loading ? <Spinner className="size-4" /> : "Verify with Didit 🪪"}
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

// ── Step 4: Done ─────────────────────────────────────────
function StepDone({ name, role }: { name: string; role: Role }) {
  const navigate = useNavigate()
  const particles = useConfetti(true)

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
        className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#7F5AF0] to-[#2CB67D] shadow-2xl shadow-[#7F5AF0]/40"
      >
        <span className="text-4xl">🎊</span>
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
        <p className="text-sm text-white/60 max-w-xs mx-auto">
          {role === "host"
            ? "Your host profile is being reviewed. You can start exploring tours in the meantime."
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
              onClick={() => navigate("/tours")}
              className="rounded-full px-8 bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-[#7F5AF0]/30"
            >
              Start Exploring 🧭
            </Button>
            <Button
              id="onboarding-done-secondary"
              size="lg"
              variant="outline"
              onClick={() => navigate("/dashboard")}
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
              onClick={() => navigate("/host/dashboard")}
              className="rounded-full px-8 bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-[#7F5AF0]/30"
            >
              Start Hosting 🏡
            </Button>
            <Button
              id="onboarding-done-secondary"
              size="lg"
              variant="outline"
              onClick={() => navigate("/tours")}
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

// ── Step 5: Payout Setup (Hosts Only) ─────────────────────────
function StepPayout({
  userId,
  onComplete,
}: {
  userId: string
  onComplete: () => void
}) {
  const [method, setMethod] = useState<"mpesa" | "bank">("mpesa")
  const [phone, setPhone] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNo, setAccountNo] = useState("")
  const [accountName, setAccountName] = useState("")

  function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (method === "mpesa" && !phone.trim()) {
      toast.error("Please enter your M-Pesa phone number.")
      return
    }
    if (method === "bank" && (!bankName.trim() || !accountNo.trim() || !accountName.trim())) {
      toast.error("Please fill in all bank details.")
      return
    }

    try {
      localStorage.setItem(
        `host_payout_${userId}`,
        JSON.stringify({
          method,
          phone: phone.trim(),
          bankName: bankName.trim(),
          accountNo: accountNo.trim(),
          accountName: accountName.trim(),
        })
      )
      toast.success("Payout settings saved!")
      onComplete()
    } catch (err) {
      console.error(err)
      toast.error("Failed to save payout settings.")
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4 px-2 w-full">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-black text-white">Set Up Payouts</h2>
        <p className="text-sm text-white/50">
          Choose how you would like to receive payments from bookings.
        </p>
      </div>

      <form onSubmit={handleSave} className="w-full max-w-md space-y-5">
        <div className="space-y-1.5">
          <Label className="text-white/70 text-xs font-semibold uppercase tracking-wide">
            Payout Method
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod("mpesa")}
              className={cn(
                "py-3 rounded-xl border font-bold text-sm transition-all duration-200 cursor-pointer",
                method === "mpesa"
                  ? "border-[#2CB67D] bg-[#2CB67D]/10 text-[#2CB67D] shadow-[0_0_12px_rgba(44,182,125,0.15)]"
                  : "border-border bg-[#16161A]/60 text-white/60 hover:text-white"
              )}
            >
              M-Pesa 📱
            </button>
            <button
              type="button"
              onClick={() => setMethod("bank")}
              className={cn(
                "py-3 rounded-xl border font-bold text-sm transition-all duration-200 cursor-pointer",
                method === "bank"
                  ? "border-[#7F5AF0] bg-[#7F5AF0]/10 text-[#7F5AF0] shadow-[0_0_12px_rgba(127,90,240,0.15)]"
                  : "border-border bg-[#16161A]/60 text-white/60 hover:text-white"
              )}
            >
              Bank Transfer 🏦
            </button>
          </div>
        </div>

        {method === "mpesa" ? (
          <div className="space-y-1.5">
            <Label htmlFor="pay-phone" className="text-white/70 text-xs font-semibold uppercase tracking-wide">
              M-Pesa Phone Number
            </Label>
            <Input
              id="pay-phone"
              type="tel"
              placeholder="e.g. +254 712 345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="bg-[#16161A]/60 border-border text-white placeholder:text-white/30 focus:border-[#7F5AF0]/60 rounded-xl"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pay-bank" className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                Bank Name
              </Label>
              <Input
                id="pay-bank"
                type="text"
                placeholder="e.g. Kenya Commercial Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                className="bg-[#16161A]/60 border-border text-white placeholder:text-white/30 focus:border-[#7F5AF0]/60 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-acc-no" className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                Account Number
              </Label>
              <Input
                id="pay-acc-no"
                type="text"
                placeholder="Your bank account number"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                required
                className="bg-[#16161A]/60 border-border text-white placeholder:text-white/30 focus:border-[#7F5AF0]/60 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-acc-name" className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                Account Holder Name
              </Label>
              <Input
                id="pay-acc-name"
                type="text"
                placeholder="Full name on the account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                className="bg-[#16161A]/60 border-border text-white placeholder:text-white/30 focus:border-[#7F5AF0]/60 rounded-xl"
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-[#7F5AF0]/30 transition-all duration-300"
        >
          Save & Continue →
        </Button>
      </form>
    </div>
  )
}

// ── Step: Host Tier ────────────────────────────────────
function StepHostTier({
  userId,
  onComplete,
}: {
  userId: string
  onComplete: () => void
}) {
  const [tier, setTier] = useState<"certified_guide" | "local_host" | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleContinue = async () => {
    if (!tier) return
    setUploading(true)
    try {
      let licenseUrl: string | null = null
      let licenseStatus: string | null = null

      if (tier === "certified_guide") {
        licenseStatus = "pending"
        if (licenseFile) {
          const ext = licenseFile.name.split(".").pop()
          const path = `${userId}/${Date.now()}.${ext}`
          const { error: upErr } = await supabase.storage.from("licenses").upload(path, licenseFile)
          if (upErr) throw upErr
          const { data: { publicUrl } } = supabase.storage.from("licenses").getPublicUrl(path)
          licenseUrl = publicUrl
        }
      }

      await supabase
        .from("profiles")
        .update({
          host_tier: "local_host", // Initially set as local_host until guide review approves
          license_url: licenseUrl,
          license_status: licenseStatus,
        } as any)
        .eq("id", userId)
      onComplete()
    } catch (err: any) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 py-4 w-full">
      <div className="text-center space-y-2">
        <div className="text-4xl">🏅</div>
        <h2 className="text-2xl font-black text-white">What kind of host are you?</h2>
        <p className="text-sm text-white/60">This helps travelers find the right experience for them.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { value: "certified_guide" as const, emoji: "🏅", label: "Certified Guide", desc: "I hold a government-issued tour guide license or certification.", color: "border-[#7F5AF0]" },
          { value: "local_host" as const, emoji: "🏡", label: "Local Host", desc: "I'm a passionate local sharing my knowledge and hidden gems.", color: "border-[#2CB67D]" },
        ]).map(({ value, emoji, label, desc, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTier(value)}
            className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
              tier === value ? `${color} bg-white/5` : "border-white/10 bg-white/2 hover:border-white/20"
            }`}
          >
            <span className="text-3xl block mb-2">{emoji}</span>
            <p className="font-bold text-white text-base">{label}</p>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">{desc}</p>
          </button>
        ))}
      </div>

      {tier === "certified_guide" && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <p className="text-sm font-semibold text-white/80">Upload your tour guide license / certification</p>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
            onChange={e => { if (e.target.files?.[0]) setLicenseFile(e.target.files[0]); e.target.value = "" }} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-xl border border-dashed border-[#7F5AF0]/40 text-sm text-[#a78bfa] hover:border-[#7F5AF0] hover:bg-[#7F5AF0]/5 transition-colors"
          >
            {licenseFile ? `✅ ${licenseFile.name}` : "Click to upload license / certificate"}
          </button>
          <p className="text-[11px] text-white/30">PDF or image (JPG/PNG). This will be reviewed by our team.</p>
        </div>
      )}

      <Button
        size="lg"
        disabled={!tier || uploading}
        onClick={handleContinue}
        className="w-full rounded-full bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] hover:opacity-90 text-white border-0 font-bold shadow-lg shadow-[#7F5AF0]/30 transition-all duration-300"
      >
        {uploading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        Continue →
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
      setStep(3) // Directly resume at StepVerifyID (Verify ID is now step 3 for Host)
      return
    }

    async function syncSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          // Check if they already have a profile row
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

          if (profile) {
            localStorage.setItem("user_id", user.id)
            localStorage.setItem("user_role", profile.role || "traveler")
            navigate(profile.role === "host" ? "/host/dashboard" : "/dashboard", { replace: true })
          }
        } else {
          const localUserId = localStorage.getItem("user_id")
          if (localUserId) navigate("/dashboard", { replace: true })
        }
      } catch (err) {
        console.error("Error syncing session in onboarding:", err)
      }
    }
    syncSession()
  }, [navigate])

  // Prefill from sessionStorage if the auth page passed data
  const prefillRaw = sessionStorage.getItem("onboarding_data")
  const prefill: OnboardingData = prefillRaw
    ? (JSON.parse(prefillRaw) as OnboardingData)
    : { name: "", email: "", password: "" }

  // Stepper steps computed dynamically based on role
  const steps = [
    { label: "Welcome" },
    { label: "Role" },
    { label: "Profile" },
    ...(role === "host"
      ? [
          { label: "Verify ID" },
          { label: "Payout" },
          { label: "Host Type" },
        ]
      : []),
    { label: "Done" },
  ]

  return (
    <div className="min-h-screen bg-[#0d0d12] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[400px] rounded-full bg-[#7F5AF0]/8 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] rounded-full bg-[#2CB67D]/6 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Card shell */}
        <div className="rounded-3xl border border-white/8 bg-[#16161A]/70 backdrop-blur-2xl shadow-2xl shadow-black/50 p-6 sm:p-10">
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
                prefill={prefill}
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
                  <StepPayout
                    userId={userId}
                    onComplete={() => setStep(5)}
                  />
                )}
                {step === 5 && (
                  <StepHostTier
                    userId={userId}
                    onComplete={() => setStep(6)}
                  />
                )}
                {step === 6 && (
                  <StepDone
                    name={completedName || prefill.name || "Explorer"}
                    role={role}
                  />
                )}
              </>
            ) : (
              <>
                {step === 3 && (
                  <StepDone
                    name={completedName || prefill.name || "Explorer"}
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
            className="text-[#7F5AF0] hover:underline font-semibold"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}
