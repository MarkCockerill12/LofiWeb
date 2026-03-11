export const THEME_COLORS = {
  cyan: "#06b6d4",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#10b981",
  pink: "#ec4899",
  white: "#ffffff",
  black: "#000000",
} as const;

export type ThemeColor = keyof typeof THEME_COLORS;

export const VISUALIZER_COLORS = {
  cyan: "#22d3ee",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#22c55e",
  pink: "#ec4899",
  white: "#ffffff",
  black: "#000000",
} as const;
