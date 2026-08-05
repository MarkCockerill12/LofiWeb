"use client"

import { useAppStore } from "@/lib/store"
import { useEffect, useRef, useState } from "react"

const CROSSFADE_DURATION = 1.5 // seconds

export function BackgroundLayer() {
  const backgroundScenes = useAppStore((state) => state.backgroundScenes)
  const currentSceneId = useAppStore((state) => state.currentSceneId)

  const [activePlayer, setActivePlayer] = useState<1 | 2>(1)
  const currentUrlRef = useRef<string>("")
  const isTransitioningRef = useRef(false)

  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)

  const scene = backgroundScenes.find((s) => s.id === currentSceneId) ?? backgroundScenes[0]
  const sceneUrl = scene?.videoUrl

  // Pause playback while hidden so a backgrounded tab stops decoding video.
  useEffect(() => {
    const handleVisibility = () => {
      for (const ref of [video1Ref, video2Ref]) {
        const video = ref.current
        if (!video) continue

        if (document.hidden) {
          if (!video.paused) {
            video.pause()
            video.dataset.wasPlaying = "true"
          }
        } else if (video.dataset.wasPlaying === "true") {
          video.play().catch(() => {})
          delete video.dataset.wasPlaying
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  // Crossfade to the newly selected scene. Transition bookkeeping lives in refs so
  // this only re-runs when the scene actually changes.
  useEffect(() => {
    if (!sceneUrl || isTransitioningRef.current) return
    if (currentUrlRef.current === sceneUrl) return

    const activeRef = activePlayer === 1 ? video1Ref.current : video2Ref.current
    const nextRef = activePlayer === 1 ? video2Ref.current : video1Ref.current
    const nextPlayerIdx = activePlayer === 1 ? 2 : 1

    if (!activeRef || !nextRef) return

    isTransitioningRef.current = true
    currentUrlRef.current = sceneUrl

    nextRef.style.display = "block"
    nextRef.style.visibility = "visible"
    nextRef.style.willChange = "opacity"
    nextRef.src = sceneUrl
    nextRef.currentTime = 0
    nextRef.style.opacity = "0"
    nextRef.load()

    activeRef.style.willChange = "opacity"

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    nextRef
      .play()
      .then(() => {
        nextRef.style.opacity = "1"
        activeRef.style.opacity = "0"

        timeoutId = setTimeout(() => {
          setActivePlayer(nextPlayerIdx)
          isTransitioningRef.current = false

          nextRef.style.willChange = "auto"

          activeRef.pause()
          activeRef.style.opacity = "0"
          activeRef.style.display = "none"
          activeRef.style.visibility = "hidden"
          activeRef.style.willChange = "auto"
        }, CROSSFADE_DURATION * 1000)
      })
      .catch((error: DOMException) => {
        isTransitioningRef.current = false
        // AbortError is expected when scenes are switched in quick succession.
        if (error.name !== "AbortError") console.error("Video play failed:", error)
      })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [sceneUrl, activePlayer])

  if (!scene) {
    return (
      <div className="fixed inset-0 bg-black -z-10 flex items-center justify-center text-white/50">
        No scenes found
      </div>
    )
  }

  // Dual Player Setup
  return (
    <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden bg-black">
      <video
        ref={video1Ref}
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
        style={{
          transitionDuration: `${CROSSFADE_DURATION}s`,
          transform: "translateZ(0)",
          willChange: "opacity",
        }}
        muted
        loop
        playsInline
        preload="auto"
      />

      <video
        ref={video2Ref}
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out opacity-0"
        style={{
          transitionDuration: `${CROSSFADE_DURATION}s`,
          display: "none",
          visibility: "hidden",
          transform: "translateZ(0)",
          willChange: "opacity",
        }}
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  )
}
