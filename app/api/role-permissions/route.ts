import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET /api/role-permissions - Fetch all role permissions
export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/role-permissions - Starting")

    const supabaseAdmin = await createAdminClient()

    console.log("[v0] Admin client created, querying permissions")

    const { data: permissions, error } = await supabaseAdmin
      .from("role_permissions")
      .select("*")
      .order("role", { ascending: true })
      .order("permission_category", { ascending: true })

    console.log("[v0] Query result:", {
      hasPermissions: !!permissions,
      count: permissions?.length,
      error: error?.message,
    })

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch permissions", details: error.message },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("[v0] Successfully fetched permissions:", permissions?.length || 0)
    return NextResponse.json(
      { permissions: permissions || [] },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("[v0] GET /api/role-permissions - Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// PUT /api/role-permissions - Update role permission
export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] PUT /api/role-permissions - Starting")
    const body = await request.json()
    const { role, permission_key, ...updates } = body

    if (!role || !permission_key) {
      return NextResponse.json(
        { error: "Missing required fields: role and permission_key" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const supabaseAdmin = await createAdminClient()

    const { data, error } = await supabaseAdmin
      .from("role_permissions")
      .update(updates)
      .eq("role", role)
      .eq("permission_key", permission_key)
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json(
        { error: "Failed to update permission", details: error.message },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("[v0] Successfully updated permission")
    return NextResponse.json(
      { permission: data },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("[v0] PUT /api/role-permissions - Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
