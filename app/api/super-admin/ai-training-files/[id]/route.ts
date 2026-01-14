import { createClient } from "@/lib/supabase/server"
import { del } from "@vercel/blob"
import type { NextRequest } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return Response.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    // Get file info before deleting
    const { data: file } = await supabase.from("ai_training_files").select("file_url").eq("id", id).single()

    if (!file) {
      return Response.json({ error: "Datei nicht gefunden" }, { status: 404 })
    }

    // Delete from Vercel Blob
    try {
      await del(file.file_url)
    } catch (blobError) {
      console.error("[v0] Error deleting from Blob:", blobError)
      // Continue anyway - file metadata will still be deleted
    }

    // Delete from database
    const { error } = await supabase.from("ai_training_files").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting AI training file:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/super-admin/ai-training-files:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return Response.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    const body = await request.json()
    const { description, category, is_active } = body

    const updates: any = {}
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await supabase.from("ai_training_files").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating AI training file:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ file: data })
  } catch (error) {
    console.error("[v0] Error in PUT /api/super-admin/ai-training-files:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
