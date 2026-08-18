import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ""
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
const BASE_URL = "https://ausaguide.com"

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    let tours: any[] = []
    let hosts: any[] = []

    if (supabase) {
      // 1. Fetch published tours
      const { data: tourData } = await supabase
        .from("tours")
        .select("id, updated_at")
        .eq("status", "published")
        .limit(500)
      if (tourData) tours = tourData

      // 2. Fetch host profiles
      const { data: hostData } = await supabase
        .from("profiles")
        .select("id, updated_at")
        .eq("role", "host")
        .limit(500)
      if (hostData) hosts = hostData
    }

    // 3. Static public pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/tours", priority: "0.9", changefreq: "daily" },
      { loc: "/about", priority: "0.8", changefreq: "monthly" },
      { loc: "/help", priority: "0.7", changefreq: "monthly" },
      { loc: "/tree-planting", priority: "0.8", changefreq: "weekly" },
      { loc: "/mental-health", priority: "0.8", changefreq: "weekly" },
      { loc: "/host-waitlist", priority: "0.8", changefreq: "weekly" },
      { loc: "/feed", priority: "0.8", changefreq: "daily" },
      { loc: "/map", priority: "0.7", changefreq: "weekly" },
      { loc: "/terms", priority: "0.4", changefreq: "yearly" },
      { loc: "/privacy", priority: "0.4", changefreq: "yearly" },
    ]

    const tourPages = (tours || []).map((t) => ({
      loc: `/tours/${t.id}`,
      lastmod: t.updated_at ? t.updated_at.split("T")[0] : new Date().toISOString().split("T")[0],
      priority: "0.8",
      changefreq: "weekly",
    }))

    const hostPages = (hosts || []).map((h) => ({
      loc: `/host/${h.id}`,
      lastmod: h.updated_at ? h.updated_at.split("T")[0] : new Date().toISOString().split("T")[0],
      priority: "0.7",
      changefreq: "weekly",
    }))

    const allPages = [...staticPages, ...tourPages, ...hostPages]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.loc}</loc>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ""}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`

    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200")
    return res.status(200).send(xml)
  } catch (err: any) {
    console.error("Sitemap generation error:", err)
    // Fallback basic XML
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ausaguide.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ausaguide.com/tours</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://ausaguide.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`
    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    return res.status(200).send(fallbackXml)
  }
}
