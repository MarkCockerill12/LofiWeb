import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isLightColor(color: string | undefined): boolean {
  if (!color) return false

  // Convert hex to RGB
  const hex = color.replace("#", "")
  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5
}

export function getUIColors(backgroundHex: string | undefined, uiMode: "auto" | "light" | "dark") {
  if (uiMode === "light") {
    return {
      bg: "rgba(255, 255, 255, 0.85)",
      text: "#000000",
      textSecondary: "rgba(0, 0, 0, 0.6)",
      border: "rgba(0, 0, 0, 0.1)",
    }
  }

  if (uiMode === "dark") {
    return {
      bg: "rgba(0, 0, 0, 0.85)",
      text: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.6)",
      border: "rgba(255, 255, 255, 0.1)",
    }
  }

  // Auto mode
  const isLight = isLightColor(backgroundHex)
  return {
    bg: isLight ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.85)",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.6)",
    border: isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
  }
}
