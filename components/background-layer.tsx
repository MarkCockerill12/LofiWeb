"use client"

import { useAppStore } from "@/lib/store"
import { backgroundScenes } from "@/lib/data"
import { useEffect, useState } from "react"

export function BackgroundLayer() {
  const currentSceneId = useAppStore((state) => state.currentSceneId)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const scene = backgroundScenes.find((s) => s.id === currentSceneId) || backgroundScenes[0]

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 500)
    return () => clearTimeout(timer)
  }, [currentSceneId])

  return (
    <div className="fixed inset-0 -z-10">
      <video
        key={scene.id}
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <source src={scene.videoUrl} type="video/webm" />
        <source src={scene.fallbackUrl} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/40" />
    </div>
  )
}
