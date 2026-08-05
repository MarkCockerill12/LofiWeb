import assetManifest from "./asset-manifest.json"
import { LEGACY_MEDIA_PREFIX, LEGACY_R2_BASE, R2_PUBLIC_BASE } from "./constants"
import type { BackgroundScene, MusicTrack, SoundEffect } from "./types"

export type { BackgroundScene, MusicTrack, SoundEffect }

/**
 * Normalises any stored URL onto the configured public base, so the browser always
 * fetches media straight from the bucket. Handles both the old same-origin /media
 * proxy paths and hardcoded pub-*.r2.dev URLs left in older manifests.
 */
export function toAssetUrl(url: string): string {
  if (!url) return url

  if (url.startsWith(LEGACY_MEDIA_PREFIX + "/")) {
    return R2_PUBLIC_BASE + url.slice(LEGACY_MEDIA_PREFIX.length)
  }

  if (url.startsWith(LEGACY_R2_BASE)) {
    return R2_PUBLIC_BASE + url.slice(LEGACY_R2_BASE.length)
  }

  return url
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
  url: toAssetUrl(t.url),
  category: t.category || inferCategory(t.url, "music"),
}))

export const backgroundScenes: BackgroundScene[] = assetManifest.backgroundScenes.map(
  (s: BackgroundScene) => ({
    ...s,
    videoUrl: toAssetUrl(s.videoUrl),
    thumbnailUrl: toAssetUrl(s.thumbnailUrl),
    category: s.category || inferCategory(s.videoUrl, "bg"),
  }),
)

export const ambienceSounds: SoundEffect[] = assetManifest.ambienceSounds.map((s: SoundEffect) => ({
  ...s,
  url: toAssetUrl(s.url),
}))

/**
 * Applies the same URL and category normalisation to a manifest fetched at runtime
 * as the bundled seed gets at build time. Previously live data skipped this, so
 * fetched entries kept whatever URL form the manifest happened to hold.
 */
export function normalizeManifest(raw: {
  musicTracks: MusicTrack[]
  backgroundScenes: BackgroundScene[]
  ambienceSounds: SoundEffect[]
}) {
  return {
    musicTracks: raw.musicTracks.map((t) => ({
      ...t,
      url: toAssetUrl(t.url),
      category: t.category || inferCategory(t.url, "music"),
    })),
    backgroundScenes: raw.backgroundScenes.map((s) => ({
      ...s,
      videoUrl: toAssetUrl(s.videoUrl),
      thumbnailUrl: toAssetUrl(s.thumbnailUrl),
      category: s.category || inferCategory(s.videoUrl, "bg"),
    })),
    ambienceSounds: raw.ambienceSounds.map((s) => ({ ...s, url: toAssetUrl(s.url) })),
  }
}

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
