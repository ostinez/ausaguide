import { useState, useEffect } from "react"
import { Timer, Rocket } from "lucide-react"
import { Link } from "react-router-dom"

interface CountdownTimerProps {
 targetDate: Date
}

interface TimeLeft {
 days: number
 hours: number
 minutes: number
 seconds: number
 launched: boolean
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
 const calculateTimeLeft = (): TimeLeft => {
 const diff = targetDate.getTime() - Date.now()
 if (diff <= 0) {
 return { days: 0, hours: 0, minutes: 0, seconds: 0, launched: true }
 }
 const days = Math.floor(diff / (1000 * 60 * 60 * 24))
 const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
 const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
 const seconds = Math.floor((diff % (1000 * 60)) / 1000)
 return { days, hours, minutes, seconds, launched: false }
 }

 const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft)

 useEffect(() => {
 const timer = setInterval(() => {
 setTimeLeft(calculateTimeLeft())
 }, 1000)

 return () => clearInterval(timer)
 }, [targetDate])

 if (timeLeft.launched) {
 return (
 <div className="rounded-2xl border border-[#0D6F73]/30 bg-card shadow-modern p-6 text-center shadow-xl shadow-[#0D6F73]/5 flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in duration-500">
 <div className="size-12 rounded-full bg-carbon-dark shadow-modern-glow border border-brand text-brand hover:bg-carbon/10 flex items-center justify-center text-[#0D6F73] animate-bounce">
 <Rocket className="size-6" />
 </div>
 <p className="text-xl font-black text-white tracking-tight font-headline">Ausaguide is now live!</p>
 <Link
 to="/auth"
 className="mt-1 text-sm font-semibold text-[#0D6F73] underline hover:text-[#0D6F73]/80 transition-colors"
 >
 Sign in now →
 </Link>
 </div>
 )
 }

 const timeUnits = [
 { value: timeLeft.days, label: "Days" },
 { value: timeLeft.hours, label: "Hours" },
 { value: timeLeft.minutes, label: "Minutes" },
 { value: timeLeft.seconds, label: "Seconds" },
 ]

 return (
 <div className="rounded-2xl border border-white/5 bg-card shadow-modern p-6 text-center shadow-xl flex flex-col items-center gap-4">
 <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-widest">
 <Timer className="size-4 text-[#0D6F73]" />
 <span>Launching in</span>
 </div>

 <div className="flex items-center justify-center gap-2 sm:gap-4 select-none">
 {timeUnits.map(({ value, label }, index) => (
 <div key={label} className="flex items-center">
 <div className="flex flex-col items-center">
 <div className="min-w-[60px] sm:min-w-[70px] bg-card shadow-modern border border-white/5 rounded-xl px-2 py-3 flex items-center justify-center shadow-inner relative group overflow-hidden">
 {/* Subtle top border glow in purple */}
 <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0D6F73] to-transparent opacity-80" />
 <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
 {String(value).padStart(2, "0")}
 </span>
 </div>
 <span className="text-[10px] sm:text-xs font-medium text-white/40 uppercase tracking-wider mt-2">
 {label}
 </span>
 </div>
 {index < timeUnits.length - 1 && (
 <span className="text-xl sm:text-2xl font-bold text-[#0D6F73] mx-1 sm:mx-2 -mt-6 animate-pulse">
 :
 </span>
 )}
 </div>
 ))}
 </div>
 </div>
 )
}
