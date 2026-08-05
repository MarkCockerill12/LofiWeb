import { NextResponse } from "next/server"
import { getStationManifest, saveStationManifest, type StationManifest } from "@/lib/r2"
import { isAuthenticated } from "@/lib/auth"

/**
 * Read fresh from R2 per request, but let the CDN absorb bursts for a minute.
 * Kept short so an admin edit shows up on the public site promptly; the admin
 * console itself fetches with `cache: "no-store"` to bypass this entirely.
 */
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const manifest = await getStationManifest()
    return NextResponse.json(manifest, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch station manifest"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function isValidManifest(value: unknown): value is StationManifest {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<StationManifest>
  return (
    Array.isArray(candidate.musicTracks) &&
    Array.isArray(candidate.backgroundScenes) &&
    Array.isArray(candidate.ambienceSounds)
  )
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { updatedManifest } = await request.json()

    if (!isValidManifest(updatedManifest)) {
      return NextResponse.json(
        { error: "Manifest must contain musicTracks, backgroundScenes and ambienceSounds arrays" },
        { status: 400 },
      )
    }

    const success = await saveStationManifest(updatedManifest)
    if (!success) {
      return NextResponse.json({ error: "Failed to write manifest to Cloudflare R2" }, { status: 500 })
    }

    return NextResponse.json({ success: true, manifest: updatedManifest })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update station manifest"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
