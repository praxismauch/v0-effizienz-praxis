import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; certificationId: string }> }
) {
  try {
    const { practiceId, certificationId } = await params
    const body = await request.json()

    const supabase = await createAdminClient()

    const allowedFields = [
      "name", "description", "issuing_body", "category",
      "validity_months", "reminder_days", "is_mandatory"
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from("certifications")
      .update(updateData)
      .eq("id", certificationId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating certification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ certification: data })
  } catch (error) {
    console.error("Error in certification PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; certificationId: string }> }
) {
  try {
    const { practiceId, certificationId } = await params

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("certifications")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", certificationId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("Error deleting certification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in certification DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
