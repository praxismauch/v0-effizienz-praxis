import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, imageBase64 } = await request.json()

    if (!filename || !imageBase64) {
      return NextResponse.json({ error: "Filename und Bilddaten sind erforderlich" }, { status: 400 })
    }

    // Convert base64 string to Buffer
    const buffer = Buffer.from(imageBase64, "base64")

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: contentType || "image/png",
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
    })
  } catch (error: unknown) {
    console.error("[Screenshot Upload] Error:", error)
    const message = error instanceof Error ? error.message : "Upload fehlgeschlagen"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
