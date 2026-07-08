import type { TourCategory, TourType } from "./types"

export const TOUR_CATEGORIES: { value: TourCategory; label: string }[] = [
  { value: "culture", label: "Culture" },
  { value: "food", label: "Food" },
  { value: "adventure", label: "Adventure" },
  { value: "nature", label: "Nature" },
  { value: "city", label: "City" },
  { value: "nightlife", label: "Nightlife" },
]

export const TOUR_TYPES: { value: TourType; label: string }[] = [
  { value: "virtual", label: "Virtual" },
  { value: "in_person", label: "In-Person" },
]

export const STATS = [
  { value: "500+", label: "Local Guides" },
  { value: "2,000+", label: "Unique Tours" },
  { value: "4.9", label: "Avg Rating" },
]

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Find a Tour",
    description: "Browse authentic experiences led by local guides on our website or mobile browser.",
  },
  {
    step: 2,
    title: "Book with Confidence",
    description: "Choose your date and time slot, and securely book with direct guide payout.",
  },
  {
    step: 3,
    title: "Virtual Tour",
    description: "Join a live video call via Daily.co to explore destinations and ask questions virtually.",
  },
  {
    step: 4,
    title: "Physical Tour",
    description: "Meet your local host in person at the destination for a rich cultural walk or wildlife safari.",
  },
]

export const NAV_LINKS = [
  { href: "/tours", label: "Explore Tours" },
  { href: "/map", label: "Map" },
  { href: "/help", label: "Help" },
]
