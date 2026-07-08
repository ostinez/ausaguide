import type { Tour, Booking, Profile, TourCategory, TourType, BookingStatus } from "./types"

export const MOCK_HOST: Profile = {
  id: "h1",
  email: "amina@example.com",
  full_name: "Amina Osei",
  avatar_url: null,
  role: "host",
  bio: "Passionate food guide based in Nairobi.",
  location: "Nairobi",
  phone: null,
  languages: ["English", "Swahili"],
  host_type: "local_host",
  is_verified: true,
  created_at: "2025-01-15T00:00:00Z",
  updated_at: "2025-06-01T00:00:00Z",
}

export const MOCK_TRAVELER: Profile = {
  id: "t1",
  email: "james@example.com",
  full_name: "James Mwangi",
  avatar_url: null,
  role: "traveler",
  bio: null,
  location: "London",
  phone: null,
  languages: ["English"],
  host_type: null,
  is_verified: false,
  created_at: "2025-03-10T00:00:00Z",
  updated_at: "2025-06-01T00:00:00Z",
}

const tour = (
  id: string,
  title: string,
  category: TourCategory,
  tourType: TourType,
  price: number,
  rating: number,
  reviewCount: number,
  published: boolean,
): Tour => ({
  id,
  host_id: "h1",
  title,
  description: "",
  short_description: "",
  price,
  currency: "KES",
  duration_hours: 3,
  max_guests: 8,
  location_name: "Nairobi, Kenya",
  latitude: -1.29,
  longitude: 36.82,
  category,
  tour_type: tourType,
  images: [],
  highlights: [],
  is_published: published,
  rating,
  review_count: reviewCount,
  created_at: "2025-02-01T00:00:00Z",
  updated_at: "2025-06-01T00:00:00Z",
  host: MOCK_HOST,
})

export const MOCK_HOST_TOURS: Tour[] = [
  tour("t1", "Nairobi Street Food Safari", "food", "in_person", 3500, 4.9, 47, true),
  tour("t2", "Karen Blixen Museum Tour", "culture", "in_person", 2800, 4.7, 23, true),
  tour("t3", "Virtual Nairobi Night Markets", "nightlife", "virtual", 1200, 4.8, 61, true),
  tour("t4", "Karura Forest Walk", "nature", "in_person", 4000, 5.0, 12, false),
]

const booking = (
  id: string,
  tourId: string,
  guestName: string,
  date: string,
  status: BookingStatus,
  total: number,
  guestCount: number,
): Booking => ({
  id,
  tour_id: tourId,
  guest_id: "t1",
  host_id: "h1",
  booking_date: date,
  check_in_date: null,
  check_out_date: null,
  guest_count: guestCount,
  status,
  total_price: total,
  stripe_payment_intent_id: null,
  daily_room_url: null,
  guest_name: guestName,
  guest_email: `${guestName.toLowerCase().replace(" ", ".")}@email.com`,
  guest_phone: "+254700000000",
  notes: null,
  created_at: "2025-05-01T00:00:00Z",
  updated_at: "2025-06-01T00:00:00Z",
  tour: MOCK_HOST_TOURS.find((t) => t.id === tourId),
})

export const MOCK_HOST_BOOKINGS: Booking[] = [
  booking("b1", "t1", "Sarah Chen", "2026-07-05", "confirmed", 7000, 2),
  booking("b2", "t2", "John Smith", "2026-07-08", "pending", 2800, 1),
  booking("b3", "t3", "Maria Garcia", "2026-07-02", "confirmed", 3600, 3),
  booking("b4", "t1", "David Kim", "2026-06-20", "completed", 3500, 1),
  booking("b5", "t2", "Emma Wilson", "2026-06-15", "completed", 5600, 2),
  booking("b6", "t3", "Alex Thompson", "2026-06-10", "cancelled", 1200, 1),
]

export const MOCK_TRAVELER_BOOKINGS: Booking[] = [
  booking("b7", "t1", "James Mwangi", "2026-07-12", "confirmed", 3500, 1),
  booking("b8", "t3", "James Mwangi", "2026-07-18", "pending", 2400, 2),
  booking("b9", "t2", "James Mwangi", "2026-05-20", "completed", 2800, 1),
  booking("b10", "t1", "James Mwangi", "2026-04-10", "completed", 7000, 2),
]

export const MOCK_HOST_STATS = {
  totalTours: 4,
  totalBookings: 6,
  totalEarnings: 23700,
  avgRating: 4.85,
}
