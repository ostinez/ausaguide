import React, { useRef, useState, useEffect } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { Mail, ShieldCheck } from "lucide-react"

interface ProfileCardProps {
  name: string
  title: string
  handle?: string
  status: string
  contactText: string
  avatarUrl: string
  showUserInfo?: boolean
  enableTilt?: boolean
  enableMobileTilt?: boolean
  behindGlowEnabled?: boolean
  behindGlowColor?: string
  innerGradient?: string
  onContactClick?: () => void
  onAvatarClick?: () => void
}

const springConfig = {
  damping: 25,
  stiffness: 150,
  mass: 1.2,
}

export default function ProfileCard({
  name,
  title,
  handle,
  status,
  contactText,
  avatarUrl,
  showUserInfo = true,
  enableTilt = true,
  enableMobileTilt = false,
  behindGlowEnabled = true,
  behindGlowColor = "rgba(127, 90, 240, 0.4)",
  innerGradient = "linear-gradient(145deg, rgba(127, 90, 240, 0.2), rgba(44, 182, 125, 0.1))",
  onContactClick,
  onAvatarClick,
}: ProfileCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Motion values for 3D tilt
  const rotateX = useSpring(useMotionValue(0), springConfig)
  const rotateY = useSpring(useMotionValue(0), springConfig)
  const scale = useSpring(1, springConfig)

  // Check if viewport is mobile size to control tilt trigger
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt) return
    if (isMobile && !enableMobileTilt) return
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const mouseX = e.clientX - rect.left - width / 2
    const mouseY = e.clientY - rect.top - height / 2

    // Max rotation amplitudes
    const maxRotateX = 12
    const maxRotateY = 12

    const rX = -(mouseY / (height / 2)) * maxRotateX
    const rY = (mouseX / (width / 2)) * maxRotateY

    rotateX.set(rX)
    rotateY.set(rY)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    scale.set(1.02)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    scale.set(1)
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <div
      className="relative w-full flex items-center justify-center p-6"
      style={{ perspective: "1000px" }}
    >
      {/* Background glow drop-shadow */}
      {behindGlowEnabled && (
        <motion.div
          className="absolute w-[280px] h-[280px] rounded-full blur-[64px] pointer-events-none z-0 transition-opacity duration-500"
          style={{
            backgroundColor: behindGlowColor,
            opacity: isHovered ? 0.75 : 0.45,
          }}
        />
      )}

      {/* Main Glassmorphism Card */}
      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative z-10 w-full max-w-[340px] rounded-3xl border border-white/10 p-6 backdrop-blur-xl bg-[#121214]/50 shadow-2xl flex flex-col items-center select-none cursor-pointer overflow-hidden transition-colors duration-300 hover:border-white/15"
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
          background: innerGradient,
        }}
      >
        {/* Shimmer overlay effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />

        {/* Profile Image with 3D translation */}
        <div
          onClick={(e) => {
            if (onAvatarClick) {
              e.stopPropagation()
              onAvatarClick()
            }
          }}
          className={`relative size-32 rounded-full p-[3px] bg-gradient-to-br from-[#7F5AF0] to-[#2CB67D] shadow-[0_8px_32px_rgba(127,90,240,0.3)] mb-6 transition-transform duration-300 ${
            onAvatarClick ? "cursor-pointer hover:scale-105" : ""
          }`}
          style={{ transform: "translateZ(50px)" }}
        >
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover rounded-full bg-[#121214]"
            onError={(e) => {
              // Gracefully handle avatar loading error with a default profile illustration
              ;(e.target as HTMLImageElement).src =
                "https://api.dicebear.com/7.x/bottts/svg?seed=austin"
            }}
          />
          {/* Active status dot */}
          <div className="absolute bottom-1 right-1 size-4 rounded-full bg-[#2CB67D] border-2 border-[#121214]" />
        </div>

        {/* User details section */}
        {showUserInfo && (
          <div
            className="text-center w-full space-y-4 transition-transform duration-300"
            style={{ transform: "translateZ(30px)" }}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <h3 className="text-xl font-bold text-white tracking-tight">{name}</h3>
                <ShieldCheck className="size-5 text-[#7F5AF0]" />
              </div>
              <span className="text-xs font-semibold text-[#7F5AF0] uppercase tracking-wider block">
                {title}
              </span>
              {handle && <span className="text-[11px] text-white/40 block">@{handle}</span>}
            </div>

            {/* Status box */}
            <div className="py-2 px-3 rounded-full bg-white/5 border border-white/5 inline-block mx-auto text-xs font-semibold text-[#2CB67D] leading-none">
              {status}
            </div>
          </div>
        )}

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            if (onContactClick) onContactClick()
          }}
          className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-[#7F5AF0] to-[#2CB67D] text-white text-sm font-bold flex items-center justify-center gap-2 hover:shadow-[0_4px_20px_rgba(127,90,240,0.4)] transition-all duration-300"
          style={{ transform: "translateZ(40px)" }}
        >
          <Mail className="size-4" />
          {contactText}
        </motion.button>
      </motion.div>
    </div>
  )
}
