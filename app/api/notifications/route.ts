/**
 * ✅ PRESERVES 100% EXISTING BUSINESS LOGIC
 * Cached notifications endpoint - wraps existing logic with Redis
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getNotifications } from "@/lib/db/queries"
import { getCached, setCached, cacheKeys, cacheTTL } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // ✅ PRESERVED: Same auth logic
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const cacheKey = `${cacheKeys.notifications(user.id)}:${limit}:${unreadOnly}`
    const cached = await getCached<any[]>(cacheKey)

    if (cached) {
      return NextResponse.json(cached)
    }

    // ✅ PRESERVED: Same query logic
    const { data, error } = await getNotifications(user.id, { limit, unreadOnly })

    if (error && error.code !== "RATE_LIMITED") {
      return NextResponse.json([])
    }

    const result = data || []
    await setCached(cacheKey, result, cacheTTL.notifications)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof SyntaxError && error.message.includes("JSON.parse")) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ✅ PRESERVED: POST logic unchanged
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, type, link, user_id, practice_id, metadata } = body

    if (!title || !message || !type) {
      return NextResponse.json({ error: "Missing required fields: title, message, type" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: user_id || user.id,
        practice_id,
        title,
        message,
        type,
        link,
        metadata,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
