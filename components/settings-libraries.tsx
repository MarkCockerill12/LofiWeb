"use client"

import { useMemo, useRef, useState } from "react"
import { Heart, Maximize2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { UIColors } from "@/components/ui/slider"
import { useAppStore } from "@/lib/store"

function SearchField({
  value,
  onChange,
  placeholder,
  uiColors,
}: Readonly<{ value: string; onChange: (v: string) => void; placeholder: string; uiColors: UIColors }>) {
  return (
    <div className="relative mb-3">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: uiColors.textSecondary }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1"
        style={{ color: uiColors.text, borderColor: uiColors.border }}
      />
    </div>
  )
}

function matches(query: string, ...fields: (string | undefined)[]) {
  if (!query) return true
  const needle = query.toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(needle))
}

export function SceneLibraryDialog({
  open,
  onOpenChange,
  uiColors,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void; uiColors: UIColors }>) {
  const backgroundScenes = useAppStore((state) => state.backgroundScenes)
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  const setCurrentScene = useAppStore((state) => state.setCurrentScene)
  const favoriteScenes = useAppStore((state) => state.favoriteScenes)
  const toggleFavoriteScene = useAppStore((state) => state.toggleFavoriteScene)

  const [query, setQuery] = useState("")
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSceneMouseEnter = (id: string) => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredSceneId(id), 500) // avoid flashing
  }

  const handleSceneMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHoveredSceneId(null)
  }

  const categories = useMemo(
    () => Array.from(new Set(backgroundScenes.map((s) => s.category || "Other"))),
    [backgroundScenes],
  )

  const previewScene = hoveredSceneId ? backgroundScenes.find((s) => s.id === hoveredSceneId) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-none sm:max-w-none h-[90vh] border flex flex-col"
        style={{ backgroundColor: uiColors.bg, borderColor: uiColors.border }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: uiColors.text }}>Background Library</DialogTitle>
        </DialogHeader>

        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search scenes by name or category..."
          uiColors={uiColors}
        />

        <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mb-4 flex flex-wrap gap-2 h-auto bg-transparent justify-start">
            <TabsTrigger value="all" className="border" style={{ borderColor: uiColors.border }}>
              All
            </TabsTrigger>
            <TabsTrigger value="favorites" className="border" style={{ borderColor: uiColors.border }}>
              Favorites
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="border" style={{ borderColor: uiColors.border }}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {["all", "favorites", ...categories].map((tab) => {
            const filteredScenes = backgroundScenes.filter((scene) => {
              if (!matches(query, scene.name, scene.category)) return false
              if (tab === "all") return true
              if (tab === "favorites") return favoriteScenes.includes(scene.id)
              return scene.category === tab
            })

            return (
              <TabsContent key={tab} value={tab} className="flex-1 min-h-0 mt-0">
                <div className="flex flex-col md:flex-row h-full gap-4 pb-4 overflow-hidden">
                  {/* Left: grid on desktop, list on mobile */}
                  <ScrollArea className="w-full md:w-1/2 md:pr-4 h-full">
                    <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                      {filteredScenes.length === 0 && (
                        <p className="text-sm py-8 text-center col-span-full" style={{ color: uiColors.textSecondary }}>
                          No scenes match &ldquo;{query}&rdquo;
                        </p>
                      )}
                      {filteredScenes.map((scene) => (
                        <div
                          key={scene.id}
                          className="relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer flex items-center md:block p-2 md:p-0 w-full gap-3 md:gap-0"
                          style={{
                            borderColor:
                              currentSceneId === scene.id
                                ? uiColors.text
                                : hoveredSceneId === scene.id
                                  ? uiColors.textSecondary
                                  : uiColors.border,
                            opacity: hoveredSceneId && hoveredSceneId !== scene.id ? 0.7 : 1,
                            backgroundColor: currentSceneId === scene.id ? `${uiColors.bg}cc` : "transparent",
                          }}
                          onMouseEnter={() => handleSceneMouseEnter(scene.id)}
                          onMouseLeave={handleSceneMouseLeave}
                          onClick={() => setCurrentScene(scene.id)}
                        >
                          {/* One element serves both layouts, so the browser fetches the thumbnail once. */}
                          <img
                            src={scene.thumbnailUrl || "/placeholder.svg"}
                            alt={scene.name}
                            loading="lazy"
                            decoding="async"
                            className="w-16 h-10 rounded-md object-cover shrink-0 md:w-full md:h-auto md:aspect-video md:rounded-none"
                          />

                          <div className="hidden md:block absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                          <div className="hidden md:flex absolute bottom-2 left-2 z-20 flex-col items-start pointer-events-none">
                            <p className="text-xs text-white font-medium shadow-black drop-shadow-md truncate w-full">
                              {scene.name}
                            </p>
                          </div>

                          <span className="md:hidden text-sm font-medium truncate" style={{ color: uiColors.text }}>
                            {scene.name}
                          </span>

                          <div className="ml-auto md:absolute md:top-1 md:right-1 md:ml-0 z-30">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded-full bg-transparent md:bg-black/20 md:hover:bg-black/40"
                              style={{ color: uiColors.text }}
                              aria-label={`Favorite ${scene.name}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavoriteScene(scene.id)
                              }}
                            >
                              <Heart
                                className={`w-3 h-3 ${favoriteScenes.includes(scene.id) ? "fill-red-500 text-red-500" : ""}`}
                              />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Right: large preview (desktop only) */}
                  <div
                    className="hidden md:block w-1/2 rounded-xl overflow-hidden relative border shadow-2xl h-full"
                    style={{ borderColor: uiColors.border }}
                  >
                    {previewScene ? (
                      <>
                        <video
                          key={previewScene.id}
                          src={previewScene.videoUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-500"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-6 left-6 z-20">
                          <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{previewScene.name}</h2>
                          <div className="flex items-center gap-2">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded text-sm text-white font-medium uppercase tracking-wider">
                              {previewScene.category || "Scene"}
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
            )
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function TrackLibraryDialog({
  open,
  onOpenChange,
  uiColors,
  onPlayTrack,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  uiColors: UIColors
  onPlayTrack: (trackId: string, category: string) => void
}>) {
  const musicTracks = useAppStore((state) => state.musicTracks)
  const currentTrackId = useAppStore((state) => state.currentTrackId)
  const favoriteTracks = useAppStore((state) => state.favoriteTracks)
  const toggleFavoriteTrack = useAppStore((state) => state.toggleFavoriteTrack)
  const setActivePlaylist = useAppStore((state) => state.setActivePlaylist)
  const setQueue = useAppStore((state) => state.setQueue)

  const [query, setQuery] = useState("")

  const categories = useMemo(
    () => Array.from(new Set(musicTracks.map((t) => t.category || "Other"))),
    [musicTracks],
  )

  const handleTabChange = (category: string) => {
    let startTrack
    if (category === "all") startTrack = musicTracks[0]
    else if (category === "favorites") startTrack = musicTracks.find((t) => favoriteTracks.includes(t.id))
    else startTrack = musicTracks.find((t) => t.category === category)

    if (startTrack) {
      onPlayTrack(startTrack.id, category)
    } else {
      setActivePlaylist(category)
      setQueue([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] border flex flex-col"
        style={{ backgroundColor: uiColors.bg, borderColor: uiColors.border }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: uiColors.text }}>Music Library</DialogTitle>
        </DialogHeader>

        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search tracks by title, artist or category..."
          uiColors={uiColors}
        />

        <Tabs defaultValue="all" onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mb-4 flex flex-wrap gap-2 h-auto bg-transparent justify-start">
            <TabsTrigger value="all" className="border" style={{ borderColor: uiColors.border }}>
              All
            </TabsTrigger>
            <TabsTrigger value="favorites" className="border" style={{ borderColor: uiColors.border }}>
              Favorites
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="border" style={{ borderColor: uiColors.border }}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {["all", "favorites", ...categories].map((tab) => {
            const filteredTracks = musicTracks.filter((track) => {
              if (!matches(query, track.title, track.artist, track.category)) return false
              if (tab === "all") return true
              if (tab === "favorites") return favoriteTracks.includes(track.id)
              return track.category === tab
            })

            return (
              <TabsContent key={tab} value={tab} className="flex-1 mt-0">
                <ScrollArea className="h-[50vh] pr-4">
                  <div className="space-y-2 p-1">
                    {filteredTracks.length === 0 && (
                      <p className="text-sm py-8 text-center" style={{ color: uiColors.textSecondary }}>
                        No tracks match &ldquo;{query}&rdquo;
                      </p>
                    )}
                    {filteredTracks.map((track) => (
                      <div
                        key={track.id}
                        className="group w-full flex items-center justify-between p-4 rounded-lg transition-all border"
                        style={{
                          backgroundColor: currentTrackId === track.id ? `${uiColors.bg}cc` : `${uiColors.bg}66`,
                          borderColor: currentTrackId === track.id ? uiColors.text : "transparent",
                        }}
                      >
                        <button className="flex-1 text-left flex flex-col" onClick={() => onPlayTrack(track.id, tab)}>
                          <p className="text-sm font-medium" style={{ color: uiColors.text }}>
                            {track.title}
                          </p>
                          <div className="flex items-center gap-2">
                            {track.artist && (
                              <p className="text-xs" style={{ color: uiColors.textSecondary }}>
                                {track.artist}
                              </p>
                            )}
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10"
                              style={{ color: uiColors.textSecondary }}
                            >
                              {track.category}
                            </span>
                          </div>
                        </button>

                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Favorite ${track.title}`}
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
            )
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
