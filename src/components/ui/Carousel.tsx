import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import type { PanInfo } from "framer-motion"
import { Clock, MapPin, Star } from "lucide-react"
import { getTourGradient } from "@/lib/tour-utils"
import "./Carousel.css"

export interface CarouselItemData {
  id: string | number
  title: string
  description: string
  icon?: React.ReactNode
  duration?: string | number
  location?: string
  price?: string
  category?: string
  tour_type?: string
  hostName?: string
  rating?: number
  onClick?: () => void
}

export interface CarouselProps {
  items?: CarouselItemData[]
  baseWidth?: number
  autoplay?: boolean
  autoplayDelay?: number
  pauseOnHover?: boolean
  loop?: boolean
  round?: boolean
}

const GAP = 16
const SPRING_OPTIONS = { type: "spring" as const, stiffness: 300, damping: 30 }
const DRAG_BUFFER = 0
const VELOCITY_THRESHOLD = 500

interface CarouselItemProps {
  item: CarouselItemData
  index: number
  itemWidth: number
  round: boolean
  trackItemOffset: number
  x: any
  transition: any
  isActive: boolean
}

function CarouselItem({
  item,
  index,
  itemWidth,
  round,
  trackItemOffset,
  x,
  transition,
  isActive,
}: CarouselItemProps) {
  const range = [
    -(index + 1) * trackItemOffset,
    -index * trackItemOffset,
    -(index - 1) * trackItemOffset,
  ]
  const outputRange = [45, 0, -45] // 45 degrees rotation for 3D depth
  const rotateY = useTransform(x, range, outputRange, { clamp: false })

  // Track mouse coordinates for the hover card glow effect
  const cardRef = useRef<HTMLDivElement>(null)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const xCoord = e.clientX - rect.left
    const yCoord = e.clientY - rect.top
    cardRef.current.style.setProperty("--mouse-x", `${xCoord}px`)
    cardRef.current.style.setProperty("--mouse-y", `${yCoord}px`)
  }

  return (
    <motion.div
      key={`${item?.id ?? index}-${index}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={item.onClick}
      className={`carousel-3d-item relative shrink-0 flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing ${
        isActive ? "active" : ""
      } ${
        round
          ? "items-center justify-center text-center bg-[#16161A] border-0"
          : "items-start bg-[#16161A] border border-border rounded-2xl"
      }`}
      style={{
        width: itemWidth,
        height: round ? itemWidth : "100%",
        rotateY: rotateY,
        ...(round && { borderRadius: "50%" }),
      }}
      transition={transition}
    >
      {/* Visual glow on hover */}
      <div className="carousel-3d-card-glow" />

      {/* Category Gradient Header */}
      {!round && (
        <div
          className="w-full h-36 flex items-center justify-center relative overflow-hidden"
          style={{ 
            background: item.category 
              ? getTourGradient(item.category as any) 
              : "linear-gradient(135deg, #7F5AF0 0%, #2CB67D 100%)" 
          }}
        >
          {item.icon && (
            <span className="carousel-icon-pulse flex h-12 w-12 items-center justify-center rounded-full bg-[#16161A] border border-border text-white z-10">
              {item.icon}
            </span>
          )}
          {item.tour_type && (
            <span className="absolute top-3 left-3 text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#16161A]/85 text-white border border-white/15 backdrop-blur-sm z-10">
              {item.tour_type}
            </span>
          )}
          {/* Subtle design patterns for header */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />
        </div>
      )}

      {/* Card Info */}
      <div className="p-5 flex-1 flex flex-col justify-between w-full space-y-3 z-10">
        <div>
          <h3 className="line-clamp-2 text-sm font-bold text-white mb-1">
            {item.title}
          </h3>
          <p className="line-clamp-2 text-xs text-white/50">
            {item.description}
          </p>
        </div>

        {/* Details Footer */}
        {!round && (item.duration !== undefined || item.location || item.price) && (
          <div className="space-y-2 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-[11px] text-white/40">
              {item.duration !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {item.duration}h
                </span>
              )}
              {item.location && (
                <span className="flex items-center gap-1 max-w-[120px] truncate">
                  <MapPin className="size-3.5" />
                  {item.location}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                {item.hostName && (
                  <span className="text-xs text-[#2CB67D] font-semibold truncate max-w-[90px]">
                    {item.hostName}
                  </span>
                )}
                {item.rating !== undefined && (
                  <span className="flex items-center gap-0.5 text-[10px] text-white/60">
                    <Star className="size-3 text-amber-400 fill-amber-400" />
                    {item.rating}
                  </span>
                )}
              </div>
              {item.price && <span className="text-sm font-black text-white">{item.price}</span>}
            </div>
          </div>
        )}

        {/* Fallback for simple items format that only have title, description, and icon */}
        {round && item.icon && (
          <div className="flex justify-center w-full">
            <span className="text-[#7F5AF0]">{item.icon}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Carousel({
  items = [],
  baseWidth = 300,
  autoplay = true,
  autoplayDelay = 3000,
  pauseOnHover = true,
  loop = true,
  round = false,
}: CarouselProps) {
  const containerPadding = 16
  const itemWidth = baseWidth - containerPadding * 2
  const trackItemOffset = itemWidth + GAP
  const itemsForRender = useMemo(() => {
    if (!loop) return items
    if (items.length === 0) return []
    return [items[items.length - 1], ...items, items[0]]
  }, [items, loop])

  const [position, setPosition] = useState<number>(loop ? 1 : 0)
  const x = useMotionValue(0)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isJumping, setIsJumping] = useState<boolean>(false)
  const [isAnimating, setIsAnimating] = useState<boolean>(false)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current
      const handleMouseEnter = () => setIsHovered(true)
      const handleMouseLeave = () => setIsHovered(false)
      container.addEventListener("mouseenter", handleMouseEnter)
      container.addEventListener("mouseleave", handleMouseLeave)
      return () => {
        container.removeEventListener("mouseenter", handleMouseEnter)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [pauseOnHover])

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return undefined
    if (pauseOnHover && isHovered) return undefined

    const timer = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1, itemsForRender.length - 1))
    }, autoplayDelay)

    return () => clearInterval(timer)
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length])

  useEffect(() => {
    const startingPosition = loop ? 1 : 0
    setPosition(startingPosition)
    x.set(-startingPosition * trackItemOffset)
  }, [items.length, loop, trackItemOffset, x])

  useEffect(() => {
    if (!loop && position > itemsForRender.length - 1) {
      setPosition(Math.max(0, itemsForRender.length - 1))
    }
  }, [itemsForRender.length, loop, position])

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS

  const handleAnimationStart = () => {
    setIsAnimating(true)
  }

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false)
      return
    }
    const lastCloneIndex = itemsForRender.length - 1

    if (position === lastCloneIndex) {
      setIsJumping(true)
      const target = 1
      setPosition(target)
      x.set(-target * trackItemOffset)
      requestAnimationFrame(() => {
        setIsJumping(false)
        setIsAnimating(false)
      })
      return
    }

    if (position === 0) {
      setIsJumping(true)
      const target = items.length
      setPosition(target)
      x.set(-target * trackItemOffset)
      requestAnimationFrame(() => {
        setIsJumping(false)
        setIsAnimating(false)
      })
      return
    }

    setIsAnimating(false)
  }

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ): void => {
    const { offset, velocity } = info
    const direction =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD
        ? -1
        : 0

    if (direction === 0) return

    setPosition((prev) => {
      const next = prev + direction
      const max = itemsForRender.length - 1
      return Math.max(0, Math.min(next, max))
    })
  }

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: 0,
        },
      }

  const activeIndex =
    items.length === 0
      ? 0
      : loop
      ? (position - 1 + items.length) % items.length
      : Math.min(position, items.length - 1)

  return (
    <div
      ref={containerRef}
      className={`carousel-3d-container relative overflow-hidden p-4 mx-auto ${
        round
          ? "rounded-full border border-border"
          : "rounded-[24px] border border-border bg-[#16161A]/50 backdrop-blur-sm shadow-xl"
      }`}
      style={{
        width: `${baseWidth}px`,
        height: "430px", // Fit the card height cleanly
        ...(round && { height: `${baseWidth}px` }),
      }}
    >
      <motion.div
        className="carousel-3d-track flex h-[350px]"
        drag={isAnimating ? false : "x"}
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationStart={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
      >
        {itemsForRender.map((item, index) => (
          <CarouselItem
            key={`${item?.id ?? index}-${index}`}
            item={item}
            index={index}
            itemWidth={itemWidth}
            round={round}
            trackItemOffset={trackItemOffset}
            x={x}
            transition={effectiveTransition}
            isActive={activeIndex === (loop ? (index - 1 + items.length) % items.length : index)}
          />
        ))}
      </motion.div>
      <div
        className={`flex w-full justify-center ${
          round ? "absolute z-20 bottom-12 left-1/2 -translate-x-1/2" : ""
        }`}
      >
        <div className="mt-4 flex w-[150px] justify-between px-8">
          {items.map((_, index) => (
            <motion.button
              type="button"
              key={index}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeIndex === index}
              className={`h-2 w-2 rounded-full cursor-pointer border-0 p-0 appearance-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                activeIndex === index
                  ? "bg-[#7F5AF0]"
                  : "bg-accent/"
              }`}
              animate={{
                scale: activeIndex === index ? 1.25 : 1,
              }}
              onClick={() => setPosition(loop ? index + 1 : index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
