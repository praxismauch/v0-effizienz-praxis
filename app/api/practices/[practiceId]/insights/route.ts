import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

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

    // Check if requesting action-items only
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (type === "action-items") {
      // Get the latest journal with its action items
      const { data: journal } = await adminClient
        .from("practice_journals")
        .select("id, title")
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!journal) {
        return NextResponse.json({ actionItems: [], journalTitle: "" })
      }

      const { data: items, error: itemsError } = await adminClient
        .from("journal_action_items")
        .select("*")
        .eq("journal_id", journal.id)
        .is("deleted_at", null)
        .in("status", ["pending", "in_progress"])
        .order("priority", { ascending: false })
        .limit(5)

      if (itemsError) {
        console.error("[v0] Error fetching action items:", itemsError)
        return NextResponse.json({ actionItems: [], journalTitle: journal.title })
      }

      return NextResponse.json({
        actionItems: items || [],
        journalTitle: journal.title || "",
      })
    }

    // Fetch journals
    const { data: journalsData, error: journalsError } = await adminClient
      .from("practice_journals")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("period_start", { ascending: false })

    if (journalsError) throw journalsError

    // Fetch preferences - try with practice_id, fall back if column doesn't exist
    let prefsData = null
    const prefsResult = await adminClient
      .from("journal_preferences")
      .select("*")
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (prefsResult.error?.code === "42703" || prefsResult.error?.message?.includes("does not exist")) {
      // Column doesn't exist, try fetching by user_id or just skip
      const prefsFallback = await adminClient
        .from("journal_preferences")
        .select("*")
        .maybeSingle()

      if (prefsFallback.error && prefsFallback.error.code !== "42P01" && prefsFallback.error.code !== "PGRST205") {
        console.error("[v0] journal_preferences fallback error:", prefsFallback.error)
      }
      prefsData = prefsFallback.data
    } else if (prefsResult.error) {
      if (prefsResult.error.code !== "42P01" && prefsResult.error.code !== "PGRST205") {
        throw prefsResult.error
      }
    } else {
      prefsData = prefsResult.data
    }

    // Fetch action items for the latest journal
    let actionItems: any[] = []
    if (journalsData && journalsData.length > 0) {
      const { data: actionsData, error: actionsError } = await adminClient
        .from("journal_action_items")
        .select("*")
        .eq("journal_id", journalsData[0].id)
        .is("deleted_at", null)
        .order("priority", { ascending: false })

      if (actionsError) throw actionsError
      actionItems = actionsData || []
    }

    // Fetch KPI count
    const { count, error: kpiError } = await adminClient
      .from("analytics_parameters")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    if (kpiError) throw kpiError

    return NextResponse.json({
      journals: journalsData || [],
      preferences: prefsData,
      actionItems,
      kpiCount: count || 0,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching practice insights:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch practice insights" },
      { status: 500 }
    )
  }
}
