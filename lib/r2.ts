import { AwsClient } from "aws4fetch"
import seedManifest from "./asset-manifest.json"
import type { MusicTrack, BackgroundScene, SoundEffect } from "./types"

export interface StationManifest {
  musicTracks: MusicTrack[]
  backgroundScenes: BackgroundScene[]
  ambienceSounds: SoundEffect[]
}

const R2_ENDPOINT = process.env.R2_ENDPOINT
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

const MANIFEST_KEY = "lofi-station/asset-manifest.json"

/**
 * R2 speaks the S3 API, so all this needs is SigV4 request signing — aws4fetch does
 * that in ~2KB instead of pulling the full AWS SDK in for two calls.
 */
const client = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  service: "s3",
  region: "auto",
})

function objectUrl(key: string): string {
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`
}

/** Uploads a single object to the bucket. Returns false on any non-2xx response. */
export async function putObject(
  key: string,
  body: ArrayBuffer | Uint8Array | string,
  contentType: string,
  cacheControl = "public, max-age=31536000, immutable",
): Promise<boolean> {
  const res = await client.fetch(objectUrl(key), {
    method: "PUT",
    body: body as BodyInit,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  })

  if (!res.ok) {
    console.error(`R2 PUT ${key} failed: ${res.status} ${await res.text()}`)
  }

  return res.ok
}

export async function getStationManifest(): Promise<StationManifest> {
  try {
    const res = await client.fetch(objectUrl(MANIFEST_KEY))
    if (res.ok) return (await res.json()) as StationManifest
    console.warn(`R2 manifest fetch returned ${res.status}; using local seed`)
  } catch (error) {
    console.warn("R2 manifest not reachable, falling back to local asset-manifest.json seed", error)
  }

  return seedManifest as StationManifest
}

export async function saveStationManifest(manifest: StationManifest): Promise<boolean> {
  return putObject(MANIFEST_KEY, JSON.stringify(manifest, null, 2), "application/json", "no-cache")
}
