import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const practiceIdText = String(practiceId) || "1"
    const memberIdText = String(memberId)
    const supabase = createAdminClient()
    const body = await request.json()

    console.log("[v0] PUT team member API called:", { practiceId: practiceIdText, memberId: memberIdText, body })

    let teamMember = null

    // First try to find by user_id
    const { data: byUserId } = await supabase
      .from("team_members")
      .select("id, user_id, first_name, last_name, email, role, status")
      .eq("practice_id", practiceIdText)
      .eq("user_id", memberIdText)
      .maybeSingle()

    if (byUserId) {
      teamMember = byUserId
    } else {
      // Then try to find by id
      const { data: byId } = await supabase
        .from("team_members")
        .select("id, user_id, first_name, last_name, email, role, status")
        .eq("practice_id", practiceIdText)
        .eq("id", memberIdText)
        .maybeSingle()

      teamMember = byId
    }

    if (!teamMember) {
      console.error("[v0] Team member not found for id:", memberIdText)
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    console.log("[v0] Found team member:", teamMember)

    const actualUserId = teamMember.user_id

    let firstName = body.firstName || body.first_name || ""
    let lastName = body.lastName || body.last_name || ""

    if (body.name && (!firstName || !lastName)) {
      const nameParts = body.name.split(" ")
      firstName = firstName || nameParts[0] || ""
      lastName = lastName || nameParts.slice(1).join(" ") || ""
    }

    const teamMemberUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (firstName) teamMemberUpdates.first_name = firstName
    if (lastName) teamMemberUpdates.last_name = lastName
    if (body.role !== undefined) teamMemberUpdates.role = body.role
    if (body.department !== undefined) teamMemberUpdates.department = body.department
    if (body.email !== undefined) teamMemberUpdates.email = body.email
    if (body.isActive !== undefined) teamMemberUpdates.status = body.isActive ? "active" : "inactive"
    if (body.status !== undefined) teamMemberUpdates.status = body.status

    console.log("[v0] Updating team_members with:", teamMemberUpdates)

    const { error: memberUpdateError } = await supabase
      .from("team_members")
      .update(teamMemberUpdates)
      .eq("id", teamMember.id)
      .eq("practice_id", practiceIdText)

    if (memberUpdateError) {
      console.error("[v0] Error updating team_members:", memberUpdateError)
      return NextResponse.json({ error: memberUpdateError.message }, { status: 500 })
    }

    if (actualUserId) {
      const userUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }

      const fullName = `${firstName} ${lastName}`.trim()
      if (fullName) userUpdates.name = fullName
      if (firstName) userUpdates.first_name = firstName
      if (lastName) userUpdates.last_name = lastName
      if (body.email !== undefined) userUpdates.email = body.email
      if (body.role !== undefined) userUpdates.role = body.role
      if (body.avatar !== undefined) userUpdates.avatar = body.avatar
      if (body.isActive !== undefined) userUpdates.is_active = body.isActive

      console.log("[v0] Updating users with:", userUpdates)

      const { error: userUpdateError } = await supabase.from("users").update(userUpdates).eq("id", actualUserId)

      if (userUpdateError) {
        console.error("[v0] Error updating users (non-fatal):", userUpdateError)
        // Don't fail - team_members update succeeded
      }
    }

    if (body.teamIds && actualUserId) {
      // Remove existing assignments
      await supabase.from("team_assignments").delete().eq("user_id", actualUserId)

      // Add new assignments
      if (body.teamIds.length > 0) {
        const assignments = body.teamIds.map((teamId: string) => ({
          user_id: actualUserId,
          team_id: teamId,
        }))

        await supabase.from("team_assignments").insert(assignments)
      }
    }

    console.log("[v0] Team member updated successfully")

    return NextResponse.json({
      success: true,
      message: "Teammitglied erfolgreich aktualisiert",
    })
  } catch (error) {
    console.error("[v0] Error updating team member:", error)
    return NextResponse.json(
      {
        error: "Failed to update team member",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const practiceIdText = String(practiceId) || "1"
    const memberIdText = String(memberId)

    console.log("[v0] DELETE team member API called:", { practiceId: practiceIdText, memberId: memberIdText })

    const supabase = createAdminClient()

    let checkMember = null

    const { data: byUserId } = await supabase
      .from("team_members")
      .select("id, user_id, first_name, last_name, status")
      .eq("practice_id", practiceIdText)
      .eq("user_id", memberIdText)
      .maybeSingle()

    if (byUserId) {
      checkMember = byUserId
    } else {
      const { data: byId } = await supabase
        .from("team_members")
        .select("id, user_id, first_name, last_name, status")
        .eq("practice_id", practiceIdText)
        .eq("id", memberIdText)
        .maybeSingle()

      checkMember = byId
    }

    if (!checkMember) {
      console.error("[v0] Member not found for id:", memberIdText)
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    console.log("[v0] Found member to delete:", checkMember)

    // Delete team assignments
    if (checkMember.user_id) {
      const { error: assignmentsError } = await supabase
        .from("team_assignments")
        .delete()
        .eq("user_id", checkMember.user_id)

      if (assignmentsError) {
        console.error("[v0] Error deleting team assignments:", assignmentsError)
      }
    }

    // Update team_member status to inactive (soft delete)
    const { error: memberError } = await supabase
      .from("team_members")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkMember.id)
      .eq("practice_id", practiceIdText)

    if (memberError) {
      console.error("[v0] Error updating team member status:", memberError)
      throw memberError
    }

    console.log("[v0] Team member status updated to inactive")

    // Deactivate user account if exists
    if (checkMember.user_id) {
      const { error: userError } = await supabase
        .from("users")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkMember.user_id)

      if (userError) {
        console.error("[v0] Error deactivating user:", userError)
      } else {
        console.log("[v0] User account deactivated")
      }
    }

    console.log("[v0] Team member deactivated successfully")

    return NextResponse.json({
      success: true,
      message: "Teammitglied erfolgreich entfernt",
    })
  } catch (error) {
    console.error("[v0] Error deleting team member:", error)
    return NextResponse.json(
      {
        error: "Failed to delete team member",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
