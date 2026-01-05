import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify super admin authorization
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || !isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body

    const adminClient = await createAdminClient()

    if (role) {
      // Reset only specific role permissions
      const { error } = await adminClient.from("role_permissions").delete().eq("role", role)

      if (error) {
        console.error("Error resetting role permissions:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Berechtigungen für Rolle "${role}" zurückgesetzt`,
      })
    } else {
      // Reset all permissions
      const { error } = await adminClient
        .from("role_permissions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all

      if (error) {
        console.error("Error resetting all permissions:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Alle Berechtigungen zurückgesetzt",
      })
    }
  } catch (error) {
    console.error("POST /api/super-admin/permissions/reset error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interner Serverfehler" },
      { status: 500 },
    )
  }
}
