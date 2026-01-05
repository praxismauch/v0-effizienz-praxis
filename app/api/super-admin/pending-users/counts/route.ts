import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Get counts for each status
    const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("approval_status", "approved"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("approval_status", "rejected"),
    ])

    console.log("[v0] Pending users counts API - Pending:", {
      count: pendingResult.count,
      error: pendingResult.error,
    })
    console.log("[v0] Pending users counts API - Approved:", {
      count: approvedResult.count,
      error: approvedResult.error,
    })
    console.log("[v0] Pending users counts API - Rejected:", {
      count: rejectedResult.count,
      error: rejectedResult.error,
    })

    return NextResponse.json({
      counts: {
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching user counts:", error)
    return NextResponse.json({ error: "Failed to fetch user counts" }, { status: 500 })
  }
}
