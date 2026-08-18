import { useEffect } from "react"

const DEFAULT_TITLE = "Ausaguide — Try Before You Fly | Live Tours in Kenya"
const DEFAULT_DESCRIPTION =
  "Experience Kenya live before you book. Connect directly with verified local hosts for unfiltered virtual tours, private safaris, and authentic cultural walks."
const DEFAULT_KEYWORDS =
  "Kenya tours, local guides Kenya, Nairobi tours, live video tours, try before you fly, Kenya safaris, Maasai Mara, Mombasa travel"
const DEFAULT_IMAGE = "https://ausaguide.com/og-image.png"
const BASE_URL = "https://ausaguide.com"

export interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: "website" | "article" | "product"
  jsonLd?: Record<string, any>
}

function setMeta(property: string, content: string, attr: "name" | "property" = "property") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${property}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function setCanonical(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement("link")
    link.setAttribute("rel", "canonical")
    document.head.appendChild(link)
  }
  link.setAttribute("href", url)
}

export function useSEO({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const resolvedTitle = title ? `${title} | Ausaguide` : DEFAULT_TITLE
    const resolvedDescription = description || DEFAULT_DESCRIPTION
    const resolvedKeywords = keywords || DEFAULT_KEYWORDS
    const resolvedImage = image || DEFAULT_IMAGE
    const resolvedUrl = url || `${BASE_URL}${window.location.pathname}`

    // 1. Document Title
    document.title = resolvedTitle

    // 2. Standard Search Meta
    setMeta("description", resolvedDescription, "name")
    setMeta("keywords", resolvedKeywords, "name")

    // 3. Canonical Link
    setCanonical(resolvedUrl)

    // 4. Open Graph (Facebook / LinkedIn / WhatsApp)
    setMeta("og:type", type)
    setMeta("og:url", resolvedUrl)
    setMeta("og:title", resolvedTitle)
    setMeta("og:description", resolvedDescription)
    setMeta("og:image", resolvedImage)
    setMeta("og:site_name", "Ausaguide")

    // 5. Twitter Cards
    setMeta("twitter:card", "summary_large_image")
    setMeta("twitter:url", resolvedUrl)
    setMeta("twitter:title", resolvedTitle)
    setMeta("twitter:description", resolvedDescription)
    setMeta("twitter:image", resolvedImage)

    // 6. JSON-LD Structured Data
    let jsonLdScript: HTMLScriptElement | null = null
    if (jsonLd) {
      jsonLdScript = document.createElement("script")
      jsonLdScript.type = "application/ld+json"
      jsonLdScript.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(jsonLdScript)
    }

    // Cleanup on page unmount
    return () => {
      document.title = DEFAULT_TITLE
      setMeta("description", DEFAULT_DESCRIPTION, "name")
      setMeta("keywords", DEFAULT_KEYWORDS, "name")
      setMeta("og:type", "website")
      setMeta("og:url", BASE_URL)
      setMeta("og:title", DEFAULT_TITLE)
      setMeta("og:description", DEFAULT_DESCRIPTION)
      setMeta("og:image", DEFAULT_IMAGE)
      setMeta("twitter:card", "summary_large_image")
      setMeta("twitter:url", BASE_URL)
      setMeta("twitter:title", DEFAULT_TITLE)
      setMeta("twitter:description", DEFAULT_DESCRIPTION)
      setMeta("twitter:image", DEFAULT_IMAGE)

      if (jsonLdScript && document.head.contains(jsonLdScript)) {
        document.head.removeChild(jsonLdScript)
      }
    }
  }, [title, description, keywords, image, url, type, jsonLd])
}

export default useSEO
