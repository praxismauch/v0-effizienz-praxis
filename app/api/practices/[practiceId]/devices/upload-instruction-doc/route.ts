import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"]

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const deviceId = formData.get("deviceId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Ungültiger Dateityp. Erlaubt sind: PDF, Word-Dokumente und Bilder." },
        { status: 400 },
      )
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Datei darf maximal 50MB groß sein" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`devices/${practiceId}/instruction-docs/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      deviceId: deviceId || null,
    })
  } catch (error: any) {
    console.error("Error uploading device instruction document:", error)
    return NextResponse.json({ error: "Failed to upload instruction document" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (url.includes("blob.vercel-storage.com")) {
      await del(url)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting instruction document:", error)
    return NextResponse.json({ error: "Failed to delete instruction document" }, { status: 500 })
  }
}
