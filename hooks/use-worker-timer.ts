"use client"

import { useEffect, useRef } from "react"

interface UseWorkerTimerProps {
  isPlaying: boolean
  onTick: () => void
}

export function useWorkerTimer({ isPlaying, onTick }: UseWorkerTimerProps) {
  const workerRef = useRef<Worker | null>(null)
  const onTickRef = useRef(onTick)

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  useEffect(() => {
    // Create Web Worker
    const workerCode = `
      let intervalId = null;
      
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(() => {
            self.postMessage('tick');
          }, 1000);
        } else if (e.data === 'stop') {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      };
    `

    const blob = new Blob([workerCode], { type: "application/javascript" })
    const workerUrl = URL.createObjectURL(blob)
    workerRef.current = new Worker(workerUrl)

    workerRef.current.onmessage = () => {
      onTickRef.current()
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        URL.revokeObjectURL(workerUrl)
      }
    }
  }, [])

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage(isPlaying ? "start" : "stop")
    }
  }, [isPlaying])
}
