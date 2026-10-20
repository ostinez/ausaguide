import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { BrowserRouter } from "react-router-dom"
import FounderPage from "@/pages/Founder"

// Mock useSEO hook to capture SEO data
vi.mock("@/hooks/useSEO", () => ({
  useSEO: vi.fn(),
  default: vi.fn(),
}))

describe("Founder Page Unit & SEO Tests", () => {
  it("renders the headline and bio correctly", () => {
    render(
      <BrowserRouter>
        <FounderPage />
      </BrowserRouter>
    )

    // Headline check
    expect(
      screen.getByRole("heading", { name: /Austin Murithi Mbote — Founder & CEO/i })
    ).toBeInTheDocument()

    // Short Bio check
    expect(
      screen.getByText(/Austin is a 23-year-old entrepreneur based in Nairobi, Kenya/i)
    ).toBeInTheDocument()
  })

  it("renders social links for LinkedIn, X (Twitter), and Instagram", () => {
    render(
      <BrowserRouter>
        <FounderPage />
      </BrowserRouter>
    )

    const linkedinLink = screen.getByTitle(/LinkedIn/i)
    expect(linkedinLink).toHaveAttribute("href", expect.stringContaining("linkedin.com"))

    const twitterLink = screen.getByTitle(/Twitter/i)
    expect(twitterLink).toHaveAttribute("href", expect.stringContaining("twitter.com"))

    const instagramLink = screen.getByTitle(/Instagram/i)
    expect(instagramLink).toHaveAttribute("href", expect.stringContaining("instagram.com"))
  })

  it("injects valid Schema.org Person JSON-LD into the document head", () => {
    render(
      <BrowserRouter>
        <FounderPage />
      </BrowserRouter>
    )

    const script = document.head.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()

    const schema = JSON.parse(script!.textContent || "{}")
    expect(schema["@context"]).toBe("https://schema.org")
    expect(schema["@type"]).toBe("Person")
    expect(schema.name).toBe("Austin Murithi Mbote")
    expect(schema.jobTitle).toBe("Founder & CEO")
    expect(schema.worksFor).toEqual({
      "@type": "Organization",
      "name": "Ausaguide Limited",
    })
    expect(schema.url).toBe("https://ausaguide.com/founder")
    expect(Array.isArray(schema.sameAs)).toBe(true)
  })
})
