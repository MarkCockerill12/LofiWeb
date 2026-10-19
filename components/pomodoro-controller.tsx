"use client"

import { useEffect, useRef, useState } from "react"
import { useAppStore } from "@/lib/store"
import { useWorkerTimer } from "@/hooks/use-worker-timer"
import { audioController } from "@/lib/audio-controller"

/**
 * Owns the Pomodoro tick, completion and cooldown. Lives in its own component so the
 * once-a-second timeLeft subscription only re-renders this (usually empty) node,
 * not the page shell with the background, players and control bar.
 */
export function PomodoroController() {
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const timeLeft = useAppStore((state) => state.timeLeft)
  const setTimeLeft = useAppStore((state) => state.setTimeLeft)
  const timerMode = useAppStore((state) => state.timerMode)
  const setTimerMode = useAppStore((state) => state.setTimerMode)

  const [isCooldown, setIsCooldown] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(5)

  const notificationShownRef = useRef(false)

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in globalThis && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Reads the store directly so the listener is registered once, not on every toggle.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault()
        const { isPlaying, setIsPlaying } = useAppStore.getState()
        setIsPlaying(!isPlaying)
      }
    }

    globalThis.addEventListener("keydown", handleKeyDown)
    return () => globalThis.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Stable tick: reading the latest value avoids recreating the callback every second.
  useWorkerTimer({
    isPlaying,
    onTick: () => {
      const { timeLeft, setTimeLeft } = useAppStore.getState()
      setTimeLeft(Math.max(0, timeLeft - 1))
    },
  })

  // Handle timer completion
  useEffect(() => {
    if (timeLeft !== 0 || notificationShownRef.current) return

    notificationShownRef.current = true
    setIsPlaying(false) // Pause current timer loop

    // Play generated alarm sound
    audioController.playAlarm()

    // Confetti is only needed at the end of a focus session, so it is loaded then
    // rather than shipped in the initial bundle.
    if (timerMode === "focus") {
      import("canvas-confetti").then(({ default: confetti }) =>
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          zIndex: 2000,
        }),
      )
    }

    // Start cooldown visual and countdown
    setIsCooldown(true)
    setCooldownSeconds(5)

    // Show notification
    if ("Notification" in globalThis && Notification.permission === "granted") {
      const message = timerMode === "focus"
        ? "Focus session complete! Take a breather."
        : "Break is over! Time to focus."

      new Notification("LoFi Web", {
        body: message,
        icon: "/icon.svg",
      })
    }
  }, [timeLeft, timerMode, setIsPlaying])

  // Handle Cooldown Countdown
  useEffect(() => {
    if (!isCooldown) return

    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }

    // Cooldown finished
    setIsCooldown(false)
    const newMode = timerMode === "focus" ? "break" : "focus"
    setTimerMode(newMode)
    const { preferences } = useAppStore.getState()
    const duration = newMode === "focus" ? preferences.focusDuration : preferences.breakDuration
    setTimeLeft(duration * 60)

    // IMPORTANT: Continue timer automatically
    setIsPlaying(true)
    notificationShownRef.current = false
  }, [isCooldown, cooldownSeconds, timerMode, setTimerMode, setTimeLeft, setIsPlaying])

  if (!isCooldown) return null

  return (
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
  )
}
