export type UserRole = "traveler" | "host" | "admin"
export type HostType = "local_host" | "certified_guide"
export type TourCategory = "culture" | "food" | "adventure" | "nature" | "city" | "nightlife"
export type TourType = "virtual" | "in_person"
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "checked_in" | "declined"
export type ApplicationStatus = "pending" | "approved" | "rejected"

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  bio: string | null
  location: string | null
  phone: string | null
  languages: string[]
  host_type: HostType | null
  is_verified: boolean
  created_at: string
  updated_at: string
  two_factor_enabled?: boolean
  two_factor_secret?: string | null
  two_factor_backup_codes?: string[]
  share_location?: boolean
  last_location_lat?: number | null
  last_location_lng?: number | null
  last_location_updated?: string | null
  host_tier?: "certified_guide" | "local_host" | null
  license_url?: string | null
  license_status?: "pending" | "approved" | "rejected" | null
  // Guide verification fields
  tra_number?: string | null
  kpsga_number?: string | null
  license_expiry?: string | null
  verified_guide?: boolean
  verification_date?: string | null
  verification_notes?: string | null
  rejected_as_guide?: boolean
  certificate_url?: string | null
  tiktok?: string | null
  instagram?: string | null
  facebook?: string | null
  reddit?: string | null
}

export interface Tour {
  id: string
  host_id: string
  title: string
  description: string
  short_description: string
  price: number
  currency: string
  duration_hours: number
  max_guests: number
  location_name: string
  latitude: number
  longitude: number
  category: TourCategory
  tour_type: TourType
  images: string[]
  highlights: string[]
  is_published: boolean
  rating: number
  review_count: number
  availability?: any
  status?: "draft" | "published"
  tags?: string[]
  views?: number
  physical_price?: number
  virtual_price?: number
  created_at: string
  updated_at: string
  host?: Profile
}

export interface Booking {
  id: string
  tour_id: string
  guest_id: string
  host_id: string
  booking_date: string
  check_in_date: string | null
  check_out_date: string | null
  guest_count: number
  status: BookingStatus
  total_price: number
  booking_type?: 'physical' | 'virtual'
  stripe_payment_intent_id: string | null
  daily_room_url: string | null
  guest_name: string
  guest_email: string
  guest_phone: string
  notes: string | null
  booking_time?: string | null
  decline_reason?: string | null
  status_history?: any
  created_at: string
  updated_at: string
  tour?: Tour
  host?: Profile
}

export interface Review {
  id: string
  tour_id?: string
  host_id: string
  guest_id?: string
  traveler_id?: string
  booking_id: string
  rating: number
  comment: string | null
  likes?: number
  complaints?: number
  status?: 'pending' | 'visible' | 'hidden'
  created_at: string
  guest?: Profile
  traveler?: Profile
  traveler_name?: string
}

export interface HostApplication {
  id: string
  user_id: string
  full_name: string
  email: string
  city: string
  host_type: HostType
  bio: string
  video_url: string | null
  id_upload_url: string | null
  license_upload_url: string | null
  rejection_reason: string | null
  status: ApplicationStatus
  created_at: string
  reviewed_at: string | null
}

export interface WishlistItem {
  id: string
  user_id: string
  tour_id: string
  created_at: string
  tour?: Tour
}

export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  tour_id: string | null
  entry_type: "virtual_experience" | "physical_experience"
  is_public: boolean
  external_link: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  booking_id: string
  sender_id: string
  receiver_id: string
  message: string
  content: string
  created_at: string
  sender?: Profile
}

export interface HostAvailability {
  id: string
  host_id: string
  day_of_week: number // 0 = Sunday, 1 = Monday, etc.
  start_time: string // e.g., "09:00"
  end_time: string // e.g., "17:00"
  guest_limit: number
}

export interface WaitingListEntry {
  id: string
  traveler_id: string
  tour_id: string
  host_id: string
  preferred_date: string
  auto_book: boolean
  status: "waiting" | "fulfilled" | "cancelled"
  created_at: string
}

export interface HostSettings {
  host_id: string
  reminder_time: number // in minutes, e.g., 15, 30, 60
  notification_preferences: string[] // e.g., ["email", "in_app"]
  is_busy: boolean
  busy_reason?: string
}

export interface Refund {
  id: string
  booking_id: string
  traveler_id: string
  host_id: string
  reason: string
  status: "pending" | "approved" | "rejected" | "refund_requested"
  created_at: string
}
