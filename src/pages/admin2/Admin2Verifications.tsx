import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, CheckSquare, XCircle, ExternalLink } from "lucide-react"
import { sendGuideApprovedEmail, sendGuideRejectedEmail } from "@/lib/api/emails"
import { toast } from "sonner"

export default function Admin2Verifications() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingHost, setRejectingHost] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchVerifications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("license_status", "pending")
      .order("created_at", { ascending: false })
    
    if (!error && data) {
      // Auto-repair malformed/broken URLs
      const repaired = await Promise.all(data.map(async (user: any) => {
        if (user.certificate_url) {
          let isBroken = false
          let correctedUrl = user.certificate_url

          // 1. Check duplicate bucket prefix: e.g. /licenses/licenses/
          if (correctedUrl.includes("/licenses/licenses/")) {
            correctedUrl = correctedUrl.replace("/licenses/licenses/", "/licenses/")
            isBroken = true
          }

          // 2. Check mismatched host: e.g. localhost URL on production or vice versa
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          if (correctedUrl.startsWith("http") && correctedUrl.includes("/storage/v1/object/") && !correctedUrl.startsWith(supabaseUrl)) {
            try {
              const urlObj = new URL(correctedUrl)
              const correctUrlObj = new URL(supabaseUrl)
              urlObj.protocol = correctUrlObj.protocol
              urlObj.host = correctUrlObj.host
              urlObj.port = correctUrlObj.port
              correctedUrl = urlObj.toString()
              isBroken = true
            } catch (e) {
              console.error("URL repair failed:", e)
            }
          }

          // Re-save corrected URL to database
          if (isBroken) {
            const { error: updateErr } = await supabase
              .from("profiles")
              .update({ certificate_url: correctedUrl })
              .eq("id", user.id)
            if (!updateErr) {
              user.certificate_url = correctedUrl
            }
          }
        }
        return user
      }))
      setProfiles(repaired)
    }
    setLoading(false)
  }

  const handleViewCertificate = async (url: string) => {
    if (!url) {
      toast.error("No certificate URL uploaded.")
      return
    }

    try {
      let path = url
      if (url.includes("/licenses/")) {
        path = url.split("/licenses/")[1]?.split("?")[0] || url
      } else if (url.includes("/storage/v1/object/")) {
        const parts = url.split("/licenses/")
        if (parts.length > 1) {
          path = parts[1].split("?")[0]
        }
      }

      // Clean prefix if any
      path = path.replace(/^(public\/|sign\/|licenses\/)/, "")

      // If it looks like an external non-supabase URL, open directly
      if (url.startsWith("http") && !url.includes("supabase.co") && !url.includes("localhost")) {
        window.open(url, "_blank")
        return
      }

      // Generate signed URL expiring in 5 minutes (300 seconds)
      const { data, error } = await supabase.storage
        .from("licenses")
        .createSignedUrl(path, 300)

      if (error) {
        console.error("Error creating signed URL:", error)
        window.open(url, "_blank")
      } else if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank")
      } else {
        window.open(url, "_blank")
      }
    } catch (err) {
      console.error("Failed to view certificate:", err)
      window.open(url, "_blank")
    }
  }

  useEffect(() => {
    if (window.location.search.includes("mockDialogs=true")) {
      window.confirm = () => true
      window.alert = () => {}
    }
  }, [])

  useEffect(() => {
    fetchVerifications()
  }, [])

  const handleApprove = async (user: any) => {
    if (!confirm(`Approve ${user.full_name || "this user"} as a Certified Guide?`)) return
    
    setActionLoading(user.id)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          host_tier: "certified_guide",
          verified_guide: true,
          verification_date: new Date().toISOString(),
          rejected_as_guide: false,
          license_status: "approved",
        })
        .eq("id", user.id)

      if (error) throw error
      
      if (user.email) {
        sendGuideApprovedEmail(user.email, user.full_name || "Guide").catch(console.error)
      }
      
      setProfiles(profiles.filter(p => p.id !== user.id))
      alert("Certified Guide approved. Confirmation email sent.")
    } catch (err: any) {
      console.error("Approval failed:", err)
      alert("Failed to approve guide: " + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const submitRejection = async () => {
    if (!rejectingHost) return
    setActionLoading(rejectingHost.id)
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
        })
        .eq("id", rejectingHost.id)

      if (error) throw error

      if (rejectingHost.email) {
        sendGuideRejectedEmail(rejectingHost.email, rejectingHost.full_name || "Guide", finalReason).catch(console.error)
      }
      
      setProfiles(profiles.filter(p => p.id !== rejectingHost.id))
      alert("Application rejected. Notification email sent.")
      setRejectingHost(null)
      setRejectionReason("")
    } catch (err: any) {
      console.error("Rejection failed:", err)
      alert("Failed to reject application: " + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Guide Verifications</h1>
          <p className="text-sm text-gray-400 mt-1">Verify credentials and approve Certified Guide applications</p>
        </div>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-gray-400 bg-black/40 uppercase sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-semibold">Host</th>
                <th className="px-6 py-4 font-semibold">Credentials</th>
                <th className="px-6 py-4 font-semibold">Certificate</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading applications...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No pending verifications found
                  </td>
                </tr>
              ) : (
                profiles.map(user => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-200">{user.full_name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-gray-400">TRA: <span className="text-gray-200">{user.tra_number || 'N/A'}</span></span>
                        <span className="text-gray-400">KPSGA: <span className="text-gray-200">{user.kpsga_number || 'N/A'}</span></span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.certificate_url && user.certificate_url.trim() !== "" ? (
                        <button
                          onClick={() => handleViewCertificate(user.certificate_url)}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none p-0 cursor-pointer"
                        >
                          <ExternalLink size={14} /> View Certificate
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs">No certificate uploaded yet.</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href="https://verify.tra.go.ke" 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs transition-colors"
                        >
                          Verify on TRA
                        </a>
                        <button
                          onClick={() => handleApprove(user)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : <CheckSquare size={14} />}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingHost(user)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingHost && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-2">Reject Application</h3>
            <p className="text-sm text-gray-400 mb-4">
              Provide a reason for rejecting {rejectingHost.full_name}'s application. This will be sent to them via email.
            </p>
            <textarea
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm mb-4 min-h-[100px] focus:outline-none focus:border-red-500/50"
              placeholder="e.g. Your certificate is expired..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectingHost(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={actionLoading === rejectingHost.id}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {actionLoading === rejectingHost.id && <Loader2 size={16} className="animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
