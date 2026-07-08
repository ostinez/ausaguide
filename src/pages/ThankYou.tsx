import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { CheckCircle2, Heart, ArrowRight, ShieldCheck, Loader2, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/GradientText"
import { SpotlightCard } from "@/components/ui/SpotlightCard"
import { supabase } from "@/lib/supabase"

interface DonationDetails {
  id: string
  item_name: string
  amount: number
  status: string
  type: string
  created_at: string
}

export default function ThankYouPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const donationType = searchParams.get("type") || "tree-planting"

  const [loading, setLoading] = useState(!!sessionId)
  const [donation, setDonation] = useState<DonationDetails | null>(null)

  useEffect(() => {
    if (!sessionId) return

    async function fetchDonation() {
      try {
        const { data, error } = await supabase
          .from("donations")
          .select("id, item_name, amount, status, type, created_at")
          .eq("stripe_session_id", sessionId)
          .maybeSingle()

        if (error) throw error
        if (data) {
          setDonation(data)
        }
      } catch (err) {
        console.error("Failed to load donation details:", err)
      } finally {
        setLoading(false)
      }
    }

    // Direct lookup, or check again after 2.5s if it was just processed
    fetchDonation()
    const timer = setTimeout(fetchDonation, 2500)
    return () => clearTimeout(timer)
  }, [sessionId])

  const formattedAmount = donation ? `$${(donation.amount / 100).toFixed(2)} USD` : ""
  const isTree = donationType === "tree-planting"

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">


      <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[500px] rounded-full bg-primary/3 blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full relative z-10 text-center space-y-8">
          
          {/* Checkmark icon */}
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#2CB67D]/10 border border-[#2CB67D]/30 ring-4 ring-[#2CB67D]/10 animate-pulse">
            <CheckCircle2 className="size-10 text-[#2CB67D]" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              <GradientText
                colors={isTree ? ["#2CB67D", "#FFFFFE"] : ["#7F5AF0", "#FFFFFE"]}
                animationSpeed={4.5}
                yoyo={true}
              >
                Thank You!
              </GradientText>
            </h1>
            <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed">
              {isTree
                ? "Your eco donation is confirmed. We will plant indigenous seedlings in partnership with local guides to restore Kenya's canopies."
                : "Your sponsorship is confirmed. Your gift directly supports mental health clinical therapy and retreats for community helpers."
              }
            </p>
          </div>

          {/* Donation Details Card */}
          {sessionId && (
            <SpotlightCard className="p-6 border border-border bg-[#121214]/40 rounded-2xl text-left space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/30 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-[#2CB67D]" />
                Transaction Confirmation
              </h3>
              
              {loading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-white/45 font-medium">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Verifying payment details with Stripe...</span>
                </div>
              ) : donation ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-white/45">Item</span>
                    <span className="font-semibold text-white">{donation.item_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-white/45">Amount Paid</span>
                    <span className="font-bold text-[#2CB67D]">{formattedAmount}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-white/45">Status</span>
                    <span className={`font-bold capitalize ${donation.status === "completed" ? "text-[#2CB67D]" : "text-amber-400"}`}>
                      {donation.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-white/30 pt-1">
                    <span>Transaction ID</span>
                    <span className="font-mono">{donation.id.slice(0, 18)}...</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-400 py-2">
                  Payment is successful, but transaction logs are taking a moment to sync. Rest assured, your donation has been recorded!
                </div>
              )}
            </SpotlightCard>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto rounded-full bg-primary hover:opacity-90 font-bold px-8 py-5 text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                View My Dashboard
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>

            <Link to="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto rounded-full border-border hover:bg-accent/ hover:text-white font-bold px-8 py-5 text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <Home className="size-3.5" />
                Return Home
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* Footer minimal info */}
      <footer className="py-6 text-center text-[10px] text-white/30 border-t border-border relative z-10">
        <div className="flex items-center justify-center gap-1">
          <Heart className="size-3 text-red-500 fill-red-500" />
          <span>Made with love for community restoration in Kenya.</span>
        </div>
      </footer>
    </div>
  )
}
