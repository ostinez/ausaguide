import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { CookieBanner } from "@/components/layout/CookieBanner"
import SignupPage, { SignUpForm } from "@/pages/Signup"
import { StepVerifyID } from "@/pages/Onboarding"
import { VerifyIdentity } from "@/pages/VerifyIdentity"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { TermsGateModal } from "@/components/auth/TermsGateModal"

// Mock Supabase
vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(() => Promise.resolve({
          data: {
            session: {
              user: {
                id: "test-user-123",
                email: "test@example.com",
                user_metadata: {},
              },
            },
          },
          error: null,
        })),
        getUser: vi.fn(() => Promise.resolve({
          data: {
            user: {
              id: "test-user-123",
              email: "test@example.com",
              user_metadata: {},
            },
          },
          error: null,
        })),
        signUp: vi.fn(() => Promise.resolve({
          data: { user: { id: "new-user-123", email: "new@example.com" } },
          error: null,
        })),
        updateUser: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "test-user-123",
            role: "traveler",
            terms_agreed: false,
          },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: { url: "https://verify.didit.me/session-123" },
          error: null,
        }),
      },
    },
  }
})

// Mock PostHog analytics
vi.mock("@/lib/posthog", () => ({
  identifyUser: vi.fn(),
  trackEvent: vi.fn(),
}))

describe("Trust & Compliance Layer Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // ─────────────────────────────────────────────────────────
  // TASK 1: Cookie Consent Banner
  // ─────────────────────────────────────────────────────────
  describe("TASK 1: Cookie Consent Banner", () => {
    it("renders the banner with exact copy and links to /privacy and /terms", () => {
      render(
        <MemoryRouter>
          <CookieBanner />
        </MemoryRouter>
      )

      // Copy verification
      expect(
        screen.getByText(/We use cookies\./i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Not the chocolate chip kind, but the ones that keep you logged in and help us improve the site\./i)
      ).toBeInTheDocument()

      // Links verification
      const privacyLink = screen.getByRole("link", { name: /Privacy Policy/i })
      const termsLink = screen.getByRole("link", { name: /Terms of Service/i })
      expect(privacyLink).toHaveAttribute("href", "/privacy")
      expect(termsLink).toHaveAttribute("href", "/terms")

      // Accept button verification
      expect(screen.getByRole("button", { name: /Accept/i })).toBeInTheDocument()
    })

    it("clicking Accept sets cookie_consent = 'true' in localStorage and hides banner", async () => {
      render(
        <MemoryRouter>
          <CookieBanner />
        </MemoryRouter>
      )

      const acceptBtn = screen.getByRole("button", { name: /Accept/i })
      fireEvent.click(acceptBtn)

      expect(localStorage.getItem("cookie_consent")).toBe("true")
      expect(screen.queryByText(/Not the chocolate chip kind/i)).not.toBeInTheDocument()
    })

    it("does not render if cookie_consent is already true in localStorage", () => {
      localStorage.setItem("cookie_consent", "true")

      render(
        <MemoryRouter>
          <CookieBanner />
        </MemoryRouter>
      )

      expect(screen.queryByText(/We use cookies\./i)).not.toBeInTheDocument()
    })

    it("clicking the dismiss button hides the banner", () => {
      render(
        <MemoryRouter>
          <CookieBanner />
        </MemoryRouter>
      )

      const dismissBtn = screen.getByRole("button", { name: /Dismiss cookie banner/i })
      fireEvent.click(dismissBtn)

      expect(screen.queryByText(/Not the chocolate chip kind/i)).not.toBeInTheDocument()
    })
  })

  // ─────────────────────────────────────────────────────────
  // TASK 2: Strict Terms of Service Gate on Signup
  // ─────────────────────────────────────────────────────────
  describe("TASK 2: Strict Terms of Service Gate on Signup", () => {
    it("renders mandatory checkbox with links opening in a new tab", () => {
      render(
        <MemoryRouter>
          <SignupPage />
        </MemoryRouter>
      )

      const checkbox = screen.getByRole("checkbox", { name: /I agree to the Terms of Service and Privacy Policy\./i })
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()

      // Links inside checkbox label open in new tab
      const termsLink = screen.getByRole("link", { name: /^Terms of Service$/i })
      const privacyLink = screen.getByRole("link", { name: /^Privacy Policy$/i })
      expect(termsLink).toHaveAttribute("href", "/terms")
      expect(termsLink).toHaveAttribute("target", "_blank")
      expect(privacyLink).toHaveAttribute("href", "/privacy")
      expect(privacyLink).toHaveAttribute("target", "_blank")
    })

    it("disables Continue button when checkbox is not checked, and enables when checked", async () => {
      render(
        <MemoryRouter>
          <SignUpForm />
        </MemoryRouter>
      )

      const continueBtn = screen.getByRole("button", { name: /Continue/i })
      const checkbox = screen.getByRole("checkbox", { name: /I agree to the Terms of Service and Privacy Policy\./i })

      // Initially unchecked -> Continue button must be disabled
      expect(checkbox).not.toBeChecked()
      expect(continueBtn).toBeDisabled()

      // Check the checkbox -> Continue button must be enabled
      await userEvent.click(checkbox)
      expect(checkbox).toBeChecked()
      expect(continueBtn).toBeEnabled()

      // Uncheck again -> Continue button disabled
      await userEvent.click(checkbox)
      expect(checkbox).not.toBeChecked()
      expect(continueBtn).toBeDisabled()
    })
  })

  // ─────────────────────────────────────────────────────────
  // TASK 3: Redesign the Verification Page (Onboarding & VerifyIdentity)
  // ─────────────────────────────────────────────────────────
  describe("TASK 3: Redesigned Verification Page", () => {
    it("StepVerifyID in Onboarding renders ShieldCheck, anxiety-reducing headline, subtext, trust bullets, and privacy link", () => {
      render(
        <MemoryRouter>
          <StepVerifyID userId="test-user-123" onComplete={() => {}} />
        </MemoryRouter>
      )

      // Headline
      expect(
        screen.getByText("Let's make sure you're you. (No, we don't want your firstborn).")
      ).toBeInTheDocument()

      // Subtext
      expect(
        screen.getByText(/We know scanning your ID feels a bit invasive\. But in a world of catfish and scammers/i)
      ).toBeInTheDocument()

      // Trust bullets
      expect(screen.getByText("We don't sell your data. Ever.")).toBeInTheDocument()
      expect(screen.getByText("Bank-level encryption.")).toBeInTheDocument()
      expect(screen.getByText("We don't store your selfies after verification.")).toBeInTheDocument()

      // Link to privacy
      const privacyLink = screen.getByRole("link", { name: /Read how we protect your data/i })
      expect(privacyLink).toHaveAttribute("href", "/privacy")
      expect(privacyLink).toHaveAttribute("target", "_blank")
    })

    it("VerifyIdentity standalone component renders all anxiety-reducing elements", () => {
      render(
        <MemoryRouter>
          <VerifyIdentity userId="test-user-123" />
        </MemoryRouter>
      )

      expect(
        screen.getByText("Let's make sure you're you. (No, we don't want your firstborn).")
      ).toBeInTheDocument()
      expect(
        screen.getByText(/We know scanning your ID feels a bit invasive/i)
      ).toBeInTheDocument()
      expect(screen.getByText("We don't sell your data. Ever.")).toBeInTheDocument()
      expect(screen.getByText("Bank-level encryption.")).toBeInTheDocument()
      expect(screen.getByText("We don't store your selfies after verification.")).toBeInTheDocument()
      expect(
        screen.getByRole("link", { name: /Read how we protect your data/i })
      ).toHaveAttribute("href", "/privacy")
    })
  })

  // ─────────────────────────────────────────────────────────
  // TASK 4: T&C Gate Blocks Dashboard Access
  // ─────────────────────────────────────────────────────────
  describe("TASK 4: T&C Gate Blocks Dashboard Access", () => {
    it("blocks access to protected routes when user has not agreed to T&Cs", async () => {
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route element={<ProtectedRoute allowedRoles={["traveler"]} />}>
              <Route path="/dashboard" element={<div data-testid="secret-dashboard">Secret Dashboard Data</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      // Dashboard content should NOT be rendered
      await waitFor(() => {
        expect(screen.queryByTestId("secret-dashboard")).not.toBeInTheDocument()
      })

      // Instead, Terms of Service gate modal is rendered
      expect(screen.getByText(/Terms of Service & Privacy Policy/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Before accessing your dashboard, please review and accept our Terms of Service/i)
      ).toBeInTheDocument()

      // Continue to Dashboard button is disabled until checked
      const checkbox = screen.getByRole("checkbox")
      const continueBtn = screen.getByRole("button", { name: /Continue to Dashboard/i })
      expect(continueBtn).toBeDisabled()

      // Checking checkbox enables button
      await userEvent.click(checkbox)
      expect(continueBtn).toBeEnabled()
    })

    it("allows access once user accepts terms via the gate modal", async () => {
      const onAgreedMock = vi.fn()

      render(
        <MemoryRouter>
          <TermsGateModal userId="test-user-123" onAgreed={onAgreedMock} />
        </MemoryRouter>
      )

      const checkbox = screen.getByRole("checkbox")
      const continueBtn = screen.getByRole("button", { name: /Continue to Dashboard/i })

      await userEvent.click(checkbox)
      await userEvent.click(continueBtn)

      await waitFor(() => {
        expect(localStorage.getItem("terms_agreed")).toBe("true")
        expect(localStorage.getItem("terms_agreed_test-user-123")).toBe("true")
        expect(onAgreedMock).toHaveBeenCalledTimes(1)
      })
    })

    it("allows direct access to dashboard when terms are already agreed in localStorage", async () => {
      localStorage.setItem("terms_agreed", "true")
      localStorage.setItem("terms_agreed_test-user-123", "true")

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route element={<ProtectedRoute allowedRoles={["traveler"]} />}>
              <Route path="/dashboard" element={<div data-testid="secret-dashboard">Secret Dashboard Data</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId("secret-dashboard")).toBeInTheDocument()
      })
    })
  })
})
