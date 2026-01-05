import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; documentId: string }> },
) {
  try {
    const { practiceId, documentId } = await params
    const practiceIdText = String(practiceId)
    const documentIdText = String(documentId)

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentIdText)
      .eq("practice_id", practiceIdText)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; documentId: string }> },
) {
  try {
    const { practiceId, documentId } = await params
    const practiceIdText = String(practiceId)
    const documentIdText = String(documentId)

    const body = await request.json()
    const supabase = await createAdminClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.folder_id !== undefined) updateData.folder_id = body.folder_id
    if (body.ai_analysis !== undefined) updateData.ai_analysis = body.ai_analysis

    const { data, error } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", documentIdText)
      .eq("practice_id", practiceIdText)
      .select()
      .maybeSingle()

    if (error) {
      console.error("Supabase error details:", JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("PATCH error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
