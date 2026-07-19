"use client"

import { useAppStore } from "@/lib/store"
import { useEffect, useRef, useState, useMemo } from "react"
import { audioController } from "@/lib/audio-controller" // Import controller

const CROSSFADE_DURATION = 3 // seconds

export function MusicPlayer() {
  const musicTracks = useAppStore((state) => state.musicTracks)
  const currentTrackId = useAppStore((state) => state.currentTrackId)
  const volume = useAppStore((state) => state.preferences.volume)
  const isPlaying = useAppStore((state) => state.musicPlaying) // Use musicPlaying state
  const setMusicPlaying = useAppStore((state) => state.setMusicPlaying) // Sync auto-play state
  const setMusicProgress = useAppStore((state) => state.setMusicProgress)
  const musicSeekRequest = useAppStore((state) => state.musicSeekRequest)
  const setMusicSeek = useAppStore((state) => state.setMusicSeek)
  const loopMode = useAppStore((state) => state.loopMode)
  const setCurrentTrack = useAppStore((state) => state.setCurrentTrack)
  const playerCommand = useAppStore((state) => state.playerCommand)
  const activePlaylist = useAppStore((state) => state.activePlaylist)
  const queue = useAppStore((state) => state.queue) // Use persistent queue from store
  const favoriteTracks = useAppStore((state) => state.favoriteTracks)
  const isShuffled = useAppStore((state) => state.isShuffled) // Add shuffle state
  
  const [activePlayer, setActivePlayer] = useState<"A" | "B">("A")
  const isFirstRender = useRef(true)
  const lastProcessedCommandRef = useRef<number>(0)
  
  const playerA = useRef<HTMLAudioElement>(null)
  const playerB = useRef<HTMLAudioElement>(null)
  
  // Connect to Audio Controller
  useEffect(() => {
      if (playerA.current) audioController.connectSource(playerA.current)
      if (playerB.current) audioController.connectSource(playerB.current)
  }, [currentTrackId]) // Run when track changes/mounts so refs are available
  
  // Resume AudioContext on play
  useEffect(() => {
      if (isPlaying) {
          audioController.resume()
      }
  }, [isPlaying])

  const fadeInterval = useRef<NodeJS.Timeout | null>(null)
  const isCrossfading = useRef(false)

  const currentTrack = musicTracks.find((t) => t.id === currentTrackId)

  // Determine current playlist logic
  // If queue is populated, use it. If empty, fallback to activePlaylist logic for safety/init
  // Memoize playlist logic to avoid recalculating on every render
  const playlist = useMemo(() => {
      if (queue && queue.length > 0) {
          const tracks = queue.map(id => musicTracks.find(t => t.id === id)).filter(Boolean) as typeof musicTracks;
          if (tracks.length > 0) return tracks;
      }
      
      if (activePlaylist === 'all') return musicTracks;
      if (activePlaylist === 'favorites') return musicTracks.filter(t => favoriteTracks.includes(t.id));
      return musicTracks.filter(t => t.category === activePlaylist);
  }, [queue, activePlaylist, favoriteTracks]);

  // Handle Player Commands (Prev/Restart/Next)
  useEffect(() => {
    if (!playerCommand || playerCommand.timestamp <= lastProcessedCommandRef.current) return;
    
    lastProcessedCommandRef.current = playerCommand.timestamp;
    
    if (playerCommand.type === 'prev') {
        const active = activePlayer === 'A' ? playerA.current : playerB.current
        if (active) {
            if (active.currentTime > 3) {
                // Restart
                active.currentTime = 0
                if (isPlaying) active.play().catch(() => {})
            } else {
                // Go to previous track in playlist
                if (isShuffled) {
                    const randomIdx = Math.floor(Math.random() * playlist.length)
                    if (playlist[randomIdx]) setCurrentTrack(playlist[randomIdx].id)
                } else {
                    const idx = playlist.findIndex(t => t.id === currentTrackId)
                    // If not found in current playlist (e.g. switched category), start from 0 or keep playing?
                    // Assuming we want to navigate RELATIVE to the playlist.
                    const currentIdx = idx === -1 ? 0 : idx;
                    const prevIdx = (currentIdx - 1 + playlist.length) % playlist.length
                    if (playlist[prevIdx]) setCurrentTrack(playlist[prevIdx].id)
                }
            }
        }
    } else if (playerCommand.type === 'next') {
        if (isShuffled) {
            const randomIdx = Math.floor(Math.random() * playlist.length)
            if (playlist[randomIdx]) setCurrentTrack(playlist[randomIdx].id)
        } else {
            const idx = playlist.findIndex(t => t.id === currentTrackId)
            const currentIdx = idx === -1 ? 0 : idx;
            const nextIdx = (currentIdx + 1) % playlist.length
            if (playlist[nextIdx]) setCurrentTrack(playlist[nextIdx].id)
        }
    }
  }, [playerCommand, activePlayer, currentTrackId, isPlaying, isShuffled, playlist, setCurrentTrack])

  // Handle Seek Request
  useEffect(() => {
    if (musicSeekRequest === null) return

    const active = activePlayer === 'A' ? playerA.current : playerB.current
    if (active) {
        if (Number.isFinite(musicSeekRequest)) {
            active.currentTime = musicSeekRequest
        }
        setMusicSeek(null)
    }
  }, [musicSeekRequest, activePlayer, setMusicSeek]) 

  // Initialize volume
  useEffect(() => {
    if (playerA.current) playerA.current.volume = volume
    if (playerB.current) playerB.current.volume = 0
  }, [volume]) // Only reset strictly on mount/volume change if not crossfading? 
  // actually volume change should affect active player immediately.

  // Handle Volume Changes
  useEffect(() => {
      if (isCrossfading.current) return; // Let crossfade handle volume during transition
      
      if (activePlayer === 'A' && playerA.current) playerA.current.volume = volume
      if (activePlayer === 'B' && playerB.current) playerB.current.volume = volume
  }, [volume, activePlayer])


  // Handle Play/Pause State
  useEffect(() => {
    const active = activePlayer === 'A' ? playerA.current : playerB.current
    if (!active) return

    if (isPlaying) {
        active.play().catch(() => {}) // Ignore auto-play blocks
    } else {
        active.pause()
    }
    
    // Also pause the inactive one just in case
    const inactive = activePlayer === 'A' ? playerB.current : playerA.current
    if (inactive && !isCrossfading.current) {
        inactive.pause()
    }

  }, [isPlaying, activePlayer])
  
  // Handle Track Change
  useEffect(() => {
    if (!currentTrack) return;
    
    // Stop crossfading if happening
    if (fadeInterval.current) clearInterval(fadeInterval.current)
    isCrossfading.current = false

    // Reset
    if (playerA.current) {
        playerA.current.src = currentTrack.url
        playerA.current.currentTime = 0
        playerA.current.volume = volume
        
        // Auto-play only if not first render or if already playing
        if (!isFirstRender.current) {
             setMusicPlaying(true)
             // Ensure playback starts even if state didn't change (e.g. was already true and Active Player was A)
             playerA.current.play().catch(() => {})
        } else {
             // First render: respect initial state (likely false)
             // If persisted state says playing, the other useEffect will handle it
             isFirstRender.current = false
             
             // If store said "playing" on load, we might need to sync UI, but typically we start paused or let user initiate.
             // But if we want to restore playback on reload:
             if (isPlaying) {
                 playerA.current.play().catch(() => {})
             }
        }
        
        setActivePlayer("A")
    }
    if (playerB.current) {
        playerB.current.src = currentTrack.url // Preload same track for looping
        playerB.current.pause()
        playerB.current.currentTime = 0
        playerB.current.volume = 0
    }

  }, [currentTrackId, currentTrack]) // Removed isPlaying, setMusicPlaying, and volume from dependencies


  const handleTimeUpdate = () => {
      const active = activePlayer === "A" ? playerA.current : playerB.current
      const next = activePlayer === "A" ? playerB.current : playerA.current

      if (!active || !next || isCrossfading.current) return

      // Update progress
      setMusicProgress(active.currentTime, active.duration)

      const timeLeft = active.duration - active.currentTime

      if (loopMode === "one") {
        // Trigger crossfade slightly before end, only if not already crossfading
        if (timeLeft <= CROSSFADE_DURATION && timeLeft > 0 && !isCrossfading.current) {
            startCrossfade(active, next)
        }
      } else {
         if (active.ended || (timeLeft <= 0.2 && active.duration > 0)) {
             if (loopMode === "all") {
                 if (isShuffled) {
                     const randomIdx = Math.floor(Math.random() * playlist.length)
                     if (playlist[randomIdx]) setCurrentTrack(playlist[randomIdx].id)
                 } else {
                     const idx = playlist.findIndex(t => t.id === currentTrackId)
                     const currentIdx = idx === -1 ? 0 : idx;
                     const nextIdx = (currentIdx + 1) % playlist.length
                     if (playlist[nextIdx]) setCurrentTrack(playlist[nextIdx].id)
                 }
             } else {
                 setMusicPlaying(false)
             }
         }
      }
  }

  const startCrossfade = (fadeOut: HTMLAudioElement, fadeIn: HTMLAudioElement) => {
      isCrossfading.current = true
      fadeIn.currentTime = 0
      fadeIn.play().catch(() => {})

      const stepTime = 100 // ms
      const steps = (CROSSFADE_DURATION * 1000) / stepTime
      let currentStep = 0

      if (fadeInterval.current) clearInterval(fadeInterval.current)

      fadeInterval.current = setInterval(() => {
          currentStep++
          const progress = currentStep / steps
          
          // Easing can be added here, linear for now
          fadeOut.volume = Math.max(0, volume * (1 - progress))
          fadeIn.volume = Math.min(volume, volume * progress)

          if (currentStep >= steps) {
              if (fadeInterval.current) clearInterval(fadeInterval.current)
              isCrossfading.current = false
              
              // Finalize state
              fadeOut.pause()
              fadeOut.currentTime = 0
              fadeOut.volume = 0 // Reset
              fadeIn.volume = volume // Ensure max
              
              setActivePlayer(prev => prev === "A" ? "B" : "A")
          }
      }, stepTime)
  }

  if (!currentTrack) return null

  return (
    <>
        <audio 
            ref={playerA} 
            src={currentTrack.url}
            onTimeUpdate={activePlayer === "A" ? handleTimeUpdate : undefined}
            onPlay={() => audioController.resume()}
            preload="auto"
            crossOrigin="anonymous"
        >
          <track kind="captions" />
        </audio>
        <audio 
            ref={playerB} 
            src={currentTrack.url}
            onTimeUpdate={activePlayer === "B" ? handleTimeUpdate : undefined}
            onPlay={() => audioController.resume()}
            preload="auto"
            crossOrigin="anonymous"
        >
          <track kind="captions" />
        </audio>
    </>
  )
}
