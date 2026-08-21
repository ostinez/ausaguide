import { useState } from "react"
import { Leaf, TreePine, Sprout, Users, ArrowRight, Check, ShieldCheck, Globe, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { trackEvent } from "@/lib/posthog"
import { sendTreePlantingConfirmationEmail } from "@/lib/api/emails"
import { cn } from "@/lib/utils"

export interface TreePlantingProps {
  onComplete?: () => void
  className?: string
}

export function TreePlanting({ onComplete, className }: TreePlantingProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [trees, setTrees] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatedTreeId, setGeneratedTreeId] = useState("")

  const treeOptions = [1, 5, 10, 25, 50, 100]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email address.")
      return
    }

    setLoading(true)
    try {
      let finalTreeId = ""

      // 1. Try to invoke edge function for unique tree ID
      try {
        const { data } = await supabase.functions.invoke("generate-tree-id", {
          method: "GET",
        })
        if (data?.tree_id) {
          finalTreeId = data.tree_id
        }
      } catch (err) {
        console.warn("[TreePlanting] Edge function fallback:", err)
      }

      // 2. Client-side fallback if edge function is unreachable
      if (!finalTreeId) {
        try {
          const { count } = await supabase
            .from("tree_commitments")
            .select("*", { count: "exact", head: true })
          const nextIndex = (count || 0) + 1
          finalTreeId = `AUS-TREE-${nextIndex.toString().padStart(4, "0")}`
        } catch {
          const randomNum = Math.floor(1000 + Math.random() * 9000)
          finalTreeId = `AUS-TREE-${randomNum}`
        }
      }

      const userId = localStorage.getItem("user_id")

      // 3. Persist to Supabase
      const { error: dbError } = await supabase.from("tree_commitments").insert({
        user_id: userId || null,
        email: email.trim(),
        name: name.trim(),
        tree_name: `${trees} Indigenous Tree${trees > 1 ? "s" : ""}`,
        dedication: `Community Reforestation Initiative in Kenya (${trees} trees)`,
        tree_id: finalTreeId,
        status: "pending",
      })

      if (dbError) {
        console.error("[TreePlanting] Supabase insert warning:", dbError)
      }

      // 4. Send automated email confirmation
      sendTreePlantingConfirmationEmail(email.trim(), name.trim(), trees, finalTreeId).catch(
        (mailErr) => console.warn("[TreePlanting] Mail notice:", mailErr)
      )

      // 5. Track with PostHog
      trackEvent("tree_planted", {
        trees_count: trees,
        name: name.trim(),
        email: email.trim(),
        tree_id: finalTreeId,
      })

      setGeneratedTreeId(finalTreeId)
      setSubmitted(true)
      toast.success(`Thank you! You've pledged ${trees} tree${trees > 1 ? "s" : ""} to Kenya's forests.`)

      if (onComplete) onComplete()
    } catch (err: any) {
      console.error("[TreePlanting] Submission error:", err)
      toast.error(err.message || "Failed to submit tree pledge. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSubmitted(false)
    setName("")
    setEmail("")
    setTrees(1)
    setGeneratedTreeId("")
  }

  if (submitted) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-[#0a1a0f] to-[#1a3a2a] rounded-3xl p-8 md:p-12 text-center border border-emerald-700/40 shadow-2xl text-white relative overflow-hidden",
          className
        )}
      >
        <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
          <TreePine className="size-64 text-emerald-400" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto space-y-5">
          <div className="size-16 md:size-20 bg-emerald-500/20 border border-emerald-400/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Check className="size-8 md:size-10 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sprout className="size-3.5" />
              <span>Pledge Confirmed</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white font-headline">
              Thank You, {name.split(" ")[0]}!
            </h3>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
              You're helping plant <span className="font-bold text-emerald-300">{trees}</span>{" "}
              indigenous tree{trees > 1 ? "s" : ""} in Kenya. You're helping restore Kenya's forests and supporting local communities.
            </p>
          </div>

          {generatedTreeId && (
            <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-emerald-500/30 text-xs font-mono text-emerald-200">
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                Certificate & Tree Identifier
              </span>
              <span className="text-base md:text-lg font-bold text-white tracking-wider">
                {generatedTreeId}
              </span>
            </div>
          )}

          <p className="text-emerald-300/80 text-xs font-medium">
            Together with local hosts and travelers, we aim to plant native trees across Kenya's vital highland water towers.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 border border-emerald-500/50 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-500/20 transition-all font-semibold text-sm cursor-pointer min-h-[44px]"
            >
              Plant More Trees
            </button>
            <a
              href="/tree-planting"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-bold text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <span>Explore Initiative</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      className={cn(
        "bg-gradient-to-br from-[#0a1a0f] to-[#1a3a2a] rounded-3xl p-6 sm:p-8 md:p-12 border border-emerald-800/40 relative overflow-hidden shadow-2xl text-white",
        className
      )}
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <TreePine className="size-64 md:size-80 text-emerald-400" />
      </div>
      <div className="absolute bottom-0 left-0 opacity-5 pointer-events-none">
        <Leaf className="size-48 md:size-64 text-emerald-400" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold mb-3">
          <Sprout className="size-4" />
          <span className="uppercase tracking-wider">Social Impact</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-headline tracking-tight leading-tight">
          Plant a Tree, Travel Responsibly
        </h2>

        <p className="text-emerald-200 text-sm sm:text-base md:text-lg mt-2.5 max-w-2xl leading-relaxed font-normal">
          We aim to plant indigenous trees and restore native Kenyan forest buffers through traveler sponsorships.
        </p>

        {/* Stats / Goals */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-5 text-xs sm:text-sm">
          <span className="flex items-center gap-2 text-emerald-200 bg-white/[0.06] border border-emerald-700/30 px-3 py-1.5 rounded-full">
            <Users className="size-4 text-emerald-400" />
            <span>Community Initiative</span>
          </span>
          <span className="flex items-center gap-2 text-emerald-200 bg-white/[0.06] border border-emerald-700/30 px-3 py-1.5 rounded-full">
            <Leaf className="size-4 text-emerald-400" />
            <span>Target: <strong className="text-white font-bold">10,000+ Native Trees</strong></span>
          </span>
          <span className="hidden sm:flex items-center gap-2 text-emerald-200 bg-white/[0.06] border border-emerald-700/30 px-3 py-1.5 rounded-full">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Community Supervised</span>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-xl mt-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs sm:text-sm text-emerald-100 font-semibold block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                disabled={loading}
                className="tree-planting-input w-full px-4 py-3 rounded-xl text-white placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm text-emerald-100 font-semibold block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                className="tree-planting-input w-full px-4 py-3 rounded-xl text-white placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-sm text-emerald-100 font-semibold block mb-2">
              Number of Trees to Plant
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {treeOptions.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTrees(num)}
                  disabled={loading}
                  className={cn(
                    "h-11 sm:h-12 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center cursor-pointer min-h-[44px]",
                    trees === num
                      ? "bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-300 scale-102"
                      : "bg-white/10 text-emerald-100 hover:bg-white/20 border border-emerald-700/40"
                  )}
                >
                  {num} {num === 1 ? "Tree" : "Trees"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full min-h-[56px] py-3.5 tree-planting-button text-white font-bold rounded-xl text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-900/40 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Planting Your Trees...</span>
              </>
            ) : (
              <>
                <span>
                  Plant {trees} Tree{trees > 1 ? "s" : ""}
                </span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        {/* Trust badge */}
        <div className="flex items-center gap-2 text-emerald-300/80 text-xs mt-5 pt-2">
          <Globe className="size-4 text-emerald-400 shrink-0" />
          <span>100% of proceeds go to community reforestation projects in Kenya</span>
        </div>
      </div>
    </section>
  )
}
