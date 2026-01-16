import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizeRole } from "@/lib/auth-utils"

const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV !== "production"

export const dynamic = "force-dynamic"

/**
 * Dev-only API endpoint to fetch user by email using admin client (bypasses RLS)
 * Only works when NEXT_PUBLIC_DEV_AUTO_LOGIN=true AND NODE_ENV !== "production"
 */
export async function GET(request: Request) {
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Dev mode not enabled" }, { status: 403 })
  }

  const devUserEmail = process.env.NEXT_PUBLIC_DEV_USER_EMAIL

  if (!devUserEmail) {
    console.error("[dev-user API] NEXT_PUBLIC_DEV_USER_EMAIL not configured")
    return NextResponse.json({ error: "Dev user not configured" }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email") || devUserEmail

    if (email !== devUserEmail) {
      return NextResponse.json({ error: "Invalid dev user email" }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: profile, error: profileError } = await adminClient
      .from("users")
      .select(
        "id, name, email, role, avatar, practice_id, is_active, created_at, preferred_language, first_name, last_name",
      )
      .eq("email", email)
      .single()

    if (profileError || !profile) {
      console.warn("[dev-user API] User not found for email:", email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = {
      id: profile.id,
      name: profile.name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Dev User",
      email: profile.email || email,
      role: normalizeRole(profile.role),
      avatar: profile.avatar,
      practice_id: profile.practice_id?.toString() || "1",
      practiceId: profile.practice_id?.toString() || "1",
      is_active: profile.is_active ?? true,
      created_at: profile.created_at || new Date().toISOString(),
      preferred_language: profile.preferred_language,
      first_name: profile.first_name,
      last_name: profile.last_name,
    }

    console.log("[dev-user API] Successfully fetched dev user:", user.email)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[dev-user API] Error fetching dev user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
