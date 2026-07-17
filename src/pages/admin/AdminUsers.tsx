import { useEffect, useState } from "react"
import { Users, Search, Loader2, AlertCircle, Trash2, Ban, UserCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: "admin" | "host" | "traveler" | null
  banned: boolean
  created_at: string
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const loadUsersData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, banned, created_at")
        .order("created_at", { ascending: false })

      if (fetchErr) throw fetchErr
      setProfiles(data || [])
    } catch (err: any) {
      console.error("Failed to load profiles:", err)
      setError("Failed to fetch user profiles. Check policy permissions.")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId)

      if (error) throw error
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole as any } : p))
      )
      alert("User role updated successfully.")
    } catch (err: any) {
      console.error("Role update failed:", err)
      alert("Failed to update role: " + err.message)
    }
  }

  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    const actionText = currentBanStatus ? "unban" : "ban"
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ banned: !currentBanStatus })
        .eq("id", userId)

      if (error) throw error
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, banned: !currentBanStatus } : p))
      )
      alert(`User successfully ${currentBanStatus ? "unbanned" : "banned"}.`)
    } catch (err: any) {
      console.error("Ban toggle failed:", err)
      alert("Failed to change ban status: " + err.message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Permanently delete this user profile? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId)
      if (error) throw error
      setProfiles((prev) => prev.filter((p) => p.id !== userId))
      alert("User profile deleted.")
    } catch (err: any) {
      console.error("User deletion failed:", err)
      alert("Failed to delete user: " + err.message)
    }
  }

  useEffect(() => {
    loadUsersData()
  }, [])

  const filteredProfiles = profiles.filter((p) =>
    (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Users className="size-8 text-purple-400" />
          Users Management
        </h1>
        <p className="text-xs text-white/40 font-medium">Manage platform permissions, user roles, and access controls</p>
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
            placeholder="Search users by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-white/5 bg-[#0D0D11]/60 focus:border-purple-500/30 text-white rounded-xl placeholder-white/30 text-xs h-10" 
          />
        </div>
        <div className="flex-1" />
        <Button 
          onClick={loadUsersData} 
          disabled={loading}
          size="sm" 
          variant="outline" 
          className="rounded-full border-white/10 hover:bg-white/5 hover:text-white transition-all text-xs h-9 px-4 shrink-0"
        >
          {loading ? (
            <Loader2 className="size-3.5 mr-2 animate-spin text-purple-400" />
          ) : (
            "Reload Users"
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
                  <th className="px-6 py-3.5">User Info</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Role Management</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredProfiles.map((user) => (
                  <tr key={user.id} className={`hover:bg-white/2 transition-colors ${user.banned ? "bg-red-500/5 hover:bg-red-500/10" : ""}`}>
                    <td className="px-6 py-4.5 font-bold text-white">{user.full_name || "Anonymous User"}</td>
                    <td className="px-6 py-4.5 font-mono text-white/60">{user.email || "No Email"}</td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider border
                        ${user.role === "admin" ? "bg-red-500/10 border-red-500/20 text-red-400" : ""}
                        ${user.role === "host" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : ""}
                        ${user.role === "traveler" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : ""}
                        ${!user.role ? "bg-white/5 border-white/10 text-white/40" : ""}
                      `}>
                        {user.role || "traveler"}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider border
                        ${user.banned 
                          ? "bg-red-500/15 border-red-500/30 text-red-400" 
                          : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        }
                      `}>
                        {user.banned ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <select
                        value={user.role || "traveler"}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-transparent border border-white/10 text-white/80 text-xs px-2.5 py-1 rounded-lg focus:border-purple-500/40 bg-[#0F0F12]"
                      >
                        <option value="traveler">Traveler</option>
                        <option value="host">Host</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleBan(user.id, user.banned)}
                          className={`h-8 w-8 rounded-lg transition-colors
                            ${user.banned 
                              ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5" 
                              : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/5"
                            }
                          `}
                          title={user.banned ? "Activate User" : "Suspend User"}
                        >
                          {user.banned ? <UserCheck className="size-4" /> : <Ban className="size-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-500/5 rounded-lg"
                          title="Delete User"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/30">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
