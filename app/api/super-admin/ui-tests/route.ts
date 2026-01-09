import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check super admin
    const { data: userData } = await supabase.from("users").select("is_super_admin, role").eq("id", user.id).single()

    if (!userData?.is_super_admin && userData?.role !== "super_admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { data: testRuns, error } = await supabase
      .from("ui_test_runs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching test runs:", error)
      return NextResponse.json({ testRuns: [] })
    }

    return NextResponse.json({ testRuns: testRuns || [] })
  } catch (error) {
    console.error("Error in GET /api/super-admin/ui-tests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check super admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_super_admin, role, email")
      .eq("id", user.id)
      .single()

    if (!userData?.is_super_admin && userData?.role !== "super_admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { name, items, summary, uiItemsVersion, uiItemsSnapshot } = body

    const { data, error } = await supabase
      .from("ui_test_runs")
      .insert({
        name,
        items,
        summary,
        ui_items_version: uiItemsVersion || null,
        ui_items_snapshot: uiItemsSnapshot || null,
        created_by: userData.email || user.email || "Unknown",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating test run:", error)
      return NextResponse.json({ error: "Failed to create test run" }, { status: 500 })
    }

    return NextResponse.json({ testRun: data })
  } catch (error) {
    console.error("Error in POST /api/super-admin/ui-tests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check super admin
    const { data: userData } = await supabase.from("users").select("is_super_admin, role").eq("id", user.id).single()

    if (!userData?.is_super_admin && userData?.role !== "super_admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing test run ID" }, { status: 400 })
    }

    const { error } = await supabase.from("ui_test_runs").delete().eq("id", id)

    if (error) {
      console.error("Error deleting test run:", error)
      return NextResponse.json({ error: "Failed to delete test run" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/super-admin/ui-tests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
