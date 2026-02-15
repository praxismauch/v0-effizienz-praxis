import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import Logger from "@/lib/logger"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    // Validate practice ID
    if (!practiceId || practiceId === "0" || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
    }
    const practiceIdText = String(practiceId)
    const memberIdText = String(memberId)
    const supabase = await createAdminClient()
    const body = await request.json()

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
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

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
    if (body.avatar !== undefined) teamMemberUpdates.avatar_url = body.avatar
    if (body.isActive !== undefined) teamMemberUpdates.status = body.isActive ? "active" : "inactive"
    if (body.status !== undefined) teamMemberUpdates.status = body.status

    const { error: memberUpdateError } = await supabase
      .from("team_members")
      .update(teamMemberUpdates)
      .eq("id", teamMember.id)
      .eq("practice_id", practiceIdText)

    if (memberUpdateError) {
      Logger.error("api", "Error updating team_members", memberUpdateError)
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

      const { error: userUpdateError } = await supabase.from("users").update(userUpdates).eq("id", actualUserId)

      if (userUpdateError) {
        Logger.warn("api", "Error updating users (non-fatal)", { error: userUpdateError.message })
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

    return NextResponse.json({
      success: true,
      message: "Teammitglied erfolgreich aktualisiert",
    })
  } catch (error) {
    Logger.error("api", "Error updating team member", error)
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
    // Validate practice ID
    if (!practiceId || practiceId === "0" || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ error: "Invalid practice ID" }, { status: 400 })
    }
    const practiceIdText = String(practiceId)
    const memberIdText = String(memberId)

    const supabase = await createAdminClient()

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
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Delete team assignments
    if (checkMember.user_id) {
      const { error: assignmentsError } = await supabase
        .from("team_assignments")
        .delete()
        .eq("user_id", checkMember.user_id)

      if (assignmentsError) {
        Logger.warn("api", "Error deleting team assignments", { error: assignmentsError.message })
      }
    }

    // Update team_member status to inactive (soft delete)
    const { error: memberError } = await supabase
      .from("team_members")
      .update({
        status: "inactive",
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkMember.id)
      .eq("practice_id", practiceIdText)

    if (memberError) {
      Logger.error("api", "Error updating team member status", memberError)
      throw memberError
    }

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
        Logger.warn("api", "Error deactivating user (non-fatal)", { error: userError.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Teammitglied erfolgreich entfernt",
    })
  } catch (error) {
    Logger.error("api", "Error deleting team member", error)
    return NextResponse.json(
      {
        error: "Failed to delete team member",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
