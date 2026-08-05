"use client"

import { useAppStore } from "@/lib/store"
import { useCallback, useState } from "react"
import { getUIColors } from "@/lib/utils"
import { SCENE_COLORS } from "@/lib/data"
import { THEME_COLORS } from "@/lib/constants"

export function TimerDisplay() {
  const timeLeft = useAppStore((state) => state.timeLeft)
  const timerMode = useAppStore((state) => state.timerMode)
  const preferences = useAppStore((state) => state.preferences)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  const setTimerInteraction = useAppStore((state) => state.setTimerInteraction)

  const [interaction, setInteraction] = useState<"none" | "hover" | "press">("none")

  const { themeColor, secondaryColor, themeVariant, timerOpacity, uiMode } = preferences
  const primaryColor = THEME_COLORS[themeColor]
  const bgColor = secondaryColor ? THEME_COLORS[secondaryColor] : THEME_COLORS.purple

  const bgHex = secondaryColor
    ? THEME_COLORS[secondaryColor]
    : (currentSceneId && SCENE_COLORS[currentSceneId]) || "#000000"
  const uiColors = getUIColors(bgHex, uiMode)

  const totalSeconds = timerMode === "focus" ? preferences.focusDuration * 60 : preferences.breakDuration * 60

  const progress = 1 - timeLeft / totalSeconds
  const circumference = 2 * Math.PI * 120
  const offset = circumference * progress

  // Interaction scale is driven by CSS transitions; the store copy keeps the
  // visualizer in sync.
  const applyInteraction = useCallback(
    (next: "none" | "hover" | "press") => {
      setInteraction(next)
      setTimerInteraction(next)
    },
    [setTimerInteraction],
  )

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const isMinimal = themeVariant === "minimal"
  const textColor = uiColors.text

  const scale = interaction === "press" ? 0.95 : interaction === "hover" ? 1.05 : 1

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 md:p-4">
      <div
        className="relative cursor-pointer transition-transform duration-300 ease-out"
        style={{ opacity: timerOpacity, transform: `scale(${scale})` }}
        onClick={() => setIsPlaying(!isPlaying)}
        onMouseEnter={() => applyInteraction("hover")}
        onMouseLeave={() => applyInteraction("none")}
        onMouseDown={() => applyInteraction("press")}
        onMouseUp={() => applyInteraction("hover")}
        onTouchStart={() => applyInteraction("press")}
        onTouchEnd={() => applyInteraction("none")}
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
        {themeVariant === "neon" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full blur-xl"
              style={{
                width: "260px",
                height: "260px",
                backgroundColor: primaryColor,
                opacity: uiMode === "dark" ? 0.25 : 0.15,
              }}
            />
          </div>
        )}

        <svg className="w-64 h-64 md:w-80 md:h-80 -rotate-90 relative overflow-visible">
          <circle cx="50%" cy="50%" r="120" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
          <circle
            cx="50%"
            cy="50%"
            r="120"
            fill="none"
            stroke={primaryColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              opacity: themeVariant === "neon" ? 0.95 : 1,
              filter: themeVariant === "neon" ? `drop-shadow(0 0 12px ${primaryColor})` : "none",
              transition: "stroke-dashoffset 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-6xl md:text-7xl font-bold tabular-nums" style={{ color: textColor }}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="text-sm md:text-base mt-2 uppercase tracking-wider" style={{ color: textColor, opacity: 1 }}>
            {timerMode === "focus" ? "Focus Time" : "Break Time"}
          </div>
        </div>
      </div>
    </div>
  )
}
