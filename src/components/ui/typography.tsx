import React from "react"
import { cn } from "@/lib/utils"

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "h1" | "h2" | "h3" | "body" | "small" | "caption"
  as?: React.ElementType
}

export function Typography({
  variant = "body",
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  const Component = as || (variant === "body" ? "p" : variant)

  const styles = {
    h1: "scroll-m-20 text-[48px] font-extrabold tracking-tight leading-[1.2] font-sans text-foreground",
    h2: "scroll-m-20 text-[32px] font-semibold tracking-tight leading-[1.2] font-sans text-foreground",
    h3: "scroll-m-20 text-[24px] font-semibold tracking-tight leading-[1.2] font-sans text-foreground",
    body: "leading-[1.6] text-[16px] font-sans text-muted-foreground",
    small: "text-[14px] font-medium leading-none font-sans text-foreground",
    caption: "text-[12px] text-muted-foreground leading-none font-sans",
  }

  return (
    <Component className={cn(styles[variant], className)} {...props}>
      {children}
    </Component>
  )
}
