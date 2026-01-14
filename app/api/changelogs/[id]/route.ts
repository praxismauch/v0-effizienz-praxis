import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { version, title, description, changes, change_type, is_published } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (version !== undefined) updateData.version = version
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (changes !== undefined) updateData.changes = changes
    if (change_type !== undefined) updateData.change_type = change_type
    if (is_published !== undefined) {
      updateData.is_published = is_published
      if (is_published && !body.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase.from("changelogs").update(updateData).eq("id", id).select().maybeSingle()

    if (error) {
      console.error("[v0] Error updating changelog:", error)
      return NextResponse.json({ error: "Failed to update changelog" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Changelog nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating changelog:", error)
    return NextResponse.json({ error: "Failed to update changelog" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("changelogs").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting changelog:", error)
    return NextResponse.json({ error: "Failed to delete changelog" }, { status: 500 })
  }
}
