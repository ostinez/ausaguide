import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        // Standard iOS/Airbnb pill switch proportions
        size === "default" && "h-6 w-11 data-[state=checked]:bg-primary data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-700",
        size === "sm" && "h-5 w-9 data-[state=checked]:bg-primary data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-700",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out",
          size === "default" && "size-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5",
          size === "sm" && "size-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
