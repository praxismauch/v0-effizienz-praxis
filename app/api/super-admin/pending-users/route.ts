export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

    const supabase = await createAdminClient()

    // Fetch users based on approval status
    console.log(`[v0] Fetching users with status: ${status}`)

    const { data: users, error } = await supabase
      .from("users")
      .select(
        "id, name, email, created_at, practice_id, role, approval_status, approved_at, approved_by, rejected_at, rejected_by, is_active",
      )
      .eq("approval_status", status)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching users by status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[v0] Fetched ${users?.length || 0} users with status: ${status}`)

    if (users && users.length > 0) {
      users.forEach((user) => {
        console.log(
          `[v0] User: ${user.name} (${user.email}) - status: ${user.approval_status}, is_active: ${user.is_active}`,
        )
      })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error("[v0] Error in GET /api/super-admin/pending-users:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch users" },
      { status: 500 },
    )
  }
}
