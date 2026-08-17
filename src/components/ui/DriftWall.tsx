import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import "./DriftWall.css"

export interface DriftItem {
  image: string
  title: string
  href?: string
}

export interface DriftWallProps {
  items: DriftItem[]
  columns?: number
  tileWidth?: number
  tileHeight?: number
  gap?: number
  radius?: number
  grayscale?: boolean
  dim?: number
  overlayColor?: string
  speed?: number
  fade?: boolean
  backgroundColor?: string
  className?: string
}

export function DriftWall({
  items = [],
  columns = 5,
  tileWidth = 200,
  tileHeight = 130,
  gap = 16,
  radius = 14,
  grayscale = true,
  dim = 0.55,
  overlayColor = "#0D6F73",
  speed = 40,
  fade = true,
  backgroundColor = "#06363D",
  className = "",
}: DriftWallProps) {
  const navigate = useNavigate()

  // Distribute items across the columns and duplicate them to ensure seamless infinite looping
  const columnData = useMemo(() => {
    if (!items.length) return []

    const cols: DriftItem[][] = Array.from({ length: columns }, () => [])

    // Ensure we have at least 8-10 items per column for continuous seamless drifting
    const targetItemsPerCol = 10
    const totalNeeded = columns * targetItemsPerCol
    const expandedItems: DriftItem[] = []

    while (expandedItems.length < totalNeeded) {
      expandedItems.push(...items)
    }

    expandedItems.slice(0, totalNeeded).forEach((item, index) => {
      cols[index % columns].push(item)
    })

    // Duplicate each column array so when it translates -50%, it seamlessly wraps around
    return cols.map((col) => [...col, ...col])
  }, [items, columns])

  const handleTileClick = (href?: string) => {
    if (!href) return
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer")
    } else {
      navigate(href)
    }
  }

  if (!items.length) {
    return (
      <div className={`drift-wall-container ${className}`}>
        <div className="flex items-center justify-center h-full w-full text-muted-foreground text-sm">
          No tours or posts available yet.
        </div>
      </div>
    )
  }

  const cssVars = {
    "--dw-gap": `${gap}px`,
    "--dw-radius": `${radius}px`,
    "--dw-tile-width": `${tileWidth}px`,
    "--dw-tile-height": `${tileHeight}px`,
    "--dw-dim": `${dim}`,
    "--dw-overlay-color": overlayColor,
    "--dw-speed": `${speed}s`,
    "--dw-bg": backgroundColor,
  } as React.CSSProperties

  return (
    <div className={`drift-wall-container ${className}`} style={cssVars}>
      <div className="drift-wall-viewport">
        {columnData.map((colItems, colIdx) => {
          const isUp = colIdx % 2 === 0
          // Slightly vary speed per column for organic drifting feel
          const colSpeed = speed + (colIdx % 3) * 6 - 3
          return (
            <div
              key={colIdx}
              className={`drift-wall-column ${isUp ? "drift-up" : "drift-down"}`}
              style={{
                animationDuration: `${colSpeed}s`,
                animationDelay: `${(colIdx * 1.5) % 5}s`,
              }}
            >
              {colItems.map((item, itemIdx) => (
                <div
                  key={`${colIdx}-${itemIdx}`}
                  className={`drift-wall-tile ${dim ? "is-dimmed" : ""} ${
                    grayscale ? "is-grayscale" : ""
                  }`}
                  onClick={() => handleTileClick(item.href)}
                  role={item.href ? "button" : undefined}
                  tabIndex={item.href ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleTileClick(item.href)
                    }
                  }}
                  title={item.title}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="drift-wall-tile-overlay" />
                  <div className="drift-wall-tile-gradient" />
                  <div className="drift-wall-tile-title">{item.title}</div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {fade && (
        <>
          <div className="drift-wall-mask" />
          <div className="drift-wall-edge-vignette" />
        </>
      )}
    </div>
  )
}

export default DriftWall
