import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const [pendingResult, superAdminsResult, allUsersResult] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "super_admin"),
      supabase.from("users").select("id", { count: "exact", head: true }),
    ])

    console.log("[v0] User counts API - Pending result:", {
      count: pendingResult.count,
      error: pendingResult.error,
    })
    console.log("[v0] User counts API - Super admins:", superAdminsResult.count)
    console.log("[v0] User counts API - Total users:", allUsersResult.count)

    return NextResponse.json({
      pending: pendingResult.count || 0,
      superAdmins: superAdminsResult.count || 0,
      total: allUsersResult.count || 0,
    })
  } catch (error) {
    console.error("Error fetching user counts:", error)
    return NextResponse.json({ error: "Failed to fetch user counts" }, { status: 500 })
  }
}
