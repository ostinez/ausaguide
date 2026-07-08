import React, { useRef } from "react"
import "./SpotlightCard.css"

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  spotlightColor?: string
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = "",
  spotlightColor = "rgba(127, 90, 240, 0.15)", // Default purple spotlight
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null)

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current) return

    const rect = divRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    divRef.current.style.setProperty("--mouse-x", `${x}px`)
    divRef.current.style.setProperty("--mouse-y", `${y}px`)
    divRef.current.style.setProperty("--spotlight-color", spotlightColor)

    // Call the parent onMouseMove handler if present
    if (props.onMouseMove) {
      props.onMouseMove(e)
    }
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`card-spotlight ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default SpotlightCard
