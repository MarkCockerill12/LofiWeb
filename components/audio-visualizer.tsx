"use client"

import { useEffect, useRef } from "react"
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

export function AudioVisualizer() {
  const showVisualizer = useAppStore(state => state.showVisualizer)
  const visualizerStyle = useAppStore(state => state.visualizerStyle)
  const visualizerSensitivity = useAppStore(state => state.visualizerSensitivity)
  const secondaryColor = useAppStore(state => state.preferences.secondaryColor)
  const timerOpacity = useAppStore(state => state.preferences.timerOpacity)
  const timerInteraction = useAppStore(state => state.timerInteraction)
  
  // Use a ref for interaction state to avoid restarting the animation loop
  const interactionRef = useRef(timerInteraction)

  useEffect(() => {
    interactionRef.current = timerInteraction
  }, [timerInteraction])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Animation state for circle size
  const scaleRef = useRef(1)
  
  const color = COLORS[secondaryColor] || COLORS.purple // Use secondary color as primary visualizer color

  useEffect(() => {
    if (!showVisualizer || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let lastTime = 0
    // Increase FPS limit for smoother animation sync (30->60 if possible, or keep 30 but smooth logic)
    const fps = 45 
    const interval = 1000 / fps
    
    // Lazy initialization in the loop
    let analyser = audioController.getAnalyser();
    let dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight // Full screen
    }
    window.addEventListener('resize', resize)
    resize()

    const render = (time: number) => {
       animationId = requestAnimationFrame(render)

       const delta = time - lastTime
       if (delta < interval) return

       lastTime = time - (delta % interval)

       ctx.clearRect(0, 0, canvas.width, canvas.height)
       
       // Try to init if missing
       if (!analyser || !dataArray) {
           analyser = audioController.getAnalyser()
           if (analyser) {
               dataArray = new Uint8Array(analyser.frequencyBinCount)
           }
       }
       
       // Handle case where audio is not playing or missing
       // Fill with zeros/defaults if missing so we can render the "flat line"
       if (analyser && dataArray) {
           analyser.getByteFrequencyData(dataArray) // ensure we call the method on the analyser object directly if audioController wrapper is just a getter?
           // Actually audioController.getFrequencyData usually wraps getByteFrequencyData
           audioController.getFrequencyData(dataArray)
       } else if (dataArray) {
           dataArray.fill(0)
       } else {
           // Create dummy zero array if initialization failed entirely
           dataArray = new Uint8Array(128).fill(0) 
       }

       const width = canvas.width
       const height = canvas.height
       const centerX = width / 2
       const centerY = height / 2

       // Check silence for "flat line" rendering
       const isSilence = dataArray.every(v => v === 0)
       const baseOpacity = Math.max(0.2, timerOpacity) // Ensure at least 20% opacity visibility

       // Handle Timer Sync Animation
       let targetScale = 1
       if (interactionRef.current === 'hover') targetScale = 1.05
       if (interactionRef.current === 'press') targetScale = 0.95
       
       // Use a faster lerp for responsiveness or match CSS transition
       scaleRef.current = lerp(scaleRef.current, targetScale, 0.15)

       // Base radius calculation synced with timer interactions
       
       if (visualizerStyle === 'bars') {
           const barWidth = (width / dataArray.length) * 2.5
           // Start x from center
           let xOffset = 0
           
           for (let i = 0; i < dataArray.length; i++) {
               const val = isSilence ? 2 : dataArray[i] // Show tiny bar if silence
               const barHeight = (val / 255) * (height * 0.4) * visualizerSensitivity // Reduced height scale
               
               ctx.fillStyle = color
               ctx.globalAlpha = (0.3 + (val / 512)) * baseOpacity
               
               // Bottom Up - Reflected from Middle
               const y = height - barHeight
               
               // Right Side (Center -> Right)
               ctx.fillRect(centerX + xOffset, y, barWidth, barHeight)
               // Left Side (Center -> Left)
               ctx.fillRect(centerX - xOffset - barWidth, y, barWidth, barHeight)
               
               xOffset += barWidth + 1
           }
           
           // If silence, maybe draw a thin line across bottom?
           if (isSilence) {
               ctx.fillStyle = color
               ctx.globalAlpha = 0.5 * baseOpacity
               ctx.fillRect(0, height - 2, width, 2)
           }

       } else if (visualizerStyle === 'wave') {
           ctx.lineWidth = 3
           ctx.strokeStyle = color
           ctx.globalAlpha = baseOpacity
           ctx.lineCap = "round"
           ctx.shadowBlur = 15
           ctx.shadowColor = color
           
           ctx.beginPath()

           // Reduce points for smoother wave
           const step = 2 
           const visibleDataLength = dataArray.length / 1.5 // Don't use highest freqs
           // Calculate width per step to fill half screen
           const xStep = (width / 2) / (visibleDataLength / step)

           // Draw Left Side (Traverse backwards from Center to Left)
           for(let i = 0; i < visibleDataLength; i += step) {
             const v = isSilence ? 0 : dataArray[i] / 255
             const yOffset = v * (height / 3) * visualizerSensitivity
             const idleY = isSilence ? Math.sin(i * 0.1 + time * 0.002) * 5 : 0
             
             const x = centerX - (i/step * xStep)
             // Alternate up/down for wave effect or just straight yOffset
             const y = centerY + (i % 4 < 2 ? yOffset : -yOffset) + idleY

             if (i === 0) ctx.moveTo(x, y)
             else ctx.lineTo(x, y)
           }

           // Draw Right Side (Traverse from Center to Right)

           ctx.beginPath()
           
           // Left side: High Freq (Left Edge) -> Low Freq (Center)
           for(let i = Math.floor(visibleDataLength); i >= 0; i -= step) {
               const v = isSilence ? 0 : dataArray[i] / 255
               const yOffset = v * (height / 3) * visualizerSensitivity
               const idleY = isSilence ? Math.sin(i * 0.1 + time * 0.002) * 5 : 0
               
               // Map i (0..max) to X distance from center
               // i=0 is center. i=max is left edge
               const x = centerX - ((i/step) * xStep)
               const y = centerY + (i % 4 < 2 ? yOffset : -yOffset) + idleY
               
               if (i === Math.floor(visibleDataLength)) ctx.moveTo(x, y)
               else ctx.lineTo(x, y)
           }

           // Right side: Low Freq (Center) -> High Freq (Right Edge)
           for(let i = 0; i < visibleDataLength; i += step) {
               const v = isSilence ? 0 : dataArray[i] / 255
               const yOffset = v * (height / 3) * visualizerSensitivity
               const idleY = isSilence ? Math.sin(i * 0.1 + time * 0.002) * 5 : 0

               const x = centerX + ((i/step) * xStep)
               const y = centerY + (i % 4 < 2 ? yOffset : -yOffset) + idleY
               
               ctx.lineTo(x, y)
           }
           
           ctx.stroke()
           ctx.shadowBlur = 0

       } else if (visualizerStyle === 'circle') {
           // Calculate average loudness for "breathing" effect
           let sum = 0;
           for(const val of dataArray) sum += val;
           const avg = sum / dataArray.length;
           const breathingOffset = (avg / 255) * 20 * visualizerSensitivity;


           // Dynamic base radius based on timer interaction state
           // Apply scale factor directly to force sync (remove Max clamp logic interference)
           // We scale the whole base size by the animation factor
           const computedBase = Math.max(height * 0.15, 135)
           const baseRadius = (computedBase * scaleRef.current) + breathingOffset
           
           ctx.translate(centerX, centerY)
           
           ctx.strokeStyle = color
           ctx.lineWidth = 3 // Thicker
           ctx.shadowBlur = 20
           ctx.shadowColor = color // Match primary
           ctx.globalAlpha = baseOpacity
           
           ctx.beginPath()
           
           const len = dataArray.length - 10 // Trim high freq
           
           // Draw 2 mirrored halves for symmetry
           for (let i = 0; i < len; i++) {
                const amp = isSilence ? 2 : dataArray[i] // Min value for visibility
                const normalized = amp / 255
                const r = baseRadius + (normalized * 60 * visualizerSensitivity) 
                
                // Map i to angle 0 -> PI
                const angle = (Math.PI * i) / (len - 1)
                
                const x = r * Math.sin(angle)
                const y = r * Math.cos(angle)
                
                if (i===0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
           }
           
           // Mirror for PI -> 2PI (Draw backwards)
           for (let i = len - 1; i >= 0; i--) {
                const amp = isSilence ? 2 : dataArray[i]
                const normalized = amp / 255
                const r = baseRadius + (normalized * 60 * visualizerSensitivity)
                
                const angle = (Math.PI * i) / (len - 1)
                
                // Flip X for mirror effect
                const x = -r * Math.sin(angle)
                const y = r * Math.cos(angle)
                
                ctx.lineTo(x, y)
           }
           
           ctx.closePath()
           ctx.stroke()
           
           // Inner Glow/Fill
           ctx.fillStyle = color
           ctx.globalAlpha = 0.1 * baseOpacity
           ctx.fill()
           
           ctx.setTransform(1, 0, 0, 1, 0, 0)
       } 
    }

    render(0)

    return () => {
        window.removeEventListener('resize', resize)
        cancelAnimationFrame(animationId)
    }
  }, [showVisualizer, visualizerStyle, color, timerOpacity, visualizerSensitivity])
  
  if (!showVisualizer) return null

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
