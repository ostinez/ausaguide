import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSocialLink(platform: "instagram" | "tiktok" | "facebook" | "reddit", value: string | null | undefined): string {
  if (!value) return ""
  const clean = value.trim()
  if (!clean) return ""
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean
  }
  const handle = clean.startsWith("@") ? clean.substring(1) : clean
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${handle}`
    case "tiktok":
      return `https://tiktok.com/@${handle}`
    case "facebook":
      return `https://facebook.com/${handle}`
    case "reddit":
      return `https://reddit.com/u/${handle}`
    default:
      return clean
  }
}
