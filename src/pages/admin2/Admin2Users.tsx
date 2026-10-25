import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Search, Loader2, Award, Home, Shield } from "lucide-react"
import { SkeletonTable } from "@/components/ui/Skeleton"
import { toast } from "sonner"

export default function Admin2Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, host_tier, host_type, requested_tier, verification_status, status, created_at")
      .order("created_at", { ascending: false })
    
    if (!error && data) {
      setUsers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId)
    try {
      const updates: Record<string, any> = { role: newRole }
      if (newRole === "host") {
        updates.status = "active"
        updates.verification_status = "verified"
        updates.is_verified = true
        // Set local_host if no tier set
        const currentUser = users.find(u => u.id === userId)
        if (!currentUser?.host_tier) {
          updates.host_tier = "local_host"
          updates.host_type = "local"
          updates.requested_tier = "local"
        }
      } else if (newRole === "pending_guide") {
        updates.status = "pending"
        updates.verification_status = "verified"
        updates.host_tier = "certified_guide"
        updates.requested_tier = "certified_guide"
      } else if (newRole === "traveler") {
        updates.status = "active"
      } else if (newRole === "admin") {
        updates.status = "active"
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)

      if (error) throw error

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates, role: newRole } : u))
      toast.success(`User role changed to ${newRole}!`)
    } catch (error: any) {
      console.error("Failed to update role:", error)
      toast.error(`Failed to update user role: ${error.message}`)
    }
    setUpdatingId(null)
  }

  function renderTierBadge(user: any) {
    const tier = (user.requested_tier || user.host_type || user.host_tier || "").toLowerCase()
    if (tier === "certified_guide" || tier === "guide") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/25">
          <Award className="size-3 text-purple-400" />
          <span>Guide</span>
        </span>
      )
    }
    if (tier === "security") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
          <Shield className="size-3 text-amber-400" />
          <span>Security</span>
        </span>
      )
    }
    if (tier === "local" || tier === "local_host") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/25">
          <Home className="size-3 text-teal-400" />
          <span>Local</span>
        </span>
      )
    }
    return <span className="text-gray-500 text-xs font-mono">—</span>
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    const nameMatch = (u.full_name?.toLowerCase() || "").includes(q)
    const emailMatch = (u.email?.toLowerCase() || "").includes(q)
    const roleMatch = (u.role?.toLowerCase() || "").includes(q)
    const tier = (u.requested_tier || u.host_type || u.host_tier || "").toLowerCase()
    const tierMatch = tier.includes(q)
    return nameMatch || emailMatch || roleMatch || tierMatch
  })

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-sm text-gray-400 mt-1">Manage user roles, requested host tiers, and account permissions</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 pl-10 pr-4 py-2 bg-[#111111] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-in fade-in duration-300">
          <SkeletonTable rows={6} cols={4} />
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm text-left relative">
              <thead className="text-xs text-gray-400 bg-black/40 uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Requested Tier</th>
                  <th className="px-6 py-4 font-semibold">Sign Up Date</th>
                  <th className="px-6 py-4 font-semibold w-52">Role Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No users found matching "{search}"
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-teal-400 font-bold border border-white/10 shrink-0">
                            {(user.full_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-200 truncate">{user.full_name || "Anonymous User"}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderTierBadge(user)}
                      </td>
                      <td className="px-6 py-4 text-gray-400 whitespace-nowrap text-xs">
                        {new Date(user.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative flex items-center">
                          <select
                            value={user.role || "traveler"}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={updatingId === user.id}
                            className="bg-black/60 border border-white/15 text-gray-200 text-xs font-semibold rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500 block w-full p-2.5 appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="traveler">Traveler</option>
                            <option value="host">Host (Verified)</option>
                            <option value="pending_guide">Pending Guide</option>
                            <option value="admin">Admin</option>
                          </select>
                          {updatingId === user.id && (
                            <Loader2 className="animate-spin text-teal-400 absolute right-8" size={14} />
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
      )}
    </div>
  )
}
