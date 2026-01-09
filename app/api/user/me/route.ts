import { createServerClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("[v0] /api/user/me: Request started")

  try {
    const supabase = await createServerClient()

    const { data, error: authError } = await supabase.auth.getUser()

    if (authError || !data?.user) {
      console.log("[v0] /api/user/me: Auth failed:", authError?.message)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const authUser = data.user
    console.log("[v0] /api/user/me: Auth successful, user ID:", authUser.id)

    const adminClient = await createAdminClient()
    const { data: userData, error: dbError } = await adminClient
      .from("users")
      .select(
        "id, name, email, role, practice_id, avatar, phone, specialization, preferred_language, is_active, last_login, created_at, updated_at, default_practice_id",
      )
      .eq("id", String(authUser.id))
      .maybeSingle()

    if (dbError) {
      console.error("[v0] /api/user/me: Database error:", dbError)
      return NextResponse.json({ error: "Failed to fetch user data", details: dbError.message }, { status: 500 })
    }

    if (!userData) {
      console.log("[v0] /api/user/me: User not found, auto-provisioning:", authUser.id)

      const emailName = authUser.email?.split("@")[0] || "User"
      const displayName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        emailName.charAt(0).toUpperCase() + emailName.slice(1)

      const newUser = {
        id: authUser.id,
        name: displayName,
        email: authUser.email || "",
        role: "receptionist",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        approval_status: "pending",
      }

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
          { error: "Failed to create user profile", details: insertError.message },
          { status: 500 },
        )
      }

      console.log("[v0] /api/user/me: User auto-provisioned successfully")
      const user = {
        id: insertedUser.id,
        name: insertedUser.name || "",
        email: insertedUser.email || authUser.email || "",
        role: insertedUser.role || "receptionist",
        avatar: insertedUser.avatar,
        practiceId: insertedUser.practice_id,
        practice_id: insertedUser.practice_id,
        isActive: insertedUser.is_active !== false,
        joinedAt: insertedUser.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        preferred_language: insertedUser.preferred_language,
        defaultPracticeId: insertedUser.default_practice_id,
      }

      return NextResponse.json({ user })
    }

    const user = {
      id: userData.id,
      name: userData.name || "",
      email: userData.email || authUser.email || "",
      role: userData.role || "receptionist",
      avatar: userData.avatar,
      practiceId: userData.practice_id,
      practice_id: userData.practice_id,
      isActive: userData.is_active !== false,
      joinedAt: userData.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      preferred_language: userData.preferred_language,
      defaultPracticeId: userData.default_practice_id,
    }

    console.log("[v0] /api/user/me: Returning user:", { id: user.id, email: user.email, role: user.role })
    return NextResponse.json({ user })
  } catch (error) {
    console.error("[v0] /api/user/me: Unexpected error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 })
  }
}
