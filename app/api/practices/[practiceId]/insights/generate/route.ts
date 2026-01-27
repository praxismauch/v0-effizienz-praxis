import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

// POST - Generate insights/journal
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Create journal entry
    const { data: journal, error: journalError } = await adminClient
      .from("practice_journals")
      .insert({
        practice_id: practiceId,
        period_type: body.period_type,
        period_start: body.period_start,
        period_end: body.period_end,
        focus_area: body.focus_area,
        additional_context: body.additional_context,
        self_check_data: body.self_check_data,
        status: "generating",
        created_by: user.id,
      })
      .select()
      .single()

    if (journalError) throw journalError

    return NextResponse.json({ journal })
  } catch (error: any) {
    console.error("[v0] Error generating insights:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: error.message || "Failed to generate insights" }, { status: 500 })
  }
}

// GET - Check for existing journal in period
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodStart = searchParams.get("period_start")
    const periodEnd = searchParams.get("period_end")

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: "period_start and period_end required" }, { status: 400 })
    }

    const { data: existing } = await adminClient
      .from("practice_journals")
      .select("id, period_type, period_start, period_end")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .gte("period_start", periodStart)
      .lte("period_end", periodEnd)
      .maybeSingle()

    return NextResponse.json({ existing })
  } catch (error: any) {
    console.error("[v0] Error checking existing journal:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: error.message || "Failed to check existing journal" }, { status: 500 })
  }
}
