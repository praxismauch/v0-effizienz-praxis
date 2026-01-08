import { createServerClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("[v0] /api/user/me: Request started")

  try {
    let supabase
    try {
      supabase = await createServerClient()
      console.log("[v0] /api/user/me: Supabase client created")
    } catch (error) {
      console.error("[v0] /api/user/me: Supabase configuration error:", error)
      const message = error instanceof Error ? error.message : String(error)
      return NextResponse.json({ error: "Supabase server configuration error", details: message }, { status: 500 })
    }

    // Get the authenticated user from Supabase
    let authUser
    try {
      const { data, error: authError } = await supabase.auth.getUser()

      console.log("[v0] /api/user/me: Auth result:", {
        hasUser: !!data?.user,
        userId: data?.user?.id,
        email: data?.user?.email,
        error: authError?.message,
      })

      if (authError || !data?.user) {
        console.log("[v0] /api/user/me: Auth failed, returning 401")
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
      authUser = data.user
    } catch (authErr) {
      const message = authErr instanceof Error ? authErr.message : String(authErr)
      console.error("[v0] /api/user/me: Auth exception:", message)
      if (message.includes("Too Many") || message.includes("rate")) {
        return NextResponse.json({ error: "Rate limited", retry: true }, { status: 429 })
      }
      return NextResponse.json({ error: "Authentication error", details: message }, { status: 500 })
    }

    // This is safe because we've already authenticated the user above
    try {
      const adminClient = await createAdminClient()
      let { data, error } = await adminClient
        .from("users")
        .select(
          "id, name, email, role, practice_id, avatar, phone, specialization, preferred_language, is_active, last_login, created_at, updated_at, default_practice_id",
        )
        .eq("id", String(authUser.id))
        .maybeSingle()

      console.log("[v0] /api/user/me: User query result:", {
        hasData: !!data,
        error: error?.message,
        authUserId: authUser.id,
        dbUserId: data?.id,
      })

      if (error) {
        const errorMessage = error.message || ""
        if (errorMessage.includes("Too Many") || errorMessage.includes("rate")) {
          console.warn("[v0] /api/user/me: Rate limited by database")
          return NextResponse.json({ error: "Rate limited", retry: true }, { status: 429 })
        }
        console.error("[v0] /api/user/me: Error fetching user from database:", error)
        return NextResponse.json({ error: "Failed to fetch user data", details: error.message }, { status: 500 })
      }

      if (!data) {
        console.log("[v0] /api/user/me: User not found, auto-provisioning:", authUser.id, authUser.email)

        // Extract name from email or use metadata
        const emailName = authUser.email?.split("@")[0] || "User"
        const displayName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          emailName.charAt(0).toUpperCase() + emailName.slice(1)

        // Create new user with auth user's UUID
        const newUser = {
          id: authUser.id,
          name: displayName,
          email: authUser.email || "",
          role: "receptionist", // Default role for new users
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approval_status: "pending", // New users need approval
        }

        console.log("[v0] /api/user/me: Creating user with data:", newUser)

        const { data: insertedUser, error: insertError } = await adminClient
          .from("users")
          .insert(newUser)
          .select(
            "id, name, email, role, practice_id, avatar, phone, specialization, preferred_language, is_active, last_login, created_at, updated_at, default_practice_id",
          )
          .single()

        if (insertError) {
          console.error("[v0] /api/user/me: Failed to auto-provision user:", insertError)
          return NextResponse.json(
            {
              error: "Failed to create user profile",
              details: insertError.message,
            },
            { status: 500 },
          )
        }

        console.log("[v0] /api/user/me: User auto-provisioned successfully:", insertedUser.id)
        data = insertedUser
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

      console.log("[v0] /api/user/me: Returning user:", { id: user.id, email: user.email, role: user.role })
      return NextResponse.json({ user })
    } catch (dbErr) {
      const message = dbErr instanceof Error ? dbErr.message : String(dbErr)
      if (message.includes("Too Many") || message.includes("rate")) {
        console.warn("[v0] /api/user/me: Rate limited by database")
        return NextResponse.json({ error: "Rate limited", retry: true }, { status: 429 })
      }
      console.error("[v0] /api/user/me: Database error:", dbErr)
      return NextResponse.json({ error: "Database error", details: message }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] /api/user/me: Unexpected error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 })
  }
}
