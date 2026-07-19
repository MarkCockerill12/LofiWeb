import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getStationManifest, saveStationManifest } from "@/lib/r2"

export async function GET() {
  try {
    const manifest = await getStationManifest()
    return NextResponse.json(manifest)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch station manifest" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")?.value
  if (session !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { updatedManifest } = await request.json()
    if (!updatedManifest) {
      return NextResponse.json({ error: "No manifest data provided" }, { status: 400 })
    }

    const success = await saveStationManifest(updatedManifest)
    if (!success) {
      return NextResponse.json({ error: "Failed to write manifest to Cloudflare R2" }, { status: 500 })
    }

    return NextResponse.json({ success: true, manifest: updatedManifest })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update station manifest" }, { status: 500 })
  }
}
