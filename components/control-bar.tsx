"use client"

import { useAppStore } from "@/lib/store"
import { RotateCcw, CheckSquare, Volume2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getUIColors } from "@/lib/utils"
import { backgroundScenes, musicTracks } from "@/lib/data"

const THEME_COLORS = {
  cyan: "#06b6d4",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#10b981",
  pink: "#ec4899",
  white: "#ffffff",
  black: "#000000",
}

export function ControlBar() {
  const resetTimer = useAppStore((state) => state.resetTimer)
  const toggleTodos = useAppStore((state) => state.toggleTodos)
  const toggleSettings = useAppStore((state) => state.toggleSettings)
  const showTodos = useAppStore((state) => state.showTodos)
  const themeColor = useAppStore((state) => state.preferences.themeColor)
  const secondaryColor = useAppStore((state) => state.preferences.secondaryColor)
  const uiMode = useAppStore((state) => state.preferences.uiMode)
  const timerOpacity = useAppStore((state) => state.preferences.timerOpacity)
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  const currentTrackId = useAppStore((state) => state.currentTrackId)
  const setCurrentTrack = useAppStore((state) => state.setCurrentTrack)
  const musicPlaying = useAppStore((state) => state.musicPlaying)
  const setMusicPlaying = useAppStore((state) => state.setMusicPlaying)

  const color = THEME_COLORS[themeColor]

  const currentScene = backgroundScenes.find((s) => s.id === currentSceneId)
  const bgHex = secondaryColor ? THEME_COLORS[secondaryColor] : currentScene?.color || "#000000"
  const uiColors = getUIColors(bgHex, uiMode)

  const currentTrack = musicTracks.find((t) => t.id === currentTrackId)

  return (
    <div className="fixed top-4 left-4 z-40">
      <div
        className="glass rounded-xl border p-2"
        style={{
          backgroundColor: uiColors.bg,
          borderColor: uiColors.border,
          opacity: timerOpacity,
        }}
      >
        <div className="flex items-center gap-1.5">
          <Button
            onClick={resetTimer}
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9"
            style={{ color: uiColors.text }}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9" style={{ color: uiColors.text }}>
                <Volume2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 border"
              style={{
                backgroundColor: uiColors.bg,
                borderColor: uiColors.border,
              }}
            >
              <div className="space-y-3">
                <div className="text-center pb-2 border-b" style={{ borderColor: uiColors.border }}>
                  <p className="text-xs font-medium mb-1" style={{ color: uiColors.textSecondary }}>
                    Now Playing
                  </p>
                  <p className="text-sm font-semibold" style={{ color: uiColors.text }}>
                    {currentTrack?.title || "No Track"}
                  </p>
                  <p className="text-xs" style={{ color: uiColors.textSecondary }}>
                    {currentTrack?.artist || ""}
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={toggleTodos}
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9"
            style={{ color: showTodos ? color : uiColors.text }}
          >
            <CheckSquare className="w-4 h-4" />
          </Button>

          <Button
            onClick={toggleSettings}
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9"
            style={{ color: uiColors.text }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
