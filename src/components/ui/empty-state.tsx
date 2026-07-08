import React from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onActionClick?: () => void
}

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  actionLabel,
  onActionClick,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-[16px] bg-card/25 min-h-[300px] transition-all",
        className
      )}
      {...props}
    >
      {IconComponent && (
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 animate-pulse">
          <IconComponent className="size-6" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onActionClick && (
        <Button onClick={onActionClick} size="sm" variant="default" className="rounded-full">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
export type { EmptyStateProps }
