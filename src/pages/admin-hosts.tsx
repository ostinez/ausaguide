import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import {
  Shield,
  Mail,
  MapPin,
  Clock,
  FileText,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Users,
  UserCheck,
  UserX,
  Search,
  ExternalLink,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ApplicationStatus } from "@/lib/types"
import {
  fetchAllHostApplications,
  approveHost,
  rejectHost,
  fetchProfileByRole,
} from "@/lib/api/hosts"
import type { HostRecord } from "@/lib/api/hosts"

/* ────────────── helpers ────────────── */

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default"
  if (status === "rejected") return "destructive"
  return "secondary"
}

function hostTypeLabel(type: string) {
  return type === "certified_guide" ? "Certified Guide" : "Local Host"
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* ────────────── stat card ────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-full"
        style={{ background: color + "20" }}
      >
        <Icon className="size-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/* ────────────── reject modal ────────────── */

function RejectModal({
  hostName,
  onConfirm,
  onCancel,
  loading,
}: {
  hostName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md animate-in fade-in-0 zoom-in-95 rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/15">
            <XCircle className="size-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Reject Application
            </h3>
            <p className="text-sm text-muted-foreground">
              {hostName}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <label
            htmlFor="reject-reason"
            className="text-sm font-medium text-foreground"
          >
            Rejection reason <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="reject-reason"
            placeholder="Explain why this application is being rejected..."
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This reason will be recorded and can be sent to the applicant.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
            className="rounded-full"
          >
            {loading ? (
              <>
                <Spinner className="size-4" />
                Rejecting…
              </>
            ) : (
              "Confirm Rejection"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ────────────── application card ────────────── */

function ApplicationCard({
  host,
  onApprove,
  onReject,
}: {
  host: HostRecord
  onApprove: (id: string) => Promise<void>
  onReject: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [approving, setApproving] = useState(false)
  const isPending = host.status === "pending"

  async function handleApprove() {
    setApproving(true)
    try {
      await onApprove(host.id)
    } finally {
      setApproving(false)
    }
  }

  return (
    <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(host.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {host.full_name}
                </h3>
                <Badge
                  variant={statusBadgeVariant(host.status)}
                  className="shrink-0 capitalize"
                >
                  {host.status}
                </Badge>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3" />
                  {host.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {host.city}
                </span>
              </div>
            </div>
          </div>

          <Badge
            variant="outline"
            className={
              host.host_type === "certified_guide"
                ? "border-teal-500/30 bg-teal-500/10 text-teal-400"
                : "border-purple-500/30 bg-purple-500/10 text-purple-400"
            }
          >
            {host.host_type === "certified_guide" ? (
              <Award className="mr-1 size-3" />
            ) : (
              <Users className="mr-1 size-3" />
            )}
            {hostTypeLabel(host.host_type)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bio */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Bio
          </p>
          <p
            className={`mt-1 text-sm leading-relaxed text-foreground/80 ${
              !expanded ? "line-clamp-3" : ""
            }`}
          >
            {host.bio}
          </p>
          {host.bio.length > 180 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="size-3" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="size-3" />
                </>
              )}
            </button>
          )}
        </div>

        <Separator />

        {/* Document links */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <FileText className="mr-1 inline size-3" />
              ID Upload
            </p>
            {host.id_upload_url ? (
              <a
                href={host.id_upload_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View document
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground/60">Not uploaded</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Award className="mr-1 inline size-3" />
              License
            </p>
            {host.host_type === "certified_guide" ? (
              host.license_upload_url ? (
                <a
                  href={host.license_upload_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View license
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground/60">
                  Not uploaded
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground/40">N/A</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Footer: date + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            Submitted {format(new Date(host.created_at), "MMM d, yyyy")}
            {host.reviewed_at && (
              <span className="ml-2">
                · Reviewed{" "}
                {format(new Date(host.reviewed_at), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {isPending && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(host.id)}
                className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="mr-1 size-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={approving}
                className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {approving ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <CheckCircle2 className="mr-1 size-3.5" />
                )}
                {approving ? "Approving…" : "Approve"}
              </Button>
            </div>
          )}

          {host.status === "rejected" && host.rejection_reason && (
            <div className="max-w-xs">
              <p className="text-xs text-destructive/80">
                <span className="font-medium">Reason:</span>{" "}
                {host.rejection_reason}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ────────────── page ────────────── */

type FilterTab = "all" | ApplicationStatus

export default function AdminHostsPage() {
  const [hosts, setHosts] = useState<HostRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>("pending")
  const [search, setSearch] = useState("")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        // Fetch seeded admin user to check system availability
        const adminProfile = await fetchProfileByRole("admin")
        
        // Simulating role based authorization
        const storedRole = localStorage.getItem("user_role")
        if (storedRole === "admin" && adminProfile) {
          setIsAdmin(true)
          const apps = await fetchAllHostApplications()
          setHosts(apps)
        } else {
          setIsAdmin(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to authenticate or load host applications")
      } finally {
        setCheckingAuth(false)
        setLoading(false)
      }
    }
    checkAuthAndLoad()
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  /* ── simulate admin login ── */
  async function handleSimulatedAdminLogin() {
    setCheckingAuth(true)
    try {
      localStorage.setItem("user_role", "admin")
      setIsAdmin(true)
      const apps = await fetchAllHostApplications()
      setHosts(apps)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load host applications")
    } finally {
      setCheckingAuth(false)
    }
  }

  /* ── stats ── */
  const pendingCount = hosts.filter((h) => h.status === "pending").length
  const approvedCount = hosts.filter((h) => h.status === "approved").length
  const rejectedCount = hosts.filter((h) => h.status === "rejected").length

  /* ── filtered list ── */
  const filtered = hosts
    .filter((h) => activeTab === "all" || h.status === activeTab)
    .filter((h) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        h.full_name.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q)
      )
    })

  /* ── approve action ── */
  async function handleApprove(hostId: string) {
    try {
      await approveHost(hostId)
      setHosts((prev) =>
        prev.map((h) =>
          h.id === hostId
            ? {
                ...h,
                status: "approved",
                reviewed_at: new Date().toISOString(),
              }
            : h
        )
      )
      setToast({ message: "Host approved successfully! Email notification sent.", type: "success" })
    } catch {
      setToast({ message: "Failed to approve host.", type: "error" })
    }
  }

  /* ── reject action ── */
  async function handleReject(reason: string) {
    if (!rejectingId) return
    setRejectLoading(true)
    try {
      await rejectHost(rejectingId, reason)
      setHosts((prev) =>
        prev.map((h) =>
          h.id === rejectingId
            ? {
                ...h,
                status: "rejected",
                rejection_reason: reason,
                reviewed_at: new Date().toISOString(),
              }
            : h
        )
      )
      setToast({ message: "Host application rejected and reason sent by email.", type: "success" })
      setRejectingId(null)
    } catch {
      setToast({ message: "Failed to reject host.", type: "error" })
    } finally {
      setRejectLoading(false)
    }
  }

  const rejectingHost = hosts.find((h) => h.id === rejectingId)

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-24">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-24">
        {/* Background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md text-center">
          <Card className="border-border/60 shadow-[var(--shadow-3)]">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/15">
                <Shield className="size-8 text-destructive" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Only users with role 'admin' should access this page. Please log in with an administrator account to view pending host applications.
              </p>
              <div className="mt-6 flex flex-col gap-3 w-full">
                <Button
                  onClick={handleSimulatedAdminLogin}
                  className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Log In as Admin (Simulated)
                </Button>
                <Link to="/" className="w-full">
                  <Button variant="outline" className="w-full rounded-full">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-24">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15">
              <Shield className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight text-foreground">
                Host Applications
              </h1>
              <p className="text-sm text-muted-foreground">
                Review and manage host applications
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Pending"
            value={pendingCount}
            icon={Clock}
            color="#f59e0b"
          />
          <StatCard
            label="Approved"
            value={approvedCount}
            icon={UserCheck}
            color="#10b981"
          />
          <StatCard
            label="Rejected"
            value={rejectedCount}
            icon={UserX}
            color="#ef4444"
          />
        </div>

        {/* Filter tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as FilterTab)}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="all">All ({hosts.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedCount})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-10 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                <Users className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {search.trim()
                  ? "No applications match your search."
                  : `No ${activeTab === "all" ? "" : activeTab + " "}applications found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((host) => (
              <ApplicationCard
                key={host.id}
                host={host}
                onApprove={handleApprove}
                onReject={(id) => setRejectingId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectingId && rejectingHost && (
        <RejectModal
          hostName={rejectingHost.full_name}
          onConfirm={handleReject}
          onCancel={() => setRejectingId(null)}
          loading={rejectLoading}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 rounded-xl border px-5 py-3 shadow-xl ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {toast.type === "success" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <XCircle className="size-4" />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
