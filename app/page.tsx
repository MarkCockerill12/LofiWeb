"use client"

import { BackgroundLayer } from "@/components/background-layer"
import { AmbientPlayer } from "@/components/ambient-player"
import { MusicPlayer } from "@/components/music-player"
import { TimerDisplay } from "@/components/timer-display"
import { ControlBar } from "@/components/control-bar"
import { TodoWidget } from "@/components/todo-widget"
import { SettingsMenu } from "@/components/settings-menu"
import { CookiePopup } from "@/components/cookie-popup"
import { AudioVisualizer } from "@/components/audio-visualizer"
import { useAppStore } from "@/lib/store"
import { useWorkerTimer } from "@/hooks/use-worker-timer"
import { useEffect, useRef, useCallback, useState } from "react"
import confetti from "canvas-confetti"
import { audioController } from "@/lib/audio-controller"

export default function Page() {
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const timeLeft = useAppStore((state) => state.timeLeft)
  const setTimeLeft = useAppStore((state) => state.setTimeLeft)
  const timerMode = useAppStore((state) => state.timerMode)
  const setTimerMode = useAppStore((state) => state.setTimerMode)
  const preferences = useAppStore((state) => state.preferences)
  
  const [isCooldown, setIsCooldown] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(5)

  const notificationShownRef = useRef(false)

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault()
        setIsPlaying(!isPlaying)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, setIsPlaying])

  // Handle timer tick
  const handleTick = useCallback(() => {
    setTimeLeft(Math.max(0, timeLeft - 1))
  }, [timeLeft, setTimeLeft])

  // Use Web Worker for timer
  useWorkerTimer({
    isPlaying,
    onTick: handleTick,
  })

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && !notificationShownRef.current) {
      notificationShownRef.current = true
      setIsPlaying(false) // Pause current timer loop
      
      // Play generated alarm sound
      audioController.playAlarm()

      // Trigger confetti if finishing a focus session
      if (timerMode === "focus") {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          zIndex: 2000,
        })
      }

      // Start cooldown visual and countdown
      setIsCooldown(true)
      setCooldownSeconds(5)

      // Show notification
      if ("Notification" in window && Notification.permission === "granted") {
        const message = timerMode === "focus" 
          ? "Focus session complete! Take a breather." 
          : "Break is over! Time to focus."

        new Notification("LoFi Web", {
          body: message,
          icon: "/icon.svg",
        })
      }
    }
  }, [timeLeft, timerMode, setIsPlaying, setTimerMode, setTimeLeft, preferences])

  // Handle Cooldown Countdown
  useEffect(() => {
    if (!isCooldown) return

    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // Cooldown finished
      setIsCooldown(false)
      const newMode = timerMode === "focus" ? "break" : "focus"
      setTimerMode(newMode)
      const duration = newMode === "focus" ? preferences.focusDuration : preferences.breakDuration
      setTimeLeft(duration * 60)
      
      // IMPORTANT: Continue timer automatically
      setIsPlaying(true) 
      notificationShownRef.current = false
    }
  }, [isCooldown, cooldownSeconds, timerMode, preferences, setIsCooldown, setTimerMode, setTimeLeft, setIsPlaying])

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BackgroundLayer />
      <AmbientPlayer />
      <MusicPlayer />

      <div className="relative z-10 w-full px-4">
        <div className="flex items-center justify-center">
          <TimerDisplay />
        </div>
      </div>

      <TodoWidget />

      <ControlBar />
      <SettingsMenu />
      <AudioVisualizer />

      {isCooldown && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="text-center p-8 rounded-2xl bg-black/50 border border-white/10 shadow-2xl min-w-75">
            <h2 className="text-4xl font-bold text-white mb-4">
              {timerMode === "focus" ? "Well done champ" : "Break over, back to work slave"}
            </h2>
            <div className="text-6xl font-mono font-light text-cyan-400 mb-4 tabular-nums">
              {cooldownSeconds}
            </div>
            <p className="text-white/80 text-lg">
              {timerMode === "focus" ? "Break starting in..." : "Focus starting in..."}
            </p>
          </div>
        </div>
      )}

      <CookiePopup />
    </main>
  )
}
