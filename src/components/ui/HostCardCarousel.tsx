import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface HostCardCarouselProps {
  hostId?: string
  images?: string[]
  className?: string
  aspectRatio?: "square" | "video" | "auto"
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80"

export function HostCardCarousel({
  hostId,
  images,
  className,
  aspectRatio = "video",
}: HostCardCarouselProps) {
  const [carouselImages, setCarouselImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const autoplayTimerRef = useRef<any>(null)
  const pauseTimeoutRef = useRef<any>(null)

  // Fetch images if not passed as props
  useEffect(() => {
    if (images && images.length > 0) {
      setCarouselImages(images.slice(0, 3))
      setLoading(false)
      return
    }

    if (!hostId) {
      setCarouselImages([PLACEHOLDER_IMAGE])
      setLoading(false)
      return
    }

    async function loadHostToursImages() {
      try {
        const { data, error } = await supabase
          .from("tours")
          .select("images")
          .eq("host_id", hostId)
          .eq("is_published", true)

        if (error) throw error

        const extractedImages = (data || [])
          .flatMap((t) => t.images || [])
          .filter(Boolean)

        // Deduplicate
        const unique = Array.from(new Set(extractedImages))
        const finalImages = unique.slice(0, 3)

        if (finalImages.length === 0) {
          setCarouselImages([PLACEHOLDER_IMAGE])
        } else {
          setCarouselImages(finalImages)
        }
      } catch (err) {
        console.error("Failed to load host tours images", err)
        setCarouselImages([PLACEHOLDER_IMAGE])
      } finally {
        setLoading(false)
      }
    }

    loadHostToursImages()
  }, [hostId, images])

  const nextSlide = useCallback(() => {
    if (carouselImages.length <= 1) return
    setCurrentIndex((prev) => (prev + 1) % carouselImages.length)
  }, [carouselImages.length])

  const prevSlide = useCallback(() => {
    if (carouselImages.length <= 1) return
    setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }, [carouselImages.length])

  // Autoplay handler
  useEffect(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }

    if (isHovered && !isPaused && carouselImages.length > 1) {
      autoplayTimerRef.current = setInterval(() => {
        nextSlide()
      }, 15000) // 15 seconds autoplay
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
    }
  }, [isHovered, isPaused, nextSlide, carouselImages.length])

  // Cleanup pauses on unmount
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  const handleManualClick = (e: React.MouseEvent, action: "next" | "prev") => {
    e.stopPropagation()
    e.preventDefault()

    if (action === "next") {
      nextSlide()
    } else {
      prevSlide()
    }

    // Pause autoplay for 5 seconds on click, then resume if still hovered
    setIsPaused(true)
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false)
    }, 5000)
  }

  if (loading) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-muted rounded-xl animate-pulse border border-border/40",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "auto" && "h-full w-full",
          className
        )}
      >
        <ImageIcon className="size-8 text-muted-foreground animate-bounce" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm transition-all duration-300",
        aspectRatio === "video" && "aspect-video",
        aspectRatio === "square" && "aspect-square",
        aspectRatio === "auto" && "h-full w-full",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPaused(false) // Reset pause state when leaving hover
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current)
        }
      }}
    >
      {/* Sliding Images Track */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {carouselImages.map((src, idx) => (
          <div key={idx} className="h-full w-full shrink-0">
            <img
              src={src}
              alt={`Host Tour Photo ${idx + 1}`}
              className="h-full w-full object-cover select-none"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Dark gradient overlay for controls legibility */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Text Indicator (top right) */}
      {carouselImages.length > 1 && (
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md border border-border select-none">
          {currentIndex + 1}/{carouselImages.length}
        </div>
      )}

      {/* Manual arrows controls (visible on hover) */}
      {carouselImages.length > 1 && (
        <>
          <button
            onClick={(e) => handleManualClick(e, "prev")}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-border opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/95 hover:scale-105"
            aria-label="Previous Photo"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={(e) => handleManualClick(e, "next")}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-border opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/95 hover:scale-105"
            aria-label="Next Photo"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {/* Dots Indicator (bottom center) */}
      {carouselImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 z-10">
          {carouselImages.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setCurrentIndex(idx)
                setIsPaused(true)
                if (pauseTimeoutRef.current) {
                  clearTimeout(pauseTimeoutRef.current)
                }
                pauseTimeoutRef.current = setTimeout(() => {
                  setIsPaused(false)
                }, 5000)
              }}
              className={cn(
                "size-1.5 rounded-full transition-all duration-300",
                currentIndex === idx
                  ? "w-4 bg-primary"
                  : "bg-white/40 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
