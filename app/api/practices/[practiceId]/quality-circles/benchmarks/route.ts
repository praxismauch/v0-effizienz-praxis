import { NextResponse, type NextRequest } from "next/server"
import { requirePracticeAccess, getEffectivePracticeId } from "@/lib/auth-utils"

// GET - Fetch all quality benchmarks
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const { data, error } = await supabase
      .from("quality_benchmarks")
      .select("*")
      .order("category")

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Error fetching quality benchmarks:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: "Failed to fetch benchmarks" }, { status: 500 })
  }
}
