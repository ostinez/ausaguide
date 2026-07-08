import type { ElementType, ReactNode, ComponentPropsWithoutRef, CSSProperties } from "react"
import "./StarBorder.css"

interface StarBorderProps<T extends ElementType = "button"> {
  as?: T
  color?: string
  speed?: string
  thickness?: number
  className?: string
  children?: ReactNode
}

export function StarBorder<T extends ElementType = "button">({
  as: Component = "button" as any,
  color = "#7F5AF0",
  speed = "4s",
  thickness = 2,
  className = "",
  children,
  ...props
}: StarBorderProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const ComponentTag = Component as any
  return (
    <ComponentTag
      className={`star-border-container ${className}`}
      style={{
        padding: `${thickness}px`,
        "--border-color": color,
        "--animation-speed": speed,
      } as CSSProperties}
      {...props}
    >
      <div className="star-border-glow" />
      <div className="star-border-content bg-[#16161A]">
        {children}
      </div>
    </ComponentTag>
  )
}
export default StarBorder
