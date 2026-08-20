import { useState } from "react"
import { Sparkles, Video, Car, Utensils, Backpack, Clock, MapPin, ChevronDown, ChevronUp, CheckCircle2, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GuidancePrompt {
  id: string
  icon: LucideIcon
  label: string
  badge: string
  color: string
  text?: string
  action?: string
}

interface TourInclusionsGuidanceProps {
  userRole?: "traveler" | "host" | "admin" | "user"
  tourName?: string | null
  onSelectPrompt: (text: string) => void
  onShareVideoCall: () => void
  isSharingVideo?: boolean
}

export default function TourInclusionsGuidance({
  userRole = "user",
  tourName,
  onSelectPrompt,
  onShareVideoCall,
  isSharingVideo = false,
}: TourInclusionsGuidanceProps) {
  const [expanded, setExpanded] = useState(false)
  const isHost = userRole === "host"

  const HOST_PROMPTS: GuidancePrompt[] = [
    {
      id: "video_call",
      icon: Video,
      label: "Share Video Meeting Room",
      badge: "Live Call",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
      action: "video",
    },
    {
      id: "inclusions_list",
      icon: Backpack,
      label: "Tour Inclusions Checklist",
      badge: "Inclusions",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      text: `📋 Tour Inclusions for ${tourName || "our experience"}:\n• Professional local guide\n• Transport & fuel\n• Park entry & activity permits\n• Bottled drinking water\n\nLet me know if you need any additional custom arrangements!`,
    },
    {
      id: "meals_diet",
      icon: Utensils,
      label: "Meal & Dietary Needs",
      badge: "Food",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
      text: "🍽️ Regarding meals during the tour: Do you or anyone in your party have any dietary preferences, allergies, or requirements (e.g., vegetarian, vegan, halal, gluten-free)?",
    },
    {
      id: "pickup_logistics",
      icon: Car,
      label: "Pickup Location & Time",
      badge: "Transport",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
      text: "🚗 Transport & Pickup: Please share your hotel or pickup address and your preferred start time so I can plan our route smoothly.",
    },
    {
      id: "timing_pace",
      icon: Clock,
      label: "Pace & Timing",
      badge: "Schedule",
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30",
      text: "⏱️ Schedule & Pace: Would you prefer an early sunrise start or a more relaxed pace with extra time for photography and breaks?",
    },
  ]

  const TRAVELER_PROMPTS: GuidancePrompt[] = [
    {
      id: "video_request",
      icon: Video,
      label: "Request Video Call with Host",
      badge: "Live Chat",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
      text: "📹 Hi! I'd love to hop on a quick live video call to discuss our tour details and itinerary. Are you available for a brief chat?",
    },
    {
      id: "inclusions_inquiry",
      icon: Backpack,
      label: "Ask About What's Included",
      badge: "Inclusions",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      text: `🎒 Could you confirm the main inclusions for ${tourName || "this tour"}? Specifically regarding entrance fees, meals, and transport?`,
    },
    {
      id: "pickup_inquiry",
      icon: Car,
      label: "Request Hotel Pickup",
      badge: "Pickup",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
      text: "🚗 Is hotel pickup and drop-off included, or can we arrange pickup from our accommodation?",
    },
    {
      id: "dietary_request",
      icon: Utensils,
      label: "Share Dietary Requirements",
      badge: "Meals",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
      text: "🍽️ We have specific dietary preferences for our meals during the tour. Could you let us know what food options will be available?",
    },
    {
      id: "custom_stop",
      icon: MapPin,
      label: "Request Custom Stop / Highlight",
      badge: "Customization",
      color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
      text: "📍 Is it possible to add a custom stop or spend extra time at specific scenic viewpoints during our itinerary?",
    },
  ]

  const prompts = isHost ? HOST_PROMPTS : TRAVELER_PROMPTS

  return (
    <div className="bg-muted/40 border-b border-border/80 px-3 py-2 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <p className="text-xs font-semibold text-foreground truncate">
            {isHost ? "Tour Inclusions & Host Guidance" : "Tour Planning & Inclusions"}
          </p>
          <span className="hidden sm:inline text-[10px] text-muted-foreground">
            • Discuss key points & inclusions
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isHost && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onShareVideoCall}
              disabled={isSharingVideo}
              className="h-7 text-[11px] font-semibold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20 gap-1.5 shadow-xs"
            >
              <Video className="size-3.5" />
              <span>{isSharingVideo ? "Creating Room…" : "Share Video Room"}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
          >
            <span className="text-[11px] mr-1">{expanded ? "Hide" : "Prompts"}</span>
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Quick Chips Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar">
        {prompts.map((p) => {
          const Icon = p.icon
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (p.action === "video") {
                  onShareVideoCall()
                } else if (p.text) {
                  onSelectPrompt(p.text)
                }
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap cursor-pointer transition-all hover:scale-102 active:scale-98 ${p.color}`}
            >
              <Icon className="size-3" />
              <span>{p.label}</span>
            </button>
          )
        })}
      </div>

      {/* Expanded Guidance View */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-card border border-border/80 space-y-1">
            <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
              <CheckCircle2 className="size-3.5" />
              <span>Key Points to Align:</span>
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Transport & exact meeting/pickup point</li>
              <li>Meal preferences, water & dietary needs</li>
              <li>Park permits & gear included vs required</li>
              <li>Departure time & weather expectations</li>
            </ul>
          </div>

          <div className="p-2.5 rounded-xl bg-card border border-border/80 space-y-1.5">
            <p className="text-xs font-bold text-foreground">1-Click Quick Message:</p>
            <div className="space-y-1">
              {prompts.slice(1, 3).map((p) => (
                <button
                  key={`exp-${p.id}`}
                  type="button"
                  onClick={() => p.text && onSelectPrompt(p.text)}
                  className="w-full text-left p-1.5 rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors text-[11px] line-clamp-1 border border-border/40"
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
