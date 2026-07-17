import { useEffect, useState } from "react"
import { BadgeCheck, Search, Loader2, AlertCircle, FileText, Check, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { sendGuideApprovedEmail, sendGuideRejectedEmail } from "@/lib/api/emails"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  tra_number: string | null
  kpsga_number: string | null
  certificate_url: string | null
  license_status: "pending" | "approved" | "rejected" | null
  verification_notes: string | null
  created_at: string
}

export default function AdminVerifications() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  // Note changes tracker
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

  // Rejection modal state
  const [rejectingHost, setRejectingHost] = useState<Profile | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectLoading, setRejectLoading] = useState(false)

  const loadVerificationsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, tra_number, kpsga_number, certificate_url, license_status, verification_notes, created_at")
        .eq("license_status", "pending")
        .order("created_at", { ascending: false })

      if (fetchErr) throw fetchErr
      setProfiles(data || [])
      
      // Initialize notes state
      const initialNotes: Record<string, string> = {}
      ;(data || []).forEach((p) => {
        initialNotes[p.id] = p.verification_notes || ""
      })
      setNotes(initialNotes)
    } catch (err: any) {
      console.error("Failed to load verifications:", err)
      setError("Failed to fetch pending verifications. Check policy controls.")
    } finally {
      setLoading(false)
    }
  }

  const logAdminAction = async (action: string, targetId: string, details: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from("audit_logs").insert({
        admin_id: user?.id || null,
        action,
        target_type: "profile",
        target_id: targetId,
        details,
        ip_address: "127.0.0.1",
      })
    } catch (err) {
      console.error("Failed to log admin action:", err)
    }
  }

  const handleViewLicense = async (url: string) => {
    if (!url) return
    try {
      let path = url
      if (url.includes("/object/public/licenses/")) {
        path = url.split("/object/public/licenses/")[1]
      } else if (url.includes("/object/sign/licenses/")) {
        path = url.split("/object/sign/licenses/")[1]?.split("?")[0]
      }

      const { data, error } = await supabase.storage.from("licenses").createSignedUrl(path, 3600)
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank")
      }
    } catch (err: any) {
      window.open(url, "_blank")
    }
  }

  const handleSaveNote = async (userId: string) => {
    setSavingNoteId(userId)
    const note = notes[userId] || ""
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_notes: note } as any)
        .eq("id", userId)

      if (error) throw error
      alert("Verification note saved.")
    } catch (err: any) {
      console.error("Note save failed:", err)
      alert("Failed to save note: " + err.message)
    } finally {
      setSavingNoteId(null)
    }
  }

  const handleApprove = async (user: Profile) => {
    if (!confirm(`Approve ${user.full_name || "this user"} as a Certified Guide?`)) return
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          host_tier: "certified_guide",
          verified_guide: true,
          verification_date: new Date().toISOString(),
          rejected_as_guide: false,
          license_status: "approved",
        } as any)
        .eq("id", user.id)

      if (error) throw error
      
      if (user.email) {
        sendGuideApprovedEmail(user.email, user.full_name || "Guide").catch(console.error)
      }
      await logAdminAction("Approve Guide", user.id, { email: user.email, name: user.full_name })
      alert("Certified Guide approved. Confirmation email sent.")
      loadVerificationsData()
    } catch (err: any) {
      console.error("Approval failed:", err)
      alert("Failed to approve guide: " + err.message)
    }
  }

  const handleRejectClick = (user: Profile) => {
    setRejectingHost(user)
    setRejectionReason("")
  }

  const submitRejection = async () => {
    if (!rejectingHost) return
    setRejectLoading(true)
    const finalReason = rejectionReason.trim() || "Your Certified Guide application was not approved. You can continue as a Local Host."
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          host_tier: "local_host",
          rejected_as_guide: true,
          verified_guide: false,
          license_status: "rejected",
          verification_notes: finalReason,
        } as any)
        .eq("id", rejectingHost.id)

      if (error) throw error

      if (rejectingHost.email) {
        sendGuideRejectedEmail(rejectingHost.email, rejectingHost.full_name || "Guide", finalReason).catch(console.error)
      }
      await logAdminAction("Reject Guide", rejectingHost.id, {
        email: rejectingHost.email,
        name: rejectingHost.full_name,
        reason: finalReason
      })
      alert("Application rejected. Notification email sent.")
      setRejectingHost(null)
      loadVerificationsData()
    } catch (err: any) {
      console.error("Rejection failed:", err)
      alert("Failed to reject application: " + err.message)
    } finally {
      setRejectLoading(false)
    }
  }

  useEffect(() => {
    loadVerificationsData()
  }, [])

  const filteredProfiles = profiles.filter((p) =>
    (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <BadgeCheck className="size-8 text-purple-400" />
          Guide Verifications
        </h1>
        <p className="text-xs text-white/40 font-medium">Verify credentials and approve Certified Guide applications</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <Input 
            placeholder="Search by host name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-white/5 bg-[#0D0D11]/60 focus:border-purple-500/30 text-white rounded-xl placeholder-white/30 text-xs h-10" 
          />
        </div>
        <div className="flex-1" />
        <Button 
          onClick={loadVerificationsData} 
          disabled={loading}
          size="sm" 
          variant="outline" 
          className="rounded-full border-white/10 hover:bg-white/5 hover:text-white transition-all text-xs h-9 px-4 shrink-0"
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-2 animate-spin text-purple-400" />
          ) : (
            "Reload Applications"
          )}
        </Button>
      </div>

      {loading && profiles.length === 0 ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="border border-white/5 rounded-2xl bg-[#0D0D11]/40 overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/40 font-semibold tracking-wider uppercase">
                  <th className="px-6 py-3.5">Host Details</th>
                  <th className="px-6 py-3.5">TRA / KPSGA Licenses</th>
                  <th className="px-6 py-3.5">Certificate File</th>
                  <th className="px-6 py-3.5">Verification Notes</th>
                  <th className="px-6 py-3.5 text-right">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredProfiles.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-white">{user.full_name || "Anonymous Host"}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4.5 font-mono text-white/70">
                      <div>TRA: {user.tra_number || "Unlisted"}</div>
                      <div className="mt-0.5">KPSGA: {user.kpsga_number || "Unlisted"}</div>
                    </td>
                    <td className="px-6 py-4.5">
                      {user.certificate_url ? (
                        <Button
                          variant="link"
                          onClick={() => handleViewLicense(user.certificate_url!)}
                          className="text-[#7F5AF0] hover:text-[#7F5AF0]/80 font-bold p-0 text-xs h-auto flex items-center gap-1"
                        >
                          <FileText className="size-4" />
                          View Certificate
                        </Button>
                      ) : (
                        <span className="text-white/30 text-xs">No File Uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 min-w-[200px]">
                      <div className="flex items-center gap-2 max-w-xs">
                        <Input
                          value={notes[user.id] || ""}
                          onChange={(e) => setNotes({ ...notes, [user.id]: e.target.value })}
                          placeholder="Verification remarks..."
                          className="h-8 border-white/5 bg-[#0D0D11]/60 focus:border-purple-500/30 text-white rounded-lg placeholder-white/20 text-xs"
                        />
                        <Button
                          onClick={() => handleSaveNote(user.id)}
                          disabled={savingNoteId === user.id}
                          className="h-8 bg-purple-500 hover:bg-purple-600 px-3 text-[10px] rounded-lg shrink-0"
                        >
                          {savingNoteId === user.id ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleApprove(user)}
                          className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1 text-[11px]"
                        >
                          <Check className="size-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectClick(user)}
                          className="h-8 font-bold px-3 py-1 rounded-lg flex items-center gap-1 text-[11px]"
                        >
                          <X className="size-3.5" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-white/30">
                      No pending guide applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md border border-white/10 bg-[#0D0D11]/90 rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Reject Certified Guide Application</h3>
              <p className="text-xs text-white/40 mt-1">
                Provide a rejection reason for <span className="font-semibold text-white/80">{rejectingHost.full_name}</span>. This message will be emailed to the host.
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Reason for rejection (optional)</label>
              <Textarea
                placeholder="e.g. TRA number not found, certificate expired..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="border-white/5 bg-white/5 focus:border-red-500/30 text-white rounded-xl placeholder-white/20 text-xs min-h-[100px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setRejectingHost(null)}
                className="rounded-xl border-white/10 text-xs h-9 px-4 hover:bg-white/5 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRejection}
                disabled={rejectLoading}
                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs h-9 px-4"
              >
                {rejectLoading ? "Sending..." : "Send Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
