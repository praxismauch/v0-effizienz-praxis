import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import { requireAuth } from "@/lib/auth/require-auth"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if ("response" in auth) return auth.response

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const practiceId = searchParams.get("practiceId")
    const limit = searchParams.get("limit")

    if (!userId) {
      return NextResponse.json({ analyses: [], error: "User ID required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createServerClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        return NextResponse.json(
          { analyses: [], error: "Service temporarily unavailable" },
          { status: 503 }
        )
      }
      throw clientError
    }

    // Build query
    let query = supabase
      .from("roi_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (practiceId) {
      query = query.eq("practice_id", practiceId)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data, error } = await query

    // If table doesn't exist, return empty array gracefully
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST204" || error.message?.includes("does not exist")) {
        return NextResponse.json({ analyses: [] })
      }
      console.error("[v0] Error fetching AI analyses:", error)
      return NextResponse.json({ analyses: [], error: error.message }, { status: 500 })
    }

    return NextResponse.json({ analyses: data || [] })
  } catch (error: any) {
    console.error("[v0] AI Analysis History API error:", error)
    return NextResponse.json({ analyses: [], error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    let supabase
    try {
      supabase = await createServerClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        return NextResponse.json(
          { error: "Service temporarily unavailable" },
          { status: 503 }
        )
      }
      throw clientError
    }

    const body = await request.json()
    const { user_id, practice_id, analysis_type, title, summary, full_analysis, metadata } = body

    if (!user_id || !analysis_type || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("roi_analyses")
      .insert({
        user_id,
        practice_id,
        analysis_type,
        title,
        summary,
        full_analysis,
        metadata,
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist, log and return gracefully
      if (error.code === "42P01" || error.code === "PGRST204") {
        console.warn("[v0] roi_analyses table does not exist")
        return NextResponse.json({ error: "Analysis history not available" }, { status: 503 })
      }
      console.error("[v0] Error saving AI analysis:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ analysis: data })
  } catch (error: any) {
    console.error("[v0] AI Analysis History POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
