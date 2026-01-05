export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: admins, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "superadmin")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching super admins:", error)
      throw error
    }

    // Transform the data to match the expected format
    const transformedAdmins = admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      practiceId: admin.practice_id,
      isActive: admin.is_active ?? true,
      joinedAt: admin.created_at
        ? new Date(admin.created_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      preferred_language: admin.preferred_language,
      defaultPracticeId: admin.default_practice_id,
    }))

    console.log("[v0] Fetched super admins from database:", transformedAdmins.length)

    return NextResponse.json({ admins: transformedAdmins })
  } catch (error: any) {
    console.error("[v0] Error in GET /api/super-admin/admins:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch super admins" }, { status: 500 })
  }
}
