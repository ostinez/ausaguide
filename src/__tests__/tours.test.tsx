import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { BrowserRouter } from "react-router-dom"
import ToursPage from "@/pages/tours"
import type { Tour } from "@/lib/types"

// Mock fetchTours API
const mockTours: Tour[] = [
  {
    id: "tour-1",
    host_id: "host-123",
    title: "Beautiful Masai Mara Safari Tour",
    description: "Experience the real wilderness in Masai Mara.",
    short_description: "Real wilderness tour",
    price: 3500,
    currency: "KES",
    duration_hours: 48,
    max_guests: 8,
    location_name: "Masai Mara",
    latitude: -1.2921,
    longitude: 36.8219,
    category: "nature",
    tour_type: "in_person",
    images: ["/images/tours/safari.png"],
    highlights: ["Game drives", "Sunset views"],
    is_published: true,
    rating: 4.8,
    review_count: 12,
    availability: {},
    status: "published",
    tags: ["nature", "wildlife"],
    views: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

vi.mock("@/lib/api/tours", () => ({
  fetchTours: vi.fn(async () => mockTours),
  incrementTourViews: vi.fn(),
}))

vi.mock("@/lib/api/wishlist", () => ({
  fetchWishlist: vi.fn(async () => []),
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
}))

vi.mock("@/hooks/useSEO", () => ({
  useSEO: vi.fn(),
}))

vi.mock("@/lib/supabase")

describe("Tours Page Unit Tests", () => {
  it("renders tours page header and search interface", async () => {
    render(
      <BrowserRouter>
        <ToursPage />
      </BrowserRouter>
    )

    // Check title and filters exist
    expect(screen.getByText(/Explore Tours/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search tours or destinations/i)).toBeInTheDocument()
  })

  it("loads and displays tour cards", async () => {
    render(
      <BrowserRouter>
        <ToursPage />
      </BrowserRouter>
    )

    // Wait for mock tours to resolve
    await waitFor(() => {
      expect(screen.getByText("Beautiful Masai Mara Safari Tour")).toBeInTheDocument()
    })

    // Check tour card elements
    expect(screen.getByText("KES 3,500")).toBeInTheDocument()
    expect(screen.getAllByText(/Masai Mara/i)[0]).toBeInTheDocument()
  })

  it("search query updates input value", () => {
    render(
      <BrowserRouter>
        <ToursPage />
      </BrowserRouter>
    )

    const searchInput = screen.getByPlaceholderText(/Search tours or destinations/i) as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: "Mara" } })
    expect(searchInput.value).toBe("Mara")
  })
})
