import type { TourCategory, TourType } from "./types"

export type FilterTag = "virtual" | "in-person" | "walking" | "food" | "nature"

const CATEGORY_GRADIENTS: Record<TourCategory, string> = {
  food: "linear-gradient(135deg, #78350f99 0%, #92400e66 100%)",
  nature: "linear-gradient(135deg, #14532d99 0%, #16653466 100%)",
  culture: "linear-gradient(135deg, #1e3a5f99 0%, #1e3a8a66 100%)",
  adventure: "linear-gradient(135deg, #1e293b99 0%, #33415566 100%)",
  city: "linear-gradient(135deg, #701a7599 0%, #86198f66 100%)",
  nightlife: "linear-gradient(135deg, #3b0764aa 0%, #4c1d9566 100%)",
}

// Curated high-quality, authentic Kenyan photography mapping
const CATEGORY_IMAGES: Record<TourCategory, string> = {
  food: "/images/tours/street_food.png", // Nairobi street food
  nature: "/images/tours/safari.png", // Maasai Mara safari
  culture: "/images/tours/village.png", // Traditional village
  adventure: "/images/tours/safari.png", // Safari adventures
  city: "/images/tours/village.png", // Village walks
  nightlife: "/images/tours/street_food.png", // Food markets
}

const CATEGORY_GALLERIES: Record<TourCategory, string[]> = {
  food: [
    "/images/tours/street_food.png",
    "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"
  ],
  nature: [
    "/images/tours/safari.png",
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=600&auto=format&fit=crop&q=80"
  ],
  culture: [
    "/images/tours/village.png",
    "https://images.unsplash.com/photo-1489641493513-ba4ee84ccea9?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&auto=format&fit=crop&q=80"
  ],
  adventure: [
    "/images/tours/safari.png",
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80"
  ],
  city: [
    "/images/tours/village.png",
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&auto=format&fit=crop&q=80"
  ],
  nightlife: [
    "/images/tours/street_food.png",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80"
  ],
}

// Title-specific detailed mappings
const TITLE_IMAGES: Record<string, string> = {
  "nairobi street food safari": "/images/tours/street_food.png",
  "nairobi national park safari": "/images/tours/safari.png",
  "kibera community walk": "/images/tours/village.png",
  "nairobi night food tour": "/images/tours/street_food.png",
}

export function getTourImage(tour: { title: string; category: TourCategory; images?: string[] }): string {
  if (tour.images && tour.images.length > 0 && tour.images[0].trim() !== "") {
    return tour.images[0]
  }

  const cleanTitle = tour.title.toLowerCase().trim()
  if (TITLE_IMAGES[cleanTitle]) {
    return TITLE_IMAGES[cleanTitle]
  }

  return CATEGORY_IMAGES[tour.category] || CATEGORY_IMAGES.nature
}

export function getTourGallery(tour: { title: string; category: TourCategory; images?: string[] }): string[] {
  if (tour.images && tour.images.length > 1) {
    return tour.images
  }
  
  const baseImg = getTourImage(tour)
  const categoryGallery = CATEGORY_GALLERIES[tour.category] || CATEGORY_GALLERIES.nature
  
  return [baseImg, ...categoryGallery]
}

export function getTourGradient(category: TourCategory): string {
  return CATEGORY_GRADIENTS[category]
}

export function getTourFilterTags(tour: {
  tour_type: TourType
  category: TourCategory
}): FilterTag[] {
  const tags: FilterTag[] = []

  if (tour.tour_type === "virtual") {
    tags.push("virtual")
  } else {
    tags.push("in-person")
  }

  if (tour.category === "food") tags.push("food")
  if (tour.category === "nature" || tour.category === "adventure") tags.push("nature")
  if (tour.category === "culture" || tour.category === "city") tags.push("walking")

  return tags
}

export function formatTourPrice(price: number, currency: string): string {
  if (currency === "KES") {
    return `KES ${price.toLocaleString()}`
  }
  return `${currency} ${price.toLocaleString()}`
}

export function getHostInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function formatViews(views: number): string {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1).replace(/\.0$/, "") + "M views"
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1).replace(/\.0$/, "") + "k views"
  }
  return `${views} view${views !== 1 ? "s" : ""}`
}
