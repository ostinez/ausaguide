import { useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { identifyUser } from "@/lib/posthog"
import { checkRateLimit, getLoginKey } from "@/lib/api/rate-limit"
import { toast } from "sonner"
import { validateName, validateEmail, validatePassword, validateConfirmPassword, validateUsername } from "@/lib/validation"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}



/** Map Supabase / network error messages to user-friendly strings */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "Incorrect email or password. Please try again."
  if (m.includes("email not confirmed"))
    return "Please check your inbox and confirm your email before logging in."
  if (m.includes("user already registered") || m.includes("already exists"))
    return "An account with this email already exists. Try logging in instead."
  if (m.includes("weak_password") || m.includes("at least 8"))
    return "Password must be at least 8 characters."
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a moment and try again."
  if (m.includes("network") || m.includes("fetch"))
    return "Network error — please check your connection and try again."
  return message
}

function SignInForm() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [showForgotPasswordView, setShowForgotPasswordView] = useState(false)

  const handleResendConfirmation = async () => {
    setError(null)
    setInfoMessage(null)
    let emailToResend = email.trim()
    if (!emailToResend) {
      setError("Please enter your email or username to resend confirmation.")
      return
    }
    setLoading(true)
    try {
      if (!emailToResend.includes("@")) {
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", emailToResend.toLowerCase())
          .maybeSingle()

        if (profileErr || !profileData?.email) {
          setError("No user found with that username.")
          return
        }
        emailToResend = profileData.email
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailToResend,
        options: {
          emailRedirectTo: window.location.origin + "/auth/callback",
        }
      })
      if (resendError) throw resendError
      toast.success("Confirmation email resent. Check your inbox.")
      setInfoMessage("Confirmation email resent. Check your inbox.")
    } catch (err: any) {
      setError(friendlyAuthError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)
    setLoading(true)

    // Rate limit: 5 attempts per 15 minutes per IP
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

    const rateLimitKey = getLoginKey(ipAddress)
    const limitResult = await checkRateLimit(rateLimitKey, { max: 5, windowMs: 15 * 60 * 1000 })
    if (!limitResult.allowed) {
      const retryAfter = Math.ceil((limitResult.resetAt.getTime() - Date.now()) / 1000)
      console.warn("Rate limit exceeded:", { retryAfter })
      setError("Too many login attempts. Please wait a moment and try again.")
      setLoading(false)
      return
    }

    try {
      let targetEmail = email.trim()

      if (!targetEmail.includes("@")) {
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", targetEmail.toLowerCase())
          .maybeSingle()

        if (profileErr || !profileData?.email) {
          setError("No user found with that username.")
          setLoading(false)
          return
        }
        targetEmail = profileData.email
      }

      // ✅ Properly call Supabase Auth signInWithPassword
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      })

      if (authError) {
        const msg = authError.message.toLowerCase()
        if (msg.includes("confirm") || msg.includes("verified") || msg.includes("verification")) {
          setError("unconfirmed_email")
        } else {
          setError(friendlyAuthError(authError.message))
        }
        return
      }

      if (!authData.user) {
        setError("Login failed — no user session returned. Please try again.")
        return
      }

      // Check if email is confirmed!
      if (authData.user.email_confirmed_at === null) {
        await supabase.auth.signOut()
        setError("unconfirmed_email")
        return
      }

      // Fetch role from profiles table
      let role = "traveler"
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, role")
          .eq("id", authData.user.id)
          .maybeSingle()

        if (profile) {
          role = profile.role ?? "traveler"
          localStorage.setItem("user_role", role)
          localStorage.setItem("user_id", profile.id)
          identifyUser(profile.id, { email: profile.email, role })
        } else {
          // No profile exists yet! Redirect to onboarding to complete profile creation
          localStorage.setItem("user_id", authData.user.id)
          navigate("/onboarding")
          return
        }
      } catch {
        localStorage.setItem("user_role", "traveler")
        localStorage.setItem("user_id", authData.user.id)
      }

      // Redirect based on role
      if (role === "admin") navigate("/admin/dashboard")
      else if (role === "host") navigate("/host/dashboard")
      else navigate("/dashboard")

    } catch (err: any) {
      const msg = (err?.message ?? "").toLowerCase()
      if (msg.includes("confirm") || msg.includes("verified") || msg.includes("verification")) {
        setError("unconfirmed_email")
      } else {
        setError(friendlyAuthError(err?.message ?? "Something went wrong. Please try again."))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setInfoMessage(null)
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      })
      if (authError) {
        setError(friendlyAuthError(authError.message))
      }
    } catch (err: any) {
      setError(friendlyAuthError(err?.message ?? "Google authentication failed."))
    }
  }

  if (showForgotPasswordView) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          setInfoMessage(null)
          if (!email.trim()) {
            setError("Please enter your email address to reset password.")
            return
          }
          setResetLoading(true)
          try {
            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
              redirectTo: window.location.origin + "/reset-password",
            })
            if (resetErr) throw resetErr
            setInfoMessage("Check your inbox for the reset link.")
            toast.success("Password reset email sent!")
          } catch (err: any) {
            setError(friendlyAuthError(err?.message ?? "Failed to send reset link. Please try again."))
          } finally {
            setResetLoading(false)
          }
        }}
        className="space-y-4"
      >
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white">Reset Password</h3>
          <p className="text-xs text-muted-foreground">
            Enter your email and we'll send you a recovery link to set a new password.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive animate-in fade-in">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-[#2CB67D]/30 bg-[#2CB67D]/10 p-3 text-xs font-semibold text-[#2CB67D] animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reset-email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full rounded-full py-5 text-sm font-semibold" disabled={resetLoading}>
          {resetLoading ? <Spinner className="size-4 text-white animate-spin" /> : "Send Link"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setShowForgotPasswordView(false)
              setError(null)
              setInfoMessage(null)
            }}
            className="text-xs text-primary hover:text-primary/80 transition-colors underline cursor-pointer"
          >
            Back to Log In
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          {error === "unconfirmed_email" ? (
            <span>
              Please confirm your email before logging in.{" "}
              <button
                type="button"
                onClick={handleResendConfirmation}
                className="underline font-bold text-primary hover:text-primary/80 transition-colors ml-1 focus:outline-none cursor-pointer"
              >
                Resend confirmation?
              </button>
            </span>
          ) : (
            <span>{error}</span>
          )}
        </div>
      )}

      {infoMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-[#2CB67D]/30 bg-[#2CB67D]/10 p-3 text-xs font-semibold text-[#2CB67D] animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>{infoMessage}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signin-email">Email or Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-email"
            type="text"
            placeholder="Email or username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password">Password</Label>
          <button
            type="button"
            onClick={() => {
              setShowForgotPasswordView(true)
              setError(null)
              setInfoMessage(null)
            }}
            className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full rounded-full py-5 text-sm font-semibold" disabled={loading}>
        {loading ? (
          <Spinner className="size-4 text-white animate-spin" />
        ) : (
          "Log In"
        )}
      </Button>

      <div className="text-center mt-2">
        <button
          type="button"
          onClick={handleResendConfirmation}
          className="text-xs text-muted-foreground hover:text-[#7F5AF0] transition-colors underline focus:outline-none cursor-pointer"
        >
          Didn't receive the confirmation email? Resend
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        className="w-full rounded-full py-5 text-sm font-medium border-border/80 gap-2 flex items-center justify-center"
      >
        <GoogleIcon />
        Continue with Google
      </Button>
    </form>
  )
}

function SignUpForm() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const nameErr = validateName(name)
    if (nameErr) { setError(nameErr); return }
    const emailErr = validateEmail(email)
    if (emailErr) { setError(emailErr); return }
    const userErr = validateUsername(username)
    if (userErr) { setError(userErr); return }
    const passErr = validatePassword(password)
    if (passErr) { setError(passErr); return }
    const confirmErr = validateConfirmPassword(password, confirmPassword)
    if (confirmErr) { setError(confirmErr); return }

    setLoading(true)
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim().toLowerCase())
        .maybeSingle()

      if (checkError) throw checkError

      if (existingUser) {
        setError("This username is already taken.")
        return
      }

      // Pass credentials to onboarding flow via sessionStorage
      sessionStorage.setItem(
        "onboarding_data",
        JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          username: username.trim().toLowerCase(),
          password,
          subscribeNewsletter,
        })
      )
      navigate("/onboarding")
    } catch (err: any) {
      setError(err.message || "Failed to check username availability.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-name"
            type="text"
            placeholder="Your name"
            className="pl-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-username">Username</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">@</span>
          <Input
            id="signup-username"
            type="text"
            placeholder="username"
            className="pl-7 border-border/80 text-foreground placeholder:text-muted-foreground/50"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            required
            minLength={3}
            maxLength={20}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            className="pl-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Min 8 characters"
            className="pl-10 pr-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">Confirm password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            className="pl-10 pr-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 py-1">
        <input
          id="signup-newsletter"
          type="checkbox"
          checked={subscribeNewsletter}
          onChange={(e) => setSubscribeNewsletter(e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary size-4 accent-[#7F5AF0]"
        />
        <Label htmlFor="signup-newsletter" className="text-xs font-normal text-muted-foreground select-none cursor-pointer">
          I'd like to receive updates and news from Ausaguide
        </Label>
      </div>

      <Button type="submit" className="w-full rounded-full py-5 text-sm font-semibold gap-2" disabled={loading}>
        {loading ? (
          <Spinner className="size-4 text-white animate-spin" />
        ) : (
          <>
            Get Started
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By signing up, you agree to our{" "}
        <Link to="/terms" className="text-primary hover:text-primary/80 underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-primary hover:text-primary/80 underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const becomeHost = searchParams.get("become-host") === "true"
  const defaultTab = becomeHost ? "signup" : (searchParams.get("tab") === "signup" ? "signup" : "signin")

  useEffect(() => {
    if (becomeHost || searchParams.get("tab") === "signup") {
      if (becomeHost) {
        sessionStorage.setItem("become_host", "true")
      }
      navigate("/onboarding", { replace: true })
    }
  }, [becomeHost, searchParams, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-24">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img
               src="/logo-primary.png"
               alt="Ausaguide"
               width={160}
               height={32}
               className="h-10 w-auto block object-contain"
            />
          </Link>
          <p className="text-sm text-muted-foreground">
            Discover Kenya through local eyes
          </p>
          <div className="mt-2 text-xs font-semibold text-[#7F5AF0] px-2.5 py-1 rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/20 inline-block">
            Early access — testing in progress
          </div>
        </div>

        <Card className="border-border/60 shadow-[var(--shadow-3)]">
          <Tabs defaultValue={defaultTab}>
            <CardHeader className="pb-4">
              {becomeHost && (
                <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 p-4 text-center animate-in fade-in">
                  <p className="text-sm font-semibold text-primary">
                    Sign up to become a host and share your world with travelers.
                  </p>
                </div>
              )}
              <TabsList className="w-full">
                <TabsTrigger value="signin" className="flex-1">
                  Log In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="flex-1"
                  onClick={() => navigate("/onboarding")}
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="signin" className="mt-0">
                <SignInForm />
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <SignUpForm />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
