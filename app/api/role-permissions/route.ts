import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { hasSupabaseAdminConfig } from "@/lib/supabase/config"

// GET /api/role-permissions
export async function GET(request: NextRequest) {
  try {
    // Try admin client first (bypasses RLS), fall back to regular authenticated client
    const supabase = hasSupabaseAdminConfig() ? await createAdminClient() : await createClient()

    const { data: permissions, error } = await supabase
      .from("role_permissions")
      .select("*")
      .order("role", { ascending: true })
      .order("permission_category", { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch permissions", details: error.message },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return NextResponse.json(
      { permissions: permissions || [] },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
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

    const supabase = hasSupabaseAdminConfig() ? await createAdminClient() : await createClient()

    const { data, error } = await supabase
      .from("role_permissions")
      .update(updates)
      .eq("role", role)
      .eq("permission_key", permission_key)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to update permission", details: error.message },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return NextResponse.json(
      { permission: data },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
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
