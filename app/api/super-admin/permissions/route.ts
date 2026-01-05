import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

// Role configuration - no hardcoding
const ROLE_CONFIG = {
  superadmin: { label: "Super Admin", color: "bg-red-500", order: 1 },
  practiceadmin: { label: "Praxis Admin", color: "bg-purple-500", order: 2 },
  admin: { label: "Admin", color: "bg-indigo-500", order: 3 },
  manager: { label: "Manager", color: "bg-blue-500", order: 4 },
  member: { label: "Mitglied", color: "bg-green-500", order: 5 },
  viewer: { label: "Betrachter", color: "bg-gray-500", order: 6 },
  extern: { label: "Extern", color: "bg-orange-500", order: 7 },
} as const

// Permission categories - no hardcoding
const PERMISSION_CATEGORIES = [
  "Übersicht",
  "Team & Personal",
  "Planung & Organisation",
  "Daten & Dokumente",
  "Administration",
  "Finanzen & Abrechnung",
  "Marketing",
  "Qualitätsmanagement",
  "Praxismanagement",
  "Infrastruktur",
] as const

// GET /api/super-admin/permissions - Fetch all permissions with statistics
export async function GET(request: NextRequest) {
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

    const adminClient = await createAdminClient()

    // Fetch all permissions from database
    const { data: permissions, error: permError } = await adminClient
      .from("role_permissions")
      .select("*")
      .order("role", { ascending: true })
      .order("permission_category", { ascending: true })
      .order("permission_key", { ascending: true })

    if (permError) {
      // Check if table doesn't exist
      if (permError.code === "42P01") {
        return NextResponse.json({
          permissions: [],
          stats: {
            totalPermissions: 0,
            roles: Object.keys(ROLE_CONFIG).length,
            categories: PERMISSION_CATEGORIES.length,
            customOverrides: 0,
          },
          roleConfig: ROLE_CONFIG,
          categories: PERMISSION_CATEGORIES,
          tableExists: false,
          error:
            "Die Tabelle role_permissions existiert nicht. Bitte führen Sie das SQL-Script 072_create_role_permissions_complete.sql aus.",
        })
      }
      console.error("Error fetching permissions:", permError)
      return NextResponse.json({ error: permError.message }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      totalPermissions: permissions?.length || 0,
      roles: [...new Set(permissions?.map((p) => p.role) || [])].length,
      categories: [...new Set(permissions?.map((p) => p.permission_category) || [])].length,
      customOverrides: 0,
    }

    return NextResponse.json({
      permissions: permissions || [],
      stats,
      roleConfig: ROLE_CONFIG,
      categories: PERMISSION_CATEGORIES,
      tableExists: true,
    })
  } catch (error) {
    console.error("GET /api/super-admin/permissions error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interner Serverfehler" },
      { status: 500 },
    )
  }
}

// POST /api/super-admin/permissions - Create new permission
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
    const { role, permission_key, permission_category, can_view, can_create, can_edit, can_delete } = body

    // Validate required fields
    if (!role || !permission_key || !permission_category) {
      return NextResponse.json({ error: "Rolle, Berechtigung und Kategorie sind erforderlich" }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    const { data, error } = await adminClient
      .from("role_permissions")
      .insert({
        role,
        permission_key,
        permission_category,
        can_view: can_view ?? false,
        can_create: can_create ?? false,
        can_edit: can_edit ?? false,
        can_delete: can_delete ?? false,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Diese Berechtigung existiert bereits für diese Rolle" }, { status: 409 })
      }
      console.error("Error creating permission:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ permission: data })
  } catch (error) {
    console.error("POST /api/super-admin/permissions error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interner Serverfehler" },
      { status: 500 },
    )
  }
}

// PUT /api/super-admin/permissions - Update permission
export async function PUT(request: NextRequest) {
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
    const { id, role, permission_key, can_view, can_create, can_edit, can_delete } = body

    // Validate - need either id or role+permission_key
    if (!id && (!role || !permission_key)) {
      return NextResponse.json({ error: "ID oder Rolle+Berechtigung erforderlich" }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    let query = adminClient.from("role_permissions").update({
      can_view: can_view ?? false,
      can_create: can_create ?? false,
      can_edit: can_edit ?? false,
      can_delete: can_delete ?? false,
      updated_at: new Date().toISOString(),
    })

    if (id) {
      query = query.eq("id", id)
    } else {
      query = query.eq("role", role).eq("permission_key", permission_key)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating permission:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ permission: data })
  } catch (error) {
    console.error("PUT /api/super-admin/permissions error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interner Serverfehler" },
      { status: 500 },
    )
  }
}

// DELETE /api/super-admin/permissions - Delete permission
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const role = searchParams.get("role")
    const permission_key = searchParams.get("permission_key")

    if (!id && (!role || !permission_key)) {
      return NextResponse.json({ error: "ID oder Rolle+Berechtigung erforderlich" }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    let query = adminClient.from("role_permissions").delete()

    if (id) {
      query = query.eq("id", id)
    } else {
      query = query.eq("role", role!).eq("permission_key", permission_key!)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting permission:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/super-admin/permissions error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interner Serverfehler" },
      { status: 500 },
    )
  }
}
