import React, { useState, useEffect, useRef } from "react"
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion"
import type { PanInfo } from "framer-motion"
import { MapPin, Heart, X } from "lucide-react"
import "./Stack.css"

export interface StackCardData {
  id: string | number
  title: string
  image: string
  location: string
  price: string
  onClick?: () => void
}

export interface StackProps {
  cards: StackCardData[]
  randomRotation?: boolean
  sensitivity?: number
  sendToBackOnClick?: boolean
  autoplay?: boolean
  autoplayDelay?: number
  pauseOnHover?: boolean
  animationConfig?: {
    stiffness?: number
    damping?: number
  }
  onSwipeLeft?: (card: StackCardData) => void
  onSwipeRight?: (card: StackCardData) => void
}

// Deterministic card rotation based on ID so it remains stable during renders
const getCardRotation = (id: string | number) => {
  const str = String(id)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return (hash % 7) - 3 // Angle between -3 and +3 degrees
}

// Memoized inner card contents to avoid costly DOM updates during dragging
const CardInner = React.memo(({ card, isTop }: { card: StackCardData; isTop: boolean }) => {
  return (
    <div className="relative h-full w-full">
      <img
        src={card.image}
        alt={card.title}
        className="h-full w-full object-cover pointer-events-none"
        loading="lazy"
      />
      <div className="stack-card-overlay" />
      
      {/* Tour details inside card overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
        <h3 className={`text-lg font-black tracking-tight line-clamp-2 leading-tight ${isTop ? "text-white" : "text-white/80"}`}>
          {card.title}
        </h3>
        
        <div className="flex items-center justify-between mt-1">
          <span className={`stack-badge-location flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${isTop ? "" : "opacity-60"}`}>
            <MapPin className="size-3 text-[#7F5AF0]" />
            {card.location.split(",")[0]}
          </span>
          <span className={`stack-badge-price text-xs font-black px-3 py-1 rounded-full ${isTop ? "" : "opacity-60"}`}>
            {card.price}
          </span>
        </div>
      </div>
    </div>
  )
})
CardInner.displayName = "CardInner"

export default function Stack({
  cards = [],
  randomRotation = true,
  sensitivity = 150,
  sendToBackOnClick = true,
  autoplay = true,
  autoplayDelay = 3000,
  pauseOnHover = true,
  animationConfig = { stiffness: 400, damping: 25 },
  onSwipeLeft,
  onSwipeRight,
}: StackProps) {
  const [activeCards, setActiveCards] = useState<StackCardData[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const isTransitioningRef = useRef(false)
  
  // Controls top card animations
  const controls = useAnimation()
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  
  // Transform drag distance to rotation & exit animations
  const rotate = useTransform(dragX, [-300, 300], [-25, 25])
  const opacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 0.9, 1, 0.9, 0.5])

  // Transform drag distance to Heart (right) or X (left) overlay visibility
  const rightSwipeOpacity = useTransform(dragX, [0, 80], [0, 1])
  const leftSwipeOpacity = useTransform(dragX, [-80, 0], [1, 0])

  useEffect(() => {
    if (cards && cards.length > 0) {
      setActiveCards(cards)
    }
  }, [cards])

  // Move top card to back of stack
  const sendToBack = async (swipeDirection?: "left" | "right") => {
    if (isTransitioningRef.current || activeCards.length === 0) return
    isTransitioningRef.current = true

    if (swipeDirection === "right") {
      onSwipeRight?.(activeCards[0])
    } else if (swipeDirection === "left") {
      onSwipeLeft?.(activeCards[0])
    }

    const exitX = swipeDirection === "left" ? -400 : swipeDirection === "right" ? 400 : 0
    const exitY = swipeDirection ? 0 : 250 // Slide down if clicked or auto-cycled

    // Animate swiping off/clicked down
    await controls.start({
      x: exitX,
      y: exitY,
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.3, ease: "easeInOut" },
    })

    // Shift state: move front card to end
    setActiveCards((prev) => {
      if (prev.length <= 1) return prev
      const [first, ...rest] = prev
      return [...rest, first]
    })

    // Reset card motion positions immediately for the next card that took the front
    dragX.set(0)
    dragY.set(0)

    // Reset control position instantly at bottom of stack
    await controls.start({
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0 },
    })

    isTransitioningRef.current = false
  }

  // Handle drag completion
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (isTransitioningRef.current) return

    const offset = info.offset.x
    const velocity = info.velocity.x

    if (offset > sensitivity || velocity > 400) {
      sendToBack("right")
    } else if (offset < -sensitivity || velocity < -400) {
      sendToBack("left")
    } else {
      // Reset card position if drag wasn't strong enough
      controls.start({ x: 0, y: 0, rotate: 0, transition: animationConfig })
    }
  }

  // Tap handler to cycle card to back on click
  const handleCardTap = () => {
    if (sendToBackOnClick && !isTransitioningRef.current) {
      sendToBack()
    }
  }

  // Autoplay effect
  useEffect(() => {
    if (!autoplay || activeCards.length <= 1) return undefined
    if (pauseOnHover && isHovered) return undefined

    const timer = setInterval(() => {
      sendToBack()
    }, autoplayDelay)

    return () => clearInterval(timer)
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, activeCards])

  if (!activeCards || activeCards.length === 0) {
    return (
      <div className="flex h-[440px] w-[320px] items-center justify-center rounded-2xl border border-border bg-[#16161A]/40 text-sm text-white/40">
        No cards available
      </div>
    )
  }

  // Render top 3 cards for visual layering
  const cardsToRender = activeCards.slice(0, 3)

  return (
    <div
      className="stack-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Loop backwards to render the bottom card first (proper z-index stack overlay) */}
      {cardsToRender
        .map((card, index) => {
          const isTop = index === 0
          const rotAngle = randomRotation ? getCardRotation(card.id) : 0
          
          // Layer spacing offset calculations
          const scaleOffset = 1 - index * 0.04
          const yOffset = index * 10

          if (isTop) {
            return (
              <motion.div
                key={card.id}
                drag="x"
                dragConstraints={{ left: -500, right: 500 }}
                onDragEnd={handleDragEnd}
                onTap={handleCardTap}
                animate={controls}
                style={{
                  x: dragX,
                  y: dragY,
                  rotate: rotate,
                  opacity: opacity,
                  zIndex: 30,
                  willChange: "transform",
                  transform: "translateZ(0)",
                }}
                className="stack-card top-card select-none"
              >
                <CardInner card={card} isTop={true} />

                {/* Right swipe indicator (Green Glow + Heart) */}
                <motion.div
                  style={{ opacity: rightSwipeOpacity }}
                  className="absolute inset-0 bg-green-500/10 pointer-events-none rounded-2xl border-2 border-green-500 flex items-center justify-center z-40"
                >
                  <div className="bg-black/85 p-4 rounded-full border border-green-500 shadow-lg shadow-green-500/20 transform scale-110">
                    <Heart className="size-10 text-green-500 fill-green-500 animate-pulse" />
                  </div>
                </motion.div>

                {/* Left swipe indicator (Red Glow + X) */}
                <motion.div
                  style={{ opacity: leftSwipeOpacity }}
                  className="absolute inset-0 bg-red-500/10 pointer-events-none rounded-2xl border-2 border-red-500 flex items-center justify-center z-40"
                >
                  <div className="bg-black/85 p-4 rounded-full border border-red-500 shadow-lg shadow-red-500/20 transform scale-110">
                    <X className="size-10 text-red-500 animate-pulse" />
                  </div>
                </motion.div>
              </motion.div>
            )
          }

          // Layered cards underneath the top card
          return (
            <motion.div
              key={card.id}
              animate={{
                scale: scaleOffset,
                y: yOffset,
                rotate: rotAngle,
                opacity: index === 1 ? 0.9 : 0.6,
              }}
              style={{
                zIndex: 30 - index,
                pointerEvents: "none",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
              transition={animationConfig}
              className="stack-card"
            >
              <CardInner card={card} isTop={false} />
            </motion.div>
          )
        })
        .reverse()}
    </div>
  )
}
