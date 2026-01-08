"use client"

import { useAppStore } from "@/lib/store"
import { X, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { backgroundScenes, musicTracks } from "@/lib/data"
import type { ThemeColor, ThemeVariant } from "@/lib/store"
import { useState } from "react"
import { getUIColors } from "@/lib/utils"

const THEME_COLORS: { color: ThemeColor; hex: string; label: string }[] = [
  { color: "cyan", hex: "#06b6d4", label: "Cyan" },
  { color: "purple", hex: "#a855f7", label: "Purple" },
  { color: "orange", hex: "#f97316", label: "Orange" },
  { color: "green", hex: "#10b981", label: "Green" },
  { color: "pink", hex: "#ec4899", label: "Pink" },
  { color: "white", hex: "#ffffff", label: "White" },
  { color: "black", hex: "#000000", label: "Black" },
]

export function SettingsMenu() {
  const showSettings = useAppStore((state) => state.showSettings)
  const toggleSettings = useAppStore((state) => state.toggleSettings)
  const preferences = useAppStore((state) => state.preferences)
  const updatePreferences = useAppStore((state) => state.updatePreferences)
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  const setCurrentScene = useAppStore((state) => state.setCurrentScene)
  const currentTrackId = useAppStore((state) => state.currentTrackId)
  const setCurrentTrack = useAppStore((state) => state.setCurrentTrack)
  const ambientSounds = useAppStore((state) => state.ambientSounds)
  const toggleAmbientSound = useAppStore((state) => state.toggleAmbientSound)

  const [showScenesPopup, setShowScenesPopup] = useState(false)
  const [showTracksPopup, setShowTracksPopup] = useState(false)

  const { secondaryColor, uiMode } = preferences

  const currentScene = backgroundScenes.find((s) => s.id === currentSceneId)
  const bgHex = secondaryColor
    ? THEME_COLORS.find((c) => c.color === secondaryColor)?.hex
    : currentScene?.color || "#000000"
  const uiColors = getUIColors(bgHex, uiMode)

  if (!showSettings) return null

  return (
    <>
      <div className="fixed inset-0 z-50 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-black/60" onClick={toggleSettings} />

        <div className="absolute right-0 top-0 bottom-0 w-full max-w-md animate-in slide-in-from-right duration-300">
          <div
            className="h-full glass border-l"
            style={{
              backgroundColor: uiColors.bg,
              borderColor: uiColors.border,
            }}
          >
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: uiColors.border }}>
              <h2 className="text-xl font-semibold" style={{ color: uiColors.text }}>
                Settings
              </h2>
              <Button
                onClick={toggleSettings}
                variant="ghost"
                size="icon"
                className="rounded-full"
                style={{ color: uiColors.textSecondary }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="h-[calc(100%-80px)]">
              <Tabs defaultValue="vibe" className="w-full p-6">
                <TabsList
                  className="grid w-full grid-cols-3"
                  style={{
                    backgroundColor: `${uiColors.bg}dd`,
                  }}
                >
                  <TabsTrigger value="vibe" style={{ color: uiColors.text }}>
                    Vibe
                  </TabsTrigger>
                  <TabsTrigger value="timer" style={{ color: uiColors.text }}>
                    Timer
                  </TabsTrigger>
                  <TabsTrigger value="appearance" style={{ color: uiColors.text }}>
                    Style
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="vibe" className="space-y-6 mt-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium" style={{ color: uiColors.textSecondary }}>
                        Background Scene
                      </h3>
                      <Button
                        onClick={() => setShowScenesPopup(true)}
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        style={{ color: uiColors.textSecondary }}
                      >
                        <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
                        View All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {backgroundScenes.slice(0, 4).map((scene) => (
                        <button
                          key={scene.id}
                          onClick={() => setCurrentScene(scene.id)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            currentSceneId === scene.id ? "scale-95" : "hover:border-white/40"
                          }`}
                          style={{
                            borderColor: currentSceneId === scene.id ? uiColors.text : `${uiColors.border}`,
                          }}
                        >
                          <img
                            src={scene.thumbnailUrl || "/placeholder.svg"}
                            alt={scene.name}
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <p className="absolute bottom-2 left-2 text-xs text-white font-medium">{scene.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium" style={{ color: uiColors.textSecondary }}>
                        Music Track
                      </h3>
                      <Button
                        onClick={() => setShowTracksPopup(true)}
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        style={{ color: uiColors.textSecondary }}
                      >
                        <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
                        View All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {musicTracks.slice(0, 3).map((track) => (
                        <button
                          key={track.id}
                          onClick={() => setCurrentTrack(track.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all`}
                          style={{
                            backgroundColor: currentTrackId === track.id ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                          }}
                        >
                          <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                            {track.title}
                          </p>
                          <p className="text-xs" style={{ color: uiColors.textSecondary }}>
                            {track.artist}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t" style={{ borderColor: uiColors.border }}>
                    <h3 className="text-sm font-medium mb-4" style={{ color: uiColors.textSecondary }}>
                      Ambient Sounds
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: uiColors.text }}>
                          Rain
                        </span>
                        <Switch checked={ambientSounds.rain} onCheckedChange={() => toggleAmbientSound("rain")} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: uiColors.text }}>
                          Keyboard
                        </span>
                        <Switch
                          checked={ambientSounds.keyboard}
                          onCheckedChange={() => toggleAmbientSound("keyboard")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: uiColors.text }}>
                          Cafe
                        </span>
                        <Switch checked={ambientSounds.cafe} onCheckedChange={() => toggleAmbientSound("cafe")} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timer" className="space-y-6 mt-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium" style={{ color: uiColors.textSecondary }}>
                        Focus Duration
                      </h3>
                      <span className="text-sm" style={{ color: uiColors.textSecondary }}>
                        {preferences.focusDuration} min
                      </span>
                    </div>
                    <Slider
                      value={[preferences.focusDuration]}
                      onValueChange={([value]) => updatePreferences({ focusDuration: value })}
                      min={1}
                      max={60}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium" style={{ color: uiColors.textSecondary }}>
                        Break Duration
                      </h3>
                      <span className="text-sm" style={{ color: uiColors.textSecondary }}>
                        {preferences.breakDuration} min
                      </span>
                    </div>
                    <Slider
                      value={[preferences.breakDuration]}
                      onValueChange={([value]) => updatePreferences({ breakDuration: value })}
                      min={1}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                      Primary Color
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {THEME_COLORS.map(({ color, hex, label }) => (
                        <button
                          key={color}
                          onClick={() => updatePreferences({ themeColor: color })}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all`}
                          style={{
                            backgroundColor: preferences.themeColor === color ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-full border-2"
                            style={{ backgroundColor: hex, borderColor: uiColors.border }}
                          />
                          <span className="text-xs" style={{ color: uiColors.text }}>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                      Secondary Color (Timer BG)
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {THEME_COLORS.map(({ color, hex, label }) => (
                        <button
                          key={color}
                          onClick={() => updatePreferences({ secondaryColor: color })}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all`}
                          style={{
                            backgroundColor: secondaryColor === color ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-full border-2"
                            style={{ backgroundColor: hex, borderColor: uiColors.border }}
                          />
                          <span className="text-xs" style={{ color: uiColors.text }}>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                      Style Mode
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => updatePreferences({ themeVariant: "minimal" as ThemeVariant })}
                        className={`p-4 rounded-lg transition-all`}
                        style={{
                          backgroundColor:
                            preferences.themeVariant === "minimal" ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                          Minimal
                        </p>
                        <p className="text-xs mt-1" style={{ color: uiColors.textSecondary }}>
                          Clean & Simple
                        </p>
                      </button>
                      <button
                        onClick={() => updatePreferences({ themeVariant: "neon" as ThemeVariant })}
                        className={`p-4 rounded-lg transition-all`}
                        style={{
                          backgroundColor:
                            preferences.themeVariant === "neon" ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                          Cyber
                        </p>
                        <p className="text-xs mt-1" style={{ color: uiColors.textSecondary }}>
                          Neon Glow
                        </p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                      UI Mode
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => updatePreferences({ uiMode: "auto" })}
                        className="p-3 rounded-lg transition-all"
                        style={{
                          backgroundColor: uiMode === "auto" ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                          Auto
                        </p>
                      </button>
                      <button
                        onClick={() => updatePreferences({ uiMode: "light" })}
                        className="p-3 rounded-lg transition-all"
                        style={{
                          backgroundColor: uiMode === "light" ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                          Light
                        </p>
                      </button>
                      <button
                        onClick={() => updatePreferences({ uiMode: "dark" })}
                        className="p-3 rounded-lg transition-all"
                        style={{
                          backgroundColor: uiMode === "dark" ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                          Dark
                        </p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium" style={{ color: uiColors.textSecondary }}>
                        UI Opacity
                      </h3>
                      <span className="text-sm" style={{ color: uiColors.textSecondary }}>
                        {Math.round(preferences.timerOpacity * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[preferences.timerOpacity * 100]}
                      onValueChange={([value]) => updatePreferences({ timerOpacity: value / 100 })}
                      min={50}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </div>
        </div>
      </div>

      <Dialog open={showScenesPopup} onOpenChange={setShowScenesPopup}>
        <DialogContent
          className="max-w-4xl max-h-[80vh] border"
          style={{
            backgroundColor: uiColors.bg,
            borderColor: uiColors.border,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: uiColors.text }}>All Background Scenes</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
              {backgroundScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setCurrentScene(scene.id)
                    setShowScenesPopup(false)
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all`}
                  style={{
                    borderColor: currentSceneId === scene.id ? uiColors.text : uiColors.border,
                  }}
                >
                  <img
                    src={scene.thumbnailUrl || "/placeholder.svg"}
                    alt={scene.name}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <p className="absolute bottom-2 left-2 text-sm text-white font-medium">{scene.name}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showTracksPopup} onOpenChange={setShowTracksPopup}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] border"
          style={{
            backgroundColor: uiColors.bg,
            borderColor: uiColors.border,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: uiColors.text }}>All Music Tracks</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-2 p-1">
              {musicTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentTrack(track.id)
                    setShowTracksPopup(false)
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-all`}
                  style={{
                    backgroundColor: currentTrackId === track.id ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                    {track.title}
                  </p>
                  <p className="text-xs" style={{ color: uiColors.textSecondary }}>
                    {track.artist}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
