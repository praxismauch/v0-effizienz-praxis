import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch dashboard preferences for a user in a practice
export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 })
    }

    const supabaseAdmin = await createAdminClient()

    // Fetch dashboard preferences from database
    const { data, error } = await supabaseAdmin
      .from("dashboard_preferences")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching dashboard preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return config if found, otherwise null (client will use defaults)
    return NextResponse.json({
      config: data?.config || null,
      updatedAt: data?.updated_at || null,
    })
  } catch (error) {
    console.error("[v0] Error in GET dashboard-preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Update dashboard preferences
export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { config, userId: bodyUserId } = body

    if (!config) {
      return NextResponse.json({ error: "config is required in request body" }, { status: 400 })
    }

    // Try to get the authenticated user, fall back to userId from body
    let resolvedUserId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      resolvedUserId = user?.id || null
    } catch {
      // Auth not available
    }

    // Fall back to userId sent in body
    if (!resolvedUserId && bodyUserId) {
      resolvedUserId = bodyUserId
    }

    if (!resolvedUserId) {
      return NextResponse.json({ error: "No userId available (not authenticated and no userId in body)" }, { status: 401 })
    }

    const supabaseAdmin = await createAdminClient()

    // Upsert dashboard preferences
    const { data, error } = await supabaseAdmin
      .from("dashboard_preferences")
      .upsert(
        {
          practice_id: practiceId,
          user_id: resolvedUserId,
          config: config,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "practice_id,user_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving dashboard preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ config: data?.config || config, success: true })
  } catch (error) {
    console.error("[v0] Error in POST dashboard-preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
