import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import WaitlistPage from "@/pages/Waitlist"
import { supabase } from "@/lib/supabase"

// Mock Supabase
vi.mock("@/lib/supabase", () => {
  const insertMock = vi.fn()
  const fromMock = vi.fn(() => ({
    insert: insertMock,
  }))
  return {
    supabase: {
      from: fromMock,
    },
  }
})

// Mock PostHog
vi.mock("@/lib/posthog", () => ({
  trackEvent: vi.fn(),
  identifyUser: vi.fn(),
}))

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe("Waitlist Page Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the headline, subheadline, input, warm orange CTA, and privacy note", () => {
    render(
      <MemoryRouter>
        <WaitlistPage />
      </MemoryRouter>
    )

    // Prominent Headline
    expect(
      screen.getByRole("heading", { name: /See Nairobi Live/i })
    ).toBeInTheDocument()

    // Subheadline with vision
    expect(
      screen.getByText(/Our vision is a world where anyone can travel to a new place and feel like a local—before they even leave home\./i)
    ).toBeInTheDocument()

    // Email Input field with placeholder
    const emailInput = screen.getByPlaceholderText("Enter your email address")
    expect(emailInput).toBeInTheDocument()

    // Button: Join the Waitlist
    const submitBtn = screen.getByRole("button", { name: /^Join the Waitlist$/i })
    expect(submitBtn).toBeInTheDocument()

    // Microcopy note
    expect(
      screen.getByText(/No spam\. Just launch updates\./i)
    ).toBeInTheDocument()
  })

  it("shows red error message when attempting to submit with an invalid email", async () => {
    render(
      <MemoryRouter>
        <WaitlistPage />
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText("Enter your email address")
    const submitBtn = screen.getByRole("button", { name: /^Join the Waitlist$/i })

    // Type invalid email
    await userEvent.type(emailInput, "not-an-email")
    await userEvent.click(submitBtn)

    expect(screen.getByText(/Please enter a valid email address\./i)).toBeInTheDocument()
  })

  it("submits valid email to Supabase waitlist table and renders success state", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    ;(supabase.from as any).mockReturnValue({ insert: insertMock })

    render(
      <MemoryRouter>
        <WaitlistPage />
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText("Enter your email address")
    const submitBtn = screen.getByRole("button", { name: /^Join the Waitlist$/i })

    await userEvent.type(emailInput, "traveler@example.com")
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("waitlist")
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "traveler@example.com",
          role: "traveler",
        })
      )
    })

    // Replaced with success state: "You're on the list! We'll be in touch soon."
    await waitFor(() => {
      expect(
        screen.getByText(/You're on the list! We'll be in touch soon\./i)
      ).toBeInTheDocument()
    })
  })

  it("handles duplicate email error gracefully with a red text message", async () => {
    const insertMock = vi.fn().mockResolvedValue({
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    })
    ;(supabase.from as any).mockReturnValue({ insert: insertMock })

    render(
      <MemoryRouter>
        <WaitlistPage />
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText("Enter your email address")
    const submitBtn = screen.getByRole("button", { name: /^Join the Waitlist$/i })

    await userEvent.type(emailInput, "existing@example.com")
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/This email is already on our waitlist\./i)
      ).toBeInTheDocument()
    })
  })
})
