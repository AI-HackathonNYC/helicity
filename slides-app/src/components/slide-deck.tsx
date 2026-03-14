import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

import { SlideHero } from "@/slides/01-hero"
import { SlideProblem } from "@/slides/02-problem"
import { SlideEngine } from "@/slides/03-engine"
import { SlideDimensions } from "@/slides/04-dimensions"
import { SlideWhyNow } from "@/slides/05-why-now"
import { SlidePositioning } from "@/slides/06-positioning"
import { SlideDemo } from "@/slides/07-demo"
import { SlideBusiness } from "@/slides/09-business"
import { SlideClose } from "@/slides/10-close"

const SLIDES = [
  SlideHero,
  SlideProblem,
  SlideEngine,
  SlideDimensions,
  SlideWhyNow,
  SlidePositioning,
  SlideBusiness,
  SlideDemo,
  SlideClose,
]

// How many sub-steps each slide has (1 = normal slide, >1 = has internal steps)
const SUB_STEPS = [1, 1, 1, 1, 1, 1, 1, 1, 1]

const PACES = [15, 20, 25, 20, 20, 20, 20, 10, 20]

export function SlideDeck() {
  const [current, setCurrent] = useState(0)
  const [subStep, setSubStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [barHidden, setBarHidden] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const total = SLIDES.length

  const go = useCallback((idx: number) => {
    if (idx >= 0 && idx < total) {
      setCurrent(idx)
      setSubStep(0)
      if (!timerRunning) setTimerRunning(true)
    }
  }, [total, timerRunning])

  const next = useCallback(() => {
    const maxSub = SUB_STEPS[current]
    if (subStep < maxSub - 1) {
      // Advance sub-step within current slide
      setSubStep(s => s + 1)
    } else {
      // Advance to next slide
      go(current + 1)
    }
  }, [current, subStep, go])

  const prev = useCallback(() => {
    if (subStep > 0) {
      // Go back a sub-step within current slide
      setSubStep(s => s - 1)
    } else if (current > 0) {
      // Go to previous slide, starting at its last sub-step
      const prevSlide = current - 1
      setCurrent(prevSlide)
      setSubStep(SUB_STEPS[prevSlide] - 1)
    }
  }, [current, subStep])

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next() }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev() }
      if (e.key === "h" || e.key === "H") setBarHidden(v => !v)
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen()
        else document.exitFullscreen()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [next, prev])

  // Fullscreen detection
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  // Timer
  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  const budget = PACES.slice(0, current + 1).reduce((a, b) => a + b, 0)
  const timerClass = elapsed > budget + 15 ? "text-danger" : elapsed > budget ? "text-warn" : "text-text-tertiary"
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  const CurrentSlide = SLIDES[current]

  return (
    <div className="w-full h-full relative overflow-hidden bg-bg">
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-0.5 z-50 pointer-events-none transition-[width] duration-400 ease-[cubic-bezier(.4,0,.2,1)]"
        style={{
          width: `${((current + 1) / total) * 100}%`,
          background: "linear-gradient(90deg, var(--color-accent-dark), var(--color-accent), var(--color-accent-light))",
        }}
      />

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <CurrentSlide subStep={subStep} />
        </motion.div>
      </AnimatePresence>

      {/* Presenter bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-9",
          "glass border-t border-black/7 transition-all duration-300",
          (barHidden || isFullscreen) && "opacity-0 translate-y-full pointer-events-none"
        )}
        style={{ backdropFilter: "blur(36px)", WebkitBackdropFilter: "blur(36px)" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="bg-accent/[0.07] border border-accent/[0.12] text-accent text-xs font-medium px-2.5 py-0.5 rounded-lg hover:bg-accent/[0.14] transition-colors cursor-pointer"
          >
            &larr;
          </button>
          <span className="text-[0.7rem] font-medium text-text-tertiary tracking-wider">
            {current + 1} / {total}
          </span>
          <button
            onClick={next}
            className="bg-accent/[0.07] border border-accent/[0.12] text-accent text-xs font-medium px-2.5 py-0.5 rounded-lg hover:bg-accent/[0.14] transition-colors cursor-pointer"
          >
            &rarr;
          </button>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer",
                i === current ? "bg-accent scale-150" : i < current ? "bg-accent/30" : "bg-black/10"
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setElapsed(0); setTimerRunning(false) }}
            className={cn(
              "text-[0.7rem] font-medium min-w-[40px] text-center px-2 py-0.5 rounded-md",
              "bg-black/[0.04] border border-black/[0.06] cursor-pointer transition-all",
              timerClass,
              elapsed > budget + 15 && "animate-[timer-pulse_1s_ease-in-out_infinite]"
            )}
          >
            {fmtTime(elapsed)}
          </button>
          <button
            onClick={() => {
              if (!document.fullscreenElement) document.documentElement.requestFullscreen()
              else document.exitFullscreen()
            }}
            className="bg-black/[0.04] border border-black/7 text-text-tertiary text-[0.7rem] font-medium px-2 py-0.5 rounded-md tracking-wider hover:bg-accent/[0.07] hover:text-accent transition-all cursor-pointer"
          >
            FULL
          </button>
        </div>
      </div>
    </div>
  )
}
