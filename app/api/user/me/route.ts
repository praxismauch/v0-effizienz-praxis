import { createServerClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data, error: authError } = await supabase.auth.getUser()

    if (authError || !data?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const authUser = data.user
    const adminClient = await createAdminClient()

    const { data: userData, error: dbError } = await adminClient
      .from("users")
      .select(
        "id, name, email, role, practice_id, avatar, phone, specialization, preferred_language, is_active, last_login, created_at, updated_at, default_practice_id",
      )
      .eq("id", authUser.id)
      .maybeSingle()

    if (dbError) {
      console.error("[v0] /api/user/me: Database error:", dbError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    if (!userData) {
      const emailName = authUser.email?.split("@")[0] || "User"
      const displayName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || emailName

      const { data: insertedUser, error: insertError } = await adminClient
        .from("users")
        .insert({
          id: authUser.id,
          name: displayName,
          email: authUser.email || "",
          role: "receptionist",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id, name, email, role, practice_id, avatar, is_active, created_at, default_practice_id")
        .single()

      if (insertError) {
        console.error("[v0] /api/user/me: Failed to create user:", insertError)
        return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
      }

      return NextResponse.json({
        user: {
          id: insertedUser.id,
          name: insertedUser.name || "",
          email: insertedUser.email || authUser.email || "",
          role: insertedUser.role || "receptionist",
          avatar: insertedUser.avatar,
          practiceId: insertedUser.practice_id,
          practice_id: insertedUser.practice_id,
          isActive: insertedUser.is_active !== false,
          defaultPracticeId: insertedUser.default_practice_id,
        },
      })
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name || "",
        email: userData.email || authUser.email || "",
        role: userData.role || "receptionist",
        avatar: userData.avatar,
        practiceId: userData.practice_id,
        practice_id: userData.practice_id,
        isActive: userData.is_active !== false,
        defaultPracticeId: userData.default_practice_id,
      },
    })
  } catch (error) {
    console.error("[v0] /api/user/me: Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
