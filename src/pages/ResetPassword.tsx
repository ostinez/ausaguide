import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

function PasswordStrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const labels = ["", "Weak", "Fair", "Good", "Strong"]
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"]
  const widths = ["w-0", "w-1/4", "w-2/4", "w-3/4", "w-full"]

  if (!password) return null

  return (
    <div className="space-y-1 mt-1">
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colors[score]} ${widths[score]}`}
        />
      </div>
      <p className="text-[10px] text-right text-gray-400">{labels[score]}</p>
    </div>
  )
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Supabase sends the recovery token as URL hash fragments.
  // The JS client parses them and fires PASSWORD_RECOVERY via onAuthStateChange.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true)
      }
    })

    // Also handle case where session was already established
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Countdown redirect after success
  useEffect(() => {
    if (!success) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate("/auth", { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [success, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      toast.success("Password updated successfully!")
    } catch (err: any) {
      setError(err?.message ?? "Failed to update password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d12] px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#7F5AF0]/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#2CB67D]/15 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold tracking-widest text-[#7F5AF0] uppercase">AusaGuide</p>
          <h1 className="text-2xl font-extrabold text-white">Set a New Password</h1>
          <p className="text-sm text-gray-400">Choose a strong password for your account.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl space-y-5">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center animate-in fade-in zoom-in-95">
              <div className="rounded-full bg-green-500/15 p-4">
                <CheckCircle2 className="size-10 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Password Updated!</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Your password has been changed successfully.
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Redirecting to login in{" "}
                  <span className="text-white font-bold">{countdown}</span>s...
                </p>
              </div>
              <button
                onClick={() => navigate("/auth", { replace: true })}
                className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-sm font-bold shadow-lg hover:opacity-90 transition"
              >
                Go to Login Now
              </button>
            </div>
          ) : !ready ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center animate-in fade-in">
              <Loader2 className="size-8 text-[#7F5AF0] animate-spin" />
              <div>
                <h2 className="text-base font-bold text-white">Verifying reset link...</h2>
                <p className="text-xs text-gray-400 mt-1">
                  If this takes too long, your link may have expired.{" "}
                  <button
                    className="text-[#7F5AF0] underline underline-offset-2"
                    onClick={() => navigate("/auth")}
                  >
                    Request a new one.
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="flex justify-center mb-2">
                <div className="rounded-full bg-[#7F5AF0]/15 p-3">
                  <KeyRound className="size-7 text-[#7F5AF0]" />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7F5AF0]/50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                    tabIndex={-1}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <PasswordStrengthBar password={password} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7F5AF0]/50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="text-[10px] text-red-400 mt-1 animate-in fade-in">
                    Passwords do not match
                  </p>
                )}
                {confirm && password === confirm && (
                  <p className="text-[10px] text-green-400 mt-1 animate-in fade-in">
                    Passwords match
                  </p>
                )}
              </div>

              <button
                id="update-password-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-sm font-bold shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-500">
          Remember your password?{" "}
          <button
            onClick={() => navigate("/auth")}
            className="text-[#7F5AF0] font-semibold hover:underline underline-offset-2"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
