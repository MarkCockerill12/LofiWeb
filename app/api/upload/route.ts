import { NextResponse } from "next/server"
import { putObject, R2_PUBLIC_URL } from "@/lib/r2"
import { isAuthenticated } from "@/lib/auth"

/**
 * Only these MIME types may be written to the bucket, each with its own size cap.
 * Images arrive as WebP already — the admin console encodes thumbnails client-side
 * with canvas, so no server-side image processing is needed.
 */
const ALLOWED_TYPES: Record<string, number> = {
  "audio/mpeg": 25 * 1024 * 1024,
  "audio/mp3": 25 * 1024 * 1024,
  "audio/wav": 50 * 1024 * 1024,
  "video/mp4": 50 * 1024 * 1024,
  "video/webm": 50 * 1024 * 1024,
  "image/webp": 5 * 1024 * 1024,
}

const ROOT_PREFIX = "lofi-station"

/**
 * The folder arrives from the client, so constrain it to a safe subtree instead of
 * trusting it — otherwise any authenticated call could write anywhere in the bucket.
 */
function normalizeFolder(raw: string): string | null {
  const trimmed = raw.replace(/^\/+|\/+$/g, "")
  if (!trimmed.startsWith(`${ROOT_PREFIX}/`) && trimmed !== ROOT_PREFIX) return null
  if (trimmed.includes("..")) return null
  if (!/^[a-zA-Z0-9/_ -]+$/.test(trimmed)) return null
  return trimmed
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const rawFolder = (formData.get("folder") as string) || ROOT_PREFIX

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const maxSize = ALLOWED_TYPES[file.type]
    if (!maxSize) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type || "unknown"}` }, { status: 415 })
    }
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File exceeds the ${Math.round(maxSize / 1024 / 1024)}MB limit for ${file.type}` },
        { status: 413 },
      )
    }

    const folder = normalizeFolder(rawFolder)
    if (!folder) {
      return NextResponse.json({ error: "Invalid destination folder" }, { status: 400 })
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const key = `${folder}/${Date.now()}-${sanitizedName}`

    const uploaded = await putObject(key, await file.arrayBuffer(), file.type)
    if (!uploaded) {
      return NextResponse.json({ error: "Failed to upload file to R2" }, { status: 502 })
    }

    return NextResponse.json({ success: true, url: `${R2_PUBLIC_URL}/${key}` })
  } catch (error) {
    console.error("R2 Upload Error:", error)
    const message = error instanceof Error ? error.message : "Failed to upload file to R2"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
