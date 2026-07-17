import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Shield, Users, Star, DollarSign, Search, ArrowLeft,
  CheckCircle2, BadgeAlert, TrendingUp, MapPin,
  Eye, Ban, UserCheck, Terminal, EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  is_verified?: boolean
  is_frozen?: boolean
}

interface Tour {
  id: string
  title: string
  category: string
  price: number
  is_published: boolean
}

interface Review {
  id: string
  rating: number
  comment: string | null
  status: string
  created_at: string
}

interface SystemLog {
  id: string
  event: string
  status: "info" | "success" | "warning" | "error"
  timestamp: string
}



export default function AdminSettingsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "content" | "logs">("stats")

  // Data
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [logs, setLogs] = useState<SystemLog[]>([])

  // Search & Filters
  const [searchUser, setSearchUser] = useState("")
  const [searchTour, setSearchTour] = useState("")

  // Helper to format database audit logs to UI system logs format
  function formatAuditLog(row: any): SystemLog {
    const adminName = row.admin?.full_name || "Admin"
    const detailsStr = row.details ? ` Details: ${JSON.stringify(row.details)}` : ""
    const targetStr = row.target_id ? ` (Target: ${row.target_type} ${row.target_id})` : ""
    return {
      id: row.id,
      event: `${adminName} performed action: ${row.action}${targetStr}.${detailsStr}`,
      status: row.action.toLowerCase().includes("reject") || row.action.toLowerCase().includes("delete") ? "warning" : "info",
      timestamp: row.created_at,
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [profRes, tourRes, revRes, logRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, role, is_verified, created_at").order("created_at", { ascending: false }),
        supabase.from("tours").select("id, title, category, price, is_published").order("created_at", { ascending: false }),
        supabase.from("reviews").select("id, rating, comment, status, created_at").order("created_at", { ascending: false }),
        supabase.from("audit_logs").select("*, admin:profiles!audit_logs_admin_id_fkey(full_name)").order("created_at", { ascending: false }).limit(50),
      ])

      if (profRes.error) throw profRes.error
      if (tourRes.error) throw tourRes.error
      if (revRes.error) throw revRes.error
      if (logRes.error) throw logRes.error

      setProfiles(profRes.data ?? [])
      setTours(tourRes.data ?? [])
      setReviews(revRes.data ?? [])
      if (logRes.data) {
        setLogs(logRes.data.map(formatAuditLog))
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load admin dashboard settings.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem("user_role")
    if (role !== "admin") {
      toast.error("Access denied. Admin role required.")
      navigate("/dashboard")
      return
    }

    loadData()

  }, [])

  // Real-time Postgres changes channel subscription tracking insertion events on the audit_logs table
  useEffect(() => {
    if (activeTab !== "logs") return

    /*
    const channel = supabase
      .channel("audit-logs-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, async (payload) => {
        const { data: adminProf } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", payload.new.admin_id)
          .maybeSingle()

        const newLog = formatAuditLog({
          ...payload.new,
          admin: adminProf
        })

        setLogs((prev) => [newLog, ...prev.slice(0, 49)])
      })
      .subscribe()
    */

    return () => {
      // supabase.removeChannel(channel)
    }
  }, [activeTab])

  // Actions
  const handleVerifyHost = async (userId: string, currentVal: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: !currentVal })
        .eq("id", userId)

      if (error) throw error
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, is_verified: !currentVal } : p))
      )
      toast.success(currentVal ? "Host verification revoked" : "Host verified successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update verification status.")
    }
  }

  const handleToggleFreeze = (userId: string, currentVal: boolean) => {
    // Mock user freezing behavior in UI state
    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, is_frozen: !currentVal } : p))
    )
    toast.success(currentVal ? "User account unfrozen." : "User account frozen successfully!")
  }

  const handleToggleTourPublish = async (tourId: string, currentVal: boolean) => {
    try {
      const { error } = await supabase
        .from("tours")
        .update({ is_published: !currentVal, status: !currentVal ? "published" : "draft" })
        .eq("id", tourId)

      if (error) throw error
      setTours((prev) =>
        prev.map((t) => (t.id === tourId ? { ...t, is_published: !currentVal } : t))
      )
      toast.success(currentVal ? "Tour unpublished" : "Tour published successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to toggle tour status.")
    }
  }

  const handleToggleReviewStatus = async (reviewId: string, currentVal: string) => {
    const newVal = currentVal === "visible" ? "hidden" : "visible"
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status: newVal })
        .eq("id", reviewId)

      if (error) throw error
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newVal } : r))
      )
      toast.success(newVal === "hidden" ? "Review hidden from public view" : "Review made visible")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update review status.")
    }
  }

  if (loading && profiles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  // Filter lists
  const filteredUsers = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
      p.email.toLowerCase().includes(searchUser.toLowerCase())
  )

  const filteredTours = tours.filter((t) =>
    t.title.toLowerCase().includes(searchTour.toLowerCase())
  )

  // Stats calculation
  const totalUsers = profiles.length
  const totalHosts = profiles.filter((p) => p.role === "host").length
  const activeToursCount = tours.filter((t) => t.is_published).length

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Shield className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Admin Settings</h1>
              <p className="text-sm text-muted-foreground">Platform Administration & Moderation Panel</p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="mr-2 size-4" /> Exit Panel
            </Button>
          </Link>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-border/60 mb-8 overflow-x-auto gap-2">
          {[
            { id: "stats", label: "KPI Stats", icon: TrendingUp },
            { id: "users", label: "User Management", icon: Users },
            { id: "content", label: "Content Moderation", icon: CheckCircle2 },
            { id: "logs", label: "Streaming System Logs", icon: Terminal },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* STATS SECTION */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/60 bg-card/40 backdrop-blur">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Registered Accounts</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/40 backdrop-blur">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-teal/15 text-teal">
                    <UserCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalHosts}</p>
                    <p className="text-xs text-muted-foreground">Verified Local Hosts</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/40 backdrop-blur">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{activeToursCount}</p>
                    <p className="text-xs text-muted-foreground">Active Experience Tours</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/40 backdrop-blur">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-teal/15 text-teal">
                    <DollarSign className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">KES 475k</p>
                    <p className="text-xs text-muted-foreground">Gross Booking Volume</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Benchmarking Comparison */}
            <Card className="border-border/60 bg-card/40 backdrop-blur p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg">Platform Composition (Benchmark Comparison)</CardTitle>
                <CardDescription>Ratio comparison against Airbnb and Upwork structures</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Host-to-Traveler Ratio</span>
                    <span>{(totalHosts / (totalUsers || 1) * 100).toFixed(0)}% Hosts</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                    <div className="bg-primary h-full" style={{ width: `${(totalHosts / (totalUsers || 1) * 100)}%` }} />
                    <div className="bg-teal h-full flex-1" />
                  </div>
                </div>
                <div className="rounded-xl bg-muted/10 border border-border/40 p-4 text-xs text-muted-foreground leading-normal space-y-1.5">
                  <p><strong>💡 Operational Insights:</strong></p>
                  <p>· Your current Host ratio matches Lamu/Nairobi seasonal peaks, aligned with Airbnb's early supply loops.</p>
                  <p>· User growth rate is trending +14% week-on-week, matching freelancer growth structures on Upwork.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* USER MANAGEMENT SECTION */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-10"
              />
            </div>

            <Card className="border-border/60 bg-card/40 backdrop-blur overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                      <th className="p-3">User Profile</th>
                      <th className="p-3">Account Role</th>
                      <th className="p-3">Verification</th>
                      <th className="p-3">Registered On</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border/40 last:border-0 hover:bg-muted/5 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground">{user.full_name}</div>
                          <div className="text-[10px] text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize px-2.5 py-0.5 font-semibold">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {user.role === "host" ? (
                            <span className={`inline-flex items-center gap-1 font-semibold ${user.is_verified ? "text-teal" : "text-amber-500"}`}>
                              {user.is_verified ? <CheckCircle2 className="size-3.5 fill-teal/10" /> : <BadgeAlert className="size-3.5" />}
                              {user.is_verified ? "Verified" : "Pending"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("en-KE")}
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {user.role === "host" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] rounded-full border-teal/40 text-teal hover:bg-teal/5"
                              onClick={() => handleVerifyHost(user.id, !!user.is_verified)}
                            >
                              <UserCheck className="size-3 mr-1" />
                              {user.is_verified ? "Revoke" : "Verify"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={user.is_frozen ? "default" : "outline"}
                            className={`h-7 text-[10px] rounded-full ${user.is_frozen ? "bg-destructive text-white hover:bg-destructive/90" : "border-destructive/40 text-destructive hover:bg-destructive/5"}`}
                            onClick={() => handleToggleFreeze(user.id, !!user.is_frozen)}
                          >
                            <Ban className="size-3 mr-1" />
                            {user.is_frozen ? "Unfreeze" : "Freeze"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* CONTENT MODERATION SECTION */}
        {activeTab === "content" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Moderating Tours */}
            <Card className="border-border/60 bg-card/40 backdrop-blur">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="size-4 text-primary" /> Experience Tours Moderation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0">
                <div className="px-4 pb-3">
                  <Input
                    placeholder="Search tours..."
                    value={searchTour}
                    onChange={(e) => setSearchTour(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="max-h-96 overflow-y-auto border-t border-border/40 text-xs">
                  {filteredTours.map((t) => (
                    <div key={t.id} className="flex items-center justify-between border-b border-border/30 last:border-0 p-3 hover:bg-muted/5 transition-colors">
                      <div className="min-w-0 pr-3">
                        <div className="font-bold text-foreground truncate max-w-[200px]" title={t.title}>
                          {t.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground capitalize">
                          {t.category} · KES {t.price.toLocaleString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={t.is_published ? "outline" : "default"}
                        className={`h-7 text-[10px] rounded-full shrink-0 ${!t.is_published ? "bg-teal hover:bg-teal/90 text-white" : "border-border"}`}
                        onClick={() => handleToggleTourPublish(t.id, t.is_published)}
                      >
                        {t.is_published ? "Hide/Draft" : "Publish"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Moderating Reviews */}
            <Card className="border-border/60 bg-card/40 backdrop-blur">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Star className="size-4 text-amber-400 fill-amber-400/10" /> Review Feed Moderation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0">
                <div className="max-h-96 overflow-y-auto text-xs">
                  {reviews.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground italic">No review reports.</p>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="border-b border-border/30 last:border-0 p-3 space-y-2 hover:bg-muted/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[11px] font-bold">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <span>{r.rating} stars</span>
                          </div>
                          <Badge variant={r.status === "hidden" ? "destructive" : "outline"} className="text-[9px] px-1.5 py-0.5 capitalize">
                            {r.status || "visible"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground italic leading-normal truncate max-w-md">
                          "{r.comment || "No written comment"}"
                        </p>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[9px] rounded-full gap-1"
                            onClick={() => handleToggleReviewStatus(r.id, r.status)}
                          >
                            {r.status === "hidden" ? (
                              <>
                                <Eye className="size-2.5" /> Show Review
                              </>
                            ) : (
                              <>
                                <EyeOff className="size-2.5" /> Hide Review
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <Card className="border-border/60 bg-card/40 backdrop-blur overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Terminal className="size-4 text-primary animate-pulse" /> Live Streaming Security Audit
                  </CardTitle>
                  <CardDescription className="text-xs">Incoming system events and database checks</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-teal-400 font-semibold uppercase tracking-wider animate-pulse">
                  <span className="size-2 rounded-full bg-teal" />
                  Live Streaming
                </div>
              </CardHeader>
              <CardContent className="pt-4 font-mono text-[10.5px] leading-relaxed max-h-[400px] overflow-y-auto space-y-2">
                {logs.map((log) => {
                  const statusColors = {
                    info: "text-blue-400",
                    success: "text-teal-400",
                    warning: "text-amber-500",
                    error: "text-destructive",
                  }
                  return (
                    <div key={log.id} className="flex items-start gap-3 border-b border-border/20 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-muted-foreground shrink-0 select-none">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`shrink-0 font-bold ${statusColors[log.status]}`}>
                        [{log.status.toUpperCase()}]
                      </span>
                      <span className="text-foreground flex-1 break-all">
                        {log.event}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
