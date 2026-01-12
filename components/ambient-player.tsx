"use client"

import { useAppStore } from "@/lib/store"
import { ambienceSounds } from "@/lib/data"
import { useEffect, useRef, useState } from "react"

const CROSSFADE = 2; // seconds

function SeamlessLoop({ url, volume, active }: { url: string, volume: number, active: boolean }) {
    // Implement dual buffer manually
    const [activePlayer, setActivePlayer] = useState<1 | 2>(1)
    const p1 = useRef<HTMLAudioElement>(null)
    const p2 = useRef<HTMLAudioElement>(null)
    const isTransitioning = useRef(false)

    // Init volume
    useEffect(() => {
        if(p1.current) p1.current.volume = volume
        if(p2.current) p2.current.volume = 0
    }, [])

    useEffect(() => {
         // Handle master volume or active state change
         if (!active) {
             if(p1.current) p1.current.pause()
             if(p2.current) p2.current.pause()
             return
         }

         // Only play if not transitioning to avoid double play logic conflict?
         // Actually we just want to ensure volume is correct.
         // And that active one is playing.
         const act = activePlayer === 1 ? p1.current : p2.current
         if (act) {
             act.volume = volume
             if (act.paused && !isTransitioning.current) {
                act.play().catch(() => {})
             }
         }
         
         const next = activePlayer === 1 ? p2.current : p1.current
         if (next && !isTransitioning.current) {
             // Inactive one should be silent/paused unless transitioning
             next.volume = 0
             next.pause()
         }
         
    }, [volume, active, activePlayer]) // Simple volume update

    const handleTimeUpdate = () => {
        const current = activePlayer === 1 ? p1.current : p2.current
        const next = activePlayer === 1 ? p2.current : p1.current
        
        if (!current || !next || isTransitioning.current) return
        
        const remaining = current.duration - current.currentTime
        
        // Check if remaining is NaN (not loaded yet)
        if (isNaN(remaining)) return;

        if (remaining <= CROSSFADE && remaining > 0) {
            isTransitioning.current = true
            
            // Start next
            next.currentTime = 0
            // Start at 0 volume
            next.volume = 0 
            next.play().catch(e => console.error("Play failed", e))
            
            // Crossfade
            const step = volume / 20; // 20 steps over interval
            const intervalTime = (CROSSFADE * 1000) / 20;
            
            const interval = setInterval(() => {
                // Fade Out Current
                if (current.volume > step) current.volume -= step
                else current.volume = 0
                
                // Fade In Next
                if (next.volume < volume - step) next.volume += step
                else next.volume = volume
                
                // Check completion
                if (current.volume <= 0.01 && next.volume >= volume * 0.9) {
                    clearInterval(interval)
                    current.pause()
                    current.currentTime = 0 // Reset for safety
                    
                    // Finalize state
                    setActivePlayer(prev => prev === 1 ? 2 : 1)
                    
                    // Unlock
                    setTimeout(() => {
                        isTransitioning.current = false
                    }, 500) // Longer delay to prevent bouncing back
                }
            }, intervalTime)
        }
    }

    // Force loop safety
    useEffect(() => {
        if (!active) return
        
        const check = setInterval(() => {
            const current = activePlayer === 1 ? p1.current : p2.current
            if (current && current.paused && !isTransitioning.current) {
                current.play().catch(() => {})
            }
        }, 3000)
        return () => clearInterval(check)
    }, [active, activePlayer])
    
    if (!active) return null

    return (
        <div className="hidden">
            <audio ref={p1} src={url} onTimeUpdate={activePlayer === 1 ? handleTimeUpdate : undefined}><track kind="captions"/></audio>
            <audio ref={p2} src={url} onTimeUpdate={activePlayer === 2 ? handleTimeUpdate : undefined}><track kind="captions"/></audio>
        </div>
    )
}

export function AmbientPlayer() {
  const ambientState = useAppStore((state) => state.ambientSounds)
  const volume = useAppStore((state) => state.preferences.ambientVolume)
  
  const getSoundUrl = (key: string) => {
      // Cast the ambienceSounds to any[] to avoid strict type checks until data.ts is updated
      // Try exact match first, then fuzzy
      // Mapping for user reported mismatches
      const nameMap: Record<string, string> = {
          "rain": "rain",
          "cafe": "cafe",
          "keyboard": "keyboard"
      }
      
      const searchKey = nameMap[key] || key;
      const sounds = ambienceSounds
      
      const exact = sounds.find(s => s.name.toLowerCase() === searchKey.toLowerCase())
      if (exact) return exact.url
      
      const fuzzy = sounds.find(s => s.name.toLowerCase().includes(searchKey.toLowerCase()))
      // Improve fuzzy to avoid "Rain" matching "Rainy Cafe" if "rain" is search.
      // But if "rain" key maps to "Heavy Rain" sound, "includes" is needed.
      // To prevent "rain" matching "cafe" (e.g. "Rainy Cafe"), we should check if other keys match better?
      // No, just trust the name.
      
      return fuzzy ? fuzzy.url : null
  }

  return (
    <>
      {(Object.keys(ambientState) as Array<keyof typeof ambientState>).map((key) => {
          const isEnabled = ambientState[key]
          const url = getSoundUrl(key)
          
          if (!url) return null;

          // We render the component even if disabled to keep state? 
          // No, if disabled we can unmount it to save resources.
          
          return (
              <SeamlessLoop key={key} url={url} volume={volume} active={isEnabled} />
          )
      })}
    </>
  )
}
