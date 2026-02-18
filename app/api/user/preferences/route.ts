import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required", preferences: { ai_disclaimer_accepted: false } },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    let data, error
    try {
      const supabase = await createAdminClient()
      const result = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle()
      data = result.data
      error = result.error
    } catch (queryError: any) {
      const errorMessage = queryError?.message || String(queryError)
      if (errorMessage.includes("Too Many") || errorMessage.includes("rate limit")) {
        console.error("User preferences rate limit hit, using fallback")
      } else {
        console.error("Error fetching user preferences:", errorMessage.substring(0, 100))
      }
      return NextResponse.json(
        { preferences: { ai_disclaimer_accepted: false } },
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    if (error) {
      console.error("Error fetching user preferences:", error.message || "Unknown error")
      return NextResponse.json(
        { preferences: { ai_disclaimer_accepted: false } },
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    const preferences = data || { ai_disclaimer_accepted: false }

    return NextResponse.json(
      { preferences },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Unexpected error in user preferences:", errorMessage.substring(0, 100))
    return NextResponse.json(
      { preferences: { ai_disclaimer_accepted: false } },
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...preferences } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Error saving user preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/user/preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
