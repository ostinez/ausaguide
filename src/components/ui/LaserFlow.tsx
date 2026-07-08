import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface LaserFlowProps {
  className?: string
  /** Primary brand colours for the beams */
  colors?: string[]
  /** Overall opacity of the canvas — keep low (0.04–0.12) so content reads */
  opacity?: number
}

/**
 * LaserFlow — animated diagonal laser-beam background.
 *
 * Pure canvas-based, hardware-accelerated. No external dependencies.
 * Designed to sit behind page content as a subtle atmospheric effect.
 */
export default function LaserFlow({
  className,
  colors = ["#7F5AF0", "#2CB67D", "#9B72F7", "#3DD9A4"],
  opacity = 0.07,
}: LaserFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    /** Resize handler — fills the parent container */
    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    /* ── Beam definitions ──────────────────────────────────────────────── */
    interface Beam {
      x: number          // current head x
      y: number          // current head y
      angle: number      // radians
      speed: number      // px / frame
      length: number     // trail length
      width: number      // stroke width
      color: string
      alpha: number      // 0-1 brightness
      delay: number      // frames before beam starts moving
      life: number       // current frame counter
      reset: () => void
    }

    const BEAM_COUNT = 18

    function makeBeam(): Beam {
      const colorIdx = Math.floor(Math.random() * colors.length)
      const angleDeg = -35 + Math.random() * 70  // −35° to +35°
      const angle = (angleDeg * Math.PI) / 180
      const w = canvas!.width
      const h = canvas!.height

      // Start from left edge or top edge, randomly
      const startEdge = Math.random() > 0.5 ? "left" : "top"
      const x = startEdge === "left" ? -50 : Math.random() * w
      const y = startEdge === "top" ? -50 : Math.random() * h

      const beam: Beam = {
        x,
        y,
        angle,
        speed: 1.5 + Math.random() * 3,
        length: 80 + Math.random() * 200,
        width: 0.5 + Math.random() * 1.5,
        color: colors[colorIdx],
        alpha: 0.5 + Math.random() * 0.5,
        delay: Math.floor(Math.random() * 120),
        life: 0,
        reset() {},
      }

      beam.reset = () => {
        const colorIdx2 = Math.floor(Math.random() * colors.length)
        const angleDeg2 = -35 + Math.random() * 70
        beam.angle = (angleDeg2 * Math.PI) / 180
        beam.speed = 1.5 + Math.random() * 3
        beam.length = 80 + Math.random() * 200
        beam.width = 0.5 + Math.random() * 1.5
        beam.color = colors[colorIdx2]
        beam.alpha = 0.5 + Math.random() * 0.5
        beam.delay = Math.floor(Math.random() * 60)
        beam.life = 0

        const edge2 = Math.random() > 0.5 ? "left" : "top"
        beam.x = edge2 === "left" ? -50 : Math.random() * w
        beam.y = edge2 === "top" ? -50 : Math.random() * h
      }

      return beam
    }

    const beams: Beam[] = Array.from({ length: BEAM_COUNT }, makeBeam)

    /* ── Animation loop ─────────────────────────────────────────────────── */
    function draw() {
      if (!canvas || !ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const beam of beams) {
        beam.life++

        // Wait for delay
        if (beam.life < beam.delay) continue

        // Move beam head
        beam.x += Math.cos(beam.angle) * beam.speed
        beam.y += Math.sin(beam.angle) * beam.speed

        // Reset when off-screen
        const margin = beam.length + 100
        if (
          beam.x > canvas.width + margin ||
          beam.y > canvas.height + margin ||
          beam.x < -margin ||
          beam.y < -margin
        ) {
          beam.reset()
          continue
        }

        // Tail start
        const tailX = beam.x - Math.cos(beam.angle) * beam.length
        const tailY = beam.y - Math.sin(beam.angle) * beam.length

        // Gradient from transparent (tail) → bright (head) → transparent (tip)
        const grad = ctx.createLinearGradient(tailX, tailY, beam.x, beam.y)
        grad.addColorStop(0, `${beam.color}00`)
        grad.addColorStop(0.5, `${beam.color}${Math.round(beam.alpha * 255).toString(16).padStart(2, "0")}`)
        grad.addColorStop(1, `${beam.color}00`)

        ctx.save()
        ctx.strokeStyle = grad
        ctx.lineWidth = beam.width
        ctx.shadowColor = beam.color
        ctx.shadowBlur = beam.width * 6
        ctx.globalAlpha = opacity * 14  // boost since the global opacity is very low
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(beam.x, beam.y)
        ctx.stroke()
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [colors, opacity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className
      )}
      style={{ opacity }}
    />
  )
}
