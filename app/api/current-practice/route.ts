import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import Logger from "@/lib/logger"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Logger.error("current-practice-api", "Not authenticated", { error: authError?.message })
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email, role, practice_id")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      Logger.error("current-practice-api", "Error fetching user profile", {
        userId: user.id,
        error: profileError.message,
      })
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    if (!userProfile) {
      Logger.error("current-practice-api", "User profile not found", { userId: user.id })
      return NextResponse.json({ error: "User profile not found" }, { status: 400 })
    }

    if (!userProfile.practice_id) {
      Logger.warn("current-practice-api", "No practice assigned to user", { userId: user.id })
      return NextResponse.json({ error: "No practice assigned" }, { status: 400 })
    }

    return NextResponse.json({
      user: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
      },
      practiceId: userProfile.practice_id,
    })
  } catch (error) {
    Logger.error("current-practice-api", "Error fetching current practice", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: "Failed to fetch current practice" }, { status: 500 })
  }
}
