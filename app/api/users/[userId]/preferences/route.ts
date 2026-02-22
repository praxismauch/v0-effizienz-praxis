import { createAdminClient } from "@/lib/supabase/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: paramUserId } = await params
    let userId = paramUserId

    // FALLBACK: Extract from URL if params fail
    if (!userId) {
      const urlParts = request.nextUrl.pathname.split("/")
      userId = urlParts[urlParts.indexOf("users") + 1]
    }

    if (!userId || userId === "undefined") {
      console.error("[v0] PREFERENCES 400: Missing userId", { params, url: request.nextUrl.pathname })
      return NextResponse.json({ error: "Missing userId", preferences: null }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        console.warn("[v0] Preferences: Rate limited creating admin client, returning defaults")
      } else {
        console.error("[v0] Preferences: Error creating Supabase admin client:", clientError)
      }
      return NextResponse.json(
        {
          preferences: {
            theme: "light",
            language: "de",
            notifications: true,
            collapsedSidebar: false,
          },
        },
        { status: 200 },
      )
    }

    try {
      const result = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle()

      const { data, error } = result

      if (error) {
        if (isRateLimitError(error)) {
          console.warn("[v0] Preferences: Rate limited, returning defaults")
        } else {
          console.error("[v0] Preferences: Error fetching from DB:", error)
        }
        return NextResponse.json(
          {
            preferences: {
              theme: "light",
              language: "de",
              notifications: true,
              collapsedSidebar: false,
            },
          },
          { status: 200 },
        )
      }

      return NextResponse.json(
        {
          preferences: data || {
            theme: "light",
            language: "de",
            notifications: true,
            collapsedSidebar: false,
          },
        },
        { status: 200 },
      )
    } catch (queryError) {
      if (isRateLimitError(queryError)) {
        console.warn("[v0] Preferences: Rate limited on query, returning defaults")
      } else {
        console.error("[v0] Preferences: Network error fetching from DB:", queryError)
      }
      return NextResponse.json(
        {
          preferences: {
            theme: "light",
            language: "de",
            notifications: true,
            collapsedSidebar: false,
          },
        },
        { status: 200 },
      )
    }
  } catch (error) {
    if (isRateLimitError(error)) {
      console.warn("[v0] Preferences: Rate limit in outer catch, returning defaults")
    } else {
      console.error("[v0] Preferences: Unexpected error in GET:", error)
    }
    return NextResponse.json(
      {
        preferences: {
          theme: "light",
          language: "de",
          notifications: true,
          collapsedSidebar: false,
        },
      },
      { status: 200 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    if (!userId) {
      console.error("Missing userId parameter")
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      console.error("Error creating Supabase admin client:", clientError)
      return NextResponse.json(
        {
          error: "Database connection failed",
        },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { preferred_language, default_landing_page, dashboard_layout } = body

    // Validate language code if provided
    if (preferred_language) {
      const validLanguages = ["en", "de", "es", "fr"]
      if (!validLanguages.includes(preferred_language)) {
        return NextResponse.json({ error: "Invalid language code" }, { status: 400 })
      }

      try {
        const { error: userError } = await supabase.from("users").update({ preferred_language }).eq("id", userId)

        if (userError) {
          console.error("Error updating user language:", userError)
          return NextResponse.json({ error: userError.message }, { status: 500 })
        }
      } catch (updateError) {
        console.error("Network error updating user language:", updateError)
        return NextResponse.json({ error: "Network error updating language" }, { status: 503 })
      }
    }

    if (default_landing_page || dashboard_layout) {
      const now = new Date().toISOString()
      const updateData: any = {
        user_id: userId,
        updated_at: now,
      }

      if (default_landing_page) updateData.default_landing_page = default_landing_page
      if (dashboard_layout) updateData.dashboard_layout = dashboard_layout

      try {
        const { data: existingRecord, error: checkError } = await supabase
          .from("user_preferences")
          .select("id, user_id")
          .eq("user_id", userId)
          .maybeSingle()

        if (checkError) {
          console.error("Error checking existing preferences:", checkError)
        }

        const { data, error } = await supabase
          .from("user_preferences")
          .upsert(updateData, {
            onConflict: "user_id",
          })
          .select()
          .single()

        if (error) {
          console.error("Error upserting user preferences:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ preferences: data }, { status: 200 })
      } catch (upsertError) {
        console.error("Network error upserting preferences:", upsertError)
        return NextResponse.json({ error: "Network error updating preferences" }, { status: 503 })
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Unexpected error in PUT /api/users/[userId]/preferences:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update preferences",
      },
      { status: 500 },
    )
  }
}
