import { createAdminClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const { data: files, error } = await supabase
      .from("ai_training_files")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching AI training files:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ files })
  } catch (error) {
    console.error("[v0] Error in GET /api/super-admin/ai-training-files:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const description = formData.get("description") as string
    const category = formData.get("category") as string

    if (!file) {
      return Response.json({ error: "Keine Datei hochgeladen" }, { status: 400 })
    }

    // Upload file to Vercel Blob
    const blob = await put(`ai-training/${file.name}`, file, {
      access: "public",
    })

    const userId = "36883b61-34e4-4b9e-8a11-eb1a9656d2a0" // Default super admin ID

    // Save file metadata to database
    const { data, error } = await supabase
      .from("ai_training_files")
      .insert({
        file_name: file.name,
        file_url: blob.url,
        file_size: file.size,
        file_type: file.type,
        description: description || null,
        category: category || "general",
        uploaded_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving AI training file:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ file: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/super-admin/ai-training-files:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
