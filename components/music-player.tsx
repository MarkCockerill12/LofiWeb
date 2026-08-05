"use client"

import { useAppStore } from "@/lib/store"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { audioController } from "@/lib/audio-controller"

const CROSSFADE_DURATION = 3 // seconds

export function MusicPlayer() {
  const musicTracks = useAppStore((state) => state.musicTracks)
  const currentTrackId = useAppStore((state) => state.currentTrackId)
  const volume = useAppStore((state) => state.preferences.volume)
  const isPlaying = useAppStore((state) => state.musicPlaying)
  const setMusicPlaying = useAppStore((state) => state.setMusicPlaying)
  const setMusicProgress = useAppStore((state) => state.setMusicProgress)
  const musicSeekRequest = useAppStore((state) => state.musicSeekRequest)
  const setMusicSeek = useAppStore((state) => state.setMusicSeek)
  const loopMode = useAppStore((state) => state.loopMode)
  const setCurrentTrack = useAppStore((state) => state.setCurrentTrack)
  const playerCommand = useAppStore((state) => state.playerCommand)
  const activePlaylist = useAppStore((state) => state.activePlaylist)
  const queue = useAppStore((state) => state.queue)
  const favoriteTracks = useAppStore((state) => state.favoriteTracks)
  const isShuffled = useAppStore((state) => state.isShuffled)

  const [activePlayer, setActivePlayer] = useState<"A" | "B">("A")
  const isFirstRender = useRef(true)
  const lastProcessedCommandRef = useRef<number>(0)

  const playerA = useRef<HTMLAudioElement>(null)
  const playerB = useRef<HTMLAudioElement>(null)

  const fadeInterval = useRef<NodeJS.Timeout | null>(null)
  const isCrossfading = useRef(false)

  const currentTrack = useMemo(
    () => musicTracks.find((t) => t.id === currentTrackId),
    [musicTracks, currentTrackId],
  )

  // Connect to Audio Controller
  useEffect(() => {
    if (playerA.current) audioController.connectSource(playerA.current)
    if (playerB.current) audioController.connectSource(playerB.current)
  }, [currentTrackId])

  // Resume AudioContext on play
  useEffect(() => {
    if (isPlaying) audioController.resume()
  }, [isPlaying])

  // Playback order. Must track musicTracks so the live station catalog replaces the
  // bundled seed once /api/station resolves.
  const playlist = useMemo(() => {
    if (queue.length > 0) {
      const tracks = queue
        .map((id) => musicTracks.find((t) => t.id === id))
        .filter((t): t is (typeof musicTracks)[number] => Boolean(t))
      if (tracks.length > 0) return tracks
    }

    if (activePlaylist === "all") return musicTracks
    if (activePlaylist === "favorites") return musicTracks.filter((t) => favoriteTracks.includes(t.id))
    return musicTracks.filter((t) => t.category === activePlaylist)
  }, [musicTracks, queue, activePlaylist, favoriteTracks])

  const goToOffset = useCallback(
    (offset: number) => {
      if (playlist.length === 0) return

      if (isShuffled) {
        const randomIdx = Math.floor(Math.random() * playlist.length)
        if (playlist[randomIdx]) setCurrentTrack(playlist[randomIdx].id)
        return
      }

      const idx = playlist.findIndex((t) => t.id === currentTrackId)
      const currentIdx = idx === -1 ? 0 : idx
      const nextIdx = (currentIdx + offset + playlist.length) % playlist.length
      if (playlist[nextIdx]) setCurrentTrack(playlist[nextIdx].id)
    },
    [playlist, isShuffled, currentTrackId, setCurrentTrack],
  )

  // Handle Player Commands (Prev/Restart/Next)
  useEffect(() => {
    if (!playerCommand || playerCommand.timestamp <= lastProcessedCommandRef.current) return

    lastProcessedCommandRef.current = playerCommand.timestamp

    if (playerCommand.type === "prev") {
      const active = activePlayer === "A" ? playerA.current : playerB.current
      if (!active) return

      // Restart the track first; only skip back if already near the start.
      if (active.currentTime > 3) {
        active.currentTime = 0
        if (isPlaying) active.play().catch(() => {})
      } else {
        goToOffset(-1)
      }
    } else if (playerCommand.type === "next") {
      goToOffset(1)
    }
  }, [playerCommand, activePlayer, isPlaying, goToOffset])

  // Handle Seek Request
  useEffect(() => {
    if (musicSeekRequest === null) return

    const active = activePlayer === "A" ? playerA.current : playerB.current
    if (active) {
      if (Number.isFinite(musicSeekRequest)) active.currentTime = musicSeekRequest
      setMusicSeek(null)
    }
  }, [musicSeekRequest, activePlayer, setMusicSeek])

  // Handle Volume Changes
  useEffect(() => {
    if (isCrossfading.current) return // Let crossfade own volume during a transition

    if (activePlayer === "A" && playerA.current) playerA.current.volume = volume
    if (activePlayer === "B" && playerB.current) playerB.current.volume = volume
  }, [volume, activePlayer])

  // Handle Play/Pause State
  useEffect(() => {
    const active = activePlayer === "A" ? playerA.current : playerB.current
    if (!active) return

    if (isPlaying) {
      active.play().catch(() => {}) // Ignore auto-play blocks
    } else {
      active.pause()
    }

    const inactive = activePlayer === "A" ? playerB.current : playerA.current
    if (inactive && !isCrossfading.current) inactive.pause()
  }, [isPlaying, activePlayer])

  // Handle Track Change
  useEffect(() => {
    if (!currentTrack) return

    if (fadeInterval.current) clearInterval(fadeInterval.current)
    isCrossfading.current = false

    const a = playerA.current
    if (a) {
      a.src = currentTrack.url
      a.currentTime = 0
      a.volume = volume

      if (isFirstRender.current) {
        // Respect persisted state on the first paint rather than forcing playback.
        isFirstRender.current = false
        if (isPlaying) a.play().catch(() => {})
      } else {
        setMusicPlaying(true)
        a.play().catch(() => {})
      }

      setActivePlayer("A")
    }

    // Player B is only needed to crossfade a repeat of this same track. Clearing its
    // source keeps the browser from downloading every track twice.
    const b = playerB.current
    if (b) {
      b.pause()
      b.removeAttribute("src")
      b.load()
      b.volume = 0
    }
    // Volume/playing are read as initial values here; their own effects keep them in sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, setMusicPlaying])

  const startCrossfade = useCallback(
    (fadeOut: HTMLAudioElement, fadeIn: HTMLAudioElement, url: string) => {
      isCrossfading.current = true

      // Load the second copy lazily, at the moment the crossfade actually needs it.
      if (!fadeIn.src) fadeIn.src = url
      fadeIn.currentTime = 0
      fadeIn.volume = 0
      fadeIn.play().catch(() => {})

      const stepTime = 100 // ms
      const steps = (CROSSFADE_DURATION * 1000) / stepTime
      let currentStep = 0

      if (fadeInterval.current) clearInterval(fadeInterval.current)

      fadeInterval.current = setInterval(() => {
        currentStep++
        const progress = currentStep / steps

        fadeOut.volume = Math.max(0, volume * (1 - progress))
        fadeIn.volume = Math.min(volume, volume * progress)

        if (currentStep >= steps) {
          if (fadeInterval.current) clearInterval(fadeInterval.current)
          isCrossfading.current = false

          fadeOut.pause()
          fadeOut.currentTime = 0
          fadeOut.volume = 0
          fadeIn.volume = volume

          setActivePlayer((prev) => (prev === "A" ? "B" : "A"))
        }
      }, stepTime)
    },
    [volume],
  )

  const handleTimeUpdate = () => {
    const active = activePlayer === "A" ? playerA.current : playerB.current
    const next = activePlayer === "A" ? playerB.current : playerA.current

    if (!active || !next || isCrossfading.current || !currentTrack) return

    setMusicProgress(active.currentTime, active.duration)

    const timeLeft = active.duration - active.currentTime

    if (loopMode === "one") {
      if (timeLeft <= CROSSFADE_DURATION && timeLeft > 0) {
        startCrossfade(active, next, currentTrack.url)
      }
      return
    }

    if (active.ended || (timeLeft <= 0.2 && active.duration > 0)) {
      if (loopMode === "all") {
        goToOffset(1)
      } else {
        setMusicPlaying(false)
      }
    }
  }

  // Clean up any in-flight fade on unmount.
  useEffect(() => {
    return () => {
      if (fadeInterval.current) clearInterval(fadeInterval.current)
    }
  }, [])

  if (!currentTrack) return null

  return (
    <>
      <audio
        ref={playerA}
        onTimeUpdate={activePlayer === "A" ? handleTimeUpdate : undefined}
        onPlay={() => audioController.resume()}
        preload="auto"
        crossOrigin="anonymous"
      >
        <track kind="captions" />
      </audio>
      <audio
        ref={playerB}
        onTimeUpdate={activePlayer === "B" ? handleTimeUpdate : undefined}
        onPlay={() => audioController.resume()}
        preload="none"
        crossOrigin="anonymous"
      >
        <track kind="captions" />
      </audio>
    </>
  )
}
