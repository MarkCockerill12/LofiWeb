"use client"

import { useAppStore } from "@/lib/store"
import { backgroundScenes } from "@/lib/data"
import { useEffect, useState, useRef } from "react"

const CROSSFADE_DURATION = 1.5 // seconds

export function BackgroundLayer() {
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const currentUrlRef = useRef<string>("")
  
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)

  const scene = backgroundScenes.find((s) => s.id === currentSceneId) || backgroundScenes[0]

  // Handle Scene Changes with Crossfade
  useEffect(() => {
    if (!scene || isTransitioning) return

    // Identify which player is active and which is next
    const activeRef = activePlayer === 1 ? video1Ref.current : video2Ref.current
    const nextRef = activePlayer === 1 ? video2Ref.current : video1Ref.current
    const nextPlayerIdx = activePlayer === 1 ? 2 : 1

    if (!activeRef || !nextRef) return

    // Prevent crossfading if already playing this URL
    if (currentUrlRef.current === scene.videoUrl) return

    setIsTransitioning(true)
    currentUrlRef.current = scene.videoUrl

    // Prepare next player
    nextRef.style.display = "block"
    nextRef.style.visibility = "visible"
    nextRef.style.willChange = "opacity"
    nextRef.src = scene.videoUrl
    nextRef.currentTime = 0
    nextRef.style.opacity = "0" 
    nextRef.load() 
    
    // Prepare active player for fade out
    activeRef.style.willChange = "opacity"
    
    const playPromise = nextRef.play()
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Start Crossfade
            // Fade In Next
            nextRef.style.opacity = "1"
            // Fade Out Active
            activeRef.style.opacity = "0" 
            
            // Swap active state variable after transition completes
            setTimeout(() => {
                setActivePlayer(nextPlayerIdx)
                setIsTransitioning(false)
                
                // Finalize styles
                nextRef.style.willChange = "auto"
                
                // Pause and hide old one
                activeRef.pause()
                activeRef.style.opacity = "0"
                activeRef.style.display = "none"
                activeRef.style.visibility = "hidden"
                activeRef.style.willChange = "auto"
            }, CROSSFADE_DURATION * 1000)
        }).catch(error => {
            setIsTransitioning(false)
            // Ignore AbortError which happens when quickly switching scenes
            if (error.name !== "AbortError") {
                console.error("Video play failed:", error)
            }
        })
    } else {
        setIsTransitioning(false)
    }
  }, [currentSceneId, scene.videoUrl, isTransitioning, activePlayer]) 

  if (!scene) {
    return <div className="fixed inset-0 bg-black -z-10 flex items-center justify-center text-white/50">No scenes found</div>
  }

  // Dual Player Setup
  return (
    <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden bg-black">
      {/* Player 1 */}
      <video
        ref={video1Ref}
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
        style={{ 
          transitionDuration: `${CROSSFADE_DURATION}s`,
          display: activePlayer === 1 || isTransitioning ? 'block' : 'none',
          visibility: activePlayer === 1 || isTransitioning ? 'visible' : 'hidden',
          transform: 'translateZ(0)',
          willChange: 'opacity'
        }}
        muted
        loop
        playsInline
        preload="auto"
      />
      
      {/* Player 2 */}
      <video
        ref={video2Ref}
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out opacity-0"
        style={{ 
          transitionDuration: `${CROSSFADE_DURATION}s`,
          display: activePlayer === 2 || isTransitioning ? 'block' : 'none',
          visibility: activePlayer === 2 || isTransitioning ? 'visible' : 'hidden',
          transform: 'translateZ(0)',
          willChange: 'opacity'
        }}
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  )
}
