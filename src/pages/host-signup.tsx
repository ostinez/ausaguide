import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  User,
  Mail,
  MapPin,
  ArrowLeft,
  Shield,
  Users,
  Star,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchHostProfiles, submitHostApplication } from "@/lib/api/hosts"
import type { HostType, Profile } from "@/lib/types"
import { getHostInitials } from "@/lib/tour-utils"
import { trackEvent } from "@/lib/posthog"

const PERKS = [
  {
    icon: Users,
    title: "Reach global travellers",
    description: "Connect with curious explorers from around the world.",
  },
  {
    icon: Shield,
    title: "Secure payments",
    description: "Get paid reliably after every completed experience.",
  },
  {
    icon: Star,
    title: "Build your reputation",
    description: "Earn reviews and grow your local tourism brand.",
  },
]

export default function HostSignupPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hostType, setHostType] = useState<HostType | "">("")
  const [featuredHosts, setFeaturedHosts] = useState<Profile[]>([])
  const [hostsLoading, setHostsLoading] = useState(true)

  useEffect(() => {
    fetchHostProfiles(4)
      .then(setFeaturedHosts)
      .catch(() => setFeaturedHosts([]))
      .finally(() => setHostsLoading(false))
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)

    const userId = localStorage.getItem("user_id")
    if (!userId) {
      setSubmitError("You must be signed in to submit a host application.")
      setSubmitting(false)
      return
    }

    try {
      await submitHostApplication({
        user_id: userId,
        full_name: formData.get("full_name") as string,
        email: formData.get("email") as string,
        city: formData.get("city") as string,
        host_type: hostType as HostType,
        bio: formData.get("bio") as string,
      })
      trackEvent("host_application_submitted", {
        user_id: userId,
        city: formData.get("city") as string,
        host_type: hostType as HostType,
      })
      toast.success("Your application has been submitted. You'll receive a response within 48 hours.")
      navigate("/dashboard")
    } catch (err) {
      console.error("Error submitting host application:", err)
      setSubmitError(err instanceof Error ? err.message : "Failed to submit application")
      toast.error(err instanceof Error ? err.message : "Failed to submit application")
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen bg-background px-4 py-24">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Home
        </Link>

        <div className="mb-10 max-w-2xl">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-foreground">
            Become a Host
          </h1>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7F5AF0]/10 border border-[#7F5AF0]/20 text-xs font-semibold text-[#7F5AF0]">
            <span>🚀 Host applications are in beta. Limited spots available.</span>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">
            Share your local knowledge and earn income by leading authentic Kenyan experiences
            for travellers worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-xl">Host Application</CardTitle>
              <CardDescription>
                Fill in your details below. All fields marked are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="host-name">
                    Full name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="host-name"
                      name="full_name"
                      type="text"
                      placeholder="Your full name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="host-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="host-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="host-city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="host-city"
                      name="city"
                      type="text"
                      placeholder="e.g. Nairobi, Mombasa, Lamu"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="host-type">
                    Host type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={hostType}
                    onValueChange={(value) => setHostType(value as HostType)}
                    required
                  >
                    <SelectTrigger id="host-type" className="w-full">
                      <SelectValue placeholder="Select your host type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local_host">Local Host</SelectItem>
                      <SelectItem value="certified_guide">Certified Guide</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {hostType === "certified_guide"
                      ? "You hold a professional guiding certification or license."
                      : hostType === "local_host"
                        ? "You're a passionate local who knows your area inside and out."
                        : "Choose the option that best describes you."}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="host-bio">
                    About you <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="host-bio"
                    name="bio"
                    placeholder="Tell us about yourself, your experience, and the kind of tours you'd like to offer..."
                    rows={5}
                    minLength={50}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 50 characters. This will appear on your host profile.
                  </p>
                </div>

                <Separator />

                {submitError && (
                  <p className="text-sm text-destructive">{submitError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-full py-5 text-sm font-semibold"
                  disabled={submitting || !hostType}
                >
                  {submitting ? (
                    <>
                      <Spinner className="size-4" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By submitting, you agree to our{" "}
                  <Link
                    to="/terms"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    Host Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <h3 className="scroll-m-20 text-lg font-semibold tracking-tight text-foreground">
              Why host with Ausaguide?
            </h3>

            <div className="space-y-4">
              {PERKS.map((perk) => (
                <div
                  key={perk.title}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <perk.icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{perk.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{perk.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <h3 className="scroll-m-20 text-lg font-semibold tracking-tight text-foreground">
                Meet our hosts
              </h3>
              {hostsLoading ? (
                <div className="mt-4 flex justify-center py-6">
                  <Spinner className="size-6 text-primary" />
                </div>
              ) : featuredHosts.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {featuredHosts.map((host) => (
                    <div
                      key={host.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                    >
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-primary/20 text-sm text-primary">
                          {getHostInitials(host.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {host.full_name}
                          </p>
                          {host.is_verified && (
                            <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{host.location}</p>
                        {host.bio && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {host.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Our host community is growing. Be among the first!
                </p>
              )}
            </div>

            <Separator />

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">Have questions?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Email us at <a href="mailto:welcome@ausaguide.com" className="text-primary underline underline-offset-2 hover:text-primary/80">welcome@ausaguide.com</a> or visit our{" "}
                <Link
                  to="/help"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Help Center
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
