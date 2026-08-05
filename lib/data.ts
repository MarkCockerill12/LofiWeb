import assetManifest from "./asset-manifest.json"
import { MEDIA_PREFIX, R2_PUBLIC_BASE } from "./constants"
import type { BackgroundScene, MusicTrack, SoundEffect } from "./types"

export type { BackgroundScene, MusicTrack, SoundEffect }

/** Rewrites absolute R2 URLs onto the same-origin /media proxy. */
function toMediaUrl(url: string): string {
  return url.replace(R2_PUBLIC_BASE, MEDIA_PREFIX)
}

const KEYWORD_CATEGORIES: Record<"bg" | "music", [RegExp, string][]> = {
  bg: [
    [/anime/, "Anime"],
    [/cyber|neon/, "Sci-Fi"],
    [/nature|forest|rain/, "Nature"],
    [/room|study/, "Cozy"],
  ],
  music: [
    [/game|nintendo|zelda/, "Video Game"],
    [/classical/, "Classical"],
    [/jazz/, "Jazz"],
  ],
}

/**
 * Assets are organised as `<type>/<Category>/<file>`, so the folder after the type
 * segment is the category. Falls back to keyword matching for flat legacy paths.
 */
function inferCategory(path: string, type: "bg" | "music"): string {
  const parts = path.split("?")[0].split("/")
  const anchor = type === "music" ? ["music"] : ["backgrounds", "scenes"]
  const anchorIdx = parts.findIndex((p) => anchor.includes(p))

  if (anchorIdx !== -1 && anchorIdx < parts.length - 1) {
    const candidate = parts[anchorIdx + 1]
    // A segment with an extension is the file itself, not a category folder.
    if (!candidate.includes(".")) return decodeURIComponent(candidate)
  }

  const lower = path.toLowerCase()
  const match = KEYWORD_CATEGORIES[type].find(([pattern]) => pattern.test(lower))
  return match ? match[1] : type === "music" ? "Lofi" : "Other"
}

export const musicTracks: MusicTrack[] = assetManifest.musicTracks.map((t: MusicTrack) => ({
  ...t,
  url: toMediaUrl(t.url),
  category: t.category || inferCategory(t.url, "music"),
}))

export const backgroundScenes: BackgroundScene[] = assetManifest.backgroundScenes.map(
  (s: BackgroundScene) => ({
    ...s,
    videoUrl: toMediaUrl(s.videoUrl),
    thumbnailUrl: toMediaUrl(s.thumbnailUrl),
    category: s.category || inferCategory(s.videoUrl, "bg"),
  }),
)

export const ambienceSounds: SoundEffect[] = assetManifest.ambienceSounds.map((s: SoundEffect) => ({
  ...s,
  url: toMediaUrl(s.url),
}))

export const SCENE_COLORS: Record<string, string> = {
  "scene-0": "#ec4899", // Sakura -> Pink
  "scene-1": "#a855f7", // Retrowave -> Purple
  "scene-2": "#06b6d4", // Night City -> Cyan
  "scene-3": "#06b6d4", // Moonlit Lake -> Cyan
  "scene-4": "#a855f7", // Moonlight Flower -> Purple
  "scene-5": "#10b981", // Minecraft -> Green
  "scene-6": "#f97316", // Magma -> Orange
  "scene-7": "#a855f7", // Galactic -> Purple
  "scene-8": "#000000", // Deltarune -> Black
  "scene-9": "#ec4899", // Bongo Cat -> Pink
}
