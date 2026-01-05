import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; folderId: string }> },
) {
  try {
    const { practiceId, folderId } = await params

    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("document_folders")
      .update({
        name: body.name,
        description: body.description,
        color: body.color,
      })
      .eq("id", folderId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase error updating folder:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Unexpected error in PATCH /document-folders/[folderId]:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; folderId: string }> },
) {
  try {
    const { practiceId, folderId } = await params

    const supabase = await createAdminClient()

    const { data: folder, error: folderError } = await supabase
      .from("document_folders")
      .select("is_system_folder")
      .eq("id", folderId)
      .single()

    if (folderError) {
      console.error("[v0] Error checking folder:", folderError)
      return NextResponse.json({ error: "Ordner nicht gefunden" }, { status: 404 })
    }

    if (folder?.is_system_folder) {
      return NextResponse.json({ error: "Systemordner können nicht gelöscht werden" }, { status: 403 })
    }

    const { error: permError } = await supabase.from("document_permissions").delete().eq("folder_id", folderId)

    if (permError) {
      console.error("[v0] Error deleting folder permissions:", permError)
    }

    const { error } = await supabase.from("document_folders").delete().eq("id", folderId).eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Supabase error deleting folder:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected error in DELETE /document-folders/[folderId]:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
