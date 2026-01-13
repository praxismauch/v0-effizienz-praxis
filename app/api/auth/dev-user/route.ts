import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizeRole } from "@/lib/auth-utils"

const DEV_USER_EMAIL = "mauch.daniel@googlemail.com"
const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true"

export const dynamic = "force-dynamic"

/**
 * Dev-only API endpoint to fetch user by email using admin client (bypasses RLS)
 * Only works when NEXT_PUBLIC_DEV_AUTO_LOGIN=true
 */
export async function GET(request: Request) {
  // Security check: Only allow in dev mode
  if (!IS_DEV_MODE) {
    return NextResponse.json({ error: "Dev mode not enabled" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email") || DEV_USER_EMAIL

    // Additional security: Only allow the configured dev email
    if (email !== DEV_USER_EMAIL) {
      return NextResponse.json({ error: "Invalid dev user email" }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Use admin client to bypass RLS
    const { data: profile, error: profileError } = await adminClient
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (profileError || !profile) {
      console.warn("[dev-user API] User not found for email:", email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Map to User format
    const user = {
      id: profile.id,
      name: profile.name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Dev User",
      email: profile.email || email,
      role: normalizeRole(profile.role),
      avatar: profile.avatar,
      practiceId: profile.practice_id?.toString() || "1",
      practice_id: profile.practice_id?.toString() || "1",
      isActive: profile.is_active ?? true,
      joinedAt: profile.created_at || new Date().toISOString(),
      preferred_language: profile.preferred_language,
      firstName: profile.first_name,
    }

    console.log("[dev-user API] Successfully fetched dev user:", user.email)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[dev-user API] Error fetching dev user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
