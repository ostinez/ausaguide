import { useState } from "react"
import { Mail, ChevronDown, ChevronUp, HelpCircle, BookOpen, Users, CreditCard, XCircle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useSEO } from "@/hooks/useSEO"

const FAQ_CATEGORIES = [
  {
    id: "booking",
    icon: BookOpen,
    label: "How to Book",
    color: "text-primary",
    bg: "bg-primary/10",
    questions: [
      {
        q: "How do I book a tour?",
        a: "Browse tours on the /tours page, select one you love, pick a date and number of guests on the calendar, then click 'Book Now' to complete your booking via the checkout form.",
      },
      {
        q: "Can I book for a group?",
        a: "Yes! Set the number of guests when selecting your date. The host's maximum guest limit will be enforced automatically.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit and debit cards via Stripe. Your payment is held securely until the booking is confirmed by the host.",
      },
      {
        q: "When is my card charged?",
        a: "Your card is charged immediately at checkout. If a host declines your booking, a full refund is processed automatically.",
      },
    ],
  },
  {
    id: "host",
    icon: Users,
    label: "Becoming a Host",
    color: "text-teal",
    bg: "bg-teal/10",
    questions: [
      {
        q: "How do I become a host?",
        a: "Visit /host/signup and fill out the application form. Include your bio, host type (Local Host or Certified Guide), and a video introduction. We review applications within 48 hours.",
      },
      {
        q: "What types of hosts are there?",
        a: "We have two tiers: Local Hosts (passionate locals who love sharing their neighbourhood) and Certified Guides (licensed tourism professionals with formal certifications).",
      },
      {
        q: "How much do hosts earn?",
        a: "Hosts keep 80% of every booking. Ausaguide retains a 20% platform fee to cover operations, marketing, and traveler support.",
      },
      {
        q: "Can I set my own schedule?",
        a: "Absolutely. You control your availability — days, hours, and guest limits — directly from your host dashboard. You can toggle busy status any time.",
      },
    ],
  },
  {
    id: "cancellation",
    icon: XCircle,
    label: "Cancellation Policy",
    color: "text-destructive",
    bg: "bg-destructive/10",
    questions: [
      {
        q: "What is the cancellation policy?",
        a: "Travelers can cancel up to 48 hours before a tour for a full refund. Cancellations within 48 hours are non-refundable unless the host declines the booking.",
      },
      {
        q: "What if the host cancels?",
        a: "If a host cancels a confirmed booking, you will receive a full refund automatically and we will help you find an alternative tour.",
      },
      {
        q: "How do I cancel a booking?",
        a: "Go to your dashboard, find the booking, and click 'Cancel'. Eligible refunds are processed to your original payment method within 5–7 business days.",
      },
    ],
  },
  {
    id: "account",
    icon: Settings,
    label: "Account Setup",
    color: "text-primary",
    bg: "bg-primary/10",
    questions: [
      {
        q: "How do I create an account?",
        a: "Visit /auth and sign in with your email. The system will auto-create a traveler profile. You can update your name, bio, and preferences in /settings.",
      },
      {
        q: "Can I switch between traveler and host?",
        a: "Your account can be both! Apply to become a host at /host/signup. Once approved, your dashboard will show both host and traveler sections.",
      },
      {
        q: "How do I reset my password?",
        a: "On the login page, click 'Forgot password'. We'll send a reset link to your email within minutes.",
      },
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    label: "Billing",
    color: "text-teal",
    bg: "bg-teal/10",
    questions: [
      {
        q: "How does billing work?",
        a: "Payments are processed securely via Stripe. You'll receive a receipt by email after each successful booking.",
      },
      {
        q: "Are there hidden fees?",
        a: "No. The price shown on tour cards is the price you pay. There are no additional booking or service fees for travelers.",
      },
      {
        q: "How do hosts receive payouts?",
        a: "Host earnings are processed via Stripe Connect. Payouts are sent after the tour is marked as completed, typically within 2 business days.",
      },
    ],
  },
]

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{question}</span>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
      )}
    </div>
  )
}

export default function HelpPage() {
  useSEO({
    title: "Help Center & FAQ",
    description:
      "Find answers about virtual tour booking, payment processing, and host guidelines.",
    url: "https://ausaguide.com/help",
  })
  const [activeCategory, setActiveCategory] = useState("booking")
  const [formSent, setFormSent] = useState(false)
  const [sending, setSending] = useState(false)

  const category = FAQ_CATEGORIES.find((c) => c.id === activeCategory)!

  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSending(false)
    setFormSent(true)
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <HelpCircle className="size-7 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Help Centre</h1>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know about Ausaguide — bookings, hosting, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <nav className="space-y-1">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left",
                  activeCategory === cat.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <span className={cn("flex size-7 items-center justify-center rounded-lg", cat.bg)}>
                  <cat.icon className={cn("size-4", cat.color)} />
                </span>
                {cat.label}
              </button>
            ))}
          </nav>

          {/* FAQ Content */}
          <div>
            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className={cn("flex size-9 items-center justify-center rounded-xl", category.bg)}>
                  <category.icon className={cn("size-5", category.color)} />
                </span>
                <h2 className="text-xl font-bold text-foreground">{category.label}</h2>
              </div>
              <div>
                {category.questions.map((item) => (
                  <AccordionItem key={item.q} question={item.q} answer={item.a} />
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="mt-8 rounded-2xl border border-border bg-card/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex size-9 items-center justify-center rounded-xl bg-teal/10">
                  <Mail className="size-5 text-teal" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Still need help?</h2>
                  <p className="text-xs text-muted-foreground">We respond within 24 hours</p>
                </div>
              </div>

              {formSent ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-teal/10 mb-3">
                    <Mail className="size-6 text-teal" />
                  </div>
                  <h3 className="font-semibold text-foreground">Message sent!</h3>
                  <p className="text-sm text-muted-foreground mt-1">We'll get back to you within 24 hours.</p>
                  <Button size="sm" variant="ghost" className="mt-4" onClick={() => setFormSent(false)}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="help-email">Email</Label>
                      <Input id="help-email" type="email" placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="help-subject">Subject</Label>
                      <Input id="help-subject" placeholder="What's this about?" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="help-message">Message</Label>
                    <textarea
                      id="help-message"
                      rows={4}
                      required
                      placeholder="Describe your issue in detail..."
                      className="w-full resize-none rounded-md border border-border/80 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <Button type="submit" disabled={sending} className="rounded-full">
                    {sending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
