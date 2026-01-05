import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = await createServerClient()
    } catch (error) {
      console.error("[user/me] Supabase configuration error:", error)
      const message = error instanceof Error ? error.message : String(error)
      return NextResponse.json({ error: "Supabase server configuration error", details: message }, { status: 500 })
    }

    // Get the authenticated user from Supabase
    let authUser
    try {
      const { data, error: authError } = await supabase.auth.getUser()

      if (authError || !data?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
      authUser = data.user
    } catch (authErr) {
      const message = authErr instanceof Error ? authErr.message : String(authErr)
      if (message.includes("Too Many") || message.includes("rate")) {
        return NextResponse.json({ error: "Rate limited", retry: true }, { status: 429 })
      }
      return NextResponse.json({ error: "Authentication error", details: message }, { status: 500 })
    }

    // Fetch user data from database
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, name, email, role, practice_id, avatar, phone, specialization, preferred_language, is_active, last_login, created_at, updated_at, default_practice_id",
        )
        .eq("id", String(authUser.id))
        .maybeSingle()

      if (error) {
        const errorMessage = error.message || ""
        if (errorMessage.includes("Too Many") || errorMessage.includes("rate")) {
          console.warn("[user/me] Rate limited by database")
          return NextResponse.json({ error: "Rate limited", retry: true }, { status: 429 })
        }
        console.error("[user/me] Error fetching user from database:", error)
        return NextResponse.json({ error: "Failed to fetch user data", details: error.message }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ error: "User not found in database" }, { status: 404 })
      }

      // Format user data to match User interface
      const user = {
        id: data.id,
        name: data.name || "",
        email: data.email || authUser.email || "",
        role: data.role || "receptionist",
        avatar: data.avatar,
        practiceId: data.practice_id,
        practice_id: data.practice_id,
        isActive: data.is_active !== false,
        joinedAt: data.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        preferred_language: data.preferred_language,
        defaultPracticeId: data.default_practice_id,
      }

      return NextResponse.json({ user })
    } catch (dbErr) {
      const message = dbErr instanceof Error ? dbErr.message : String(dbErr)
      if (message.includes("Too Many") || message.includes("rate")) {
        console.warn("[user/me] Rate limited by database")
        return NextResponse.json({ error: "Rate limited", retry: true }, { status: 429 })
      }
      console.error("[user/me] Database error:", dbErr)
      return NextResponse.json({ error: "Database error", details: message }, { status: 500 })
    }
  } catch (error) {
    console.error("[user/me] Unexpected error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 })
  }
}
