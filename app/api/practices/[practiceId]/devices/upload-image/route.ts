import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const oldImageUrl = formData.get("oldImageUrl") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 10MB" }, { status: 400 })
    }

    // Delete old image if provided
    if (oldImageUrl && oldImageUrl.includes("blob.vercel-storage.com")) {
      try {
        await del(oldImageUrl)
      } catch (e) {
        console.error("[v0] Error deleting old device image:", e)
      }
    }

    // Upload to Vercel Blob
    const blob = await put(`devices/${practiceId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (error: any) {
    console.error("[v0] Error uploading device image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
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
    console.error("[v0] Error deleting device image:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
