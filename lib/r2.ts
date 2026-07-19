import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
})

export async function getStationManifest(): Promise<any> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: "lofi-station/asset-manifest.json",
  })
  
  try {
    const response = await s3Client.send(command)
    const dataStr = await response.Body?.transformToString()
    if (dataStr) {
      return JSON.parse(dataStr)
    }
  } catch (error) {
    console.warn("R2 manifest not found, falling back to local asset-manifest.json seed", error)
  }
  
  // Fallback to local file if not in R2
  const localManifest = require("./asset-manifest.json")
  return localManifest
}

export async function saveStationManifest(manifest: any): Promise<boolean> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: "lofi-station/asset-manifest.json",
    Body: JSON.stringify(manifest, null, 2),
    ContentType: "application/json",
  })
  
  try {
    await s3Client.send(command)
    return true
  } catch (error) {
    console.error("Failed to save asset-manifest.json to R2:", error)
    return false
  }
}
