import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { BrowserRouter } from "react-router-dom"
import AuthPage from "@/pages/auth"

// Mock Supabase using our local mock
vi.mock("@/lib/supabase")

// Mock PostHog analytics
vi.mock("@/lib/posthog", () => ({
  identifyUser: vi.fn(),
  trackEvent: vi.fn(),
}))

// Mock Rate Limiting
vi.mock("@/lib/api/rate-limit", () => ({
  checkRateLimit: vi.fn(() => Promise.resolve({ allowed: true, resetAt: new Date() })),
  getLoginKey: vi.fn(() => "mock-key"),
}))

describe("Auth Page Unit Tests", () => {
  it("renders login form successfully", () => {
    render(
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    )

    // Check tabs and core forms exist
    expect(screen.getByRole("tab", { name: /Log In/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Sign Up/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Log In$/i })).toBeInTheDocument()
  })

  it("renders signup form when signup tab is clicked", async () => {
    render(
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    )

    const signUpTab = screen.getByRole("tab", { name: /Sign Up/i })
    await userEvent.click(signUpTab)

    // Signup form inputs should render
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Create a password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Get Started/i })).toBeInTheDocument()
  })

  it("Google OAuth button exists", () => {
    render(
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    )

    const googleBtn = screen.getByRole("button", { name: /Google/i })
    expect(googleBtn).toBeInTheDocument()
  })
})
