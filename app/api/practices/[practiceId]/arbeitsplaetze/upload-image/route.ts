import { NextResponse } from "next/server"
import { put, del } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const oldImageUrl = formData.get("oldImageUrl") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP and GIF are allowed." },
        { status: 400 },
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 })
    }

    // Delete old image if exists
    if (oldImageUrl) {
      try {
        await del(oldImageUrl)
      } catch (error) {
        console.error("Error deleting old image:", error)
      }
    }

    // Upload new image
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "jpg"
    const filename = `arbeitsplaetze/practice-${practiceId}/${timestamp}.${extension}`

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error: any) {
    console.error("Error uploading arbeitsplatz image:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
