import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

const MAX_WIDTH = 1920
const MAX_HEIGHT = 1920
const QUALITY = 90

async function compressImageServer(buffer: Buffer, mimeType: string): Promise<Buffer> {
  // Skip non-compressible formats
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    return buffer
  }

  try {
    let sharpInstance = sharp(buffer)

    // Get metadata to check dimensions
    const metadata = await sharpInstance.metadata()

    // Only resize if larger than max dimensions
    if ((metadata.width && metadata.width > MAX_WIDTH) || (metadata.height && metadata.height > MAX_HEIGHT)) {
      sharpInstance = sharpInstance.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "inside",
        withoutEnlargement: true,
      })
    }

    // Compress based on format
    if (mimeType === "image/jpeg") {
      return await sharpInstance.jpeg({ quality: QUALITY }).toBuffer()
    } else if (mimeType === "image/png") {
      return await sharpInstance.png({ quality: QUALITY, compressionLevel: 9 }).toBuffer()
    } else if (mimeType === "image/webp") {
      return await sharpInstance.webp({ quality: QUALITY }).toBuffer()
    }

    return buffer
  } catch (error) {
    console.error("Error compressing image:", error)
    return buffer // Return original on error
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    let fileBuffer = Buffer.from(await file.arrayBuffer())
    let finalFileName = file.name
    let finalMimeType = file.type

    if (file.type.startsWith("image/") && file.type !== "image/svg+xml" && file.type !== "image/gif") {
      fileBuffer = await compressImageServer(fileBuffer, file.type)

      // Convert to jpeg for better compression (except for png with transparency)
      if (file.type !== "image/png") {
        finalMimeType = "image/jpeg"
        finalFileName = file.name.replace(/\.[^/.]+$/, ".jpg")
      }
    }

    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN is not set")
      return NextResponse.json({ error: "Blob storage not configured. Please add the Vercel Blob integration." }, { status: 500 })
    }

    // Upload to Vercel Blob
    const blob = await put(finalFileName, fileBuffer, {
      access: "public",
      contentType: finalMimeType,
    })

    return NextResponse.json({
      url: blob.url,
      fileName: finalFileName,
      fileSize: fileBuffer.length,
      originalSize: file.size,
      compressed: fileBuffer.length < file.size,
    })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to upload file: ${errorMessage}` }, { status: 500 })
  }
}
