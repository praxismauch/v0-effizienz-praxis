import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("sick_leaves")
      .select(`
        *,
        user:users!sick_leaves_user_id_fkey(id, name, email, avatar),
        approved_by_user:users!sick_leaves_approved_by_fkey(id, name, email),
        team_member:team_members(id, first_name, last_name)
      `)
      .eq("id", String(id))
      .eq("practice_id", String(practiceId))
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("[v0] sick-leaves GET by ID error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sickLeave: data })
  } catch (error) {
    console.error("[v0] sick-leaves GET by ID exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.start_date !== undefined) updateData.start_date = body.start_date
    if (body.end_date !== undefined) updateData.end_date = body.end_date
    if (body.reason !== undefined) updateData.reason = body.reason
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.status !== undefined) updateData.status = body.status
    if (body.document_url !== undefined) updateData.document_url = body.document_url

    // Handle approval
    if (body.status === "approved" && body.approved_by) {
      updateData.approved_by = String(body.approved_by)
      updateData.approved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("sick_leaves")
      .update(updateData)
      .eq("id", String(id))
      .eq("practice_id", String(practiceId))
      .select(`
        *,
        user:users!sick_leaves_user_id_fkey(id, name, email, avatar),
        approved_by_user:users!sick_leaves_approved_by_fkey(id, name, email),
        team_member:team_members(id, first_name, last_name)
      `)
      .single()

    if (error) {
      console.error("[v0] sick-leaves PATCH error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sickLeave: data })
  } catch (error) {
    console.error("[v0] sick-leaves PATCH exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from("sick_leaves")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", String(id))
      .eq("practice_id", String(practiceId))

    if (error) {
      console.error("[v0] sick-leaves DELETE error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] sick-leaves DELETE exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
