import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

export async function GET(req: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { searchParams } = new URL(req.url)

  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const filter = searchParams.get("filter") || "all" // all, default, greeting, faq
  const search = searchParams.get("search") || ""
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""

  const offset = (page - 1) * limit

  try {
    let query = supabase
      .from("landing_chat_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    // Apply filters
    if (filter === "default") {
      query = query.eq("is_default_response", true)
    } else if (filter === "greeting") {
      query = query.eq("is_greeting", true)
    } else if (filter === "faq") {
      query = query.eq("is_default_response", false).eq("is_greeting", false)
    }

    // Search in question
    if (search) {
      query = query.ilike("question", `%${search}%`)
    }

    // Date range
    if (from) {
      query = query.gte("created_at", from)
    }
    if (to) {
      query = query.lte("created_at", to)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error("[v0] Chat logs fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get statistics
    const { data: stats } = await supabase.rpc("get_chat_log_stats").single()

    // If RPC doesn't exist, calculate manually
    let statistics = stats
    if (!stats) {
      const { count: totalCount } = await supabase.from("landing_chat_logs").select("*", { count: "exact", head: true })

      const { count: defaultCount } = await supabase
        .from("landing_chat_logs")
        .select("*", { count: "exact", head: true })
        .eq("is_default_response", true)

      const { count: greetingCount } = await supabase
        .from("landing_chat_logs")
        .select("*", { count: "exact", head: true })
        .eq("is_greeting", true)

      const { data: faqStats } = await supabase
        .from("landing_chat_logs")
        .select("matched_faq_key")
        .not("matched_faq_key", "is", null)
        .not("matched_faq_key", "eq", "greeting")

      // Count FAQ usage
      const faqUsage: Record<string, number> = {}
      faqStats?.forEach((log) => {
        if (log.matched_faq_key) {
          faqUsage[log.matched_faq_key] = (faqUsage[log.matched_faq_key] || 0) + 1
        }
      })

      statistics = {
        total: totalCount || 0,
        default_responses: defaultCount || 0,
        greetings: greetingCount || 0,
        faq_matches: (totalCount || 0) - (defaultCount || 0) - (greetingCount || 0),
        faq_usage: faqUsage,
      }
    }

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics,
    })
  } catch (error) {
    console.error("[v0] Chat logs error:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}

// Delete logs (for cleanup)
export async function DELETE(req: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { searchParams } = new URL(req.url)

  const id = searchParams.get("id")
  const olderThan = searchParams.get("olderThan") // days

  try {
    if (id) {
      // Delete single log
      const { error } = await supabase.from("landing_chat_logs").delete().eq("id", id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (olderThan) {
      // Delete logs older than X days
      const days = Number.parseInt(olderThan)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const { error, count } = await supabase
        .from("landing_chat_logs")
        .delete()
        .lt("created_at", cutoffDate.toISOString())

      if (error) throw error
      return NextResponse.json({ success: true, deleted: count })
    }

    return NextResponse.json({ error: "No deletion criteria provided" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Chat logs delete error:", error)
    return NextResponse.json({ error: "Failed to delete logs" }, { status: 500 })
  }
}
