import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import Logger from "@/lib/logger"

// Get all pending approvals (practices and users)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userRecord || userRecord.role !== "superadmin") {
      return NextResponse.json({ error: "Nur Super-Admins haben Zugriff" }, { status: 403 })
    }

    const supabaseAdmin = await createAdminClient()

    // Fetch pending practices
    const { data: pendingPractices, error: practicesError } = await supabaseAdmin
      .from("practices")
      .select("*, created_by")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false })

    if (practicesError) {
      Logger.error("approvals-get", "Error fetching pending practices", practicesError)
    }

    // Fetch pending users with practice info
    const { data: pendingUsers, error: usersError } = await supabaseAdmin
      .from("users")
      .select(`
        *,
        practice:practice_id (
          id,
          name,
          approval_status
        )
      `)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false })

    if (usersError) {
      Logger.error("approvals-get", "Error fetching pending users", usersError)
    }

    return NextResponse.json({
      practices: pendingPractices || [],
      users: pendingUsers || [],
    })
  } catch (error) {
    Logger.error("approvals-get", "Unexpected error", error)
    return NextResponse.json({ error: "Ein unerwarteter Fehler ist aufgetreten" }, { status: 500 })
  }
}

// Approve or reject a practice
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userRecord } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userRecord || userRecord.role !== "superadmin") {
      return NextResponse.json({ error: "Nur Super-Admins können genehmigen" }, { status: 403 })
    }

    const body = await request.json()
    const { type, id, status, reason } = body

    if (!type || !id || !status) {
      return NextResponse.json({ error: "Type, ID und Status sind erforderlich" }, { status: 400 })
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Status muss 'approved' oder 'rejected' sein" }, { status: 400 })
    }

    const supabaseAdmin = await createAdminClient()

    if (type === "practice") {
      // Approve/reject practice
      const { error: practiceError } = await supabaseAdmin
        .from("practices")
        .update({
          approval_status: status,
          settings: status === "approved" ? { isActive: true } : { isActive: false },
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (practiceError) {
        Logger.error("approvals-patch", "Error updating practice", practiceError)
        return NextResponse.json({ error: practiceError.message }, { status: 500 })
      }

      // If approved, also approve the practice admin user
      if (status === "approved") {
        const { data: practice } = await supabaseAdmin
          .from("practices")
          .select("created_by")
          .eq("id", id)
          .single()

        if (practice?.created_by) {
          await supabaseAdmin
            .from("users")
            .update({
              approval_status: "approved",
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", practice.created_by)

          await supabaseAdmin
            .from("team_members")
            .update({ status: "active" })
            .eq("user_id", practice.created_by)
            .eq("practice_id", id)

          // Confirm email for the admin user
          await supabaseAdmin.auth.admin.updateUserById(practice.created_by, {
            email_confirm: true,
          })
        }
      }

      Logger.info("approvals-patch", "Practice approval updated", { id, status })
      return NextResponse.json({ success: true, message: `Praxis ${status === "approved" ? "genehmigt" : "abgelehnt"}` })
    } else if (type === "user") {
      // Approve/reject user
      const { error: userError } = await supabaseAdmin
        .from("users")
        .update({
          approval_status: status,
          is_active: status === "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (userError) {
        Logger.error("approvals-patch", "Error updating user", userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      // Update team member status
      await supabaseAdmin
        .from("team_members")
        .update({ status: status === "approved" ? "active" : "rejected" })
        .eq("user_id", id)

      // If approved, confirm email
      if (status === "approved") {
        await supabaseAdmin.auth.admin.updateUserById(id, {
          email_confirm: true,
        })
      }

      Logger.info("approvals-patch", "User approval updated", { id, status })
      return NextResponse.json({ success: true, message: `Benutzer ${status === "approved" ? "genehmigt" : "abgelehnt"}` })
    } else {
      return NextResponse.json({ error: "Ungültiger Typ" }, { status: 400 })
    }
  } catch (error) {
    Logger.error("approvals-patch", "Unexpected error", error)
    return NextResponse.json({ error: "Ein unerwarteter Fehler ist aufgetreten" }, { status: 500 })
  }
}
