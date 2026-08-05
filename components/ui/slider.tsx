"use client"

import * as SliderPrimitive from "@radix-ui/react-slider"

export interface UIColors {
  bg: string
  bgBase: string
  text: string
  textSecondary: string
  border: string
}

interface SimpleSliderProps {
  value: number
  onChange: (value: number) => void
  uiColors: UIColors
  min?: number
  max?: number
  step?: number
  ariaLabel?: string
}

/** The single slider used across the control bar and settings panel. */
export function SimpleSlider({
  value,
  onChange,
  uiColors,
  min = 0,
  max = 100,
  step = 1,
  ariaLabel,
}: SimpleSliderProps) {
  return (
    <SliderPrimitive.Root
      className="relative flex items-center select-none touch-none w-full h-5 group cursor-pointer"
      value={[value]}
      max={max}
      min={min}
      step={step}
      onValueChange={(vals) => onChange(vals[0])}
    >
      <SliderPrimitive.Track className="bg-black/20 dark:bg-white/20 relative grow rounded-full h-1.5 overflow-hidden">
        <SliderPrimitive.Range className="absolute h-full" style={{ backgroundColor: uiColors.text }} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        className="block w-4 h-4 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:scale-110 focus:outline-none focus:scale-110 transition-transform"
        style={{ border: `2px solid ${uiColors.text}` }}
      />
    </SliderPrimitive.Root>
  )
}
