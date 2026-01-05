import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const practiceIdText = String(practiceId)
    const memberIdText = String(memberId)
    const supabase = await createAdminClient()
    const body = await request.json()

    console.log("[v0] PUT team member API called:", { practiceId: practiceIdText, memberId: memberIdText })

    const { data: teamMember, error: lookupError } = await supabase
      .from("team_members")
      .select("id, user_id")
      .eq("practice_id", practiceIdText)
      .or(`user_id.eq.${memberIdText},id.eq.${memberIdText}`)
      .maybeSingle()

    if (lookupError || !teamMember) {
      console.error("[v0] Team member not found:", lookupError)
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    console.log("[v0] Found team member:", teamMember)

    const actualUserId = teamMember.user_id
    const nameParts = body.name?.split(" ") || []
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    if (actualUserId) {
      await supabase
        .from("users")
        .update({
          name: body.name,
          email: body.email,
          role: body.role,
          avatar: body.avatar,
          is_active: body.isActive,
        })
        .eq("id", actualUserId)
    }

    await supabase
      .from("team_members")
      .update({
        first_name: firstName,
        last_name: lastName,
        role: body.role,
        department: body.department,
        status: body.isActive ? "active" : "inactive",
      })
      .eq("id", teamMember.id)
      .eq("practice_id", practiceIdText)

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating team member:", error)
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const practiceIdText = String(practiceId)
    const memberIdText = String(memberId)

    console.log("[v0] DELETE team member API called:", { practiceId: practiceIdText, memberId: memberIdText })

    const supabase = await createAdminClient()

    const { data: checkMember, error: checkError } = await supabase
      .from("team_members")
      .select("id, user_id, first_name, last_name, status")
      .eq("practice_id", practiceIdText)
      .or(`user_id.eq.${memberIdText},id.eq.${memberIdText}`)
      .maybeSingle()

    if (checkError || !checkMember) {
      console.error("[v0] Member not found:", checkError)
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

    // Update team_member status to inactive
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
        .update({ is_active: false })
        .eq("id", checkMember.user_id)

      if (userError) {
        console.error("[v0] Error deactivating user:", userError)
      } else {
        console.log("[v0] User account deactivated")
      }
    }

    console.log("[v0] Team member deactivated successfully")

    return NextResponse.json({ success: true })
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
