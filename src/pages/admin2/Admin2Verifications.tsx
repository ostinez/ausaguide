import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, CheckSquare, XCircle, ExternalLink, History, AlertTriangle } from "lucide-react"
import { sendGuideApprovedEmail, sendGuideRejectedEmail, sendGuideRevokedEmail } from "@/lib/api/emails"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function Admin2Verifications() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingHost, setRejectingHost] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending')
  const [revokingHost, setRevokingHost] = useState<any>(null)
  const [revokeReason, setRevokeReason] = useState("")
  const [selectedHostHistory, setSelectedHostHistory] = useState<any>(null)
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchVerifications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "host")
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

  const fetchHistory = async (hostId: string) => {
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from("verification_history")
        .select(`
          id,
          action,
          notes,
          created_at,
          admin_id
        `)
        .eq("host_id", hostId)
        .order("created_at", { ascending: false })
      
      if (!error && data) {
        // Resolve admin names locally or keep them simple
        const withAdminInfo = await Promise.all(data.map(async (log: any) => {
          if (log.admin_id) {
            const { data: adminProf } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", log.admin_id)
              .maybeSingle()
            if (adminProf) {
              log.admin = adminProf
            }
          }
          return log
        }))
        setHistoryLogs(withAdminInfo)
      } else {
        setHistoryLogs([])
      }
    } catch (e) {
      console.error("Failed to fetch history logs:", e)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleViewHistoryClick = (user: any) => {
    setSelectedHostHistory(user)
    fetchHistory(user.id)
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

      const { data: { user: adminUser } } = await supabase.auth.getUser()

      // Log entry
      await supabase.from("verification_history").insert({
        host_id: user.id,
        admin_id: adminUser?.id || null,
        action: "approved",
        notes: "Approved Certified Guide license credentials."
      })
      
      if (user.email) {
        sendGuideApprovedEmail(user.email, user.full_name || "Guide").catch(console.error)
      }
      
      toast.success("Certified Guide approved. Confirmation email sent.")
      fetchVerifications()
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

      const { data: { user: adminUser } } = await supabase.auth.getUser()

      // Log entry
      await supabase.from("verification_history").insert({
        host_id: rejectingHost.id,
        admin_id: adminUser?.id || null,
        action: "rejected",
        notes: finalReason
      })

      if (rejectingHost.email) {
        sendGuideRejectedEmail(rejectingHost.email, rejectingHost.full_name || "Guide", finalReason).catch(console.error)
      }
      
      toast.success("Application rejected. Notification email sent.")
      setRejectingHost(null)
      setRejectionReason("")
      fetchVerifications()
    } catch (err: any) {
      console.error("Rejection failed:", err)
      alert("Failed to reject application: " + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const submitRevoke = async () => {
    if (!revokingHost) return
    setActionLoading(revokingHost.id)
    const finalReason = revokeReason.trim() || "Your Certified Guide status has been revoked by our admin team."
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          host_tier: "local_host",
          verified_guide: false,
          license_status: "rejected",
          verification_notes: finalReason,
        })
        .eq("id", revokingHost.id)

      if (error) throw error

      const { data: { user: adminUser } } = await supabase.auth.getUser()

      // Log entry
      await supabase.from("verification_history").insert({
        host_id: revokingHost.id,
        admin_id: adminUser?.id || null,
        action: "revoked",
        notes: finalReason
      })

      if (revokingHost.email) {
        sendGuideRevokedEmail(revokingHost.email, revokingHost.full_name || "Guide", finalReason).catch(console.error)
      }

      toast.success("Certified Guide status revoked. Notification email sent.")
      setRevokingHost(null)
      setRevokeReason("")
      fetchVerifications()
    } catch (err: any) {
      console.error("Revocation failed:", err)
      alert("Failed to revoke status: " + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredProfiles = profiles.filter(p => {
    if (activeTab === 'pending') return p.license_status === 'pending'
    if (activeTab === 'approved') return p.verified_guide === true && p.host_tier === 'certified_guide'
    return true
  })

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Guide Verifications</h1>
          <p className="text-sm text-gray-400 mt-1">Verify credentials and approve Certified Guide applications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 shrink-0">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-colors border border-transparent",
            activeTab === 'pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "text-gray-400 hover:text-white"
          )}
        >
          Pending Applications ({profiles.filter(p => p.license_status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-colors border border-transparent",
            activeTab === 'approved' ? "bg-green-500/10 border-green-500/20 text-green-400" : "text-gray-400 hover:text-white"
          )}
        >
          Approved Guides ({profiles.filter(p => p.verified_guide === true && p.host_tier === 'certified_guide').length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-colors border border-transparent",
            activeTab === 'all' ? "bg-white/5 border-white/10 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          All Hosts ({profiles.length})
        </button>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-gray-400 bg-black/40 uppercase sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-semibold">Host</th>
                <th className="px-6 py-4 font-semibold">Credentials</th>
                <th className="px-6 py-4 font-semibold">Certificate</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading applications...
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No matching guides or hosts found
                  </td>
                </tr>
              ) : (
                filteredProfiles.map(user => (
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
                    <td className="px-6 py-4">
                      {user.verified_guide === true && user.host_tier === 'certified_guide' ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                          Certified Guide ✅
                        </span>
                      ) : user.license_status === 'pending' ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                          Pending Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-full text-xs font-semibold">
                          Local Host
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewHistoryClick(user)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded flex items-center gap-1 text-xs transition-colors"
                          title="View Verification History Log"
                        >
                          <History size={13} />
                          History
                        </button>
                        
                        {user.license_status === 'pending' && (
                          <>
                            <a 
                              href="https://verify.tra.go.ke" 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs transition-colors"
                            >
                              Verify on TRA
                            </a>
                            <button
                              onClick={() => handleApprove(user)}
                              disabled={actionLoading === user.id}
                              className="px-2.5 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
                            >
                              {actionLoading === user.id ? <Loader2 size={13} className="animate-spin" /> : <CheckSquare size={13} />}
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingHost(user)}
                              disabled={actionLoading === user.id}
                              className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}

                        {user.verified_guide === true && user.host_tier === 'certified_guide' && (
                          <button
                            onClick={() => setRevokingHost(user)}
                            disabled={actionLoading === user.id}
                            className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded flex items-center gap-1 text-xs transition-colors disabled:opacity-50 font-semibold"
                          >
                            <AlertTriangle size={13} /> Revoke
                          </button>
                        )}
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

      {/* Revoke Modal */}
      {revokingHost && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-2">Revoke Certified Guide Status</h3>
            <p className="text-sm text-gray-400 mb-4">
              Provide a reason for revoking {revokingHost.full_name}'s guide status. This will be logged and sent to them via email.
            </p>
            <textarea
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm mb-4 min-h-[100px] focus:outline-none focus:border-red-500/50"
              placeholder="e.g. Conduct policy violation or expired guide credentials..."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRevokingHost(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRevoke}
                disabled={actionLoading === revokingHost.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {actionLoading === revokingHost.id && <Loader2 size={16} className="animate-spin" />}
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Timeline Modal */}
      {selectedHostHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl font-semibold text-white">Verification History</h3>
              <button
                onClick={() => setSelectedHostHistory(null)}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Close
              </button>
            </div>
            
            <div className="mb-4 bg-white/5 p-3 rounded-lg text-xs border border-white/5 shrink-0">
              <div className="font-semibold text-gray-200">{selectedHostHistory.full_name}</div>
              <div className="text-gray-400 mt-0.5">{selectedHostHistory.email}</div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Loading logs...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No verification activity logs recorded for this host.
                </div>
              ) : (
                <div className="relative border-l-2 border-white/10 ml-3 pl-5 space-y-6">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Marker dot */}
                      <span className="absolute -left-[27px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-br from-[#7F5AF0] to-[#2CB67D]" />
                      
                      <div>
                        <div className="flex items-center justify-between gap-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            log.action === "approved" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            log.action === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          )}>
                            {log.action}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-2 bg-black/40 p-2.5 rounded-lg border border-white/5">
                          {log.notes || "No additional comments."}
                        </p>
                        <div className="text-[10px] text-gray-500 mt-1">
                          Logged by: {log.admin ? `${log.admin.full_name} (${log.admin.email})` : "System / Deleted Admin"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 text-right shrink-0">
              <button
                onClick={() => setSelectedHostHistory(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm font-semibold rounded-lg text-white transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
