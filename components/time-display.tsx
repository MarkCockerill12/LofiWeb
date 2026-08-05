"use client"

import { useEffect, useRef, useState } from "react"
import { useAppStore } from "@/lib/store"
import { getUIColors } from "@/lib/utils"
import { SCENE_COLORS } from "@/lib/data"
import { THEME_COLORS } from "@/lib/constants"

export function TimeDisplay() {
  const [time, setTime] = useState<Date | null>(null)
  const preferences = useAppStore((state) => state.preferences)
  const currentSceneId = useAppStore((state) => state.currentSceneId)

  const { uiMode, clockStyle = 'default', themeColor } = preferences
  
  const bgHex = (currentSceneId && SCENE_COLORS[currentSceneId]) || "#000000"

  const uiColors = getUIColors(bgHex, uiMode)
  const primaryColor = THEME_COLORS[themeColor] || uiColors.text

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Only hours and minutes are rendered, so re-render on the minute boundary
  // instead of every second.
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now)
      const msToNextMinute = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds())
      timeoutRef.current = setTimeout(tick, msToNextMinute)
    }

    tick()
    return () => clearTimeout(timeoutRef.current)
  }, [])

  if (!time) return null

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const getPillTextColor = () => {
      if (themeColor === 'black') return '#ffffff'
      if (themeColor === 'purple') return '#ffffff' 
      return '#000000'
  }

  if (clockStyle === 'clean') {
    return (
      <div 
        className="text-6xl font-light tracking-wider select-none transition-colors duration-500"
        style={{ color: uiColors.text }}
      >
        {timeString}
      </div>
    )
  }

  if (clockStyle === 'box') {
     return (
        <div 
            className="text-6xl font-bold px-8 py-4 border-2 rounded-xl backdrop-blur-md select-none transition-all duration-500 tabular-nums"
            style={{ 
                color: primaryColor,
                borderColor: primaryColor,
                backgroundColor: `${uiColors.bgBase}40`,
                boxShadow: `0 0 20px ${primaryColor}20`
            }}
        >
            {timeString}
        </div>
     )
  }

  if (clockStyle === 'pill') {
     return (
        <div 
            className="text-6xl font-bold px-10 py-4 rounded-full backdrop-blur-md select-none transition-all duration-500 tabular-nums shadow-lg"
            style={{ 
                backgroundColor: primaryColor,
                boxShadow: `0 0 30px ${primaryColor}40`
            }}
        >
            <span style={{ color: getPillTextColor() }}>
                {timeString}
            </span>
        </div>
     )
  }

  // Default (matches timer)
  return (
    <div 
      className="text-6xl md:text-7xl font-bold tabular-nums select-none transition-colors duration-500"
      style={{ color: uiColors.text }}
    >
      {timeString}
    </div>
  )
}
