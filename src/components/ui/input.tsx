import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean
}

function Input({ className, type, error, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20",
        error ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : "border-border/80",
        className
      )}
      {...props}
    />
  )
}

export { Input }
