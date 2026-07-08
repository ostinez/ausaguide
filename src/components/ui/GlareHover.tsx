import { useRef, useState, useCallback } from "react"
import "./GlareHover.css"

interface GlareHoverProps {
  children: React.ReactNode
  glareColor?: string
  glareOpacity?: number
  glareAngle?: number
  glareSize?: number
  transitionDuration?: number
  playOnce?: boolean
  className?: string
  style?: React.CSSProperties
}

export function GlareHover({
  children,
  glareColor = "#FFFFFF",
  glareOpacity = 0.15,
  glareAngle = -30,
  glareSize = 200,
  transitionDuration = 600,
  playOnce = false,
  className = "",
  style,
}: GlareHoverProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({
    opacity: 0,
    background: "transparent",
    transition: `opacity ${transitionDuration}ms ease, background ${transitionDuration}ms ease`,
  })
  const hasPlayedRef = useRef(false)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!wrapperRef.current) return
      if (playOnce && hasPlayedRef.current) return

      const rect = wrapperRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const xPct = (x / rect.width) * 100
      const yPct = (y / rect.height) * 100

      // Build a radial glare that follows the cursor, offset by glareAngle
      const angleRad = (glareAngle * Math.PI) / 180
      const offsetX = Math.cos(angleRad) * 30
      const offsetY = Math.sin(angleRad) * 30

      setOverlayStyle({
        opacity: 1,
        background: `radial-gradient(
          circle at ${xPct + offsetX}% ${yPct + offsetY}%,
          ${glareColor} 0%,
          transparent ${glareSize}%
        )`,
        backgroundSize: "100% 100%",
        mixBlendMode: "overlay" as const,
        transition: `opacity ${transitionDuration}ms ease`,
      })
    },
    [glareColor, glareAngle, glareSize, transitionDuration, playOnce]
  )

  const handleMouseEnter = useCallback(() => {
    if (playOnce && hasPlayedRef.current) return
    hasPlayedRef.current = true
  }, [playOnce])

  const handleMouseLeave = useCallback(() => {
    setOverlayStyle((prev) => ({
      ...prev,
      opacity: 0,
      transition: `opacity ${transitionDuration}ms ease`,
    }))
  }, [transitionDuration])

  return (
    <div
      ref={wrapperRef}
      className={`glare-hover-wrapper ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className="glare-hover-overlay"
        style={{
          ...overlayStyle,
          opacity: (overlayStyle.opacity as number) * glareOpacity * 5,
        }}
        aria-hidden="true"
      />
    </div>
  )
}
