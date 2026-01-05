import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { isRateLimitError } from "@/lib/supabase/safe-query"

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 500): Promise<T> {
  let lastError: any
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      if (isRateLimitError(error) && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw lastError
}

function isValidName(name: string | null | undefined): boolean {
  if (!name) return false
  const trimmed = name.trim()
  if (!trimmed || trimmed === "null null" || trimmed === "null" || trimmed === "Kein Name") {
    return false
  }
  return true
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    console.log("[v0] TEAM MEMBERS GET - practiceId:", practiceId)

    if (!practiceId || practiceId === "undefined") {
      console.log("[v0] TEAM MEMBERS GET - Invalid practiceId")
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError: any) {
      console.log("[v0] TEAM MEMBERS GET - Supabase client error:", clientError.message)
      if (isRateLimitError(clientError)) {
        return NextResponse.json([])
      }
      return NextResponse.json([])
    }

    let members: any[] = []
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
            last_name,
            users(id, name, email, avatar, is_active, first_name, last_name, role, date_of_birth)
          `)
          .eq("practice_id", practiceId)
          .order("created_at", { ascending: false })

        if (res.error) {
          console.log("[v0] TEAM MEMBERS GET - Query error:", res.error.message)
          if (isRateLimitError(res.error)) {
            throw res.error
          }
          return { data: [], error: res.error }
        }
        console.log("[v0] TEAM MEMBERS GET - Query returned:", res.data?.length, "members")
        return res
      })

      members = result.data || []
    } catch (queryError: any) {
      console.log("[v0] TEAM MEMBERS GET - Query exception:", queryError.message)
      if (isRateLimitError(queryError)) {
        return NextResponse.json({ error: "Service temporarily unavailable", retryable: true }, { status: 503 })
      }
      return NextResponse.json([])
    }

    if (!members || !Array.isArray(members)) {
      console.log("[v0] TEAM MEMBERS GET - No members array")
      return NextResponse.json([])
    }

    const activeMembers = members.filter((member: any) => {
      if (member.user_id && member.users) {
        return member.users.role !== "superadmin"
      }
      return true
    })
    console.log("[v0] TEAM MEMBERS GET - After superadmin filter:", activeMembers.length, "members")

    const userIds = activeMembers.map((m: any) => m.user_id).filter(Boolean)
    let teamAssignments: any[] = []

    if (userIds.length > 0) {
      try {
        const result = await withRetry(async () => {
          return await supabase.from("team_assignments").select("user_id, team_id").in("user_id", userIds)
        })
        teamAssignments = result.data || []
      } catch (assignError: any) {
        // Continue with empty assignments rather than failing
      }
    }

    const teamMembers = activeMembers.map((member: any) => {
      const memberId = member.user_id || member.id

      let name = ""
      const firstName = member.first_name?.trim() || member.users?.first_name?.trim() || ""
      const lastName = member.last_name?.trim() || member.users?.last_name?.trim() || ""

      if (firstName && lastName) {
        name = `${firstName} ${lastName}`
      } else if (firstName) {
        name = firstName
      } else if (lastName) {
        name = lastName
      } else if (member.users?.name?.trim()) {
        name = member.users.name.trim()
      }

      return {
        id: memberId,
        user_id: member.user_id,
        firstName: firstName,
        lastName: lastName,
        name: name || "Unbekannt",
        email: member.users?.email || "",
        role: member.role || member.users?.role || "user",
        avatar: member.users?.avatar || null,
        practiceId: practiceId,
        isActive: (member.status === "active" || !member.status) && member.users?.is_active !== false,
        is_active: (member.status === "active" || !member.status) && member.users?.is_active !== false,
        status: member.status || "active",
        userIsActive: member.users?.is_active ?? true,
        joinedAt: member.joined_date || member.created_at || new Date().toISOString(),
        created_at: member.created_at,
        permissions: [],
        lastActive: new Date().toISOString(),
        teamIds: member.user_id
          ? teamAssignments.filter((ta: any) => ta.user_id === member.user_id).map((ta: any) => ta.team_id)
          : [],
        date_of_birth: member.users?.date_of_birth || null,
      }
    })

    console.log("[v0] TEAM MEMBERS GET - Returning:", teamMembers.length, "members")
    return NextResponse.json(teamMembers || [])
  } catch (error: any) {
    console.log("[v0] TEAM MEMBERS GET - Exception:", error.message)
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Service temporarily unavailable", retryable: true }, { status: 503 })
    }
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    console.log("[v0] TEAM MEMBERS POST - practiceId:", practiceId)

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
      console.log("[v0] TEAM MEMBERS POST - Creating user with email:", body.email)

      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          id: userId,
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          email: body.email.trim(),
          role: userRole,
          avatar: body.avatar || null,
          practice_id: String(practiceId),
          is_active: true,
          date_of_birth: body.date_of_birth || null,
        })
        .select()
        .single()

      if (userError) {
        console.error("[v0] User insert error:", userError.message)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    } else {
      console.log("[v0] TEAM MEMBERS POST - Creating team member without user (no email provided)")
    }

    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .insert({
        id: teamMemberId,
        user_id: userId,
        practice_id: String(practiceId),
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
      console.error("[v0] Team member insert error:", memberError.message)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    if (body.teamIds && body.teamIds.length > 0 && userId) {
      const assignments = body.teamIds.map((teamId: string) => ({
        user_id: String(userId),
        team_id: String(teamId),
      }))

      const { error: assignError } = await supabase.from("team_assignments").insert(assignments)
      if (assignError) {
        console.error("[v0] Team assignments error:", assignError.message)
      }
    }

    console.log("[v0] TEAM MEMBERS POST - Success, created member:", teamMemberId)
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
    console.error("[v0] Team members POST exception:", error)
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 })
  }
}
