import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Map, Star } from "lucide-react"
import { STATS } from "@/lib/constants"

const icons = [Users, Map, Star]

export function StatsSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((stat, i) => {
            const Icon = icons[i]
            return (
              <Card
                key={stat.label}
                className={`border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-700 ${
                  visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <CardContent className="flex items-center gap-4 py-2">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
