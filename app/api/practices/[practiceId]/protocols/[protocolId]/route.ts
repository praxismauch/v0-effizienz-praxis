import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; protocolId: string }> },
) {
  try {
    const { practiceId, protocolId } = await params
    const supabase = await createServerClient()

    const { data: protocol, error } = await supabase
      .from("practice_journals")
      .select("*")
      .eq("id", protocolId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .maybeSingle()

    if (error) {
      console.error("[API] Error fetching protocol:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!protocol) {
      return NextResponse.json({ error: "Protocol not found" }, { status: 404 })
    }

    return NextResponse.json(protocol)
  } catch (error) {
    console.error("[API] Error in protocol GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; protocolId: string }> },
) {
  try {
    const { practiceId, protocolId } = await params
    const supabase = await createServerClient()
    const body = await request.json()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[API] Unauthorized:", userError?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, content, category, status, protocolDate, actionItems, attendees } = body

    const adminClient = await createAdminClient()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (content !== undefined) updateData.content = content
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = status
    if (protocolDate !== undefined) updateData.protocol_date = protocolDate
    if (actionItems !== undefined) updateData.action_items = actionItems
    if (attendees !== undefined) updateData.attendees = attendees

    const { data: protocol, error } = await adminClient
      .from("practice_journals")
      .update(updateData)
      .eq("id", protocolId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error updating protocol:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(protocol)
  } catch (error) {
    console.error("[API] Error in protocol PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; protocolId: string }> },
) {
  try {
    const { practiceId, protocolId } = await params
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[API] Unauthorized:", userError?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    // Soft delete by setting deleted_at
    const { error } = await adminClient
      .from("practice_journals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", protocolId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[API] Error deleting protocol:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error in protocol DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
