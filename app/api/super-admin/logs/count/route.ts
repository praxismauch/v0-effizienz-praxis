export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Count unresolved errors (new, acknowledged, investigating) with error or critical level
    const { count, error } = await supabase
      .from("error_logs")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "acknowledged", "investigating"])
      .in("level", ["error", "critical"])

    if (error) {
      console.error("[v0] Error fetching error logs count:", error)
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("[v0] Error in logs count endpoint:", error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}
