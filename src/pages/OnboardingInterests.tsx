import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { OnboardingInterests } from "@/components/auth/OnboardingInterests"
import { supabase } from "@/lib/supabase"
import { useSEO } from "@/hooks/useSEO"

export default function OnboardingInterestsPage() {
  useSEO({
    title: "Personalize Your Kenya Travel | Ausaguide",
    description: "Choose your travel interests to get personalized tour and local guide recommendations in Kenya.",
  })

  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  return (
    <div className="min-h-screen bg-background pt-20 pb-16 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[140px]" />

      <div className="relative z-10 w-full max-w-2xl bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/40">
        <OnboardingInterests
          userId={userId}
          onComplete={() => navigate("/tours")}
          onSkip={() => navigate("/tours")}
        />
      </div>
    </div>
  )
}
