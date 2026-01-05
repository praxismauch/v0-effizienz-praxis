import { NextResponse } from "next/server"
import { createAdminClient, isUsingMockAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    if (isUsingMockAdminClient()) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const logEntry = await request.json()

    if (!logEntry.level || !logEntry.message) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    try {
      await supabase.from("system_logs").insert({
        level: logEntry.level,
        category: logEntry.category || "other",
        message: logEntry.message,
        details: logEntry.details || null,
        user_id: logEntry.userId || null,
        practice_id: logEntry.practiceId || null,
        request_id: logEntry.requestId || null,
        url: logEntry.url || null,
        method: logEntry.method || null,
        stack_trace: logEntry.stackTrace || null,
        timestamp: logEntry.timestamp || new Date().toISOString(),
      })
    } catch {
      // Silent fail - do nothing
    }

    return NextResponse.json({ success: true })
  } catch {
    // Silent fail - always return success
    return NextResponse.json({ success: true }, { status: 200 })
  }
}

export async function GET(request: Request) {
  try {
    if (isUsingMockAdminClient()) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const supabase = await createAdminClient()

    try {
      let query = supabase.from("system_logs").select("*").order("timestamp", { ascending: false }).limit(limit)

      if (level) {
        if (level.includes(",")) {
          query = query.in("level", level.split(","))
        } else {
          query = query.eq("level", level)
        }
      }

      if (category) {
        if (category.includes(",")) {
          query = query.in("category", category.split(","))
        } else {
          query = query.eq("category", category)
        }
      }

      const { data, error } = await query

      if (error) {
        return NextResponse.json([])
      }

      return NextResponse.json(data || [])
    } catch {
      return NextResponse.json([])
    }
  } catch {
    return NextResponse.json([])
  }
}

export async function DELETE() {
  try {
    if (isUsingMockAdminClient()) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const supabase = await createAdminClient()

    try {
      const { error } = await supabase.from("system_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000")

      if (error) {
        return NextResponse.json({ error: "Failed to delete logs" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ success: true }, { status: 200 })
    }
  } catch {
    return NextResponse.json({ success: true }, { status: 200 })
  }
}
