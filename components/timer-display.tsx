"use client"

import { useAppStore } from "@/lib/store"
import { useEffect, useRef } from "react"
import anime from "animejs"
import { getUIColors } from "@/lib/utils"
import { SCENE_COLORS } from "@/lib/data"

const THEME_COLORS = {
  cyan: "#06b6d4",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#10b981",
  pink: "#ec4899",
  white: "#ffffff",
  black: "#000000",
}


export function TimerDisplay() {
  const timeLeft = useAppStore((state) => state.timeLeft)
  const timerMode = useAppStore((state) => state.timerMode)
  const preferences = useAppStore((state) => state.preferences)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  const setTimerInteraction = useAppStore((state) => state.setTimerInteraction)
  const circleRef = useRef<SVGCircleElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { themeColor, secondaryColor, themeVariant, timerOpacity, uiMode } = preferences
  const primaryColor = THEME_COLORS[themeColor]
  const bgColor = secondaryColor ? THEME_COLORS[secondaryColor] : THEME_COLORS.purple

  const bgHex = secondaryColor ? THEME_COLORS[secondaryColor] : (currentSceneId && SCENE_COLORS[currentSceneId]) || "#000000"
  const uiColors = getUIColors(bgHex, uiMode)

  const totalSeconds = timerMode === "focus" ? preferences.focusDuration * 60 : preferences.breakDuration * 60

  const progress = 1 - timeLeft / totalSeconds
  const circumference = 2 * Math.PI * 120
  const offset = circumference * progress

  useEffect(() => {
    if (circleRef.current) {
      anime({
        targets: circleRef.current,
        strokeDashoffset: offset,
        duration: 1000,
        easing: "easeOutQuad",
      })
    }
  }, [offset])

  useEffect(() => {
    if (!containerRef.current) return

    const handleMouseEnter = () => {
      setTimerInteraction("hover")
      anime({
        targets: containerRef.current,
        scale: 1.05,
        duration: 300,
        easing: "easeOutQuad",
      })
    }

    const handleMouseLeave = () => {
      setTimerInteraction("none")
      anime({
        targets: containerRef.current,
        scale: 1,
        duration: 300,
        easing: "easeOutQuad",
      })
    }

    const handleMouseDown = () => {
      setTimerInteraction("press")
      anime({
        targets: containerRef.current,
        scale: 0.95,
        duration: 150,
        easing: "easeOutQuad",
      })
    }

    const handleMouseUp = () => {
      setTimerInteraction("hover")
      anime({
        targets: containerRef.current,
        scale: 1.05,
        duration: 150,
        easing: "easeOutQuad",
      })
    }

    const element = containerRef.current
    element.addEventListener("mouseenter", handleMouseEnter)
    element.addEventListener("mouseleave", handleMouseLeave)
    element.addEventListener("mousedown", handleMouseDown)
    element.addEventListener("mouseup", handleMouseUp)
    // Add touch events for mobile sync
    element.addEventListener("touchstart", handleMouseDown) 
    element.addEventListener("touchend", handleMouseUp)

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter)
      element.removeEventListener("mouseleave", handleMouseLeave)
      element.removeEventListener("mousedown", handleMouseDown)
      element.removeEventListener("mouseup", handleMouseUp)
      element.removeEventListener("touchstart", handleMouseDown)
      element.removeEventListener("touchend", handleMouseUp)
    }
  }, [setTimerInteraction])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const isMinimal = themeVariant === "minimal"
  const textColor = uiColors.text

  const handleTimerClick = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 md:p-4">
      <div
        ref={containerRef}
        className="relative cursor-pointer"
        style={{ opacity: timerOpacity }}
        onClick={handleTimerClick}
      >
        {isMinimal && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full"
              style={{
                width: "240px",
                height: "240px",
                backgroundColor: bgColor,
              }}
            />
          </div>
        )}

        {/* Neon Background Backing */}
        {themeVariant === 'neon' && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                    className="rounded-full blur-md"
                    style={{
                        width: "220px",
                        height: "220px",
                        backgroundColor: primaryColor,
                        opacity: uiMode === 'dark' ? 0.35 : 0.25,
                    }}
                />
             </div>
        )}

        <svg className="w-64 h-64 md:w-80 md:h-80 -rotate-90 relative overflow-visible">
          <circle cx="50%" cy="50%" r="120" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
          <circle
            ref={circleRef}
            cx="50%"
            cy="50%"
            r="120"
            fill="none"
            stroke={primaryColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{
              filter:
                themeVariant === "neon"
                  ? `drop-shadow(0 0 8px ${primaryColor}) drop-shadow(0 0 16px ${primaryColor})`
                  : "none",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-6xl md:text-7xl font-bold tabular-nums" style={{ color: textColor }}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div
            className="text-sm md:text-base mt-2 uppercase tracking-wider"
            style={{ color: textColor, opacity: 1 }}
          >
            {timerMode === "focus" ? "Focus Time" : "Break Time"}
          </div>
        </div>
      </div>
    </div>
  )
}
