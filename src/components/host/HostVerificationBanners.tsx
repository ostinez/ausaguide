import { useState, useRef } from "react"
import { BadgeCheck, Clock, AlertTriangle, FileCheck, RefreshCw, Upload, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

interface HostVerificationBannersProps {
  profile: Profile | null
  onRefresh: () => void
}

export function HostVerificationBanners({ profile, onRefresh }: HostVerificationBannersProps) {
  const [showModal, setShowModal] = useState(false)
  const [traNumber, setTraNumber] = useState(profile?.tra_number || "")
  const [expiryDate, setExpiryDate] = useState(profile?.license_expiry ? profile.license_expiry.split("T")[0] : "")
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Status computation
  const isVerified = Boolean(profile?.verified_guide) || profile?.license_status === "approved"
  const isRejected = profile?.license_status === "rejected" || Boolean(profile?.rejected_as_guide)
  const isPending = !isVerified && !isRejected && (
    profile?.license_status === "pending" ||
    Boolean(profile?.tra_number)
  )

  // Expiry check
  let isExpiringSoon = false
  let daysRemaining: number | null = null
  if (profile?.license_expiry) {
    const expiry = new Date(profile.license_expiry)
    if (!isNaN(expiry.getTime())) {
      const now = new Date()
      const diffMs = expiry.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      if (daysRemaining <= 30) {
        isExpiringSoon = true
      }
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return
    if (!traNumber.trim()) {
      toast.error("Please provide your TRA license number.")
      return
    }

    setSaving(true)
    try {
      let certificateUrl = profile.certificate_url

      // Upload file if selected
      if (licenseFile) {
        const ext = licenseFile.name.split(".").pop() || "pdf"
        const filePath = `${profile.id}/cert-renew-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from("licenses").upload(filePath, licenseFile)
        if (upErr) throw upErr

        const { data: { publicUrl } } = supabase.storage.from("licenses").getPublicUrl(filePath)
        certificateUrl = publicUrl
      }

      const updateData: any = {
        tra_number: traNumber.trim(),
        license_status: "pending",
        verified_guide: false,
        rejected_as_guide: false,
        host_tier: "local_host",
        updated_at: new Date().toISOString(),
      }
      if (expiryDate) {
        updateData.license_expiry = expiryDate
      }
      if (certificateUrl) {
        updateData.certificate_url = certificateUrl
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id)

      if (updateErr) throw updateErr

      toast.success("License updated successfully! Submitted for verification.")
      setShowModal(false)
      onRefresh()
    } catch (err: any) {
      console.error("Update license error:", err)
      toast.error(err.message || "Failed to update license details.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── 1. License Expiry Warning Banner (<= 30 Days) ── */}
      {isExpiringSoon && (
        <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/15 p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-amber-500/10 animate-in fade-in">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="size-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="size-5 text-amber-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base text-amber-300">
                Your license expires soon. Please update it.
              </h4>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                {daysRemaining !== null && daysRemaining > 0
                  ? `Your license expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Please update your license credentials to avoid any interruption to your Verified Guide status.`
                  : `Your license has expired. Please update it to maintain your Verified Guide status and premium features.`}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setTraNumber(profile?.tra_number || "")
              setExpiryDate(profile?.license_expiry ? profile.license_expiry.split("T")[0] : "")
              setShowModal(true)
            }}
            className="rounded-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs px-5 h-9 shrink-0 gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <FileCheck className="size-4" />
            Update License
          </Button>
        </div>
      )}

      {/* ── 2. Prominent Verification Status Banner ── */}
      {isVerified && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-4 shadow-sm animate-in fade-in">
          <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <BadgeCheck className="size-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base text-emerald-300">Verification Status: Verified</h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Certified Guide
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your guide credentials have been verified by Ausaguide. Your profile and tours feature the official blue Verified Guide badge, boosting traveler trust and bookings.
            </p>
            {profile?.tra_number && (
              <p className="text-xs font-mono text-emerald-400/90 mt-2">
                TRA Number: <span className="font-bold">{profile.tra_number}</span>
                {profile?.license_expiry && ` • Expiry: ${new Date(profile.license_expiry).toLocaleDateString()}`}
              </p>
            )}
          </div>
        </div>
      )}

      {isPending && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 flex items-start gap-4 shadow-sm animate-in fade-in">
          <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="size-6 text-amber-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base text-amber-300">Verification Status: Pending</h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Under Review
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your Certified Guide application is currently under review by our admin team. You can continue creating, managing, and hosting tours as a Local Host in the meantime.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                className="h-8 rounded-lg border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 flex items-start gap-4 shadow-sm animate-in fade-in">
          <div className="size-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-6 text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base text-rose-300">Verification Status: Rejected</h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Action Required
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your application for Certified Guide status was not approved. You can continue hosting as a Local Host, or update your documentation to re-apply.
            </p>
            {profile?.verification_notes && (
              <div className="mt-2 text-xs border-l-2 border-rose-500/50 pl-3 py-1 bg-rose-500/5 rounded-r text-rose-200">
                <strong>Reason from Admin:</strong> "{profile.verification_notes}"
              </div>
            )}
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => {
                  setTraNumber(profile?.tra_number || "")
                  setExpiryDate(profile?.license_expiry ? profile.license_expiry.split("T")[0] : "")
                  setShowModal(true)
                }}
                className="h-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs gap-1.5 cursor-pointer"
              >
                <FileCheck className="size-3.5" />
                Update License & Re-apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isVerified && !isPending && !isRejected && (
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 flex items-start gap-4 shadow-sm animate-in fade-in">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BadgeCheck className="size-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base text-foreground">Local Host Status</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              You are currently registered as a Local Host. If you hold an official Tourism Regulatory Authority (TRA) license, apply to unlock the Certified Guide badge and higher earnings.
            </p>
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => {
                  setTraNumber(profile?.tra_number || "")
                  setShowModal(true)
                }}
                className="h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 cursor-pointer"
              >
                Apply for Guide Verification
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Update License Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-[#111] p-6 shadow-2xl text-foreground space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileCheck className="size-5 text-primary" />
                <h3 className="font-bold text-base">Update Guide License</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="update-tra-number" className="text-xs font-semibold">
                  TRA License Number (required)
                </Label>
                <Input
                  id="update-tra-number"
                  type="text"
                  placeholder="e.g. TRA/TTA/2026/0491"
                  value={traNumber}
                  onChange={(e) => setTraNumber(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="update-license-expiry" className="text-xs font-semibold">
                  License Expiry Date (required)
                </Label>
                <Input
                  id="update-license-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-10 text-xs rounded-xl scheme-dark"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Upload License Document (PDF or image)
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setLicenseFile(e.target.files[0])
                    e.target.value = ""
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-primary/40 hover:border-primary text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="size-4 text-primary" />
                  <span className="truncate">
                    {licenseFile ? licenseFile.name : "Choose certificate file to upload"}
                  </span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
