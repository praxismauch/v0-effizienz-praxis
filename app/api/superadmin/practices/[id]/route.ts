import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Authorization check
    const authSupabase = await createServerClient()
    const {
      data: { user: authUser },
    } = await authSupabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData } = await authSupabase.from("users").select("role").eq("id", authUser.id).single()

    if (!userData || !isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Zugriff verweigert: Super-Admin-Berechtigung erforderlich" }, { status: 403 })
    }

    const supabase = await createAdminClient()

    // Fetch practice details
    const { data: practice, error: practiceError } = await supabase
      .from("practices")
      .select(`
        id,
        name,
        email,
        phone,
        address,
        city,
        postal_code,
        color,
        logo_url,
        specialty,
        practice_type,
        subscription_plan,
        subscription_status,
        trial_ends_at,
        created_at,
        updated_at,
        deleted_at,
        settings,
        onboarding_completed
      `)
      .eq("id", id)
      .single()

    if (practiceError) {
      console.error("[v0] Error fetching practice:", practiceError)
      if (practiceError.code === "PGRST116") {
        return NextResponse.json({ error: "Praxis nicht gefunden" }, { status: 404 })
      }
      return NextResponse.json({ error: practiceError.message }, { status: 500 })
    }

    // Fetch team members count
    const { count: teamMembersCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", id)
      .is("deleted_at", null)

    // Fetch users count
    const { count: usersCount } = await supabase
      .from("practice_users")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", id)
      .eq("status", "active")

    // Fetch recent activity from system logs
    const { data: recentActivity } = await supabase
      .from("system_logs")
      .select("id, action, category, message, created_at, user_id")
      .eq("practice_id", id)
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      practice: {
        ...practice,
        team_members_count: teamMembersCount || 0,
        users_count: usersCount || 0,
      },
      recentActivity: recentActivity || [],
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/superadmin/practices/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Authorization check
    const authSupabase = await createServerClient()
    const {
      data: { user: authUser },
    } = await authSupabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData } = await authSupabase.from("users").select("role").eq("id", authUser.id).single()

    if (!userData || !isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Zugriff verweigert: Super-Admin-Berechtigung erforderlich" }, { status: 403 })
    }

    const body = await request.json()
    const supabase = await createAdminClient()

    // Update practice
    const { data: updatedPractice, error: updateError } = await supabase
      .from("practices")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating practice:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ practice: updatedPractice })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/superadmin/practices/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Authorization check
    const authSupabase = await createServerClient()
    const {
      data: { user: authUser },
    } = await authSupabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData } = await authSupabase.from("users").select("role").eq("id", authUser.id).single()

    if (!userData || !isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Zugriff verweigert: Super-Admin-Berechtigung erforderlich" }, { status: 403 })
    }

    const supabase = await createAdminClient()

    // Soft delete practice
    const { error: deleteError } = await supabase
      .from("practices")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (deleteError) {
      console.error("[v0] Error deleting practice:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/superadmin/practices/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
