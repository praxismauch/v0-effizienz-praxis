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
    console.error("[v0] Exception in GET /api/super-admin/users/[id]:", error)
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
    if (name !== undefined) updates.name = name
    if (email !== undefined) updates.email = email
    if (is_active !== undefined) updates.is_active = is_active
    if (role !== undefined) updates.role = role
    if (practice_id !== undefined) updates.practice_id = practice_id
    if (preferred_language !== undefined) updates.preferred_language = preferred_language
    if (phone !== undefined) updates.phone = phone
    if (specialization !== undefined) updates.specialization = specialization

    // Update user record - using parametrized query
    const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating user:", error)
      return NextResponse.json({ error: "Benutzer konnte nicht aktualisiert werden" }, { status: 500 })
    }

    // If email changed, update auth.users email too
    if (email && email !== data.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, { email })
      if (authError) {
        console.error("[v0] Error updating auth email:", authError)
      }
    }

    // If practice_id changed, update practice_users
    if (practice_id !== undefined) {
      // Remove existing primary practice
      await supabase.from("practice_users").update({ is_primary: false }).eq("user_id", id).eq("is_primary", true)

      if (practice_id) {
        // Check if entry exists
        const { data: existingPU } = await supabase
          .from("practice_users")
          .select("id")
          .eq("user_id", id)
          .eq("practice_id", practice_id)
          .single()

        if (existingPU) {
          // Update existing
          await supabase
            .from("practice_users")
            .update({ is_primary: true, status: "active" })
            .eq("user_id", id)
            .eq("practice_id", practice_id)
        } else {
          // Create new entry
          await supabase.from("practice_users").insert({
            user_id: id,
            practice_id: practice_id,
            role: role || data.role || "member",
            status: "active",
            is_primary: true,
            invited_by: authUser.id,
            joined_at: new Date().toISOString(),
          })
        }
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
    console.error("[v0] Exception in PATCH /api/super-admin/users/[id]:", error)
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
      console.error("[v0] Error deleting user record:", deleteError)
      return NextResponse.json({ error: "Benutzer konnte nicht gelöscht werden" }, { status: 500 })
    }

    // Delete from auth.users
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id)

    if (authDeleteError) {
      console.error("[v0] Error deleting auth user:", authDeleteError)
      // User record already deleted, log warning but don't fail
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Exception in DELETE /api/super-admin/users/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
