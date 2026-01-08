"use client"

import { BackgroundLayer } from "@/components/background-layer"
import { TimerDisplay } from "@/components/timer-display"
import { ControlBar } from "@/components/control-bar"
import { TodoWidget } from "@/components/todo-widget"
import { SettingsMenu } from "@/components/settings-menu"
import { CookiePopup } from "@/components/cookie-popup"
import { useAppStore } from "@/lib/store"
import { useWorkerTimer } from "@/hooks/use-worker-timer"
import { useEffect, useRef, useCallback } from "react"
import { alarmSounds } from "@/lib/data"

export default function Page() {
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const timeLeft = useAppStore((state) => state.timeLeft)
  const setTimeLeft = useAppStore((state) => state.setTimeLeft)
  const timerMode = useAppStore((state) => state.timerMode)
  const setTimerMode = useAppStore((state) => state.setTimerMode)
  const preferences = useAppStore((state) => state.preferences)
  const showTodos = useAppStore((state) => state.showTodos)

  const audioRef = useRef<HTMLAudioElement | null>(null)
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
      setIsPlaying(false)

      // Play alarm sound
      if (audioRef.current) {
        audioRef.current.play().catch(console.error)
      }

      // Show notification
      if ("Notification" in window && Notification.permission === "granted") {
        const message = timerMode === "focus" ? "Time for a break! Great work!" : "Break is over! Ready to focus?"

        new Notification("Lofi Study Station", {
          body: message,
          icon: "/icon.svg",
          badge: "/icon.svg",
        })
      }

      // Switch mode and reset
      setTimeout(() => {
        const newMode = timerMode === "focus" ? "break" : "focus"
        setTimerMode(newMode)
        const duration = newMode === "focus" ? preferences.focusDuration : preferences.breakDuration
        setTimeLeft(duration * 60)
        notificationShownRef.current = false
      }, 1000)
    }
  }, [timeLeft, timerMode, setIsPlaying, setTimerMode, setTimeLeft, preferences])

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BackgroundLayer />

      <audio ref={audioRef} src={alarmSounds[0].url} preload="auto" />

      <div className="relative z-10 w-full px-4">
        <div className="flex items-center justify-center">
          <TimerDisplay />
        </div>
      </div>

      <TodoWidget />

      <ControlBar />
      <SettingsMenu />
      <CookiePopup />
    </main>
  )
}
