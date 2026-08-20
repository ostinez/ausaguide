import { useState } from "react"
import { Smile, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void
  disabled?: boolean
}

const EMOJI_CATEGORIES = [
  {
    name: "Frequent & Reactions",
    emojis: ["👍", "❤️", "🔥", "😂", "🙏", "🎉", "👏", "😍", "✨", "🙌", "💯", "😊", "👌", "🤩", "🤝", "🥳"],
  },
  {
    name: "Travel & Safari",
    emojis: ["✈️", "🏖️", "🦁", "🐘", "🦒", "🦓", "🏔️", "🌅", "🚗", "🧭", "🎒", "📸", "🏨", "🌴", "🏕️", "🗺️", "🧳", "⛵", "🌊", "☀️"],
  },
  {
    name: "Food & Drinks",
    emojis: ["☕", "🍽️", "🍹", "🥩", "🥗", "🍕", "🍔", "🍉", "🍍", "🥥", "🥂", "🍻", "🥑", "🥘"],
  },
  {
    name: "Activities & Nature",
    emojis: ["🏃‍♂️", "🚴", "🏊", "🏄", "🎣", "🌲", "🌺", "🌸", "🌻", "🌿", "🐾", "🐒", "🐆", "🦜"],
  },
  {
    name: "Gestures & Smileys",
    emojis: ["👋", "✌️", "🤙", "💪", "😎", "🤗", "🥳", "😇", "🤔", "🫡", "😃", "😄", "😁", "😆", "🥹"],
  },
]

export default function EmojiPickerPopover({ onSelectEmoji, disabled }: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredCategories = EMOJI_CATEGORIES.map((cat) => ({
    ...cat,
    emojis: cat.emojis.filter((e) => !search.trim() || e.includes(search.trim())),
  })).filter((cat) => cat.emojis.length > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="size-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 transition-colors"
          title="Add emoji"
          aria-label="Add emoji"
        >
          <Smile className="size-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        className="w-72 sm:w-80 p-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl z-50 animate-in fade-in zoom-in-95"
      >
        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="w-full bg-muted/60 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Emojis list */}
        <div className="max-h-60 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No emojis found
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.name}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                  {cat.name}
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {cat.emojis.map((emoji, idx) => (
                    <button
                      key={`${emoji}-${idx}`}
                      type="button"
                      onClick={() => {
                        onSelectEmoji(emoji)
                      }}
                      className="size-8 rounded-lg flex items-center justify-center text-lg hover:bg-primary/15 hover:scale-125 active:scale-95 transition-all cursor-pointer select-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
