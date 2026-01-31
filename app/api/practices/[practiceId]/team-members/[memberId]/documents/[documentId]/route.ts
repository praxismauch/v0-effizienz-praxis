import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; memberId: string; documentId: string }> }
) {
  const { practiceId, memberId, documentId } = await params

  try {
    const body = await request.json()
    const adminClient = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.file_url !== undefined) updateData.file_url = body.file_url
    if (body.file_size !== undefined) updateData.file_size = body.file_size
    if (body.expiry_date !== undefined) updateData.expiry_date = body.expiry_date
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data, error } = await adminClient
      .from("team_member_documents")
      .update(updateData)
      .eq("id", documentId)
      .eq("practice_id", practiceId)
      .eq("team_member_id", memberId)
      .select()
      .single()

    if (error) {
      console.error("Error updating document:", error)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    return NextResponse.json({ document: data })
  } catch (error) {
    console.error("Error in document PATCH:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; memberId: string; documentId: string }> }
) {
  const { practiceId, memberId, documentId } = await params

  try {
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("team_member_documents")
      .delete()
      .eq("id", documentId)
      .eq("practice_id", practiceId)
      .eq("team_member_id", memberId)

    if (error) {
      console.error("Error deleting document:", error)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in document DELETE:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
