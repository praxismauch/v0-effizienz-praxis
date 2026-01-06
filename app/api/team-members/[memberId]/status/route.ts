import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const { memberId } = await params

    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const body = await request.json()
    const { status, is_active } = body

    const adminClient = await createAdminClient()

    // First get the team member to check practice access
    const { data: teamMember, error: fetchError } = await adminClient
      .from("team_members")
      .select("id, practice_id, user_id")
      .eq("id", memberId)
      .single()

    if (fetchError || !teamMember) {
      return NextResponse.json({ error: "Teammitglied nicht gefunden" }, { status: 404 })
    }

    // Verify user has access to this practice
    const { data: userData } = await adminClient.from("users").select("role, practice_id").eq("id", user.id).single()

    const { data: practiceUser } = await adminClient
      .from("practice_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("practice_id", teamMember.practice_id)
      .eq("status", "active")
      .single()

    const hasAccess =
      userData?.role === "super_admin" ||
      userData?.role === "superadmin" ||
      userData?.practice_id === teamMember.practice_id ||
      practiceUser

    if (!hasAccess) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) {
      updateData.employment_status = status
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active

      // If deactivating, also set left_at if not already set
      if (!is_active) {
        updateData.left_at = new Date().toISOString()
      } else {
        updateData.left_at = null
      }
    }

    // Update team member
    const { data: updatedMember, error: updateError } = await adminClient
      .from("team_members")
      .update(updateData)
      .eq("id", memberId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating team member status:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If team member has a linked user, update their status too
    if (teamMember.user_id && is_active !== undefined) {
      await adminClient
        .from("users")
        .update({
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", teamMember.user_id)

      // Also update practice_users if deactivating
      if (!is_active) {
        await adminClient
          .from("practice_users")
          .update({
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", teamMember.user_id)
          .eq("practice_id", teamMember.practice_id)
      }
    }

    return NextResponse.json({
      success: true,
      teamMember: updatedMember,
    })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/team-members/[memberId]/status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const { memberId } = await params

    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    const { data: teamMember, error } = await adminClient
      .from("team_members")
      .select("id, is_active, employment_status, left_at, practice_id")
      .eq("id", memberId)
      .single()

    if (error || !teamMember) {
      return NextResponse.json({ error: "Teammitglied nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json({
      status: {
        is_active: teamMember.is_active,
        employment_status: teamMember.employment_status,
        left_at: teamMember.left_at,
      },
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/team-members/[memberId]/status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
