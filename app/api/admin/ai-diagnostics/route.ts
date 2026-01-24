import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { checkAIDiagnostics, testAIConnection } from "@/lib/ai-diagnostics"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData } = await supabase.from("users").select("role, practice_id").eq("id", user.id).single()

    if (userData?.role !== "super_admin" && userData?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    // Run diagnostics
    const diagnostics = await checkAIDiagnostics(userData.practice_id, user.id)

    // Test AI connection with Claude model
    const connectionTests = await Promise.allSettled([
      testAIConnection("anthropic/claude-sonnet-4-20250514"),
    ])

    return NextResponse.json({
      diagnostics,
      connectionTests: connectionTests.map((result) => (result.status === "fulfilled" ? result.value : { error: result.reason })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] AI Diagnostics error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
