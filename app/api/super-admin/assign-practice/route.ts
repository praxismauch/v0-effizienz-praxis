import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST - Assign user to practice
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, practiceId, role = "user" } = body

    if (!userId || !practiceId) {
      return NextResponse.json({ error: "Missing userId or practiceId" }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    // Update user's primary practice_id
    const { error: updateUserError } = await adminClient
      .from("users")
      .update({ practice_id: practiceId })
      .eq("id", userId)

    if (updateUserError) {
      console.error("Error updating user practice_id:", updateUserError)
      return NextResponse.json({ error: "Failed to update user practice" }, { status: 500 })
    }

    // Check if team_members entry already exists
    const { data: existingMember } = await adminClient
      .from("team_members")
      .select("*")
      .eq("user_id", userId)
      .eq("practice_id", practiceId)
      .single()

    if (!existingMember) {
      // Create team_members entry
      const { error: teamMemberError } = await adminClient.from("team_members").insert({
        user_id: userId,
        practice_id: practiceId,
        role: role,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (teamMemberError) {
        console.error("Error creating team member:", teamMemberError)
        return NextResponse.json({ error: "Failed to create team member" }, { status: 500 })
      }
    } else {
      // Update existing team_members entry
      const { error: updateMemberError } = await adminClient
        .from("team_members")
        .update({
          role: role,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("practice_id", practiceId)

      if (updateMemberError) {
        console.error("Error updating team member:", updateMemberError)
        return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error assigning user to practice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove user from practice
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, practiceId } = body

    if (!userId || !practiceId) {
      return NextResponse.json({ error: "Missing userId or practiceId" }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    // Remove team_members entry
    const { error: deleteError } = await adminClient
      .from("team_members")
      .delete()
      .eq("user_id", userId)
      .eq("practice_id", practiceId)

    if (deleteError) {
      console.error("Error removing team member:", deleteError)
      return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
    }

    // Check if user has other practices
    const { data: otherPractices } = await adminClient
      .from("team_members")
      .select("practice_id")
      .eq("user_id", userId)
      .limit(1)

    // If this was the user's only practice, clear their practice_id
    if (!otherPractices || otherPractices.length === 0) {
      await adminClient.from("users").update({ practice_id: null }).eq("id", userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing user from practice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
