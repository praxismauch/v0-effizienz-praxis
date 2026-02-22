export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

// GET /api/system/role-colors - Get all role colors
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: roleColors, error } = await supabase
      .from("role_colors")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) throw error

    return NextResponse.json(roleColors)
  } catch (error) {
    console.error("[API] Failed to fetch role colors:", error)
    return NextResponse.json({ error: "Failed to fetch role colors" }, { status: 500 })
  }
}

// PUT /api/system/role-colors - Update a role color (super admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("[v0] Role color update - Error fetching user:", userError)
      return NextResponse.json({ error: "Failed to verify user role" }, { status: 500 })
    }

    if (!currentUser || !isSuperAdminRole(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { role, color, label, description } = body

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("role_colors")
      .update({
        color,
        label,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("role", role)
      .select()
      .single()

    if (error) {
      console.error("[v0] Role color update - Database error:", error)
      console.error("[v0] Role color update - Error details:", JSON.stringify(error, null, 2))
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[API] Failed to update role color:", error)
    console.error("[API] Error message:", error?.message)
    console.error("[API] Error details:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        error: "Failed to update role color",
        details: error?.message || "Unknown error",
        code: error?.code,
      },
      { status: 500 },
    )
  }
}
