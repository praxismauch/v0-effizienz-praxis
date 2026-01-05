import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`goals/${practiceId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (error: any) {
    console.error("[v0] Error uploading goal image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
