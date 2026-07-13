import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Globe, Camera, Play } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"

const footerLinks = {
  explore: [
    { href: "/tours", label: "Tours" },
    { href: "/map", label: "Live Map" },
    { href: "/feed", label: "Community Feed" },
  ],
  community: [
    { href: "/journal", label: "Travel Journal" },
    { href: "/wishlist", label: "Wishlist" },
    { href: "/tree-planting", label: "Tree Planting" },
    { href: "/mental-health", label: "Mental Health Support" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/help", label: "Help & FAQ" },
    { href: "/onboarding?become-host=true", label: "Become a Host" },
    { href: "/settings", label: "Account Settings" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Use" },
  ],
}

export function Footer() {
  const userId = localStorage.getItem("user_id")
  const userRole = localStorage.getItem("user_role") || "traveler"
  const [hasAppliedHost, setHasAppliedHost] = useState(false)

  useEffect(() => {
    if (userId) {
      async function checkHost() {
        try {
          const { data } = await supabase
            .from("hosts")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle()
          if (data) setHasAppliedHost(true)
        } catch (err) {
          console.error(err)
        }
      }
      checkHost()
    }
  }, [userId])

  const showBecomeHost = !userId || (userRole === "traveler" && !hasAppliedHost)
  const filteredCompanyLinks = footerLinks.company.filter(link => {
    if (link.href === "/onboarding?become-host=true" || link.href === "/host/signup") {
      return showBecomeHost
    }
    return true
  })

  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src="/logo-primary.png"
                alt="Ausaguide"
                width={160}
                height={32}
                className="h-10 w-auto block object-contain"
              />
              <div id="footer-brand-fallback" className="items-center gap-2" style={{ display: "none" }}>
                <Globe className="size-5 text-teal" />
                <span className="text-lg font-bold text-foreground">Ausaguide</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Be a Local. Share Your World.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Follow Us</p>
              <div className="flex flex-wrap gap-2">
                <a href="https://instagram.com/ausaguide" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-accent/5 border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 hover:border-accent transition-all">
                  <Camera className="size-3.5" />
                  <span>Instagram</span>
                </a>
                <a href="https://twitter.com/ausaguide" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-accent/5 border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 hover:border-accent transition-all">
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span>X (Twitter)</span>
                </a>
                <a href="https://youtube.com/@ausaguide" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-accent/5 border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 hover:border-accent transition-all">
                  <Play className="size-3.5" />
                  <span>YouTube</span>
                </a>
                <a href="https://tiktok.com/@ausaguide" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-accent/5 border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 hover:border-accent transition-all">
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.97 1.15 2.37 1.95 3.85 2.22l-.01 3.94c-1.39-.02-2.78-.37-3.99-1.07-.63-.36-1.19-.84-1.65-1.42l-.01 7.21c.05 1.58-.33 3.19-1.12 4.54-1.08 1.83-2.92 3.17-5.02 3.59-1.63.35-3.37.19-4.9-.45-1.89-.78-3.47-2.31-4.32-4.18-.89-1.92-1.07-4.18-.49-6.22C3.04 8.76 4.79 6.84 7.07 6c1.39-.53 2.92-.6 4.38-.2l-.01 4.09c-.93-.31-1.97-.24-2.85.22-.9.46-1.57 1.3-1.82 2.29-.32 1.14-.11 2.39.54 3.39.63.97 1.69 1.64 2.84 1.8 1.15.18 2.36-.14 3.25-.89.84-.71 1.29-1.78 1.25-2.88V.02h-.01z"/></svg>
                  <span>TikTok</span>
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Explore</h3>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Company</h3>
            <ul className="space-y-2">
              {filteredCompanyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Ausaguide. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {import.meta.env.DEV && (
              <button
                onClick={() => { throw new Error('Test error for Sentry'); }}
                className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground hover:underline transition-colors cursor-pointer"
              >
                Test Sentry
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
