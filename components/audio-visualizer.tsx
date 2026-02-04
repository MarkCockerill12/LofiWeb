"use client"

import { useEffect, useRef, useState } from "react"
import { useAppStore } from "@/lib/store"
import { audioController } from "@/lib/audio-controller"

const COLORS = {
  cyan: "#22d3ee",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#22c55e",
  pink: "#ec4899",
  white: "#ffffff",
  black: "#000000",
}

function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t
}

interface DrawOptions {
    ctx: CanvasRenderingContext2D
    dataArray: Uint8Array
    width: number
    height: number
    centerX: number
    centerY: number
    color: string
    baseOpacity: number
    sensitivity: number
    isSilence: boolean
    time: number
}

function drawBars(opts: DrawOptions) {
    const { ctx, dataArray, width, height, centerX, color, baseOpacity, sensitivity, isSilence } = opts
    
    const step = 4 
    const barWidth = (width / (dataArray.length / step)) * 0.8
    let xOffset = 0
    
    ctx.fillStyle = color
    // Single global alpha for all bars to allow batching
    ctx.globalAlpha = 0.8 * baseOpacity
    
    ctx.beginPath()
    for (let i = 0; i < dataArray.length; i += step) {
        const val = isSilence ? 4 : Math.max(dataArray[i], 2)
        const barHeight = (val / 255) * (height * 0.4) * sensitivity
        const y = height - barHeight
        
        ctx.rect(centerX + xOffset, y, barWidth, barHeight)
        ctx.rect(centerX - xOffset - barWidth, y, barWidth, barHeight)
        
        xOffset += barWidth + 2
    }
    ctx.fill()
}

function drawWave(opts: DrawOptions) {
    const { ctx, dataArray, width, height, centerX, centerY, color, baseOpacity, sensitivity, isSilence, time } = opts
    ctx.strokeStyle = color
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    
    const step = 6 
    const visibleDataLength = dataArray.length / 1.5 
    const xStep = (width / 2) / (visibleDataLength / step)

    const drawPass = (lineWidth: number, alpha: number) => {
        ctx.lineWidth = lineWidth
        ctx.globalAlpha = alpha
        
        // Right Side Path
        ctx.beginPath()
        for(let i = 0; i < visibleDataLength; i += step) {
            const v = isSilence ? 0 : dataArray[i] / 255
            const yOffset = v * (height * 0.3) * sensitivity
            const idleY = isSilence ? Math.sin(i * 0.1 + time * 0.002) * 5 : 0
            const y = centerY + (i % 12 < 6 ? yOffset : -yOffset) + idleY
            const x = centerX + (i/step * xStep)
            
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Left Side Path
        ctx.beginPath()
        for(let i = 0; i < visibleDataLength; i += step) {
            const v = isSilence ? 0 : dataArray[i] / 255
            const yOffset = v * (height * 0.3) * sensitivity
            const idleY = isSilence ? Math.sin(i * 0.1 + time * 0.002) * 5 : 0
            const y = centerY + (i % 12 < 6 ? yOffset : -yOffset) + idleY
            const x = centerX - (i/step * xStep)
            
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }
        ctx.stroke()
    }

    drawPass(8, baseOpacity * 0.2) // Bloom
    drawPass(2, baseOpacity)       // Core
}

function drawCircle(opts: DrawOptions, scale: number) {
    const { ctx, dataArray, centerX, centerY, color, baseOpacity, sensitivity, isSilence, time } = opts
    
    // Optimization: Just use first few bins for breathing
    let sum = 0;
    for(let i = 0; i < 8; i++) sum += dataArray[i] || 0; 
    const avg = sum / 8;
    const breathingOffset = (avg / 255) * 12 * sensitivity;
    const idlePulse = isSilence ? Math.sin(time * 0.002) * 2 : 0;

    // Radius matching: Timer is r=120 on screen. 
    // If canvas is scaled by 0.5, we draw r=60 to match.
    // baseRadius = 75 ensures a nice ring around it with a visible gap.
    const baseRadius = (75 * scale) + breathingOffset + idlePulse
    
    ctx.translate(centerX, centerY)
    ctx.strokeStyle = color
    ctx.fillStyle = color
    
    ctx.beginPath()
    const len = dataArray.length 
    const circleStep = 4 
    
    for (let i = 0; i <= len; i += circleStep) {
         const idx = i % len
         const amp = isSilence ? 1 : dataArray[idx]
         const r = baseRadius + ((amp / 255) * 50 * sensitivity) 
         const angle = (Math.PI * 2 * i) / len
         if (i === 0) ctx.moveTo(r * Math.sin(angle), r * Math.cos(angle))
         else ctx.lineTo(r * Math.sin(angle), r * Math.cos(angle))
    }
    
    ctx.closePath()
    
    ctx.globalAlpha = 0.1 * baseOpacity
    ctx.fill()
    
    ctx.lineWidth = 10
    ctx.globalAlpha = 0.15 * baseOpacity
    ctx.stroke()
    
    ctx.lineWidth = 2.5
    ctx.globalAlpha = baseOpacity
    ctx.stroke()
    
    ctx.setTransform(1, 0, 0, 1, 0, 0)
}

export function AudioVisualizer() {
  const [mounted, setMounted] = useState(false)
  const showVisualizer = useAppStore(state => state.showVisualizer)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !showVisualizer) return null

  return <AudioVisualizerCanvas />
}

function AudioVisualizerCanvas() {
  const visualizerStyle = useAppStore(state => state.visualizerStyle)
  const visualizerSensitivity = useAppStore(state => state.visualizerSensitivity)
  const secondaryColor = useAppStore(state => state.preferences.secondaryColor)
  const timerOpacity = useAppStore(state => state.preferences.timerOpacity)
  const timerInteraction = useAppStore(state => state.timerInteraction)
  const isMusicPlaying = useAppStore(state => state.musicPlaying)
  
  const interactionRef = useRef(timerInteraction)
  const colorRef = useRef(COLORS[secondaryColor] || COLORS.purple)
  const opacityRef = useRef(timerOpacity)
  const sensitivityRef = useRef(visualizerSensitivity)
  const playingRef = useRef(isMusicPlaying)

  useEffect(() => {
    interactionRef.current = timerInteraction
    colorRef.current = COLORS[secondaryColor] || COLORS.purple
    opacityRef.current = timerOpacity
    sensitivityRef.current = visualizerSensitivity
    playingRef.current = isMusicPlaying
  }, [timerInteraction, secondaryColor, timerOpacity, visualizerSensitivity, isMusicPlaying])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scaleRef = useRef(1)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let lastTime = 0
    const fps = 24 
    const interval = 1000 / fps
    const resScale = 0.5 // Lower scale for better performance
    
    let analyser = audioController.getAnalyser()
    let dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : new Uint8Array(128).fill(0)

    const resize = () => {
        const w = Math.floor(window.innerWidth * resScale)
        const h = Math.floor(window.innerHeight * resScale)
        
        canvas.width = w
        canvas.height = h
    }

    const render = (time: number) => {
       animationId = requestAnimationFrame(render)

       const delta = time - lastTime
       if (delta < interval) return

       lastTime = time - (delta % interval)
       
       const w = canvas.width
       const h = canvas.height
       
       ctx.clearRect(0, 0, w, h)
       
       const centerX = w / 2
       const centerY = h / 2

       analyser ??= audioController.getAnalyser()
       
       if (analyser && dataArray.length !== analyser.frequencyBinCount) {
           dataArray = new Uint8Array(analyser.frequencyBinCount)
       }
       
       if (analyser) {
           audioController.getFrequencyData(dataArray)
       } else {
           dataArray.fill(0)
       }

       const isSilence = !playingRef.current || (dataArray[0] === 0 && dataArray[Math.floor(dataArray.length/2)] === 0)
       const baseOpacity = Math.max(0.2, opacityRef.current) 
       const color = colorRef.current

       let targetScale = 1
       if (interactionRef.current === 'hover') targetScale = 1.05
       if (interactionRef.current === 'press') targetScale = 0.95
       
       scaleRef.current = lerp(scaleRef.current, targetScale, 0.15)

       const opts: DrawOptions = {
           ctx, dataArray, width: w, height: h, centerX, centerY, 
           color, baseOpacity, sensitivity: sensitivityRef.current, isSilence, time
       }

       if (visualizerStyle === 'bars') {
           drawBars(opts)
       } else if (visualizerStyle === 'wave') {
           drawWave(opts)
       } else if (visualizerStyle === 'circle') {
           drawCircle(opts, scaleRef.current)
       } 
    }

    window.addEventListener('resize', resize)
    resize()
    render(performance.now())

    return () => {
        window.removeEventListener('resize', resize)
        cancelAnimationFrame(animationId)
    }
  }, [visualizerStyle])
  
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}
