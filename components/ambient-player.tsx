"use client"

import { useAppStore } from "@/lib/store"
import { useEffect, useMemo, useRef } from "react"
import { audioController, type AmbientLoopHandle } from "@/lib/audio-controller"

/**
 * Drives one gapless ambience loop. Web Audio handles the looping natively, so this
 * needs no dual buffers, crossfade intervals or playback watchdog.
 */
function useAmbientLoop(url: string | null, active: boolean, volume: number) {
  const handleRef = useRef<AmbientLoopHandle | null>(null)

  useEffect(() => {
    if (!active || !url) return

    let cancelled = false
    audioController.resume()

    audioController
      .playLoop(url, volume)
      .then((handle) => {
        // The toggle may have flipped back off while the buffer was decoding.
        if (cancelled) {
          handle?.stop()
          return
        }
        handleRef.current = handle
      })
      .catch((err) => console.warn("Ambient loop failed to start:", err))

    return () => {
      cancelled = true
      handleRef.current?.stop()
      handleRef.current = null
    }
    // Volume is applied as an initial value; the effect below keeps it live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, active])

  useEffect(() => {
    handleRef.current?.setVolume(volume)
  }, [volume])
}

function AmbientLoop({ url, volume, active }: { url: string; volume: number; active: boolean }) {
  useAmbientLoop(url, active, volume)
  return null
}

export function AmbientPlayer() {
  const ambienceSounds = useAppStore((state) => state.ambienceSounds)
  const ambientState = useAppStore((state) => state.ambientSounds)
  const volume = useAppStore((state) => state.preferences.ambientVolume)

  // Resolve each toggle key to a manifest URL once per catalog change.
  const urls = useMemo(() => {
    const resolve = (key: string): string | null => {
      const lowerKey = key.toLowerCase()
      const exact = ambienceSounds.find((s) => s.name.toLowerCase() === lowerKey)
      if (exact) return exact.url
      return ambienceSounds.find((s) => s.name.toLowerCase().includes(lowerKey))?.url ?? null
    }

    return Object.fromEntries(
      (Object.keys(ambientState) as Array<keyof typeof ambientState>).map((key) => [key, resolve(key)]),
    ) as Record<keyof typeof ambientState, string | null>
  }, [ambienceSounds, ambientState])

  return (
    <>
      {(Object.keys(ambientState) as Array<keyof typeof ambientState>).map((key) => {
        const url = urls[key]
        if (!url || !ambientState[key]) return null
        return <AmbientLoop key={key} url={url} volume={volume} active />
      })}
    </>
  )
}
