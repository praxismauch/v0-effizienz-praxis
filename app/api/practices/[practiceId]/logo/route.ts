import { createServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`practice-logos/${practiceId}/${file.name}`, file, {
      access: "public",
    })

    // Update practice with logo URL
    const { error } = await supabase.from("practices").update({ logo_url: blob.url }).eq("id", practiceId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Error uploading logo:", error)
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
  }
}
