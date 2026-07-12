import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Bell, Lock, Tag, CheckCircle2, Settings, Shield, DollarSign, MapPin, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { generateBase32Secret, generateBackupCodes, verifyTOTP } from "@/lib/api/totp"
import { cn } from "@/lib/utils"
import { fetchProfileById, updateProfile, updateHostSettings, fetchHostSettings } from "@/lib/api/hosts"
import { Spinner } from "@/components/ui/spinner"
import { PlusSpinner } from "@/components/ui/PlusSpinner"
import { validatePhone } from "@/lib/validation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getHostInitials } from "@/lib/tour-utils"
import Dropzone from "@/components/ui/Dropzone"
import OtpInput from "@/components/ui/OtpInput"

const INTEREST_OPTIONS = [
  { value: "food", label: "🍜 Food & Drink" },
  { value: "nature", label: "🌿 Nature & Wildlife" },
  { value: "culture", label: "🏛️ Culture & History" },
  { value: "adventure", label: "🧗 Adventure" },
  { value: "photography", label: "📷 Photography" },
  { value: "wellness", label: "🧘 Wellness" },
]

export default function SettingsPage() {
  const role = localStorage.getItem("user_role") ?? "traveler"
  const userId = localStorage.getItem("user_id")
  const navigate = useNavigate()
  
  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "interests", label: "Preferences", icon: Tag },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "security", label: "Password & 2FA", icon: Shield },
  ]

  if (role === "host") {
    tabs.push(
      { id: "verification", label: "Identity Verification", icon: CheckCircle2 },
      { id: "payout", label: "Payout Settings", icon: DollarSign },
      { id: "tours", label: "Tour Management", icon: MapPin }
    )
  } else if (role === "admin") {
    tabs.push(
      { id: "verification", label: "Identity Verification", icon: CheckCircle2 }
    )
  }

  const [activeTab, setActiveTab] = useState("personal")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Personal Info
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [bio, setBio] = useState("")
  const [languages, setLanguages] = useState("")
  const [hostType, setHostType] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Social links
  const [tiktok, setTiktok] = useState("")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [reddit, setReddit] = useState("")

  // Interests (Preferences)
  const [interests, setInterests] = useState<string[]>(["food", "nature"])

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [inAppNotifs, setInAppNotifs] = useState(true)

  // Privacy
  const [publicProfile, setPublicProfile] = useState(true)

  // Verification
  const [isVerified, setIsVerified] = useState(false)
  const [verificationDocType, setVerificationDocType] = useState("national_id")
  const [verificationDocUrl, setVerificationDocUrl] = useState("")
  const [uploadingVerificationDoc, setUploadingVerificationDoc] = useState(false)

  // Payout Settings
  const [payoutMethod, setPayoutMethod] = useState("mpesa")
  const [payoutPhone, setPayoutPhone] = useState("")
  const [payoutBankName, setPayoutBankName] = useState("")
  const [payoutAccountNo, setPayoutAccountNo] = useState("")
  const [payoutAccountName, setPayoutAccountName] = useState("")

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([])
  const [tempSecret, setTempSecret] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [setupMode, setSetupMode] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  async function handleStartSetup2FA() {
    const sec = generateBase32Secret()
    setTempSecret(sec)
    setSetupMode(true)
    setOtpCode("")
    setVerifyLoading(false)
    setVerifySuccess(false)
    setVerifyError(null)
  }

  const handleResend2FA = () => {
    const sec = generateBase32Secret()
    setTempSecret(sec)
    setOtpCode("")
    setVerifyError(null)
    setVerifySuccess(false)
    toast.success("Secret key regenerated! Scan the new QR code.")
  }

  async function handleConfirm2FA(codeToVerify?: string) {
    const code = typeof codeToVerify === "string" ? codeToVerify : otpCode
    if (!code || code.length !== 6) {
      setVerifyError("Please enter a 6-digit verification code.")
      return
    }

    setVerifyLoading(true)
    setVerifyError(null)
    setVerifySuccess(false)

    // Premium delay to simulate verification check
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
      const isValid = await verifyTOTP(tempSecret, code)
      if (!isValid) {
        setVerifyError("Invalid verification code. Please try again.")
        setVerifyLoading(false)
        return
      }

      const backupCodes = generateBackupCodes()
      const { error } = await supabase
        .from("profiles")
        .update({
          two_factor_enabled: true,
          two_factor_secret: tempSecret,
          two_factor_backup_codes: backupCodes,
        })
        .eq("id", userId)

      if (error) throw error

      setVerifySuccess(true)
      setTwoFactorEnabled(true)
      setTwoFactorBackupCodes(backupCodes)
      
      setTimeout(() => {
        setShowBackupCodes(true)
        setSetupMode(false)
        toast.success("2FA enabled successfully!")
      }, 1500)
    } catch (err) {
      console.error(err)
      setVerifyError("Failed to enable 2FA.")
    } finally {
      setVerifyLoading(false)
    }
  }

  async function handleDisable2FA() {
    if (!confirm("Are you sure you want to disable 2FA? This decreases account security.")) return
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_backup_codes: [],
          updated_at: new Date().toISOString()
        })
        .eq("id", userId)

      if (error) throw error

      setTwoFactorEnabled(false)
      setTwoFactorBackupCodes([])
      setShowBackupCodes(false)
      toast.success("Two-factor authentication disabled.")
    } catch (err) {
      console.error(err)
      toast.error("Failed to disable 2FA.")
    }
  }

  useEffect(() => {
    async function loadProfile() {
      if (!userId) {
        setLoading(false)
        return
      }
      try {
        // Load profile and host settings in parallel
        const [p, hs] = await Promise.all([
          fetchProfileById(userId),
          fetchHostSettings(userId).catch(() => null), // non-fatal if user is not a host
        ])

        if (p) {
          setName(p.full_name || "")
          setEmail(p.email || "")
          setPhone(p.phone || "")
          setLocation(p.location || "")
          setBio(p.bio || "")
          setLanguages((p.languages || []).join(", "))
          setHostType(p.host_type || "")
          setTwoFactorEnabled(!!p.two_factor_enabled)
          setTwoFactorBackupCodes(p.two_factor_backup_codes ?? [])
          setAvatarUrl(p.avatar_url || null)
          setIsVerified(!!p.is_verified)
          setTiktok((p as any).tiktok || "")
          setInstagram((p as any).instagram || "")
          setFacebook((p as any).facebook || "")
          setReddit((p as any).reddit || "")
        }

        // Load traveler preferences from local storage
        const savedInterests = localStorage.getItem(`traveler_interests_${userId}`)
        if (savedInterests) {
          try {
            setInterests(JSON.parse(savedInterests))
          } catch (e) {
            console.error("Failed to parse interests:", e)
          }
        }

        // Load host payout settings from local storage
        const savedPayout = localStorage.getItem(`host_payout_${userId}`)
        if (savedPayout) {
          try {
            const parsed = JSON.parse(savedPayout)
            setPayoutMethod(parsed.method || "mpesa")
            setPayoutPhone(parsed.phone || "")
            setPayoutBankName(parsed.bankName || "")
            setPayoutAccountNo(parsed.accountNo || "")
            setPayoutAccountName(parsed.accountName || "")
          } catch (e) {
            console.error("Failed to parse payout settings:", e)
          }
        }

        // Populate notification toggles from saved host settings, or keep defaults
        if (hs) {
          const prefs = hs.notification_preferences ?? []
          setEmailNotifs(prefs.includes("email"))
          setInAppNotifs(prefs.includes("in_app"))
        }
      } catch (err) {
        console.error("Failed to load profile settings", err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [userId])

  const roleColors: Record<string, string> = {
    admin: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    host: "bg-teal/15 text-teal border-teal/30",
    traveler: "bg-primary/15 text-primary border-primary/30",
  }

  function toggleInterest(v: string) {
    setInterests((prev) =>
      prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v]
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    // Validate phone if provided (Kenyan format)
    if (phone.trim()) {
      const phoneErr = validatePhone(phone)
      if (phoneErr) {
        toast.error(phoneErr)
        return
      }
    }

    setSaved(true)
    try {
      await updateProfile(userId, {
        full_name: name.trim(),
        phone: phone.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
        host_type: hostType || null,
        avatar_url: avatarUrl || null,
        tiktok: tiktok.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        reddit: reddit.trim() || null,
      } as any)

      const notifs: string[] = []
      if (emailNotifs) notifs.push("email")
      if (inAppNotifs) notifs.push("in_app")
      
      const hostSettingsPayload = {
        reminder_time: 30,
        notification_preferences: notifs,
        is_busy: false,
      }

      await updateHostSettings(userId, hostSettingsPayload)


      // Save interests and payout details to localStorage
      localStorage.setItem(`traveler_interests_${userId}`, JSON.stringify(interests))
      if (role === "host") {
        localStorage.setItem(`host_payout_${userId}`, JSON.stringify({
          method: payoutMethod,
          phone: payoutPhone,
          bankName: payoutBankName,
          accountNo: payoutAccountNo,
          accountName: payoutAccountName,
        }))
      }

      const p = await fetchProfileById(userId)
      if (p) {
        setName(p.full_name || "")
        setEmail(p.email || "")
        setPhone(p.phone || "")
        setLocation(p.location || "")
        setBio(p.bio || "")
        setLanguages((p.languages || []).join(", "))
        setHostType(p.host_type || "")
        setAvatarUrl(p.avatar_url || null)
        setIsVerified(!!p.is_verified)
      }

      toast.success("Settings saved successfully!")
    } catch (err) {
      console.error("Error saving settings", err)
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        toast.error("Your session has expired. Please log in again.")
        navigate("/login")
        return
      }
      toast.error("Failed to update profile settings.")
    } finally {
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <PlusSpinner size={52} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <Settings className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Account Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
          </div>
          <div className="ml-auto">
            <span className={cn("rounded-full border px-3 py-1 text-xs font-bold capitalize", roleColors[role])}>
              {role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
          {/* Sidebar Tabs */}
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content Panel */}
          <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card/50 p-6">
            {activeTab === "personal" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-foreground">Personal Information</h2>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-border/40">
                  <div className="relative size-20 shrink-0">
                    <Avatar className="size-full border-2 border-primary/20">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                          {getHostInitials(name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-[1px]">
                        <Spinner className="size-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <Label>Profile Picture</Label>
                    <Dropzone
                      bucket="avatars"
                      multiple={false}
                      value={avatarUrl ? [avatarUrl] : []}
                      onChange={(urls) => setAvatarUrl(urls[0] || null)}
                      onUploadingChange={setUploadingAvatar}
                      aspectRatio="square"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-name">Full Name</Label>
                    <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-email">Email</Label>
                    <Input id="settings-email" type="email" value={email} disabled className="bg-muted text-muted-foreground border-border/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-phone">Phone</Label>
                    <Input id="settings-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-location">Location</Label>
                    <Input id="settings-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nairobi, Kenya" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-languages">Languages (comma-separated)</Label>
                    <Input id="settings-languages" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Swahili" />
                  </div>
                  {role === "host" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="settings-host-type">Host Type</Label>
                      <select
                        id="settings-host-type"
                        value={hostType}
                        onChange={(e) => setHostType(e.target.value)}
                        className="w-full rounded-md border border-border/85 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="local_host">Local Host</option>
                        <option value="certified_guide">Certified Guide</option>
                      </select>
                    </div>
                  )}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="settings-bio">Bio</Label>
                    <textarea
                      id="settings-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="sm:col-span-2 space-y-3">
                    <Label className="text-sm font-semibold">Social Links</Label>
                    <p className="text-xs text-muted-foreground -mt-1">Add your social profiles (TikTok, Instagram, Facebook, Reddit).</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: "settings-tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle", value: tiktok, set: setTiktok },
                        { id: "settings-instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle", value: instagram, set: setInstagram },
                        { id: "settings-facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage", value: facebook, set: setFacebook },
                        { id: "settings-reddit", label: "Reddit", placeholder: "https://reddit.com/u/yourhandle", value: reddit, set: setReddit },
                      ].map(({ id, label, placeholder, value, set }) => (
                        <div key={id} className="space-y-1">
                          <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
                          <Input
                            id={id}
                            type="url"
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            className="border-border/80 text-foreground placeholder:text-muted-foreground/50 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Account Role</Label>
                  <div className="flex items-center gap-3">
                    <Input value={role.toUpperCase()} disabled className="bg-muted text-muted-foreground border-border/40 font-semibold max-w-xs" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-primary/40 text-primary hover:bg-primary/5"
                      onClick={() => toast.success("Support ticket raised! Our team will contact you to review your role change request.")}
                    >
                      Request Role Change
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Once chosen, your role is locked to maintain platform integrity. Contact support if you need to switch roles.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "interests" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-foreground">Your Interests</h2>
                <p className="text-sm text-muted-foreground">Select the types of experiences you enjoy most.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {INTEREST_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleInterest(opt.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                        interests.includes(opt.value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-foreground">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { id: "email-notifs", label: "Email Notifications", desc: "Receive booking updates and offers by email", value: emailNotifs, set: setEmailNotifs },
                    { id: "inapp-notifs", label: "In-App Notifications", desc: "Get real-time alerts within the app", value: inAppNotifs, set: setInAppNotifs },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start justify-between rounded-xl border border-border/50 bg-card/30 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => item.set(!item.value)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                          item.value ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform duration-200",
                            item.value ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-foreground">Privacy Settings</h2>
                <div className="flex items-start justify-between rounded-xl border border-border/50 bg-card/30 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Public Profile</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {publicProfile
                        ? "Your profile is visible to other users and hosts."
                        : "Your profile is hidden. Only you can see it."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublicProfile(!publicProfile)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                      publicProfile ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform duration-200",
                        publicProfile ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <Shield className="size-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Security Settings</h2>
                    <p className="text-xs text-muted-foreground">Manage your two-factor authentication and account security.</p>
                  </div>
                </div>

                {/* 2FA Status */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Two-Factor Authentication (2FA)</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Secure your account using an authenticator app (Google Authenticator, Microsoft Authenticator, etc.)
                      </p>
                    </div>
                    <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                      {twoFactorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  {!twoFactorEnabled && !setupMode && (
                    <Button type="button" onClick={handleStartSetup2FA} className="text-xs">
                      Enable 2FA
                    </Button>
                  )}

                  {twoFactorEnabled && (
                    <Button type="button" variant="destructive" onClick={handleDisable2FA} className="text-xs">
                      Disable 2FA
                    </Button>
                  )}
                </div>

                {/* 2FA Setup Mode */}
                {setupMode && (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-5">
                    <h3 className="text-sm font-semibold text-foreground">Configure Authenticator App</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      1. Scan this QR code or manually enter the secret key in your authenticator app.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2 bg-card/40 rounded-lg p-4">
                      {/* QR Code */}
                      <div className="bg-white p-2.5 rounded-lg shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            `otpauth://totp/Ausaguide:${email}?secret=${tempSecret}&issuer=Ausaguide`
                          )}`}
                          alt="2FA QR Code"
                          className="size-[150px]"
                        />
                      </div>

                      {/* Secret Key text */}
                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Secret Key</p>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <code className="bg-background border border-border px-2.5 py-1 rounded text-xs select-all text-primary font-mono tracking-widest break-all">
                            {tempSecret}
                          </code>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Issuer: Ausaguide <br />
                          Account: {email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 border-t border-border/40 pt-4">
                      <Label htmlFor="verification-code" className="text-xs font-semibold text-foreground">
                        2. Verify Code
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Enter the 6-digit verification code generated by your app:
                      </p>
                      <OtpInput
                        value={otpCode}
                        onChange={setOtpCode}
                        onComplete={handleConfirm2FA}
                        onResend={handleResend2FA}
                        loading={verifyLoading}
                        success={verifySuccess}
                        error={verifyError}
                      />
                    </div>
                  </div>
                )}

                {/* Backup Codes Display */}
                {showBackupCodes && twoFactorBackupCodes.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                      <Shield className="size-4 text-amber-500" /> Save Your Backup Recovery Codes
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      If you lose your authenticator app device, you can use these backup codes to log in to your account.
                      Each backup code is single-use only. Save them in a secure place.
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-sm py-2">
                      {twoFactorBackupCodes.map((code, idx) => (
                        <code key={idx} className="bg-background border border-border px-3 py-1.5 rounded text-xs font-mono tracking-widest text-center select-all">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "verification" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <CheckCircle2 className="size-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Identity Verification</h2>
                    <p className="text-xs text-muted-foreground">Verify your identity to manage tours and receive payouts.</p>
                  </div>
                </div>

                {isVerified ? (
                  <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-6 flex flex-col items-center text-center space-y-3">
                    <div className="flex size-14 items-center justify-center rounded-full bg-teal-500/10">
                      <Check className="size-7 text-teal" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Identity Verified</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md">
                        Your government-issued ID has been successfully verified. Your account is in good standing and you are authorized to list experiences.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="verification-type">Document Type</Label>
                      <select
                        id="verification-type"
                        value={verificationDocType}
                        onChange={(e) => setVerificationDocType(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <option value="national_id">National ID</option>
                        <option value="passport">Passport</option>
                        <option value="drivers_license">Driver's License</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2">
                        <span>Upload government-issued document (Front & Back)</span>
                        {uploadingVerificationDoc && <Spinner className="size-3 text-primary animate-spin" />}
                      </Label>
                      <Dropzone
                        bucket="verification"
                        multiple={false}
                        value={verificationDocUrl ? [verificationDocUrl] : []}
                        onChange={(urls) => {
                          setVerificationDocUrl(urls[0] || "")
                          toast.success("Document uploaded successfully! Under review.")
                        }}
                        onUploadingChange={setUploadingVerificationDoc}
                        aspectRatio="video"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "payout" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <DollarSign className="size-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Payout Settings</h2>
                    <p className="text-xs text-muted-foreground">Configure how you receive your tour earnings.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="payout-method">Payout Method</Label>
                    <select
                      id="payout-method"
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      <option value="mpesa">M-Pesa (Mobile Money)</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>

                  {payoutMethod === "mpesa" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="payout-phone">M-Pesa Phone Number</Label>
                      <Input
                        id="payout-phone"
                        type="tel"
                        value={payoutPhone}
                        onChange={(e) => setPayoutPhone(e.target.value)}
                        placeholder="+254 700 000 000"
                        required
                      />
                      <p className="text-[10px] text-muted-foreground">Payments will be sent directly to this Safaricom registered line.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="payout-bank">Bank Name</Label>
                        <Input
                          id="payout-bank"
                          value={payoutBankName}
                          onChange={(e) => setPayoutBankName(e.target.value)}
                          placeholder="e.g. KCB Bank Kenya"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="payout-acc-no">Account Number</Label>
                        <Input
                          id="payout-acc-no"
                          value={payoutAccountNo}
                          onChange={(e) => setPayoutAccountNo(e.target.value)}
                          placeholder="Bank account number"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="payout-acc-name">Account Holder Name</Label>
                        <Input
                          id="payout-acc-name"
                          value={payoutAccountName}
                          onChange={(e) => setPayoutAccountName(e.target.value)}
                          placeholder="Full name on bank record"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tours" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <MapPin className="size-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Tour Management</h2>
                    <p className="text-xs text-muted-foreground">Quick access links to manage your listed tour experiences.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">My Tour Listings</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        View and update your active tours, review pricing plans, and toggle visibility states.
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => navigate("/dashboard?tab=tours")} 
                      className="text-xs w-full flex items-center justify-center gap-1.5"
                    >
                      <span>Manage Listings</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Create New Experience</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        List a new local tour, street food crawl, or cultural safari in Nairobi.
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => navigate("/host/tours/new")} 
                      className="text-xs w-full flex items-center justify-center gap-1.5 bg-[#2CB67D] hover:bg-[#2CB67D]/95 text-white"
                    >
                      <span>Add New Tour</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== "security" && activeTab !== "tours" && (
              <div className="mt-8 flex items-center gap-3">
                <Button type="submit" className="rounded-full">Save Changes</Button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-teal">
                    <CheckCircle2 className="size-4" />
                    Changes saved!
                  </span>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
