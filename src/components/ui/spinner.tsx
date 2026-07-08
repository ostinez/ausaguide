import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg"
}

/**
 * Spinner — spinning plus-sign loader.
 * Replacing the default loading spinner site-wide with a premium minimal spinning plus.
 * Includes a subtle pulsing purple glow (#7F5AF0) and smooth rotation.
 */
export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 64,
  }
  const pixelSize = sizeMap[size]
  const color = "#7F5AF0"
  
  // Calculate relative sizes for vertical & horizontal bars
  const armLen = pixelSize * 0.38
  const armShort = Math.max(1.5, pixelSize * 0.1)

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("relative flex items-center justify-center shrink-0", className)}
      style={{ width: pixelSize, height: pixelSize }}
      {...props}
    >
      <style>{`
        @keyframes spinner-plus-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spinner-plus-pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 ${pixelSize * 0.12}px ${color}88); }
          50%       { filter: drop-shadow(0 0 ${pixelSize * 0.22}px ${color}dd); }
        }
        .spinner-plus-wrap {
          animation:
            spinner-plus-spin 1.4s linear infinite,
            spinner-plus-pulse-glow 2.4s ease-in-out infinite;
        }
      `}</style>
      <svg
        className="spinner-plus-wrap"
        width={pixelSize}
        height={pixelSize}
        viewBox={`0 0 ${pixelSize} ${pixelSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Horizontal arm */}
        <rect
          x={(pixelSize / 2) - armLen}
          y={(pixelSize / 2) - armShort}
          width={armLen * 2}
          height={armShort * 2}
          rx={armShort}
          fill={color}
        />
        {/* Vertical arm */}
        <rect
          x={(pixelSize / 2) - armShort}
          y={(pixelSize / 2) - armLen}
          width={armShort * 2}
          height={armLen * 2}
          rx={armShort}
          fill={color}
        />
      </svg>
    </div>
  )
}
