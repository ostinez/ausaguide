import { useState } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { Globe, Mail, Lock, User, Eye, EyeOff, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { supabase } from "@/lib/supabase"
import { fetchProfileByRole } from "@/lib/api/hosts"
import { identifyUser } from "@/lib/posthog"
import { checkRateLimit, getLoginKey } from "@/lib/api/rate-limit"
import { validateName, validateEmail, validatePassword } from "@/lib/validation"
import { verifyTOTP } from "@/lib/api/totp"
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

function SignInForm() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loginMode, setLoginMode] = useState<"normal" | "admin" | "host">("normal")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [adminCode, setAdminCode] = useState("")
  const [hostCode, setHostCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 2FA login verify state
  const [show2FAVerify, setShow2FAVerify] = useState(false)
  const [totpCode, setTotpCode] = useState("")
  const [tempAdminProfile, setTempAdminProfile] = useState<any>(null)

  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault()
    if (!totpCode) {
      setError("Please enter your verification code.")
      return
    }
    setError("")
    setLoading(true)

    try {
      const secret = tempAdminProfile.two_factor_secret
      const backupCodes = tempAdminProfile.two_factor_backup_codes ?? []

      // 1. Check if standard TOTP code matches
      let isValid = await verifyTOTP(secret, totpCode)
      let isBackupUsed = false
      let updatedBackupCodes = [...backupCodes]

      // 2. Check if it's a backup code
      if (!isValid) {
        const matchingIdx = backupCodes.indexOf(totpCode.trim().toLowerCase())
        if (matchingIdx !== -1) {
          isValid = true
          isBackupUsed = true
          updatedBackupCodes.splice(matchingIdx, 1) // Consume it
        }
      }

      if (!isValid) {
        setError("Invalid verification code. Please try again.")
        setLoading(false)
        return
      }

      // Consumed backup code update
      if (isBackupUsed) {
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({
            two_factor_backup_codes: updatedBackupCodes,
            updated_at: new Date().toISOString()
          })
          .eq("id", tempAdminProfile.id)

        if (updateErr) throw updateErr
      }

      // Complete login
      localStorage.setItem("user_role", "admin")
      localStorage.setItem("user_id", tempAdminProfile.id)
      identifyUser(tempAdminProfile.id, { email: "ostinez48@gmail.com", role: "admin" })
      navigate("/admin")
    } catch (err) {
      console.error(err)
      setError("Failed to verify 2FA code.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Rate Limit: 5 attempts per 15 minutes per IP
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
      console.warn("Rate limit exceeded:", {
        error: "Too many requests. Please wait a moment.",
        retryAfter
      })
      setError("Too many requests. Please wait a moment.")
      setLoading(false)
      return
    }

    if (loginMode === "admin") {
      if (email.trim().toLowerCase() === "ostinez48@gmail.com" && adminCode.trim() === "1178") {
        try {
          const adminProfile = await fetchProfileByRole("admin")
          if (adminProfile && (adminProfile as any).two_factor_enabled) {
            setTempAdminProfile(adminProfile)
            setShow2FAVerify(true)
            setLoading(false)
            return
          }

          localStorage.setItem("user_role", "admin")
          if (adminProfile) {
            localStorage.setItem("user_id", adminProfile.id)
            identifyUser(adminProfile.id, { email: "ostinez48@gmail.com", role: "admin" })
          }
          navigate("/admin")
        } catch (err) {
          setError("Failed to verify admin profile details.")
        } finally {
          setLoading(false)
        }
      } else {
        setError("Invalid admin credentials")
        setLoading(false)
      }
    } else if (loginMode === "host") {
      const emailLower = email.trim().toLowerCase();
      if ((emailLower === "austin@ausaguide.com" || emailLower === "amina@ausaguide.com") && hostCode.trim() === "2026") {
        try {
          localStorage.setItem("user_role", "host")
          const { data } = await supabase.from("profiles").select("id, email, role").eq("email", emailLower).maybeSingle()
          if (data) {
            localStorage.setItem("user_id", data.id)
            identifyUser(data.id, { email: data.email, role: data.role })
          }
          navigate("/dashboard")
        } catch (err) {
          setError("Failed to fetch host details")
        } finally {
          setLoading(false)
        }
      } else {
        setError("Invalid host credentials")
        setLoading(false)
      }
    } else {
      // Normal Login Simulation
      if (email.trim().toLowerCase() === "traveler@ausaguide.com" && password !== "1234") {
        setError("Invalid traveler credentials");
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, email, role")
          .eq("email", email.trim())
          .maybeSingle()

        if (data) {
          localStorage.setItem("user_role", data.role)
          localStorage.setItem("user_id", data.id)
          identifyUser(data.id, { email: data.email, role: data.role })
        } else {
          localStorage.setItem("user_role", "traveler")
        }
        navigate("/dashboard")
      } catch (err) {
        localStorage.setItem("user_role", "traveler")
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }
  }

  if (show2FAVerify) {
    return (
      <form onSubmit={handleVerify2FA} className="space-y-4">
        <div className="space-y-2 text-center pb-2">
          <Shield className="size-8 text-primary mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Two-Factor Authentication</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter the 6-digit code from your authenticator app, or a backup recovery code.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="totp-code">Verification Code</Label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="totp-code"
              type="text"
              placeholder="000000 or xxxx-xxxx"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="pl-10 border-border/80 text-foreground font-mono text-center tracking-widest text-sm animate-none"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Log In"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-full text-xs text-muted-foreground"
            onClick={() => {
              setShow2FAVerify(false)
              setTotpCode("")
              setError("")
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive animate-in fade-in">
          {error}
        </div>
      )}

      {/* Quick Login Shortcuts */}
      {loginMode === "host" && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Quick Host Login Shortcuts</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-medium"
              onClick={() => {
                setEmail("austin@ausaguide.com")
                setHostCode("2026")
              }}
            >
              Austin (Certified)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-medium"
              onClick={() => {
                setEmail("amina@ausaguide.com")
                setHostCode("2026")
              }}
            >
              Amina (Local Host)
            </Button>
          </div>
        </div>
      )}

      {loginMode === "admin" && (
        <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Quick Admin Login Shortcut</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-full text-xs font-medium"
            onClick={() => {
              setEmail("ostinez48@gmail.com")
              setAdminCode("1178")
            }}
          >
            Super Admin (ostinez48@gmail.com)
          </Button>
        </div>
      )}

      {loginMode === "normal" && (
        <div className="rounded-xl border border-muted/30 bg-muted/20 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Traveler Login Shortcut</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-full text-xs font-medium"
            onClick={() => {
              setEmail("traveler@ausaguide.com")
              setPassword("1234")
            }}
          >
            Test Traveler (traveler@ausaguide.com)
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
            required
          />
        </div>
      </div>

      {loginMode === "admin" ? (
        <div className="space-y-2">
          <Label htmlFor="signin-code">Admin Code</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signin-code"
              type="password"
              placeholder="Enter 4-digit code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="pl-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
              required
            />
          </div>
        </div>
      ) : loginMode === "host" ? (
        <div className="space-y-2">
          <Label htmlFor="signin-host-code">Host Code</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signin-host-code"
              type="password"
              placeholder="Enter host code"
              value={hostCode}
              onChange={(e) => setHostCode(e.target.value)}
              className="pl-10 border-border/80 text-foreground placeholder:text-muted-foreground/50"
              required
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password">Password</Label>
            <button
              type="button"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
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
              required={loginMode === "normal"}
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
      )}

      <Button type="submit" className="w-full rounded-full py-5 text-sm font-semibold" disabled={loading}>
        {loading ? (
          <Spinner className="size-4 text-white animate-spin" />
        ) : loginMode === "admin" ? (
          "Log In as Admin"
        ) : loginMode === "host" ? (
          "Log In as Host"
        ) : (
          "Log In"
        )}
      </Button>

      {loginMode === "normal" && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full py-5 text-sm font-medium border-border/80"
          >
            <GoogleIcon />
            Google
          </Button>
        </>
      )}

      <div className="flex justify-center gap-4 pt-2">
        {loginMode !== "admin" && (
          <button
            type="button"
            onClick={() => {
              setLoginMode("admin")
              setError(null)
            }}
            className="text-xs font-semibold text-teal hover:underline hover:text-teal/80 transition-colors"
          >
            Switch to Admin Login →
          </button>
        )}
        {loginMode !== "host" && (
          <button
            type="button"
            onClick={() => {
              setLoginMode("host")
              setError(null)
            }}
            className="text-xs font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            Switch to Host Login →
          </button>
        )}
        {loginMode !== "normal" && (
          <button
            type="button"
            onClick={() => {
              setLoginMode("normal")
              setError(null)
            }}
            className="text-xs font-semibold text-muted-foreground hover:underline hover:text-foreground transition-colors"
          >
            ← Back to Traveller Login
          </button>
        )}
      </div>
    </form>
  )
}

function SignUpForm() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const nameErr = validateName(name)
    if (nameErr) { setError(nameErr); return }
    const emailErr = validateEmail(email)
    if (emailErr) { setError(emailErr); return }
    const passErr = validatePassword(password)
    if (passErr) { setError(passErr); return }

    // Pass credentials to onboarding flow via sessionStorage
    sessionStorage.setItem(
      "onboarding_data",
      JSON.stringify({ name: name.trim(), email: email.trim(), password })
    )
    navigate("/onboarding")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive animate-in fade-in">
          {error}
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
            required
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
            placeholder="Create a password"
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

      <Button type="submit" className="w-full rounded-full py-5 text-sm font-semibold">
        Get Started →
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
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin"

  // If someone lands on /auth?tab=signup, send them straight to onboarding
  if (searchParams.get("tab") === "signup") {
    navigate("/onboarding", { replace: true })
    return null
  }

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
            <Globe className="size-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Ausaguide
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Discover Kenya through local eyes
          </p>
        </div>

        <Card className="border-border/60 shadow-[var(--shadow-3)]">
          <Tabs defaultValue={defaultTab}>
            <CardHeader className="pb-4">
              <TabsList className="w-full">
                <TabsTrigger value="signin" className="flex-1">
                  Log In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">
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
