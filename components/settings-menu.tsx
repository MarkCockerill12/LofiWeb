"use client"

import { useAppStore } from "@/lib/store"
import { X, Maximize2, Heart, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { backgroundScenes, musicTracks } from "@/lib/data"
import type { ThemeColor, ThemeVariant } from "@/lib/store"
import { useState, useRef, useEffect } from "react"
import { getUIColors } from "@/lib/utils"
import * as SliderPrimitive from "@radix-ui/react-slider"

// Simple native slider 
function SimpleSlider({ value, max = 100, min = 0, onChange, uiColors }: { value: number, max?: number, min?: number, onChange: (val: number) => void, uiColors: any }) {
    return (
        <SliderPrimitive.Root
            className="relative flex items-center select-none touch-none w-full h-5 group cursor-pointer"
            value={[value]}
            max={max}
            min={min}
            step={1}
            onValueChange={(vals) => onChange(vals[0])}
        >
            <SliderPrimitive.Track className="bg-black/20 dark:bg-white/20 relative grow rounded-full h-1.5 overflow-hidden">
                <SliderPrimitive.Range 
                    className="absolute h-full transition-colors" 
                    style={{ backgroundColor: uiColors.text }}
                />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
                className="block w-4 h-4 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:scale-110 focus:outline-none focus:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                style={{ border: `2px solid ${uiColors.text}` }}
            />
        </SliderPrimitive.Root>
    )
}



const THEME_COLORS: { color: ThemeColor; hex: string; label: string }[] = [
  { color: "cyan", hex: "#06b6d4", label: "Cyan" },
  { color: "purple", hex: "#a855f7", label: "Purple" },
  { color: "orange", hex: "#f97316", label: "Orange" },
  { color: "green", hex: "#10b981", label: "Green" },
  { color: "pink", hex: "#ec4899", label: "Pink" },
  { color: "white", hex: "#ffffff", label: "White" },
  { color: "black", hex: "#000000", label: "Black" },
]

const SCENE_COLORS: Record<string, string> = {
  "scene-0": "#ec4899", // Sakura -> Pink
  "scene-1": "#a855f7", // Retrowave -> Purple
  "scene-2": "#06b6d4", // Night City -> Cyan
  "scene-3": "#06b6d4", // Moonlit Lake -> Cyan
  "scene-4": "#a855f7", // Moonlight Flower -> Purple
  "scene-5": "#10b981", // Minecraft -> Green
  "scene-6": "#f97316", // Magma -> Orange
  "scene-7": "#a855f7", // Galactic -> Purple
  "scene-8": "#000000", // Deltarune -> Black
  "scene-9": "#ec4899", // Bongo Cat -> Pink
}

const UI_COLORS_EXTENDED = {
    // Add any specific UI overrides if needed
}

export function SettingsMenu() {
  const showSettings = useAppStore((state) => state.showSettings)
  const toggleSettings = useAppStore((state) => state.toggleSettings)
  const preferences = useAppStore((state) => state.preferences)
  const updatePreferences = useAppStore((state) => state.updatePreferences)
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  const setCurrentScene = useAppStore((state) => state.setCurrentScene)
  const currentTrackId = useAppStore((state) => state.currentTrackId)
  const setCurrentTrack = useAppStore((state) => state.setCurrentTrack)
  const activePlaylist = useAppStore((state) => state.activePlaylist)
  const setActivePlaylist = useAppStore((state) => state.setActivePlaylist)
  const setQueue = useAppStore((state) => state.setQueue) // Use setQueue
  const ambientSounds = useAppStore((state) => state.ambientSounds)

  // ... rest of imports/vars ...

  // Helper to set playlist context
  const handlePlayTrack = (trackId: string, category: string) => {
      // 1. Set current track
      setCurrentTrack(trackId)
      
      // 2. Set Active Playlist Context
      setActivePlaylist(category)
      
      // 3. Populate Queue based on category
      let newQueue: typeof musicTracks = [];
      if (category === 'all') newQueue = musicTracks;
      else if (category === 'favorites') newQueue = musicTracks.filter(t => favoriteTracks.includes(t.id));
      else newQueue = musicTracks.filter(t => t.category === category);
      
      setQueue(newQueue.map(t => t.id));
  }

  // Check if we need to sync queue on first load if empty?
  // Maybe better to do in store init or just rely on fallback in MusicPlayer.
  
  // ... helper function updates logic below ...

  const toggleAmbientSound = useAppStore((state) => state.toggleAmbientSound)
  
  const favoriteScenes = useAppStore((state) => state.favoriteScenes)
  const toggleFavoriteScene = useAppStore((state) => state.toggleFavoriteScene)
  const favoriteTracks = useAppStore((state) => state.favoriteTracks)
  const toggleFavoriteTrack = useAppStore((state) => state.toggleFavoriteTrack)
  
  const showVisualizer = useAppStore(state => state.showVisualizer)
  const toggleVisualizer = useAppStore(state => state.toggleVisualizer)
  const visualizerStyle = useAppStore(state => state.visualizerStyle)
  const setVisualizerStyle = useAppStore(state => state.setVisualizerStyle)
  const visualizerSensitivity = useAppStore(state => state.visualizerSensitivity)
  const setVisualizerSensitivity = useAppStore(state => state.setVisualizerSensitivity)
  
  const isAnyAmbientOn = Object.values(ambientSounds).some(Boolean)

  const [showScenesPopup, setShowScenesPopup] = useState(false)
  const [showTracksPopup, setShowTracksPopup] = useState(false)
  
  // Hover Preview State
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSceneMouseEnter = (id: string) => {
      hoverTimeoutRef.current = setTimeout(() => {
          setHoveredSceneId(id)
      }, 500) // 0.5s delay to avoid flashing
  }

  const handleSceneMouseLeave = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      setHoveredSceneId(null)
  }

  const { secondaryColor, uiMode } = preferences

  const currentScene = backgroundScenes.find((s) => s.id === currentSceneId)
  const bgHex = secondaryColor
    ? THEME_COLORS.find((c) => c.color === secondaryColor)?.hex
    : (currentSceneId && SCENE_COLORS[currentSceneId]) || "#000000"
  const uiColors = getUIColors(bgHex, uiMode)

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
                className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-all"
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
                    backgroundColor: `${uiColors.bgBase}40`,
                  }}
                >
                  <TabsTrigger 
                    value="vibe" 
                    className="data-[state=active]:bg-white/20 dark:data-[state=active]:bg-white/10 hover:bg-white/10 transition-colors"
                    style={{ color: uiColors.text }}
                  >
                    Vibe
                  </TabsTrigger>
                  <TabsTrigger 
                    value="timer" 
                    className="data-[state=active]:bg-white/20 dark:data-[state=active]:bg-white/10 hover:bg-white/10 transition-colors"
                    style={{ color: uiColors.text }}
                  >
                    Timer
                  </TabsTrigger>
                  <TabsTrigger 
                    value="appearance" 
                    className="data-[state=active]:bg-white/20 dark:data-[state=active]:bg-white/10 hover:bg-white/10 transition-colors"
                    style={{ color: uiColors.text }}
                  >
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
                          className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
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
                          onClick={() => handlePlayTrack(track.id, track.category || 'all')}
                          className={`w-full text-left p-3 rounded-lg transition-all hover:scale-105 active:scale-95`}
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
                        />
                      </div>
                    )}
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
                    <SimpleSlider
                      value={preferences.focusDuration}
                      onChange={(value) => updatePreferences({ focusDuration: value })}
                      min={1}
                      max={60}
                      uiColors={uiColors}
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
                            backgroundColor:
                              preferences.themeColor === color ? `${uiColors.bgBase}40` : "transparent",
                            border: preferences.themeColor === color ? `1px solid ${uiColors.border}` : "1px solid transparent",
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
                            backgroundColor:
                              secondaryColor === color ? `${uiColors.bgBase}40` : "transparent",
                            border: secondaryColor === color ? `1px solid ${uiColors.border}` : "1px solid transparent",
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
                        className={`p-4 rounded-lg transition-all border`}
                        style={{
                          backgroundColor:
                            preferences.themeVariant === "minimal" ? `${uiColors.bgBase}40` : "transparent",
                          borderColor: preferences.themeVariant === "minimal" ? uiColors.border : "transparent",
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
                        className={`p-4 rounded-lg transition-all border`}
                        style={{
                          backgroundColor:
                            preferences.themeVariant === "neon" ? `${uiColors.bgBase}40` : "transparent",
                          borderColor: preferences.themeVariant === "neon" ? uiColors.border : "transparent",
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
                          min={5} // 0.5x
                          max={15} // 1.5x - Lowered max per request
                          uiColors={uiColors}
                      />
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-3" style={{ color: uiColors.textSecondary }}>
                        Visualizer Style
                      </h3>
                      
                      <div className="grid grid-cols-3 gap-3">
                              {(['bars', 'wave', 'circle'] as const).map((style) => (
                                <button
                                  key={style}
                                  onClick={() => setVisualizerStyle(style)}
                                  className={`p-3 rounded-lg transition-all border flex flex-col items-center gap-2 justify-center`}
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
                      <button
                        onClick={() => updatePreferences({ uiMode: "auto" })}
                        className="p-3 rounded-lg transition-all border hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: uiMode === "auto" ? `${uiColors.bgBase}40` : "transparent",
                          borderColor: uiMode === "auto" ? uiColors.border : "transparent",
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                          Auto
                        </p>
                      </button>
                      <button
                        onClick={() => updatePreferences({ uiMode: "light" })}
                        className="p-3 rounded-lg transition-all border hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: uiMode === "light" ? `${uiColors.bgBase}40` : "transparent",
                          borderColor: uiMode === "light" ? uiColors.border : "transparent",
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                          Light
                        </p>
                      </button>
                      <button
                        onClick={() => updatePreferences({ uiMode: "dark" })}
                        className="p-3 rounded-lg transition-all border hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: uiMode === "dark" ? `${uiColors.bgBase}40` : "transparent",
                          borderColor: uiMode === "dark" ? uiColors.border : "transparent",
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
                    <SimpleSlider
                      value={preferences.timerOpacity * 100}
                      onChange={(value) => updatePreferences({ timerOpacity: value / 100 })}
                      min={20}
                      max={100}
                      uiColors={uiColors}
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
          className="w-[95vw] max-w-none sm:max-w-none h-[90vh] border flex flex-col"
          style={{
            backgroundColor: uiColors.bg,
            borderColor: uiColors.border,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: uiColors.text }}>Background Library</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
             <TabsList className="mb-4 flex flex-wrap gap-2 h-auto bg-transparent justify-start">
                 <TabsTrigger value="all" className="border" style={{ borderColor: uiColors.border }}>All</TabsTrigger>
                 <TabsTrigger value="favorites" className="border" style={{ borderColor: uiColors.border }}>Favorites</TabsTrigger>
                 {Array.from(new Set(backgroundScenes.map(s => s.category || 'Other'))).map(cat => (
                     <TabsTrigger key={cat} value={cat} className="border" style={{ borderColor: uiColors.border }}>{cat}</TabsTrigger>
                 ))}
             </TabsList>
             
             {['all', 'favorites', ...Array.from(new Set(backgroundScenes.map(s => s.category || 'Other')))].map(tab => {
                 const filteredScenes = backgroundScenes.filter(scene => {
                                  if (tab === 'all') return true;
                                  if (tab === 'favorites') return favoriteScenes.includes(scene.id);
                                  return scene.category === tab;
                 })
                 
                 const previewScene = hoveredSceneId ? backgroundScenes.find(s => s.id === hoveredSceneId) : null

                 return (
                 <TabsContent key={tab} value={tab} className="flex-1 min-h-0 mt-0">
                     <div className="flex flex-col md:flex-row h-full gap-4 pb-4 overflow-hidden">
                         {/* Left Side: Grid (Desktop) / List (Mobile) */}
                         <ScrollArea className="w-full md:w-1/2 md:pr-4 h-full">
                            <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                              {filteredScenes.map((scene) => (
                                    <div
                                      key={scene.id}
                                      className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer flex items-center md:block p-2 md:p-0 w-full gap-3 md:gap-0`}
                                      style={{
                                        borderColor: currentSceneId === scene.id ? uiColors.text : (hoveredSceneId === scene.id ? uiColors.textSecondary : uiColors.border),
                                        opacity: hoveredSceneId && hoveredSceneId !== scene.id ? 0.7 : 1,
                                        backgroundColor: currentSceneId === scene.id ? `${uiColors.bg}cc` : 'transparent',
                                      }}
                                      onMouseEnter={() => handleSceneMouseEnter(scene.id)}
                                      onMouseLeave={handleSceneMouseLeave}
                                      onClick={() => setCurrentScene(scene.id)}
                                    >
                                      {/* Mobile Thumb */}
                                      <img
                                          src={scene.thumbnailUrl || "/placeholder.svg"}
                                          alt={scene.name}
                                          className="md:hidden w-16 h-10 rounded-md object-cover flex-shrink-0"
                                      />

                                      {/* Desktop Preview */}
                                      <img
                                          src={scene.thumbnailUrl || "/placeholder.svg"}
                                          alt={scene.name}
                                          className="hidden md:block w-full aspect-video object-cover"
                                      />
                                      
                                      <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                                      
                                      {/* Desktop Caption */}
                                      <div className="hidden md:flex absolute bottom-2 left-2 z-20 flex-col items-start pointer-events-none">
                                          <p className="text-xs text-white font-medium shadow-black drop-shadow-md truncate w-full">{scene.name}</p>
                                      </div>
                                      
                                      {/* Mobile Only Text */}
                                       <span className="md:hidden text-sm font-medium truncate" style={{ color: uiColors.text }}>
                                            {scene.name}
                                       </span>

                                      <div className="ml-auto md:absolute md:top-1 md:right-1 md:ml-0 z-30">
                                          <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-6 w-6 rounded-full bg-transparent md:bg-black/20 md:hover:bg-black/40" // Transparent on mobile list
                                              style={{ color: uiColors.text }}
                                              onClick={(e) => {
                                                  e.stopPropagation()
                                                  toggleFavoriteScene(scene.id)
                                              }}
                                          >
                                              <Heart className={`w-3 h-3 ${favoriteScenes.includes(scene.id) ? "fill-red-500 text-red-500" : ""}`} />
                                          </Button>
                                      </div>
                                    </div>
                                  ))}
                            </div>
                         </ScrollArea>
                         
                         {/* Right Side: Large Preview (Desktop Only) */}
                         <div className="hidden md:block w-1/2 rounded-xl overflow-hidden relative border shadow-2xl h-full" style={{ borderColor: uiColors.border }}>
                             {previewScene ? (
                                 <>
                                     <video 
                                        key={previewScene.id}
                                        src={previewScene.videoUrl} 
                                        autoPlay 
                                        muted 
                                        loop 
                                        className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-500"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                                      <div className="absolute bottom-6 left-6 z-20">
                                          <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{previewScene.name}</h2>
                                          <div className="flex items-center gap-2">
                                              <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded text-sm text-white font-medium uppercase tracking-wider">
                                                {previewScene.category || 'Scene'}
                                              </span>
                                          </div>
                                      </div>
                                 </>
                             ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
                                    <Maximize2 className="w-16 h-16 opacity-20" />
                                    <p className="text-xl font-medium">Hover over a scene to preview</p>
                                </div>
                             )}
                         </div>
                     </div>
                 </TabsContent>
             )})}
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showTracksPopup} onOpenChange={setShowTracksPopup}>
        <DialogContent
          className="max-w-3xl max-h-[85vh] border flex flex-col"
          style={{
            backgroundColor: uiColors.bg,
            borderColor: uiColors.border,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: uiColors.text }}>Music Library</DialogTitle>
          </DialogHeader>

                   <Tabs 
                        defaultValue="all" 
                        onValueChange={(category) => {
                             // Switch playlist immediately on tab change
                             let startTrack;
                             if (category === 'all') startTrack = musicTracks[0];
                             else if (category === 'favorites') {
                                 const favs = musicTracks.filter(t => favoriteTracks.includes(t.id));
                                 if (favs.length > 0) startTrack = favs[0];
                             } else {
                                 const cats = musicTracks.filter(t => t.category === category);
                                 if (cats.length > 0) startTrack = cats[0];
                             }
                             
                             if (startTrack) {
                                 handlePlayTrack(startTrack.id, category);
                             } else {
                                 setActivePlaylist(category);
                                 setQueue([]);
                             }
                        }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
             <TabsList className="mb-4 flex flex-wrap gap-2 h-auto bg-transparent justify-start">
                 <TabsTrigger value="all" className="border" style={{ borderColor: uiColors.border }}>All</TabsTrigger>
                 <TabsTrigger value="favorites" className="border" style={{ borderColor: uiColors.border }}>Favorites</TabsTrigger>
                 {Array.from(new Set(musicTracks.map(t => t.category || 'Other'))).map(cat => (
                     <TabsTrigger key={cat} value={cat} className="border" style={{ borderColor: uiColors.border }}>{cat}</TabsTrigger>
                 ))}
             </TabsList>
             
             {/* We need to define CONTENT for every trigger, or just one generic content that filters based on state? 
                 Radix Tabs requires TabsContent for each value. */}

             {['all', 'favorites', ...Array.from(new Set(musicTracks.map(t => t.category || 'Other')))].map(tab => (
                 <TabsContent key={tab} value={tab} className="flex-1 mt-0">
                    <ScrollArea className="h-[50vh] pr-4">
                        <div className="space-y-2 p-1">
                          {musicTracks
                             .filter(track => {
                                  if (tab === 'all') return true;
                                  if (tab === 'favorites') return favoriteTracks.includes(track.id);
                                  return track.category === tab;
                              })
                             .map((track) => (
                            <div
                              key={track.id}
                              className={`group w-full flex items-center justify-between p-4 rounded-lg transition-all border`}
                              style={{
                                backgroundColor: currentTrackId === track.id ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                                borderColor: currentTrackId === track.id ? uiColors.text : 'transparent'
                              }}
                            >
                              <button 
                                  className="flex-1 text-left flex flex-col"
                                  onClick={() => handlePlayTrack(track.id, tab)}
                              >
                                  <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                                    {track.title}
                                  </p>
                                  <div className="flex items-center gap-2">
                                      <p className="text-xs" style={{ color: uiColors.textSecondary }}>
                                        {track.artist}
                                      </p>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10" style={{ color: uiColors.textSecondary }}>
                                          {track.category}
                                      </span>
                                  </div>
                              </button>
                              
                              <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                      e.stopPropagation()
                                      toggleFavoriteTrack(track.id)
                                  }}
                                  className={`${favoriteTracks.includes(track.id) ? "text-red-500" : ""} hover:bg-black/10 dark:hover:bg-white/10`}
                              >
                                   <Heart className={`w-4 h-4 ${favoriteTracks.includes(track.id) ? "fill-current" : ""}`} />
                              </Button>
                            </div>
                          ))}
                        </div>
                     </ScrollArea>
                 </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
