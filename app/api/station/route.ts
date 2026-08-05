import { NextResponse } from "next/server"
import { saveStationManifest, type StationManifest } from "@/lib/r2"
import { isAuthenticated } from "@/lib/auth"

/**
 * Write-only. Reads are served straight from the public bucket to the browser, so
 * a normal visit never invokes this function — only an admin save does.
 */

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
