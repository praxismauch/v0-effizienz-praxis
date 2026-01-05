import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"]

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const oldHandbookUrl = formData.get("oldHandbookUrl") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json({ error: "File must be a PDF or Word document (.pdf, .doc, .docx)" }, { status: 400 })
    }

    // Validate file size (max 50MB for documents)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 50MB" }, { status: 400 })
    }

    // Delete old handbook if provided
    if (oldHandbookUrl && oldHandbookUrl.includes("blob.vercel-storage.com")) {
      try {
        await del(oldHandbookUrl)
      } catch (e) {
        console.error("Error deleting old device handbook:", e)
      }
    }

    // Upload to Vercel Blob
    const blob = await put(`devices/${practiceId}/handbooks/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (error: any) {
    console.error("Error uploading device handbook:", error)
    return NextResponse.json({ error: "Failed to upload handbook" }, { status: 500 })
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
    console.error("Error deleting device handbook:", error)
    return NextResponse.json({ error: "Failed to delete handbook" }, { status: 500 })
  }
}
