"use client"

import { BackgroundLayer } from "@/components/background-layer"
import { AmbientPlayer } from "@/components/ambient-player"
import { MusicPlayer } from "@/components/music-player"
import { TimerDisplay } from "@/components/timer-display"
import { TimeDisplay } from "@/components/time-display"
import { ControlBar } from "@/components/control-bar"
import { PomodoroController } from "@/components/pomodoro-controller"
import dynamic from "next/dynamic"

const TodoWidget = dynamic(() => import("@/components/todo-widget").then(mod => mod.TodoWidget), { ssr: false })
const SettingsMenu = dynamic(() => import("@/components/settings-menu").then(mod => mod.SettingsMenu), { ssr: false })
const CookiePopup = dynamic(() => import("@/components/cookie-popup").then(mod => mod.CookiePopup), { ssr: false })
import { AudioVisualizer } from "@/components/audio-visualizer"
import { useAppStore } from "@/lib/store"
import { MANIFEST_URL } from "@/lib/constants"
import { normalizeManifest } from "@/lib/data"
import { useEffect } from "react"

export default function Page() {
  const setStationData = useAppStore((state) => state.setStationData)

  // Read the catalog straight from the public bucket. Nothing about a normal visit
  // touches a server function; if the bucket is unreachable the bundled seed
  // manifest already in the store stays in place.
  useEffect(() => {
    fetch(MANIFEST_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (data.musicTracks && data.backgroundScenes && data.ambienceSounds) {
          setStationData(normalizeManifest(data))
        }
      })
      .catch((err) => console.warn("Using offline fallback music catalog:", err))
  }, [setStationData])

  // Only the two layout flags are read here; anything that ticks lives in its own
  // component so the page shell never re-renders on a timer.
  const showTime = useAppStore((state) => state.preferences.showTime)
  const showTimer = useAppStore((state) => state.preferences.showTimer)

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BackgroundLayer />
      <AudioVisualizer />
      <AmbientPlayer />
      <MusicPlayer />

      {/* Top Time Display (when both active) */}
      {showTime && showTimer && (
        <div className="absolute top-8 sm:top-12 z-20 animate-in slide-in-from-top-4 duration-700 fade-in select-none">
          <div className="scale-75 sm:scale-90 origin-top">
            <TimeDisplay />
          </div>
        </div>
      )}

      {/* Middle Content */}
      <div className="relative z-10 w-full px-4">
        <div className="flex items-center justify-center">
          {showTimer && <TimerDisplay />}
          {!showTimer && showTime && <TimeDisplay />}
        </div>
      </div>

      <TodoWidget />

      <ControlBar />
      <SettingsMenu />

      <PomodoroController />

      <CookiePopup />
    </main>
  )
}
