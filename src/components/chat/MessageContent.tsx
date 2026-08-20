import React from "react"
import { ExternalLink, Video } from "lucide-react"

interface MessageContentProps {
  text: string
  isMe?: boolean
}

// Regex to detect URLs
const URL_REGEX = /(https?:\/\/[^\s]+)/g

// Check if string contains only 1-3 emojis
const ONLY_EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s){1,8}$/u

export default function MessageContent({ text, isMe }: MessageContentProps) {
  if (!text) return null

  // If text is only 1-3 emojis, make them larger (WhatsApp style)
  const isOnlyEmoji = ONLY_EMOJI_REGEX.test(text.trim()) && text.trim().length <= 12

  if (isOnlyEmoji) {
    return <span className="text-3xl leading-normal inline-block select-none">{text}</span>
  }

  // Split text by URLs and render links
  const parts = text.split(URL_REGEX)

  return (
    <span className="break-words leading-relaxed whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.match(URL_REGEX)) {
          const isDailyLink = part.includes("daily.co")

          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={
                isDailyLink
                  ? `inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-lg text-xs font-semibold underline underline-offset-2 ${
                      isMe
                        ? "bg-white/20 text-white hover:bg-white/30"
                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                    }`
                  : `underline underline-offset-2 font-medium break-all ${
                      isMe
                        ? "text-white/95 hover:text-white"
                        : "text-primary hover:text-primary/80"
                    }`
              }
            >
              {isDailyLink && <Video className="size-3.5 inline shrink-0" />}
              <span>{part}</span>
              {!isDailyLink && <ExternalLink className="size-3 inline shrink-0 ml-0.5 opacity-75" />}
            </a>
          )
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
      })}
    </span>
  )
}
