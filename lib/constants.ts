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

/** Origin of the R2 bucket holding every media asset. */
export const R2_PUBLIC_BASE =
  process.env.NEXT_PUBLIC_R2_URL ??
  "https://pub-699441ce0cfb40449cc458823a3f1ed2.r2.dev/lofi-station";

/** Legacy hardcoded base that may still appear inside a stored manifest. */
export const LEGACY_R2_BASE = "https://pub-699441ce0cfb40449cc458823a3f1ed2.r2.dev/lofi-station";

/**
 * Same-origin prefix that next.config rewrites to R2_PUBLIC_BASE.
 *
 * Media is deliberately proxied rather than loaded straight from the bucket: some
 * school and corporate networks block *.r2.dev outright, which is what the June
 * 2026 "fix cors" change was for. Serving from our own origin also sidesteps CORS
 * for the Web Audio visualiser and the decoded ambience buffers.
 *
 * The manifest is the exception — it is fetched client-side from the bucket, so a
 * normal page load costs no server function invocation.
 */
export const MEDIA_PREFIX = "/media";

/** Manifest object, read by the browser through the same-origin media proxy. */
export const MANIFEST_URL = `${MEDIA_PREFIX}/asset-manifest.json`;

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
