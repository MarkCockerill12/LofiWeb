import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
})

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")?.value
  if (session !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "lofi-station"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    let key = `${folder.replace(/\/$/, "")}/${Date.now()}-${sanitizedName}`

    let finalBuffer = buffer
    let finalContentType = file.type

    // If image and not SVG/GIF, convert to WebP
    if (file.type.startsWith("image/") && !file.type.includes("gif") && !file.type.includes("svg+xml")) {
      try {
        console.log(`Converting image ${file.name} to WebP...`)
        finalBuffer = await sharp(buffer)
          .webp({ quality: 85 })
          .toBuffer()
        finalContentType = "image/webp"

        // Rewrite extension in key
        const dotIdx = key.lastIndexOf(".")
        if (dotIdx !== -1) {
          key = key.substring(0, dotIdx) + ".webp"
        } else {
          key = key + ".webp"
        }
      } catch (sharpError) {
        console.warn("Sharp image conversion failed; uploading original.", sharpError)
      }
    }

    console.log(`Uploading file to R2 with key: ${key}...`)

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: finalBuffer,
      ContentType: finalContentType || "application/octet-stream",
      CacheControl: "public, max-age=31536000",
    })

    await s3Client.send(command)

    // Return the absolute public URL
    const publicUrl = `${R2_PUBLIC_URL}/${key}`
    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error("R2 Upload Error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file to R2" }, { status: 500 })
  }
}
