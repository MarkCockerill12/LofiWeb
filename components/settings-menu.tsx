"use client"

import { useAppStore } from "@/lib/store"
import { X, Maximize2, Activity, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SimpleSlider } from "@/components/ui/slider"
import { SceneLibraryDialog, TrackLibraryDialog } from "@/components/settings-libraries"
import { SCENE_COLORS } from "@/lib/data"
import { THEME_COLORS, TIMER_PRESETS } from "@/lib/constants"
import type { ThemeColor, ThemeVariant } from "@/lib/store"
import { useState } from "react"
import { getUIColors } from "@/lib/utils"

const AMBIENT_KEYS = [
  { key: "rain", label: "Rain" },
  { key: "keyboard", label: "Keyboard" },
  { key: "cafe", label: "Cafe" },
] as const

export function SettingsMenu() {
  const musicTracks = useAppStore((state) => state.musicTracks)
  const backgroundScenes = useAppStore((state) => state.backgroundScenes)
  const showSettings = useAppStore((state) => state.showSettings)
  const toggleSettings = useAppStore((state) => state.toggleSettings)
  const preferences = useAppStore((state) => state.preferences)
  const updatePreferences = useAppStore((state) => state.updatePreferences)
  const applyTimerPreset = useAppStore((state) => state.applyTimerPreset)
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  const setCurrentScene = useAppStore((state) => state.setCurrentScene)
  const currentTrackId = useAppStore((state) => state.currentTrackId)
  const setCurrentTrack = useAppStore((state) => state.setCurrentTrack)
  const setActivePlaylist = useAppStore((state) => state.setActivePlaylist)
  const setQueue = useAppStore((state) => state.setQueue)
  const ambientSounds = useAppStore((state) => state.ambientSounds)
  const toggleAmbientSound = useAppStore((state) => state.toggleAmbientSound)
  const ambientPresets = useAppStore((state) => state.ambientPresets)
  const saveAmbientPreset = useAppStore((state) => state.saveAmbientPreset)
  const applyAmbientPreset = useAppStore((state) => state.applyAmbientPreset)
  const deleteAmbientPreset = useAppStore((state) => state.deleteAmbientPreset)
  const favoriteTracks = useAppStore((state) => state.favoriteTracks)

  const visualizerStyle = useAppStore((state) => state.visualizerStyle)
  const setVisualizerStyle = useAppStore((state) => state.setVisualizerStyle)
  const visualizerSensitivity = useAppStore((state) => state.visualizerSensitivity)
  const setVisualizerSensitivity = useAppStore((state) => state.setVisualizerSensitivity)

  const [showScenesPopup, setShowScenesPopup] = useState(false)
  const [showTracksPopup, setShowTracksPopup] = useState(false)
  const [presetName, setPresetName] = useState("")

  const isAnyAmbientOn = Object.values(ambientSounds).some(Boolean)

  const { secondaryColor, uiMode, clockStyle } = preferences
  const activeClockStyle = clockStyle || "default"

  const bgHex = secondaryColor
    ? THEME_COLORS[secondaryColor]
    : (currentSceneId && SCENE_COLORS[currentSceneId]) || "#000000"
  const uiColors = getUIColors(bgHex, uiMode)

  /** Sets the track along with the playlist context and queue it belongs to. */
  const handlePlayTrack = (trackId: string, category: string) => {
    setCurrentTrack(trackId)
    setActivePlaylist(category)

    let newQueue: typeof musicTracks = []
    if (category === "all") newQueue = musicTracks
    else if (category === "favorites") newQueue = musicTracks.filter((t) => favoriteTracks.includes(t.id))
    else newQueue = musicTracks.filter((t) => t.category === category)

    setQueue(newQueue.map((t) => t.id))
  }

  const handleSavePreset = () => {
    const name = presetName.trim()
    if (!name) return
    saveAmbientPreset(name)
    setPresetName("")
  }

  const activePreset = TIMER_PRESETS.find(
    (p) => p.focus === preferences.focusDuration && p.break === preferences.breakDuration,
  )

  const tabTriggerClass =
    uiColors.bgBase === "#ffffff"
      ? "data-[state=active]:bg-black/10 hover:bg-black/5"
      : "data-[state=active]:bg-white/25 dark:data-[state=active]:bg-white/10 hover:bg-white/10"

  if (!showSettings) return null

  return (
    <>
      <div className="fixed inset-0 z-50 animate-in fade-in duration-200">
        <div
          className="absolute inset-0 bg-black/60"
          onClick={toggleSettings}
          role="button"
          tabIndex={-1}
          onKeyDown={(e) => e.key === "Escape" && toggleSettings()}
        />

        <div className="absolute right-0 top-0 bottom-0 w-full max-w-md animate-in slide-in-from-right duration-300">
          <div
            className="h-full glass border-l"
            style={{ backgroundColor: uiColors.bg, borderColor: uiColors.border }}
          >
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: uiColors.border }}
            >
              <h2 className="text-xl font-semibold" style={{ color: uiColors.text }}>
                Settings
              </h2>
              <Button
                onClick={toggleSettings}
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-all"
                style={{ color: uiColors.textSecondary }}
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="h-[calc(100%-80px)]">
              <Tabs defaultValue="vibe" className="w-full p-6">
                <TabsList
                  className="grid w-full grid-cols-3"
                  style={{
                    backgroundColor: uiColors.bgBase === "#ffffff" ? "rgba(0, 0, 0, 0.05)" : "#050505",
                  }}
                >
                  {(
                    [
                      ["vibe", "Vibe"],
                      ["timer", "Timer"],
                      ["appearance", "Style"],
                    ] as const
                  ).map(([value, label]) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className={`transition-colors duration-200 ${tabTriggerClass}`}
                      style={{ color: uiColors.text }}
                    >
                      {label}
                    </TabsTrigger>
                  ))}
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
                          className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                            currentSceneId === scene.id ? "scale-95" : "hover:border-white/40"
                          }`}
                          style={{
                            borderColor: currentSceneId === scene.id ? uiColors.text : uiColors.border,
                          }}
                        >
                          <img
                            src={scene.thumbnailUrl || "/placeholder.svg"}
                            alt={scene.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
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
                          onClick={() => handlePlayTrack(track.id, track.category || "all")}
                          className="w-full text-left p-3 rounded-lg transition-all hover:scale-105 active:scale-95"
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
                      {AMBIENT_KEYS.map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: uiColors.text }}>
                            {label}
                          </span>
                          <Switch
                            checked={ambientSounds[key]}
                            onCheckedChange={() => toggleAmbientSound(key)}
                            aria-label={label}
                          />
                        </div>
                      ))}
                    </div>

                    {isAnyAmbientOn && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: uiColors.border }}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium" style={{ color: uiColors.textSecondary }}>
                            Ambience Volume
                          </h3>
                          <span className="text-sm" style={{ color: uiColors.textSecondary }}>
                            {Math.round(preferences.ambientVolume * 100)}%
                          </span>
                        </div>
                        <SimpleSlider
                          value={preferences.ambientVolume * 100}
                          onChange={(value) => updatePreferences({ ambientVolume: value / 100 })}
                          min={0}
                          max={100}
                          uiColors={uiColors}
                          ariaLabel="Ambience volume"
                        />
                      </div>
                    )}

                    {/* Saved ambient mixes */}
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: uiColors.border }}>
                      <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                        Mix Presets
                      </h3>

                      {ambientPresets.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {ambientPresets.map((preset) => (
                            <div key={preset.id} className="flex items-center gap-2">
                              <button
                                onClick={() => applyAmbientPreset(preset.id)}
                                className="flex-1 text-left px-3 py-2 rounded-lg text-sm transition-all hover:scale-[1.02] active:scale-95 border"
                                style={{
                                  color: uiColors.text,
                                  backgroundColor: `${uiColors.bg}66`,
                                  borderColor: uiColors.border,
                                }}
                              >
                                {preset.name}
                                <span className="ml-2 text-xs" style={{ color: uiColors.textSecondary }}>
                                  {Object.entries(preset.sounds)
                                    .filter(([, on]) => on)
                                    .map(([k]) => k)
                                    .join(" + ") || "silent"}
                                </span>
                              </button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteAmbientPreset(preset.id)}
                                aria-label={`Delete preset ${preset.name}`}
                                className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                                style={{ color: uiColors.textSecondary }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                          placeholder="Name this mix..."
                          aria-label="Preset name"
                          className="flex-1 rounded-lg border px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1"
                          style={{ color: uiColors.text, borderColor: uiColors.border }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSavePreset}
                          disabled={!presetName.trim()}
                          aria-label="Save ambient mix preset"
                          className="h-9 w-9 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-40"
                          style={{ color: uiColors.text }}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timer" className="space-y-6 mt-6">
                  <div className="space-y-4 pb-6 border-b" style={{ borderColor: uiColors.border }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: uiColors.text }}>
                        Show Clock
                      </span>
                      <Switch
                        checked={preferences.showTime}
                        onCheckedChange={(checked) => updatePreferences({ showTime: checked })}
                        aria-label="Show clock"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: uiColors.text }}>
                        Show Timer
                      </span>
                      <Switch
                        checked={preferences.showTimer}
                        onCheckedChange={(checked) => updatePreferences({ showTimer: checked })}
                        aria-label="Show timer"
                      />
                    </div>
                  </div>

                  {/* Timer presets */}
                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                      Presets
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {TIMER_PRESETS.map((preset) => {
                        const isActive = activePreset?.id === preset.id
                        return (
                          <button
                            key={preset.id}
                            onClick={() => applyTimerPreset(preset.focus, preset.break)}
                            className="p-3 rounded-lg transition-all border flex flex-col items-center gap-0.5 hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: isActive ? `${uiColors.bgBase}40` : "transparent",
                              borderColor: isActive ? uiColors.text : uiColors.border,
                            }}
                          >
                            <span className="text-xs font-medium" style={{ color: uiColors.text }}>
                              {preset.label}
                            </span>
                            <span className="text-[10px]" style={{ color: uiColors.textSecondary }}>
                              {preset.focus}/{preset.break}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {!activePreset && (
                      <p className="text-[10px] mt-2 text-center" style={{ color: uiColors.textSecondary }}>
                        Custom &mdash; {preferences.focusDuration}/{preferences.breakDuration}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium" style={{ color: uiColors.textSecondary }}>
                        Focus Duration
                      </h3>
                      <span className="text-sm" style={{ color: uiColors.textSecondary }}>
                        {preferences.focusDuration} min
                      </span>
                    </div>
                    <SimpleSlider
                      value={preferences.focusDuration}
                      onChange={(value) => updatePreferences({ focusDuration: value })}
                      min={1}
                      max={120}
                      uiColors={uiColors}
                      ariaLabel="Focus duration"
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
                    <SimpleSlider
                      value={preferences.breakDuration}
                      onChange={(value) => updatePreferences({ breakDuration: value })}
                      min={1}
                      max={30}
                      uiColors={uiColors}
                      ariaLabel="Break duration"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6 mt-6">
                  {(
                    [
                      ["Primary Color", "themeColor", preferences.themeColor],
                      ["Secondary Color (Timer BG)", "secondaryColor", secondaryColor],
                    ] as const
                  ).map(([label, prefKey, active]) => (
                    <div key={prefKey}>
                      <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                        {label}
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(THEME_COLORS).map(([color, hex]) => (
                          <button
                            key={color}
                            onClick={() => updatePreferences({ [prefKey]: color as ThemeColor })}
                            className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all"
                            style={{
                              backgroundColor: active === color ? `${uiColors.bgBase}40` : "transparent",
                              border: active === color ? `1px solid ${uiColors.border}` : "1px solid transparent",
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-full border-2"
                              style={{ backgroundColor: hex, borderColor: uiColors.border }}
                            />
                            <span className="text-xs capitalize" style={{ color: uiColors.text }}>
                              {color}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                      Style Mode
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ["minimal", "Minimal", "Clean & Simple"],
                          ["neon", "Cyber", "Neon Glow"],
                        ] as const
                      ).map(([variant, title, subtitle]) => (
                        <button
                          key={variant}
                          onClick={() => updatePreferences({ themeVariant: variant as ThemeVariant })}
                          className="p-4 rounded-lg transition-all border"
                          style={{
                            backgroundColor:
                              preferences.themeVariant === variant ? `${uiColors.bgBase}40` : "transparent",
                            borderColor: preferences.themeVariant === variant ? uiColors.border : "transparent",
                          }}
                        >
                          <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                            {title}
                          </p>
                          <p className="text-xs mt-1" style={{ color: uiColors.textSecondary }}>
                            {subtitle}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                      Clock Style
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {(["default", "clean", "box", "pill"] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => updatePreferences({ clockStyle: style })}
                          className="p-2 rounded-lg transition-all border flex flex-col items-center gap-1 justify-center capitalize"
                          style={{
                            backgroundColor: activeClockStyle === style ? `${uiColors.bgBase}40` : "transparent",
                            borderColor: activeClockStyle === style ? uiColors.text : uiColors.border,
                          }}
                        >
                          <span className="text-xs font-medium" style={{ color: uiColors.text }}>
                            {style}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t" style={{ borderColor: uiColors.border }}>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium" style={{ color: uiColors.textSecondary }}>
                          Visualizer Scale
                        </h3>
                        <span className="text-sm" style={{ color: uiColors.textSecondary }}>
                          {visualizerSensitivity.toFixed(1)}x
                        </span>
                      </div>
                      <SimpleSlider
                        value={visualizerSensitivity * 10}
                        onChange={(value) => setVisualizerSensitivity(value / 10)}
                        min={5}
                        max={15}
                        uiColors={uiColors}
                        ariaLabel="Visualizer scale"
                      />
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                        Visualizer Style
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {(["bars", "wave", "circle"] as const).map((style) => (
                          <button
                            key={style}
                            onClick={() => setVisualizerStyle(style)}
                            className="p-3 rounded-lg transition-all border flex flex-col items-center gap-2 justify-center"
                            style={{
                              backgroundColor: visualizerStyle === style ? `${uiColors.bgBase}40` : "transparent",
                              borderColor: visualizerStyle === style ? uiColors.text : uiColors.border,
                            }}
                          >
                            <Activity className="w-4 h-4" style={{ color: uiColors.text }} />
                            <p className="text-xs font-medium capitalize" style={{ color: uiColors.text }}>
                              {style}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                      UI Mode
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {(["auto", "light", "dark"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updatePreferences({ uiMode: mode })}
                          className="p-3 rounded-lg transition-all border hover:scale-105 active:scale-95 capitalize"
                          style={{
                            backgroundColor: uiMode === mode ? `${uiColors.bgBase}40` : "transparent",
                            borderColor: uiMode === mode ? uiColors.border : "transparent",
                          }}
                        >
                          <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                            {mode}
                          </p>
                        </button>
                      ))}
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
                    <SimpleSlider
                      value={preferences.timerOpacity * 100}
                      onChange={(value) => updatePreferences({ timerOpacity: value / 100 })}
                      min={20}
                      max={100}
                      uiColors={uiColors}
                      ariaLabel="UI opacity"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </div>
        </div>
      </div>

      <SceneLibraryDialog open={showScenesPopup} onOpenChange={setShowScenesPopup} uiColors={uiColors} />
      <TrackLibraryDialog
        open={showTracksPopup}
        onOpenChange={setShowTracksPopup}
        uiColors={uiColors}
        onPlayTrack={handlePlayTrack}
      />
    </>
  )
}
