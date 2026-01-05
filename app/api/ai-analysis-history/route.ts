import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const practiceId = searchParams.get("practiceId")

    if (!userId) {
      console.error("[v0] AI Analysis History - Missing userId")
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    let userData = null
    let retries = 3
    let lastError: unknown = null

    while (retries > 0 && !userData) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, practice_id, default_practice_id, role")
          .eq("id", userId)
          .single()

        if (error) {
          lastError = error
          const errorMessage = error.message || String(error)

          if (errorMessage.includes("Too Many") || errorMessage.includes("rate") || error.code === "429") {
            console.warn("[v0] AI Analysis History - Rate limited, retrying...", { retries })
            retries--
            await new Promise((resolve) => setTimeout(resolve, 1000))
            continue
          }

          console.error("[v0] AI Analysis History - User query error:", error)
          break
        }

        userData = data
      } catch (queryError) {
        lastError = queryError
        const errorStr = String(queryError)

        if (queryError instanceof SyntaxError || errorStr.includes("Too Many") || errorStr.includes("SyntaxError")) {
          console.warn("[v0] AI Analysis History - Rate limited (parse error), retrying...", {
            retries,
            error: errorStr,
          })
          retries--
          await new Promise((resolve) => setTimeout(resolve, 1500)) // Longer wait for rate limits
          continue
        }

        console.error("[v0] AI Analysis History - Query exception:", queryError)
        break
      }
    }

    if (!userData) {
      const errorStr = String(lastError)

      if (
        lastError instanceof SyntaxError ||
        errorStr.includes("Too Many") ||
        errorStr.includes("rate") ||
        errorStr.includes("SyntaxError")
      ) {
        console.warn("[v0] AI Analysis History - Rate limited, returning empty analyses")
        return NextResponse.json({ analyses: [], rateLimited: true }, { status: 200 })
      }

      console.error("[v0] AI Analysis History - User not found:", lastError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isSuperAdmin = userData?.role === "superadmin"
    const userPracticeId = userData?.practice_id || userData?.default_practice_id

    let query = supabase.from("ai_analysis_history").select("*").eq("user_id", userId)

    if (practiceId) {
      query = query.eq("practice_id", practiceId)
    } else if (userPracticeId && !isSuperAdmin) {
      query = query.eq("practice_id", userPracticeId)
    }

    try {
      const { data: analyses, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] AI Analysis History - Database error:", error)
        return NextResponse.json({ analyses: [] }, { status: 200 })
      }

      return NextResponse.json({ analyses: analyses || [] })
    } catch (queryError) {
      console.warn("[v0] AI Analysis History - Analysis query failed:", queryError)
      return NextResponse.json({ analyses: [] }, { status: 200 })
    }
  } catch (error) {
    console.error("[v0] Error fetching AI analyses:", error)
    return NextResponse.json({ analyses: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const body = await request.json()

    if (!body.user_id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id, practice_id, default_practice_id, role")
      .eq("id", body.user_id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isSuperAdmin = userData?.role === "superadmin"
    const userPracticeId = userData?.practice_id || userData?.default_practice_id

    if (!isSuperAdmin && userPracticeId !== body.practice_id) {
      console.error(
        "[v0] AI Analysis History - SECURITY VIOLATION: User attempting to save analysis for different practice",
      )
      return NextResponse.json({ error: "Forbidden - Access denied" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("ai_analysis_history")
      .insert({
        practice_id: body.practice_id,
        user_id: body.user_id,
        analysis_type: body.analysis_type,
        title: body.title,
        summary: body.summary,
        full_analysis: body.full_analysis,
        metadata: body.metadata || {},
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ analysis: data })
  } catch (error) {
    console.error("[v0] Error creating AI analysis:", error)
    return NextResponse.json({ error: "Failed to create AI analysis" }, { status: 500 })
  }
}
