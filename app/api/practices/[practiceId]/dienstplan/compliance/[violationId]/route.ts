import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; violationId: string }> },
) {
  try {
    const { practiceId, violationId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: violation, error } = await supabase
      .from("compliance_violations")
      .update({
        resolved: body.resolved,
        resolved_at: body.resolved ? new Date().toISOString() : null,
        resolved_by: body.resolved ? user?.id : null,
      })
      .eq("id", violationId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ violation })
  } catch (error) {
    console.error("Error updating violation:", error)
    return NextResponse.json({ error: "Failed to update violation" }, { status: 500 })
  }
}
