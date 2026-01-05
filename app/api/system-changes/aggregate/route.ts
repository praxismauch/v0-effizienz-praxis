import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { start_date, end_date } = await request.json()

    // Fetch unaggregated changes in date range
    let query = supabase
      .from("system_changes")
      .select("*")
      .eq("is_aggregated", false)
      .eq("is_user_facing", true)
      .order("created_at", { ascending: false })

    if (start_date) {
      query = query.gte("created_at", start_date)
    }
    if (end_date) {
      query = query.lte("created_at", end_date)
    }

    const { data: changes, error: fetchError } = await query

    if (fetchError) {
      console.error("[v0] Fetch changes error:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!changes || changes.length === 0) {
      return NextResponse.json({
        message: "No unaggregated changes found",
        changes: [],
        summary: "",
      })
    }

    // Group changes by type
    const groupedChanges = changes.reduce((acc: any, change: any) => {
      const type = change.change_type
      if (!acc[type]) acc[type] = []
      acc[type].push(change)
      return acc
    }, {})

    // Create a summary for AI generation
    const summary = Object.entries(groupedChanges)
      .map(([type, items]: [string, any]) => {
        return `${type.toUpperCase()} (${items.length}):\n${items.map((item: any) => `- ${item.title}`).join("\n")}`
      })
      .join("\n\n")

    return NextResponse.json({
      message: "Changes aggregated",
      changes,
      grouped: groupedChanges,
      summary,
      count: changes.length,
    })
  } catch (error) {
    console.error("[v0] Aggregate API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
