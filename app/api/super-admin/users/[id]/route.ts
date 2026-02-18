import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json({ error: "Ungültige Benutzer-ID" }, { status: 400 })
    }

    // Authorization check
    const authSupabase = await createServerClient()
    const {
      data: { user: authUser },
    } = await authSupabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Check if user is super admin using isSuperAdminRole helper
    const { data: userData } = await authSupabase.from("users").select("role").eq("id", authUser.id).single()

    if (!userData || !isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
    }

    const supabase = await createAdminClient()

    // Fetch user details
    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error || !user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }

    // Fetch practice assignments
    const { data: practiceAssignments } = await supabase
      .from("practice_users")
      .select(`
        practice_id,
        role,
        status,
        is_primary,
        joined_at,
        practices:practice_id (
          id,
          name,
          color
        )
      `)
      .eq("user_id", id)

    return NextResponse.json({
      user: {
        ...user,
        practices:
          practiceAssignments?.map((pa) => ({
            practiceId: pa.practice_id,
            practiceName: (pa.practices as any)?.name,
            practiceColor: (pa.practices as any)?.color,
            role: pa.role,
            status: pa.status,
            isPrimary: pa.is_primary,
            joinedAt: pa.joined_at,
          })) || [],
      },
    })
  } catch (error) {
    console.error("Error in GET /api/super-admin/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json({ error: "Ungültige Benutzer-ID" }, { status: 400 })
    }

    // Authorization check
    const authSupabase = await createServerClient()
    const {
      data: { user: authUser },
    } = await authSupabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Check if user is super admin using isSuperAdminRole helper
    const { data: userData } = await authSupabase.from("users").select("role").eq("id", authUser.id).single()

    if (!userData || !isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, is_active, role, practice_id, preferred_language, phone, specialization } = body

    const supabase = await createAdminClient()

    // Build update object - only include provided fields
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    
    // Handle name - split into first_name and last_name
    if (name !== undefined) {
      updates.name = name
      const nameParts = name.trim().split(" ")
      updates.first_name = nameParts[0] || name
      updates.last_name = nameParts.slice(1).join(" ") || ""
    }
    
    if (email !== undefined) updates.email = email
    if (is_active !== undefined) updates.is_active = is_active
    if (role !== undefined) updates.role = role
    
    // Handle practice_id properly - can be null, number, or string
    if (practice_id !== undefined) {
      if (practice_id === null || practice_id === "none" || practice_id === "") {
        updates.practice_id = null
      } else {
        // Keep as string (UUID format in Supabase)
        updates.practice_id = String(practice_id)
      }
    }
    
    if (preferred_language !== undefined) updates.preferred_language = preferred_language
    if (phone !== undefined) updates.phone = phone
    if (specialization !== undefined) updates.specialization = specialization

    // Update user record - using parametrized query
    const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ 
        error: "Benutzer konnte nicht aktualisiert werden", 
        details: error.message 
      }, { status: 500 })
    }

    // If email changed, update auth.users email too
    if (email && email !== data.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, { email })
      if (authError) {
        console.error("Error updating auth email:", authError)
      }
    }

    // Update team_members if practice changed
    if (practice_id !== undefined) {
      const finalPracticeId = practice_id === null || practice_id === "none" || practice_id === "" 
        ? null 
        : String(practice_id)

      if (finalPracticeId) {
        // Check if team_members entry exists for this practice
        const { data: existingTM } = await supabase
          .from("team_members")
          .select("id, status")
          .eq("user_id", id)
          .eq("practice_id", finalPracticeId)
          .single()

        if (existingTM) {
          // Update existing - make sure it's active
          await supabase
            .from("team_members")
            .update({ 
              status: "active",
              role: role || data.role || "member",
              updated_at: new Date().toISOString()
            })
            .eq("id", existingTM.id)
        } else {
          // Get user details for team_members
          const firstName = updates.first_name || data.first_name || data.name?.split(" ")[0] || ""
          const lastName = updates.last_name || data.last_name || data.name?.split(" ").slice(1).join(" ") || ""
          
          // Create new team_members entry
          await supabase.from("team_members").insert({
            practice_id: finalPracticeId,
            user_id: id,
            first_name: firstName,
            last_name: lastName,
            email: email || data.email,
            role: role || data.role || "member",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      } else {
        // Practice removed - deactivate team_members entries
        await supabase
          .from("team_members")
          .update({ status: "inactive", updated_at: new Date().toISOString() })
          .eq("user_id", id)
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
        practice_id: data.practice_id,
        updated_at: data.updated_at,
      },
    })
  } catch (error) {
    console.error("Error in PATCH /api/super-admin/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json({ error: "Ungültige Benutzer-ID" }, { status: 400 })
    }

    // Authorization check
    const authSupabase = await createServerClient()
    const {
      data: { user: authUser },
    } = await authSupabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    // Check if user is super admin using isSuperAdminRole helper
    const { data: userData } = await authSupabase.from("users").select("role").eq("id", authUser.id).single()

    if (!userData || !isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
    }

    // Prevent self-deletion
    if (authUser.id === id) {
      return NextResponse.json({ error: "Sie können sich nicht selbst löschen" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Check if target is super admin and if they're the last one
    const { data: targetUser } = await supabase.from("users").select("role").eq("id", id).single()

    if (targetUser && isSuperAdminRole(targetUser.role)) {
      // Count remaining super admins using both variants
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .or("role.eq.superadmin,role.eq.super_admin")

      if (count !== null && count <= 1) {
        return NextResponse.json(
          {
            error: "Der letzte Super-Admin kann nicht gelöscht werden",
          },
          { status: 400 },
        )
      }
    }

    // Delete from practice_users first (foreign key constraint)
    await supabase.from("practice_users").delete().eq("user_id", id)

    // Delete from public.users
    const { error: deleteError } = await supabase.from("users").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting user record:", deleteError)
      return NextResponse.json({ error: "Benutzer konnte nicht gelöscht werden" }, { status: 500 })
    }

    // Delete from auth.users
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id)

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError)
      // User record already deleted, log warning but don't fail
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/super-admin/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
