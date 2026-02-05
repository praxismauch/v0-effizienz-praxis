import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import { sortTeamMembersByRole } from "@/lib/team-role-order"
import { handleApiError } from "@/lib/api-helpers"
import { createAdminClient } from "@/lib/supabase/admin"

interface TeamMember {
  id: string
  user_id: string | null
  role: string
  department: string | null
  status: string
  joined_date: string | null
  created_at: string
  first_name: string | null
  last_name: string | null
}

interface TeamAssignment {
  user_id: string
  team_id: string
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 1000): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error
      if (isRateLimitError(error) && i < maxRetries - 1) {
        const jitter = Math.random() * 500
        const delay = baseDelay * Math.pow(2, i) + jitter
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw lastError
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const practiceIdStr = String(practiceId)
    const supabase = await createAdminClient()

    let customRoleOrder: string[] | undefined
    try {
      const practiceIdInt = Number.parseInt(practiceIdStr, 10)
      const { data: practiceSettings } = await supabase
        .from("practice_settings")
        .select("system_settings")
        .eq("practice_id", practiceIdInt)
        .single()

      customRoleOrder = practiceSettings?.system_settings?.team_member_role_order
    } catch {
      // Use default order if settings not found
    }

    let members: TeamMember[] = []
    try {
      const result = await withRetry(async () => {
        const res = await supabase
          .from("team_members")
          .select(`
            id,
            user_id,
            role,
            department,
            status,
            joined_date,
            created_at,
            first_name,
            last_name
          `)
          .eq("practice_id", practiceIdStr)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })

        if (res.error) {
          if (isRateLimitError(res.error)) {
            throw res.error
          }
          console.error("team_members GET error:", res.error.message)
          return { data: [], error: res.error }
        }
        return res
      })

      members = result.data || []
    } catch (queryError: unknown) {
      if (isRateLimitError(queryError)) {
        return NextResponse.json(
          { error: "Service temporarily unavailable", retryable: true },
          { status: 503, headers: { "Retry-After": "5" } },
        )
      }
      console.error("[v0] Query error in team-members GET:", queryError)
      return NextResponse.json({ teamMembers: [] })
    }

    const activeMembers = members.filter((member) => member.status === "active" || !member.status)

    const userIds = activeMembers.map((m) => m.user_id).filter(Boolean) as string[]

    let teamAssignments: TeamAssignment[] = []
    let userAvatars: Record<string, string | null> = {}

    if (userIds.length > 0) {
      try {
        const result = await withRetry(async () => {
          return await supabase.from("team_assignments").select("user_id, team_id").in("user_id", userIds)
        })
        teamAssignments = result.data || []
      } catch (assignError: unknown) {
        console.error("Error fetching team assignments:", assignError)
      }

      // Fetch avatars from users table
      try {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, avatar")
          .in("id", userIds)

        if (usersData) {
          userAvatars = usersData.reduce((acc: Record<string, string | null>, user: any) => {
            acc[user.id] = user.avatar
            return acc
          }, {})
        }
      } catch (avatarError: unknown) {
        console.error("Error fetching user avatars:", avatarError)
      }
    }

    const teamMembers = activeMembers.map((member) => {
      const memberId = member.user_id || member.id

      const firstName = member.first_name?.trim() || ""
      const lastName = member.last_name?.trim() || ""
      const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || "Unbekannt"

      const avatar = member.user_id ? userAvatars[member.user_id] : null

      return {
        id: memberId,
        team_member_id: member.id, // Always include the team_members table ID
        user_id: member.user_id,
        first_name: firstName,
        last_name: lastName,
        firstName: firstName,
        lastName: lastName,
        name: name,
        email: "",
        role: member.role || "user",
        avatar: avatar,
        avatar_url: avatar,
        practiceId: practiceId,
        isActive: member.status === "active" || !member.status,
        is_active: member.status === "active" || !member.status,
        status: member.status || "active",
        userIsActive: true,
        joinedAt: member.joined_date || member.created_at || new Date().toISOString(),
        created_at: member.created_at,
        permissions: [],
        lastActive: new Date().toISOString(),
        team_ids: member.user_id
          ? teamAssignments.filter((ta: any) => ta.user_id === member.user_id).map((ta: any) => ta.team_id)
          : [],
        teamIds: member.user_id
          ? teamAssignments.filter((ta) => ta.user_id === member.user_id).map((ta) => ta.team_id)
          : [],
        date_of_birth: null,
      }
    })

    const sortedTeamMembers = sortTeamMembersByRole(teamMembers, customRoleOrder)
    return NextResponse.json({ teamMembers: sortedTeamMembers || [] })
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: "Service temporarily unavailable", retryable: true },
        { status: 503, headers: { "Retry-After": "5" } },
      )
    }
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const practiceIdStr = String(practiceId)
    const practiceIdInt = Number.parseInt(practiceIdStr, 10)

    const supabase = await createAdminClient()

    const body = await request.json()

    const firstName = body.firstName?.trim()
    const lastName = body.lastName?.trim()

    if (!firstName || firstName.length === 0) {
      return NextResponse.json({ error: "Vorname ist erforderlich" }, { status: 400 })
    }

    if (!lastName || lastName.length === 0) {
      return NextResponse.json({ error: "Nachname ist erforderlich" }, { status: 400 })
    }

    const teamMemberId = uuidv4()
    const fullName = `${firstName} ${lastName}`.trim()
    const userRole = body.role || "user"
    let userId: string | null = null

    const currentDate = new Date().toISOString().split("T")[0]

    if (body.email && body.email.trim() !== "") {
      userId = uuidv4()

      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: userId,
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          email: body.email.trim(),
          role: userRole,
          avatar: body.avatar || null,
          practice_id: practiceIdInt,
          is_active: true,
          date_of_birth: body.date_of_birth || null,
        })
        .select()
        .single()

      if (userError) {
        console.error("User insert error:", userError.message)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    }

    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .insert({
        id: teamMemberId,
        user_id: userId,
        practice_id: practiceIdStr,
        role: userRole,
        department: body.department || null,
        status: "active",
        joined_date: currentDate,
        first_name: firstName,
        last_name: lastName,
      })
      .select()
      .single()

    if (memberError) {
      console.error("Team member insert error:", memberError.message)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    if (body.teamIds && body.teamIds.length > 0 && userId) {
      const assignments = body.teamIds.map((teamId: string) => ({
        user_id: String(userId),
        team_id: String(teamId),
      }))

      const { error: assignError } = await supabase.from("team_assignments").insert(assignments)
      if (assignError) {
        console.error("Team assignments error:", assignError.message)
      }
    }

    return NextResponse.json({
      id: userId || teamMemberId,
      teamMemberId: teamMemberId,
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      email: body.email?.trim() || null,
      role: userRole,
      avatar: body.avatar || null,
      practiceId: practiceId,
      isActive: true,
      is_active: true,
      joinedAt: memberData.joined_date || memberData.created_at,
      created_at: memberData.created_at,
      permissions: [],
      lastActive: new Date().toISOString(),
      teamIds: body.teamIds || [],
      date_of_birth: body.date_of_birth || null,
    })
  } catch (error) {
    console.error("Team members POST exception:", error)
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const practiceIdStr = String(practiceId)
    const practiceIdInt = Number.parseInt(practiceIdStr, 10)

    const supabase = await createAdminClient()
    const body = await request.json()

    const memberId = body.id || body.user_id

    if (!memberId) {
      return NextResponse.json({ error: "Mitglied-ID fehlt" }, { status: 400 })
    }

    const teamMemberUpdates: Record<string, unknown> = {}

    if (body.firstName !== undefined || body.lastName !== undefined) {
      const firstName = body.firstName?.trim() || body.first_name?.trim() || ""
      const lastName = body.lastName?.trim() || body.last_name?.trim() || ""

      if (firstName) teamMemberUpdates.first_name = firstName
      if (lastName) teamMemberUpdates.last_name = lastName
    }

    if (body.role !== undefined) {
      teamMemberUpdates.role = body.role
    }

    if (body.department !== undefined) {
      teamMemberUpdates.department = body.department
    }

    if (body.isActive !== undefined) {
      teamMemberUpdates.status = body.isActive ? "active" : "inactive"
    }

    if (body.status !== undefined) {
      teamMemberUpdates.status = body.status
    }

    if (Object.keys(teamMemberUpdates).length > 0) {
      const { error: memberError } = await supabase
        .from("team_members")
        .update(teamMemberUpdates)
        .eq("user_id", memberId)
        .eq("practice_id", practiceIdStr)

      if (memberError) {
        console.error("Team member update error:", memberError.message)
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }
    }

    const userUpdates: Record<string, unknown> = {}

    if (body.firstName !== undefined || body.lastName !== undefined) {
      const firstName = body.firstName?.trim() || body.first_name?.trim() || ""
      const lastName = body.lastName?.trim() || body.last_name?.trim() || ""
      const fullName = `${firstName} ${lastName}`.trim()

      if (fullName) {
        userUpdates.name = fullName
        userUpdates.first_name = firstName
        userUpdates.last_name = lastName
      }
    }

    if (body.email !== undefined && body.email?.trim()) {
      userUpdates.email = body.email.trim()
    }

    if (body.role !== undefined) {
      userUpdates.role = body.role
    }

    if (body.avatar !== undefined) {
      userUpdates.avatar = body.avatar
    }

    if (body.isActive !== undefined) {
      userUpdates.is_active = body.isActive
    }

    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await supabase
        .from("users")
        .update(userUpdates)
        .eq("id", memberId)
        .eq("practice_id", practiceIdInt)

      if (userError) {
        console.error("User update error:", userError.message)
      }
    }

    return NextResponse.json({
      success: true,
      id: memberId,
      message: "Teammitglied erfolgreich aktualisiert",
    })
  } catch (error) {
    console.error("Team members PUT exception:", error)
    return handleApiError(error)
  }
}
