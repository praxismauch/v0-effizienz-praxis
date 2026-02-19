import { getApiClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; certificationId: string }> }
) {
  try {
    const { practiceId, certificationId } = await params
    const body = await request.json()

    const supabase = await getApiClient()

    // Map client field names to actual DB column names
    const fieldMap: Record<string, string> = {
      name: "name",
      description: "description",
      category: "category",
      issuing_authority: "issuing_authority",
      validity_months: "validity_months",
      is_mandatory: "is_mandatory",
      icon: "icon",
      color: "color",
      team_id: "team_id",
      required_for: "required_for",
      // Client sends reminder_days_before, DB column is renewal_reminder_days
      reminder_days_before: "renewal_reminder_days",
      renewal_reminder_days: "renewal_reminder_days",
    }

    const updateData: Record<string, unknown> = {}
    for (const [clientField, dbField] of Object.entries(fieldMap)) {
      if (body[clientField] !== undefined) {
        updateData[dbField] = body[clientField]
      }
    }

    updateData.updated_at = new Date().toISOString()

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

    const supabase = await getApiClient()

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
