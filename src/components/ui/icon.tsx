import React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
  icon: LucideIcon
  size?: "sm" | "md" | "lg"
  accent?: boolean
}

export function Icon({
  icon: LucideIconComponent,
  size = "md",
  accent = false,
  className,
  ...props
}: IconProps) {
  const sizes = {
    sm: "size-4", // 16px
    md: "size-5", // 20px
    lg: "size-6", // 24px
  }

  return (
    <LucideIconComponent
      className={cn(
        sizes[size],
        accent ? "text-primary" : "text-current",
        className
      )}
      {...props}
    />
  )
}
export type { IconProps }
