import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
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
      return NextResponse.json({ error: "Zugriff verweigert: Super-Admin-Berechtigung erforderlich" }, { status: 403 })
    }

    const supabase = await createAdminClient()

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        name,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at,
        practice_id,
        phone,
        avatar,
        approval_status
      `)
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("[v0] Error fetching users:", usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Fetch practices for mapping - only non-deleted practices
    const { data: practices, error: practicesError } = await supabase
      .from("practices")
      .select("id, name, color")
      .is("deleted_at", null)

    if (practicesError) {
      console.error("[v0] Error fetching practices:", practicesError)
      return NextResponse.json({ error: practicesError.message }, { status: 500 })
    }

    // Fetch practice_users for multi-practice assignments
    const { data: practiceUsers, error: puError } = await supabase
      .from("practice_users")
      .select("user_id, practice_id, role, status, is_primary, joined_at")
      .eq("status", "active")

    if (puError) {
      console.error("[v0] Error fetching practice_users:", puError)
    }

    // Build maps for efficient lookups
    const practiceMap = new Map(practices?.map((p) => [p.id, { name: p.name, color: p.color }]) || [])
    const userPracticesMap = new Map<
      string,
      Array<{ practiceId: number; practiceName: string; role: string; isPrimary: boolean }>
    >()

    // Build user-practices mapping from practice_users table
    practiceUsers?.forEach((pu) => {
      const practice = practiceMap.get(pu.practice_id)
      if (practice) {
        const existing = userPracticesMap.get(pu.user_id) || []
        existing.push({
          practiceId: pu.practice_id,
          practiceName: practice.name,
          role: pu.role,
          isPrimary: pu.is_primary || false,
        })
        userPracticesMap.set(pu.user_id, existing)
      }
    })

    // Transform users data - handle null/undefined values properly
    const transformedUsers =
      users?.map((user) => {
        const legacyPractice = user.practice_id ? practiceMap.get(user.practice_id) : null
        const assignedPractices = userPracticesMap.get(user.id) || []

        // If no practice_users entries but has legacy practice_id, use that
        if (assignedPractices.length === 0 && legacyPractice && user.practice_id) {
          assignedPractices.push({
            practiceId: user.practice_id,
            practiceName: legacyPractice.name,
            role: user.role,
            isPrimary: true,
          })
        }

        const displayName =
          user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.name || "Unbekannt"

        return {
          id: user.id,
          name: displayName,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          is_active: user.is_active ?? true,
          created_at: user.created_at,
          updated_at: user.updated_at,
          practice_id: user.practice_id,
          practice_name: legacyPractice?.name || null,
          practice_color: legacyPractice?.color || null,
          practices: assignedPractices,
          phone: user.phone,
          avatar: user.avatar,
          approval_status: user.approval_status,
        }
      }) || []

    // Calculate stats using isSuperAdminRole helper - no hardcoding
    const stats = {
      total: transformedUsers.length,
      active: transformedUsers.filter((u) => u.is_active).length,
      inactive: transformedUsers.filter((u) => !u.is_active).length,
      superAdmins: transformedUsers.filter((u) => isSuperAdminRole(u.role)).length,
      withPractice: transformedUsers.filter((u) => u.practice_id || u.practices.length > 0).length,
      withoutPractice: transformedUsers.filter((u) => !u.practice_id && u.practices.length === 0).length,
    }

    return NextResponse.json({
      users: transformedUsers,
      stats,
      practices: practices?.map((p) => ({ id: p.id, name: p.name, color: p.color })) || [],
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/super-admin/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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
      return NextResponse.json({ error: "Zugriff verweigert: Super-Admin-Berechtigung erforderlich" }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name, role, practiceId } = body

    // Validation - no empty values
    if (!email || !password || !name) {
      return NextResponse.json({ error: "E-Mail, Passwort und Name sind erforderlich" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits" }, { status: 400 })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: role || "user",
      },
    })

    if (authError || !authData.user) {
      console.error("[v0] Error creating auth user:", authError)
      return NextResponse.json(
        { error: authError?.message || "Benutzer konnte nicht erstellt werden" },
        { status: 500 },
      )
    }

    const validPracticeId = practiceId && !Number.isNaN(Number(practiceId)) ? Number(practiceId) : null

    const nameParts = name.trim().split(" ")
    const firstName = nameParts[0] || name
    const lastName = nameParts.slice(1).join(" ") || ""

    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        name,
        first_name: firstName,
        last_name: lastName,
        role: role || "user",
        is_active: true,
        practice_id: validPracticeId,
        approval_status: "approved", // Auto-approve when created by super admin
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error("[v0] Error creating user record:", userError)
      // Cleanup auth user on failure
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        {
          error: `Benutzerdatensatz konnte nicht erstellt werden: ${userError.message}`,
        },
        { status: 500 },
      )
    }

    // If practice assigned, create practice_users entry
    if (validPracticeId) {
      const { error: puError } = await supabase.from("practice_users").insert({
        practice_id: validPracticeId,
        user_id: authData.user.id,
        role: role || "member",
        status: "active",
        is_primary: true,
        invited_by: authUser.id,
        joined_at: new Date().toISOString(),
      })

      if (puError) {
        console.error("[v0] Error creating practice_users entry:", puError)
        // Non-fatal, user is still created
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        is_active: newUser.is_active,
        practice_id: newUser.practice_id,
        created_at: newUser.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Exception in POST /api/super-admin/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
