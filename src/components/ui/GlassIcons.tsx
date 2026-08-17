import React from "react"
import "./GlassIcons.css"

export interface GlassIconsItem {
 icon: React.ReactElement
 color: string
 label: string
 customClass?: string
 onClick?: () => void
 active?: boolean
}

export interface GlassIconsProps {
 items: GlassIconsItem[]
 className?: string
}

const gradientMapping: Record<string, string> = {
  blue: "linear-gradient(135deg, #0B3037 0%, #134E5E 100%)",
  purple: "linear-gradient(135deg, #0D6F73 0%, #06363D 100%)",
  red: "linear-gradient(135deg, #0B3037 0%, #134E5E 100%)",
  indigo: "linear-gradient(135deg, #0D6F73 0%, #06363D 100%)",
  orange: "linear-gradient(135deg, #0B3037 0%, #134E5E 100%)",
  green: "linear-gradient(135deg, #0D6F73 0%, #84BABF 100%)",
  teal: "linear-gradient(135deg, #0D6F73 0%, #06363D 100%)",
}

export const GlassIcons: React.FC<GlassIconsProps> = ({ items, className = "" }) => {
 const getBackgroundStyle = (color: string): React.CSSProperties => {
 if (gradientMapping[color]) {
 return { background: gradientMapping[color] }
 }
 return { background: color }
 }

 return (
 <div className={`icon-btns ${className}`}>
 {items.map((item, index) => (
 <button
 key={index}
 type="button"
 onClick={item.onClick}
 className={`icon-btn ${item.active ? "is-active" : ""} ${item.customClass || ""}`}
 aria-label={item.label}
 >
 <span className="icon-btn__back" style={getBackgroundStyle(item.color)}></span>
 <span className="icon-btn__front">
 <span className="icon-btn__icon" aria-hidden="true">
 {item.icon}
 </span>
 </span>
 <span className="icon-btn__label">{item.label}</span>
 </button>
 ))}
 </div>
 )
}

export default GlassIcons
