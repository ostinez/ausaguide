import { useEffect } from "react"

const DEFAULT_TITLE = "Ausaguide — Live tours with real locals in Kenya"
const DEFAULT_DESCRIPTION =
  "See destinations live before you book. Connect with real locals in Kenya for unfiltered virtual tours."
const DEFAULT_IMAGE = "https://ausaguide.com/og-image.png"
const BASE_URL = "https://ausaguide.com"

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: "website" | "article"
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

export function useSEO({ title, description, image, url, type = "website" }: SEOProps) {
  useEffect(() => {
    const resolvedTitle = title ? `${title} | Ausaguide` : DEFAULT_TITLE
    const resolvedDescription = description || DEFAULT_DESCRIPTION
    const resolvedImage = image || DEFAULT_IMAGE
    const resolvedUrl = url || `${BASE_URL}${window.location.pathname}`

    // Document title
    document.title = resolvedTitle

    // Standard meta
    setMeta("description", resolvedDescription, "name")

    // Open Graph
    setMeta("og:type", type)
    setMeta("og:url", resolvedUrl)
    setMeta("og:title", resolvedTitle)
    setMeta("og:description", resolvedDescription)
    setMeta("og:image", resolvedImage)

    // Twitter Card
    setMeta("twitter:card", "summary_large_image")
    setMeta("twitter:url", resolvedUrl)
    setMeta("twitter:title", resolvedTitle)
    setMeta("twitter:description", resolvedDescription)
    setMeta("twitter:image", resolvedImage)

    // Restore defaults on unmount
    return () => {
      document.title = DEFAULT_TITLE
      setMeta("description", DEFAULT_DESCRIPTION, "name")
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
    }
  }, [title, description, image, url, type])
}
