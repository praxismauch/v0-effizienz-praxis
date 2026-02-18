import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      const authSupabase = await createServerClient()
      const {
        data: { user: authUser },
      } = await authSupabase.auth.getUser()

      if (!authUser) {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
      }
    }

    const authSupabase = await createServerClient()
    const {
      data: { user: authUser },
    } = await authSupabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const { data: userData, error: userDataError } = await authSupabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single()

    if (!userData || !isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Zugriff verweigert: Super-Admin-Berechtigung erforderlich" }, { status: 403 })
    }

    const supabase = await createAdminClient()

    // Pagination support (optional - backward compatible)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "0", 10)
    const limit = parseInt(searchParams.get("limit") || "0", 10)
    const search = searchParams.get("search") || ""
    const isPaginated = page > 0 && limit > 0

    let query = supabase
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
      `, { count: isPaginated ? "exact" : undefined })
      .order("created_at", { ascending: false })

    // Apply search filter if provided
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    // Apply pagination if requested
    if (isPaginated) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }

    const { data: users, error: usersError, count: totalCount } = await query

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Fetch practices for mapping - only non-deleted practices
    const { data: practices, error: practicesError } = await supabase
      .from("practices")
      .select("id, name, color")
      .is("deleted_at", null)

    if (practicesError) {
      console.error("Error fetching practices:", practicesError)
      return NextResponse.json({ error: practicesError.message }, { status: 500 })
    }

    // Using team_members as alternative
    const { data: teamMembers, error: tmError } = await supabase
      .from("team_members")
      .select("user_id, practice_id, role, status")
      .eq("status", "active")
      .not("user_id", "is", null)

    if (tmError) {
      console.error("Error fetching team_members:", tmError)
    }

    // Build maps for efficient lookups - practice_id is now TEXT
    const practiceMap = new Map(practices?.map((p) => [String(p.id), { name: p.name, color: p.color }]) || [])
    const userPracticesMap = new Map<
      string,
      Array<{ practiceId: string; practiceName: string; role: string; isPrimary: boolean }>
    >()

    teamMembers?.forEach((tm) => {
      const practice = practiceMap.get(String(tm.practice_id))
      if (practice) {
        const existing = userPracticesMap.get(tm.user_id) || []
        existing.push({
          practiceId: tm.practice_id,
          practiceName: practice.name,
          role: tm.role,
          isPrimary: existing.length === 0, // First entry is primary
        })
        userPracticesMap.set(tm.user_id, existing)
      }
    })

    // Transform users data - handle null/undefined values properly
    const transformedUsers =
      users?.map((user) => {
        const legacyPractice = user.practice_id ? practiceMap.get(user.practice_id) : null
        const assignedPractices = userPracticesMap.get(user.id) || []

        // If no team_members entries but has legacy practice_id, use that
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

    const response: Record<string, unknown> = {
      users: transformedUsers,
      stats,
      practices: practices?.map((p) => ({ id: p.id, name: p.name, color: p.color })) || [],
    }

    // Add pagination metadata if paginated request
    if (isPaginated && totalCount !== null) {
      response.pagination = {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in GET /api/super-admin/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      const authSupabase = await createServerClient()
      const {
        data: { user: authUser },
      } = await authSupabase.auth.getUser()

      if (!authUser) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
      }
    }

    const authSupabase = await createServerClient()
    const {
      data: { user: authUser },
    } = await authSupabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }

    const { data: userData, error: userDataError } = await authSupabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single()

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
    const { data: authData, error: createAuthError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: role || "member",
      },
    })

    if (createAuthError || !authData.user) {
      console.error("Error creating auth user:", createAuthError?.message)
      return NextResponse.json(
        { error: createAuthError?.message || "Benutzer konnte nicht erstellt werden" },
        { status: 500 },
      )
    }

    // Practice ID is now TEXT (UUID format), keep as string
    const validPracticeId = practiceId && practiceId !== "undefined" && practiceId !== "null" ? String(practiceId) : null

    const nameParts = name.trim().split(" ")
    const firstName = nameParts[0] || name
    const lastName = nameParts.slice(1).join(" ") || ""

    const { data: newUser, error: createUserError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        name,
        first_name: firstName,
        last_name: lastName,
        role: role || "member",
        is_active: true,
        practice_id: validPracticeId,
        approval_status: "approved",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createUserError) {
      console.error("Error creating user record:", createUserError.message)
      
      // Cleanup auth user on failure
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError)
      }
      
      return NextResponse.json(
        {
          error: `Benutzerdatensatz konnte nicht erstellt werden: ${createUserError.message}`,
          code: createUserError.code,
          details: createUserError.details,
        },
        { status: 500 },
      )
    }

    // If practice assigned, create team_members entry
    if (validPracticeId) {
      const { error: tmError } = await supabase.from("team_members").insert({
        id: randomUUID(),
        practice_id: validPracticeId,
        user_id: authData.user.id,
        role: role || "member",
        status: "active",
        first_name: firstName,
        last_name: lastName,
        name: name,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (tmError) {
        console.error("Error creating team_members entry:", tmError)
        // Non-critical: user was created successfully, team membership failed
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
    console.error("Error in POST /api/super-admin/users:", error)
    const message = error instanceof Error ? error.message : "Interner Serverfehler"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
