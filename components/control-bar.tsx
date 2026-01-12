"use client"

import { useAppStore } from "@/lib/store"
import { RotateCcw, CheckSquare, Volume2, Settings, Play, Pause, SkipForward, SkipBack, Repeat, Repeat1, Activity, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getUIColors } from "@/lib/utils"
import { musicTracks, SCENE_COLORS } from "@/lib/data"
import { useState } from "react"
import * as React from "react"

// Simple native slider for volume
function SimpleSlider({ value, max = 100, onChange, uiColors }: { value: number, max?: number, onChange: (val: number) => void, uiColors: any }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    return (
        <div className="relative h-4 flex items-center w-full group">
            <input 
            type="range" 
            min={0} 
            max={max} 
            step={1}
            value={value}
            onInput={(e) => onChange(Number(e.currentTarget.value))}
            onChange={() => {}} 
            className="absolute inset-0 w-full opacity-0 z-10 cursor-pointer"
            />
            
            {/* Custom Track */}
            <div className="absolute inset-0 h-1.5 rounded-full bg-black/20 dark:bg-white/20 overflow-hidden pointer-events-none">
                <div 
                className="h-full transition-all bg-black dark:bg-white" 
                style={{ width: `${percentage}%`, backgroundColor: uiColors.text }}
                />
            </div>
            
            {/* Custom Thumb - Visible on Hover */}
            <div 
                className="absolute h-4 w-4 bg-white rounded-full shadow border transition-opacity pointer-events-none opacity-0 group-hover:opacity-100"
                style={{ 
                    left: `${percentage}%`, 
                    transform: 'translateX(-50%)',
                    borderColor: uiColors.text,
                }}
            >
                 <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: uiColors.text }}></div>
            </div>
        </div>
    )
}

function MusicSlider({ currentTime, duration, uiColors, onSeek }: { currentTime: number, duration: number, uiColors: any, onSeek: (val: number) => void }) {
    const [dragValue, setDragValue] = useState<number | null>(null)
    
    // Use drag value if dragging, otherwise source of truth
    const currentValue = dragValue ?? currentTime;
    
    // Handle potential NaN
    const safeCurrent = Number.isFinite(currentValue) ? currentValue : 0;
    const safeDuration = (Number.isFinite(duration) && duration > 0) ? duration : 100;
    const percentage = Math.min(100, Math.max(0, (safeCurrent / safeDuration) * 100));

    const formatTime = (seconds: number) => {
        if (!seconds || Number.isNaN(seconds)) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="w-full space-y-1 group">
            <div className="flex items-center justify-between px-1 text-xs font-mono tabular-nums" style={{ color: uiColors.textSecondary }}>
                    <span>{formatTime(safeCurrent)}</span>
                    <span>{formatTime(safeDuration)}</span>
            </div>
            
            <div className="relative h-4 flex items-center w-full">
                 <input 
                    type="range" 
                    min={0} 
                    max={safeDuration} 
                    step={1}
                    value={safeCurrent}
                    onInput={(e) => {
                         setDragValue(Number(e.currentTarget.value))
                    }}
                    onChange={() => {}} // Controlled input requires onChange or readOnly, but onInput handles updates
                    onMouseUp={(e) => {
                          const val = Number(e.currentTarget.value)
                          setDragValue(null)
                          onSeek(val)
                    }}
                    onTouchEnd={(e) => {
                          const val = Number(e.currentTarget.value)
                          setDragValue(null)
                          onSeek(val)
                    }}
                    className="absolute inset-0 w-full opacity-0 z-10 cursor-pointer"
                 />
                 
                 {/* Custom Track */}
                 <div className="absolute inset-0 h-1.5 rounded-full bg-black/20 dark:bg-white/20 overflow-hidden pointer-events-none">
                     <div 
                        className="h-full transition-all bg-black dark:bg-white" 
                        style={{ width: `${percentage}%`, backgroundColor: uiColors.text }}
                     />
                 </div>
                 
                 {/* Custom Thumb - Visible on Group Hover or Dragging */}
                 <div 
                    className="absolute h-4 w-4 bg-white rounded-full shadow border transition-opacity pointer-events-none"
                    style={{ 
                        left: `${percentage}%`, 
                        transform: 'translateX(-50%)',
                        borderColor: uiColors.text,
                        opacity: dragValue === null ? 0 : 1 
                    }}
                 >
                     <div className="absolute inset-0 rounded-full opacity-20 group-hover:opacity-100" style={{ backgroundColor: uiColors.text }}></div>
                 </div>
            </div>
        </div>
    )
}

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
  const preferences = useAppStore((state) => state.preferences)
  const updatePreferences = useAppStore((state) => state.updatePreferences)
  const themeColor = useAppStore((state) => state.preferences.themeColor)
  const secondaryColor = useAppStore((state) => state.preferences.secondaryColor)
  const uiMode = useAppStore((state) => state.preferences.uiMode)
  const timerOpacity = useAppStore((state) => state.preferences.timerOpacity)
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  const currentTrackId = useAppStore((state) => state.currentTrackId)
  const musicPlaying = useAppStore((state) => state.musicPlaying)
  const setMusicPlaying = useAppStore((state) => state.setMusicPlaying)
  const loopMode = useAppStore((state) => state.loopMode)
  const setLoopMode = useAppStore((state) => state.setLoopMode)
  const sendPlayerCommand = useAppStore((state) => state.sendPlayerCommand)
  const activePlaylist = useAppStore((state) => state.activePlaylist)
  const setActivePlaylist = useAppStore((state) => state.setActivePlaylist)
  const musicDuration = useAppStore((state) => state.musicDuration)
  const musicCurrentTime = useAppStore((state) => state.musicCurrentTime)
  const setMusicSeek = useAppStore((state) => state.setMusicSeek)
  const showVisualizer = useAppStore((state) => state.showVisualizer)
  const toggleVisualizer = useAppStore((state) => state.toggleVisualizer)
  const isShuffled = useAppStore((state) => state.isShuffled)
  const toggleShuffle = useAppStore((state) => state.toggleShuffle)
  const setQueue = useAppStore((state) => state.setQueue)
  const setCurrentTrack = useAppStore((state) => state.setCurrentTrack)
  const favoriteTracks = useAppStore((state) => state.favoriteTracks)

  const color = THEME_COLORS[themeColor]

  const bgHex = secondaryColor ? THEME_COLORS[secondaryColor] : (currentSceneId && SCENE_COLORS[currentSceneId]) || "#000000"
  const uiColors = getUIColors(bgHex, uiMode)

  const currentTrack = musicTracks.find((t) => t.id === currentTrackId)

  const handlePlaylistChange = (category: string) => {
    setActivePlaylist(category)
    
    // 1. Filter tracks for new queue
    let newQueueTracks: typeof musicTracks = []
    if (category === 'all') newQueueTracks = musicTracks
    else if (category === 'favorites') newQueueTracks = musicTracks.filter(t => favoriteTracks.includes(t.id))
    else newQueueTracks = musicTracks.filter(t => t.category === category)
    
    // 2. Update Queue
    const newQueueIds = newQueueTracks.map(t => t.id)
    setQueue(newQueueIds)

    // 3. Play first available track if current is not in new playlist
    // Or just play first track to give immediate feedback
    if (newQueueIds.length > 0) {
        // If current track is NOT in the new list, switch. 
        // Or if user explicitly clicked a playlist tag, they likely want to hear it.
        // Let's switch to the first one for clarity.
        if (!newQueueIds.includes(currentTrackId)) {
             setCurrentTrack(newQueueIds[0])
        }
        // If we want to force start playing even if paused:
        // setMusicPlaying(true)
        // import('@/lib/audio-controller').then(m => m.audioController.resume())
    }
  }

  const handlePrevious = () => {
      // Trigger "Restart or Prev" logic via store command to MusicPlayer
      sendPlayerCommand({ type: 'prev', timestamp: Date.now() })
  }

  const handleNext = () => {
      sendPlayerCommand({ type: 'next', timestamp: Date.now() })
  }
  
  const toggleLoop = () => {
      const modes: ("all" | "one" | "none")[] = ["all", "one", "none"]
      const idx = modes.indexOf(loopMode)
      setLoopMode(modes[(idx + 1) % modes.length])
  }
  
  const playlistCategories = ['all', 'favorites', ...Array.from(new Set(musicTracks.map(t => t.category || 'Other')))]

  return (
    <div className="fixed top-4 right-4 z-40">
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
            className="rounded-full w-9 h-9 hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-transform"
            style={{ color: uiColors.text }}
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-9 h-9 hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-transform" 
                style={{ color: uiColors.text }}
                title="Audio Settings"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 border p-4"
              align="end"
              sideOffset={12}
              alignOffset={-100} 
              style={{
                backgroundColor: uiColors.bg,
                borderColor: uiColors.border,
              }}
            >
              <div className="space-y-4">
                <div className="text-center pb-4 border-b space-y-1" style={{ borderColor: uiColors.border }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: uiColors.textSecondary }}>
                    Now Playing ({activePlaylist})
                  </p>
                  <p className="text-base font-bold truncate px-2" style={{ color: uiColors.text }}>
                    {currentTrack?.title || "No Track"}
                  </p>
                  <p className="text-sm truncate px-2" style={{ color: uiColors.textSecondary }}>
                    {currentTrack?.artist || "Select a track"}
                  </p>
                </div>
                
                {/* Playlist Selector */}
                <div className="flex flex-wrap gap-1 justify-center pb-2 border-b" style={{ borderColor: uiColors.border }}>
                    {playlistCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handlePlaylistChange(cat)}
                            className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full transition-colors ${activePlaylist === cat ? 'bg-white/20' : 'hover:bg-white/10'}`}
                            style={{ color: activePlaylist === cat ? uiColors.text : uiColors.textSecondary }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                     variant="ghost" 
                     size="icon" 
                     onClick={handlePrevious}
                     className="hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-transform"
                     style={{ color: uiColors.text }}
                     title="Previous Track"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>

                  <Button
                     variant="ghost" 
                     size="icon" 
                     onClick={() => {
                         setMusicPlaying(!musicPlaying)
                         // Ensure AudioContext is resumed and connected
                         import('@/lib/audio-controller').then(m => m.audioController.resume())
                     }}
                     className="hover:bg-black/5 dark:hover:bg-white/10 scale-110 hover:scale-125 active:scale-100 transition-transform"
                     style={{ color: uiColors.text }}
                     title={musicPlaying ? "Pause" : "Play"}
                  >
                    {musicPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>

                  <Button
                     variant="ghost" 
                     size="icon" 
                     onClick={handleNext}
                     className="hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-transform"
                     style={{ color: uiColors.text }}
                     title="Next Track"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>

                  <Button
                     variant="ghost" 
                     size="icon" 
                     onClick={toggleShuffle}
                     className="hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-transform"
                     style={{ color: isShuffled ? color : uiColors.textSecondary }}
                     title="Shuffle"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                  
                  <Button
                     variant="ghost" 
                     size="icon" 
                     onClick={toggleLoop}
                     className="hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-transform"
                     style={{ color: loopMode === "none" ? uiColors.textSecondary : uiColors.text }}
                     title="Loop Mode"
                  >
                    {loopMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-2">
                    <MusicSlider 
                        currentTime={musicCurrentTime} 
                        duration={musicDuration} 
                        uiColors={uiColors} 
                        onSeek={setMusicSeek} 
                    />
                </div>

                <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-medium" style={{ color: uiColors.textSecondary }}>Volume</span>
                        <span className="text-xs font-medium" style={{ color: uiColors.text }}>{Math.round(preferences.volume * 100)}%</span>
                    </div>
                    <SimpleSlider 
                        value={preferences.volume * 100}
                        onChange={(val) => updatePreferences({ volume: val / 100 })}
                        max={100}
                        uiColors={uiColors}
                    />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={toggleTodos}
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-transform"
            style={{ color: showTodos ? "#3b82f6" : uiColors.text }}
            title="Todos"
          >
            <CheckSquare className="w-4 h-4" />
          </Button>

          <Button
            onClick={toggleVisualizer}
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-transform"
            style={{ color: showVisualizer ? "#3b82f6" : uiColors.text }}
            title="Toggle Visualizer"
          >
            <Activity className="w-4 h-4" />
          </Button>

          <Button
            onClick={toggleSettings}
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 active:scale-95 transition-transform"
            style={{ color: uiColors.text }}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
