"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
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

export function TimeDisplay() {
  const [time, setTime] = useState<Date | null>(null)
  const preferences = useAppStore((state) => state.preferences)
  const currentSceneId = useAppStore((state) => state.currentSceneId)

  const { uiMode, clockStyle = 'default', themeColor } = preferences
  
  const bgHex = (currentSceneId && SCENE_COLORS[currentSceneId]) || "#000000"

  const uiColors = getUIColors(bgHex, uiMode)
  const primaryColor = THEME_COLORS[themeColor] || uiColors.text

  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
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
