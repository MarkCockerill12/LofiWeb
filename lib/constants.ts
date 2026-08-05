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

/** Public R2 origin holding every media asset, proxied same-origin via /media. */
export const R2_PUBLIC_BASE =
  process.env.NEXT_PUBLIC_R2_URL ??
  "https://pub-699441ce0cfb40449cc458823a3f1ed2.r2.dev/lofi-station";

/** Same-origin prefix that next.config rewrites to R2_PUBLIC_BASE. */
export const MEDIA_PREFIX = "/media";

export interface TimerPreset {
  id: string;
  label: string;
  focus: number;
  break: number;
}

export const TIMER_PRESETS: TimerPreset[] = [
  { id: "classic", label: "Classic", focus: 25, break: 5 },
  { id: "extended", label: "Extended", focus: 50, break: 10 },
  { id: "deep", label: "Deep Work", focus: 90, break: 20 },
];
