import { put, del } from "@vercel/blob"
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

const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN is not set")
      return NextResponse.json({ error: "Blob storage not configured. Please add the Vercel Blob integration." }, { status: 500 })
    }

    // Support both single "file" and multiple "files" field names
    const singleFile = formData.get("file") as File | null
    const multipleFiles = formData.getAll("files") as File[]
    const folder = (formData.get("folder") as string) || "uploads"

    const filesToProcess = singleFile ? [singleFile] : multipleFiles

    if (!filesToProcess.length || !filesToProcess[0]?.name) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const results = []

    for (const file of filesToProcess) {
      if (file.size > MAX_FILE_SIZE) {
        results.push({ name: file.name, error: `Datei zu groß (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` })
        continue
      }

      let fileBuffer = Buffer.from(await file.arrayBuffer())
      let finalFileName = file.name
      let finalMimeType = file.type

      // Compress images (but not documents)
      if (file.type.startsWith("image/") && file.type !== "image/svg+xml" && file.type !== "image/gif") {
        fileBuffer = await compressImageServer(fileBuffer, file.type)
        if (file.type !== "image/png") {
          finalMimeType = "image/jpeg"
          finalFileName = file.name.replace(/\.[^/.]+$/, ".jpg")
        }
      }

      const timestamp = Date.now()
      const safeName = finalFileName.replace(/[^a-zA-Z0-9._-]/g, "_")
      const pathname = `${folder}/${timestamp}-${safeName}`

      const blob = await put(pathname, fileBuffer, {
        access: "public",
        contentType: finalMimeType,
      })

      results.push({
        url: blob.url,
        name: file.name,
        type: file.type,
        size: fileBuffer.length,
        originalSize: file.size,
        compressed: fileBuffer.length < file.size,
        uploaded_at: new Date().toISOString(),
      })
    }

    // For single-file backward compatibility, return flat object if only one file
    if (singleFile && results.length === 1 && !results[0].error) {
      return NextResponse.json({
        url: results[0].url,
        fileName: results[0].name,
        fileSize: results[0].size,
        originalSize: results[0].originalSize,
        compressed: results[0].compressed,
      })
    }

    return NextResponse.json({ files: results })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to upload file: ${errorMessage}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }
    await del(url)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting file:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
