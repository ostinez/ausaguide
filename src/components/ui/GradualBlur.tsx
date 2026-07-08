// React Bits GradualBlur — TypeScript port
// Original: github.com/ansh-dhanani

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  type CSSProperties,
} from 'react'
import './GradualBlur.css'

/* ── Types ──────────────────────────────────────────────────────────────── */

type Position = 'top' | 'bottom' | 'left' | 'right'
type Curve = 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'
type Target = 'parent' | 'page'
type PresetKey =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'subtle' | 'intense' | 'smooth' | 'sharp'
  | 'header' | 'footer' | 'sidebar'
  | 'page-header' | 'page-footer'

export interface GradualBlurProps {
  position?: Position
  strength?: number
  height?: string
  width?: string
  divCount?: number
  exponential?: boolean
  curve?: Curve
  opacity?: number
  animated?: boolean | 'scroll'
  duration?: string
  easing?: string
  hoverIntensity?: number
  target?: Target
  preset?: PresetKey
  responsive?: boolean
  zIndex?: number
  onAnimationComplete?: () => void
  className?: string
  style?: CSSProperties
}

/* ── Config defaults ────────────────────────────────────────────────────── */

const DEFAULT_CONFIG: Required<Omit<GradualBlurProps, 'width' | 'hoverIntensity' | 'preset' | 'onAnimationComplete'>> = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  responsive: false,
  target: 'parent',
  className: '',
  style: {},
}

const PRESETS: Partial<Record<PresetKey, Partial<GradualBlurProps>>> = {
  top: { position: 'top', height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  left: { position: 'left', height: '6rem' },
  right: { position: 'right', height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth: { height: '8rem', curve: 'bezier', divCount: 10 },
  sharp: { height: '5rem', curve: 'linear', divCount: 4 },
  header: { position: 'top', height: '8rem', curve: 'ease-out' },
  footer: { position: 'bottom', height: '8rem', curve: 'ease-out' },
  sidebar: { position: 'left', height: '6rem', strength: 2.5 },
  'page-header': { position: 'top', height: '10rem', target: 'page', strength: 3 },
  'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 },
}

/* ── Curve functions ────────────────────────────────────────────────────── */

const CURVE_FUNCTIONS: Record<Curve, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  'ease-in': (p) => p * p,
  'ease-out': (p) => 1 - Math.pow(1 - p, 2),
  'ease-in-out': (p) =>
    p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function mergeConfigs<T extends object>(...configs: Partial<T>[]): T {
  return configs.reduce<T>((acc, c) => ({ ...acc, ...c }), {} as T)
}

function getGradientDirection(position: Position): string {
  const map: Record<Position, string> = {
    top: 'to top',
    bottom: 'to bottom',
    left: 'to left',
    right: 'to right',
  }
  return map[position]
}

function debounce<A extends unknown[]>(fn: (...a: A) => void, wait: number) {
  let t: ReturnType<typeof setTimeout>
  return (...a: A) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...a), wait)
  }
}

/* ── Hooks ──────────────────────────────────────────────────────────────── */

function useResponsiveDimension(
  responsive: boolean,
  config: GradualBlurProps,
  key: 'height' | 'width'
): string | undefined {
  const [value, setValue] = useState<string | undefined>(config[key])

  useEffect(() => {
    if (!responsive) return
    const calc = () => {
      const w = window.innerWidth
      const capKey = key[0].toUpperCase() + key.slice(1)
      let v: string | undefined = config[key]
      if (w <= 480 && (config as Record<string, unknown>)[`mobile${capKey}`])
        v = (config as Record<string, unknown>)[`mobile${capKey}`] as string
      else if (w <= 768 && (config as Record<string, unknown>)[`tablet${capKey}`])
        v = (config as Record<string, unknown>)[`tablet${capKey}`] as string
      else if (w <= 1024 && (config as Record<string, unknown>)[`desktop${capKey}`])
        v = (config as Record<string, unknown>)[`desktop${capKey}`] as string
      setValue(v)
    }
    const debounced = debounce(calc, 100)
    calc()
    window.addEventListener('resize', debounced)
    return () => window.removeEventListener('resize', debounced)
  }, [responsive, config, key])

  return responsive ? value : config[key]
}

function useIntersectionObserver(
  ref: React.RefObject<HTMLDivElement | null>,
  shouldObserve = false
): boolean {
  const [isVisible, setIsVisible] = useState(!shouldObserve)

  useEffect(() => {
    if (!shouldObserve || !ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, shouldObserve])

  return isVisible
}

/* ── Component ──────────────────────────────────────────────────────────── */

function GradualBlur(props: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const config = useMemo<GradualBlurProps>(() => {
    const presetConfig =
      props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {}
    return mergeConfigs<GradualBlurProps>(DEFAULT_CONFIG, presetConfig ?? {}, props)
  }, [props])

  const responsiveHeight = useResponsiveDimension(
    config.responsive ?? false,
    config,
    'height'
  )
  const responsiveWidth = useResponsiveDimension(
    config.responsive ?? false,
    config,
    'width'
  )

  const isVisible = useIntersectionObserver(
    containerRef,
    config.animated === 'scroll'
  )

  const blurDivs = useMemo(() => {
    const divs: React.ReactElement[] = []
    const divCount = config.divCount ?? 5
    const increment = 100 / divCount
    const currentStrength =
      isHovered && config.hoverIntensity
        ? (config.strength ?? 2) * config.hoverIntensity
        : (config.strength ?? 2)

    const curveFunc =
      CURVE_FUNCTIONS[config.curve as Curve] ?? CURVE_FUNCTIONS.linear

    for (let i = 1; i <= divCount; i++) {
      let progress = i / divCount
      progress = curveFunc(progress)

      let blurValue: number
      if (config.exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * currentStrength
      } else {
        blurValue = 0.0625 * (progress * divCount + 1) * currentStrength
      }

      const p1 = Math.round((increment * i - increment) * 10) / 10
      const p2 = Math.round(increment * i * 10) / 10
      const p3 = Math.round((increment * i + increment) * 10) / 10
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10

      let gradient = `transparent ${p1}%, black ${p2}%`
      if (p3 <= 100) gradient += `, black ${p3}%`
      if (p4 <= 100) gradient += `, transparent ${p4}%`

      const direction = getGradientDirection(config.position as Position)

      const divStyle: CSSProperties = {
        position: 'absolute',
        inset: '0',
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity: config.opacity,
        transition:
          config.animated && config.animated !== 'scroll'
            ? `backdrop-filter ${config.duration} ${config.easing}`
            : undefined,
      }

      divs.push(<div key={i} style={divStyle} />)
    }

    return divs
  }, [config, isHovered])

  const containerStyle = useMemo<CSSProperties>(() => {
    const isVertical = ['top', 'bottom'].includes(config.position as string)
    const isHorizontal = ['left', 'right'].includes(config.position as string)
    const isPageTarget = config.target === 'page'

    const baseStyle: CSSProperties = {
      position: isPageTarget ? 'fixed' : 'absolute',
      pointerEvents: config.hoverIntensity ? 'auto' : 'none',
      opacity: isVisible ? 1 : 0,
      transition: config.animated
        ? `opacity ${config.duration} ${config.easing}`
        : undefined,
      zIndex: isPageTarget
        ? (config.zIndex ?? 1000) + 100
        : (config.zIndex ?? 1000),
      ...config.style,
    }

    if (isVertical) {
      ;(baseStyle as Record<string, unknown>).height = responsiveHeight
      ;(baseStyle as Record<string, unknown>).width = responsiveWidth ?? '100%'
      ;(baseStyle as Record<string, unknown>)[config.position as string] = 0
      baseStyle.left = 0
      baseStyle.right = 0
    } else if (isHorizontal) {
      ;(baseStyle as Record<string, unknown>).width =
        responsiveWidth ?? responsiveHeight
      ;(baseStyle as Record<string, unknown>).height = '100%'
      ;(baseStyle as Record<string, unknown>)[config.position as string] = 0
      baseStyle.top = 0
      baseStyle.bottom = 0
    }

    return baseStyle
  }, [config, responsiveHeight, responsiveWidth, isVisible])

  const { hoverIntensity, animated, onAnimationComplete, duration } = config

  useEffect(() => {
    if (isVisible && animated === 'scroll' && onAnimationComplete) {
      const ms = parseFloat(duration ?? '0.3') * 1000
      const t = setTimeout(() => onAnimationComplete(), ms)
      return () => clearTimeout(t)
    }
  }, [isVisible, animated, onAnimationComplete, duration])

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${
        config.target === 'page'
          ? 'gradual-blur-page'
          : 'gradual-blur-parent'
      } ${config.className ?? ''}`}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div
        className="gradual-blur-inner"
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        {blurDivs}
      </div>
    </div>
  )
}

const GradualBlurMemo = React.memo(GradualBlur)
GradualBlurMemo.displayName = 'GradualBlur'

export default GradualBlurMemo
export { GradualBlurMemo as GradualBlur }

/* ── Style injection (SSR-safe) ─────────────────────────────────────────── */

const injectStyles = () => {
  if (typeof document === 'undefined') return
  const styleId = 'gradual-blur-styles'
  if (document.getElementById(styleId)) return
  const styleElement = document.createElement('style')
  styleElement.id = styleId
  styleElement.textContent = `
  .gradual-blur { pointer-events: none; transition: opacity 0.3s ease-out; }
  .gradual-blur-parent { overflow: hidden; }
  .gradual-blur-inner { pointer-events: none; }`
  document.head.appendChild(styleElement)
}

if (typeof document !== 'undefined') injectStyles()
