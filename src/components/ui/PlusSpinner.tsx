import { cn } from "@/lib/utils"

/**
 * PlusSpinner — a premium spinning plus-sign loader.
 *
 * Matches the StaggeredMenu aesthetic: dark, minimal, purple-glowing.
 * Drop-in replacement wherever <Spinner /> is used for full-page / section loaders.
 * For small inline spinners (size-4 / size-3), the existing Spinner is still fine.
 */

interface PlusSpinnerProps {
  className?: string
  /** Controls overall size. Defaults to 48px. */
  size?: number
  /** Primary glow colour. Defaults to brand purple. */
  color?: string
}

export function PlusSpinner({
  className,
  size = 48,
  color = "#7F5AF0",
}: PlusSpinnerProps) {
  const armLen = size * 0.38                               // arm half-length
  const armShort = size * 0.12                             // arm half-width (rounded cap)

  return (
    <>
      <style>{`
        @keyframes plus-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes plus-pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 ${size * 0.12}px ${color}88); }
          50%       { filter: drop-shadow(0 0 ${size * 0.22}px ${color}dd); }
        }
        .plus-spinner-wrap {
          animation:
            plus-spin 1.4s linear infinite,
            plus-pulse-glow 2.4s ease-in-out infinite;
        }
      `}</style>

      <div
        role="status"
        aria-label="Loading"
        className={cn("inline-flex items-center justify-center shrink-0", className)}
        style={{ width: size, height: size }}
      >
        <svg
          className="plus-spinner-wrap"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Horizontal arm */}
          <rect
            x={(size / 2) - armLen}
            y={(size / 2) - armShort}
            width={armLen * 2}
            height={armShort * 2}
            rx={armShort}
            fill={color}
          />
          {/* Vertical arm */}
          <rect
            x={(size / 2) - armShort}
            y={(size / 2) - armLen}
            width={armShort * 2}
            height={armLen * 2}
            rx={armShort}
            fill={color}
          />
        </svg>
      </div>
    </>
  )
}
