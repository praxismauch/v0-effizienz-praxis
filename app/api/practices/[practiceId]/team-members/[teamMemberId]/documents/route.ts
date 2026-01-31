import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; teamMemberId: string }> }
) {
  const { practiceId, teamMemberId } = await params

  try {
    const adminClient = createAdminClient()

    const { data: documents, error } = await adminClient
      .from("team_member_documents")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("team_member_id", teamMemberId)
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("Error fetching documents:", error)
      return NextResponse.json({ documents: [] })
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error("Error in documents GET:", error)
    return NextResponse.json({ documents: [] })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; teamMemberId: string }> }
) {
  const { practiceId, teamMemberId } = await params

  try {
    const body = await request.json()
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("team_member_documents")
      .insert({
        practice_id: practiceId,
        team_member_id: teamMemberId,
        name: body.name,
        type: body.type || "unknown",
        category: body.category || "other",
        file_url: body.file_url,
        file_size: body.file_size,
        expiry_date: body.expiry_date,
        notes: body.notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating document:", error)
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
    }

    return NextResponse.json({ document: data })
  } catch (error) {
    console.error("Error in documents POST:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
