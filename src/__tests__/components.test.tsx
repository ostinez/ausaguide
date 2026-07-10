import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { BrowserRouter } from "react-router-dom"
import { StaggeredMenu } from "@/components/ui/StaggeredMenu"
import { BorderGlow } from "@/components/ui/BorderGlow"
import { GlassIcons } from "@/components/ui/GlassIcons"
import { GradientText } from "@/components/ui/GradientText"

// Mock GSAP since it touches DOM window/document APIs in ways that jsdom doesn't fully support
vi.mock("gsap", () => {
  const gsapMock = {
    to: vi.fn(),
    from: vi.fn(),
    set: vi.fn(),
    getProperty: vi.fn(() => 0),
    context: vi.fn((cb) => {
      if (cb) cb()
      return { revert: vi.fn() }
    }),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
      eventCallback: vi.fn().mockReturnThis(),
      play: vi.fn(),
      reverse: vi.fn(),
    })),
  }
  return {
    default: gsapMock,
    gsap: gsapMock,
  }
})

describe("Custom UI Components Unit Tests", () => {
  describe("StaggeredMenu", () => {
    it("renders hamburger button", () => {
      const items = [{ label: "Home", href: "/" }]
      render(
        <BrowserRouter>
          <StaggeredMenu items={items} />
        </BrowserRouter>
      )

      // Hamburger button should be in document
      const button = screen.getByRole("button", { name: /open menu/i })
      expect(button).toBeInTheDocument()
    })

    it("toggles class when button is clicked", () => {
      const items = [{ label: "Home", href: "/" }]
      render(
        <BrowserRouter>
          <StaggeredMenu items={items} />
        </BrowserRouter>
      )

      const button = screen.getByRole("button", { name: /open menu/i })
      fireEvent.click(button)
      // GSAP animate calls trigger, confirming it attempted to open
      expect(button).toHaveAttribute("aria-expanded", "true")
    })
  })

  describe("BorderGlow", () => {
    it("renders children inside glow wrapper", () => {
      render(
        <BorderGlow glowColor="2CB67D">
          <div data-testid="glow-child">Glow Content</div>
        </BorderGlow>
      )
      expect(screen.getByTestId("glow-child")).toBeInTheDocument()
    })
  })

  describe("GlassIcons", () => {
    it("renders active glass icon element", () => {
      const items = [
        {
          icon: <span data-testid="mock-icon">★</span>,
          color: "teal" as const,
          label: "Teal Star",
          active: true,
        },
      ]
      render(<GlassIcons items={items} />)
      expect(screen.getByTestId("mock-icon")).toBeInTheDocument()
      expect(screen.getByText("Teal Star")).toBeInTheDocument()
    })
  })

  describe("GradientText", () => {
    it("renders text content with animation inline styling options", () => {
      render(
        <GradientText colors={["#2CB67D", "#7F5AF0"]} animationSpeed={4}>
          Kenya Tours
        </GradientText>
      )
      expect(screen.getByText("Kenya Tours")).toBeInTheDocument()
    })
  })
})
