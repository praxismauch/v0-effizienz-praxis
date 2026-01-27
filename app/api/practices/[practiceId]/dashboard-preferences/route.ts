import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has access to this practice
    if (user.id !== userId) {
      return NextResponse.json({ error: "Forbidden - can only fetch own preferences" }, { status: 403 })
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
      console.error("Error fetching dashboard preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return config if found, otherwise null (client will use defaults)
    return NextResponse.json({
      config: data?.config || null,
      updatedAt: data?.updated_at || null,
    })
  } catch (error) {
    console.error("Error in GET dashboard-preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Update dashboard preferences
export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { config } = body

    if (!config) {
      return NextResponse.json({ error: "config is required in request body" }, { status: 400 })
    }

    const supabaseAdmin = await createAdminClient()

    // Upsert dashboard preferences
    const { data, error } = await supabaseAdmin
      .from("dashboard_preferences")
      .upsert(
        {
          practice_id: practiceId,
          user_id: user.id,
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
      console.error("Error saving dashboard preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ config: data })
  } catch (error) {
    console.error("Error in POST dashboard-preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
