import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

function isRateLimitError(error: any): boolean {
  if (!error) return false
  const message = error?.message || String(error)
  return (
    error instanceof SyntaxError ||
    message.includes("Too Many") ||
    message.includes("Unexpected token") ||
    message.includes("is not valid JSON")
  )
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    console.log("[v0] Fetching responsibilities for practice:", practiceId)

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (adminError) {
      try {
        supabase = await createClient()
      } catch (clientError) {
        console.warn("[v0] Responsibilities: Failed to create any client")
        return NextResponse.json({ responsibilities: [] })
      }
    }

    let responsibilities: any[] = []
    try {
      const result = await supabase
        .from("responsibilities")
        .select("*")
        .eq("practice_id", practiceId)
        .or("is_active.is.null,is_active.eq.true")
        .order("group_name")
        .order("name")

      if (result.error) {
        console.warn("[v0] Responsibilities query error:", result.error.message)
        return NextResponse.json({ responsibilities: [] })
      }
      responsibilities = result.data || []
    } catch (queryError: any) {
      if (isRateLimitError(queryError)) {
        console.warn("[v0] Responsibilities: Rate limited, returning empty array")
        return NextResponse.json({ responsibilities: [] })
      }
      console.warn("[v0] Responsibilities: Query failed:", queryError?.message)
      return NextResponse.json({ responsibilities: [] })
    }

    console.log("[v0] Found", responsibilities?.length || 0, "responsibilities")

    if (responsibilities && responsibilities.length > 0) {
      const userIds = new Set<string>()
      responsibilities.forEach((resp: any) => {
        if (resp.responsible_user_id) userIds.add(resp.responsible_user_id)
        if (resp.deputy_user_id) userIds.add(resp.deputy_user_id)
      })

      if (userIds.size > 0) {
        let teamMembers: any[] = []
        try {
          // Look up by both id AND user_id since responsible_user_id could be either
          const result = await supabase
            .from("team_members")
            .select(`id, first_name, last_name, user_id`)
            .eq("practice_id", practiceId)

          if (result.error) {
            console.warn("[v0] Team members lookup error:", result.error.message)
          } else {
            teamMembers = result.data || []
          }
        } catch (tmError: any) {
          if (isRateLimitError(tmError)) {
            console.warn("[v0] Team members lookup: Rate limited")
          }
        }

        if (teamMembers && teamMembers.length > 0) {
          // Create maps for both team_member.id and team_member.user_id lookups
          const userMapById = new Map<string, string>()
          const userMapByUserId = new Map<string, string>()
          
          teamMembers.forEach((tm: any) => {
            const fullName = `${tm.first_name || ""} ${tm.last_name || ""}`.trim()
            if (fullName) {
              userMapById.set(tm.id, fullName)
              if (tm.user_id) {
                userMapByUserId.set(tm.user_id, fullName)
              }
            }
          })

          const transformedResponsibilities = responsibilities.map((resp: any) => {
            // Try to find by id first, then by user_id
            const responsibleName = userMapById.get(resp.responsible_user_id) || 
                                    userMapByUserId.get(resp.responsible_user_id) || null
            const deputyName = userMapById.get(resp.deputy_user_id) || 
                               userMapByUserId.get(resp.deputy_user_id) || null

            return {
              ...resp,
              category: resp.group_name,
              responsible_user_name: responsibleName,
              deputy_user_name: deputyName,
            }
          })

          return NextResponse.json({ responsibilities: transformedResponsibilities })
        }
      }
    }

    const transformedResponsibilities = (responsibilities || []).map((resp: any) => ({
      ...resp,
      category: resp.group_name,
      responsible_user_name: null,
      deputy_user_name: null,
    }))

    return NextResponse.json({ responsibilities: transformedResponsibilities })
  } catch (error: any) {
    if (isRateLimitError(error)) {
      console.warn("[v0] Responsibilities: Rate limited (outer catch)")
      return NextResponse.json({ responsibilities: [] })
    }
    console.error("Error fetching responsibilities:", error)
    return NextResponse.json({ responsibilities: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (adminError) {
      console.error("Admin client failed:", adminError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const body = await request.json()

    const name = body.name
    const description = body.description
    const groupName = body.group_name || body.groupName || body.category
    const responsibleUserId = body.responsible_user_id || body.responsibleUserId
    const deputyUserId = body.deputy_user_id || body.deputyUserId
    const teamMemberIds = body.team_member_ids || body.teamMemberIds
    const arbeitsplatzIds = body.arbeitsplatz_ids || body.arbeitsplatzIds || []
    const assignedTeams = body.assigned_teams || body.assignedTeams || []
    const priority = body.priority || "medium"
    const createdBy = body.created_by || body.createdBy
    const suggestedHoursPerWeek = body.suggested_hours_per_week || body.suggestedHoursPerWeek
    const estimatedTimeAmount = body.estimated_time_amount || body.estimatedTimeAmount
    const estimatedTimePeriod = body.estimated_time_period || body.estimatedTimePeriod
    const cannotCompleteDuringConsultation =
      body.cannot_complete_during_consultation || body.cannotCompleteDuringConsultation
    const calculateTimeAutomatically = body.calculate_time_automatically || body.calculateTimeAutomatically
    const optimizationSuggestions = body.optimization_suggestions || body.optimizationSuggestions
    const jointExecution = body.joint_execution || body.jointExecution || false
    const jointExecutionUserId = body.joint_execution_user_id || body.jointExecutionUserId
    const jointExecutionTeamGroup = body.joint_execution_team_group || body.jointExecutionTeamGroup

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    let finalCreatedBy = createdBy
    if (!finalCreatedBy) {
      // Try to get a user ID as fallback
      const { data: users } = await supabase.from("users").select("id").eq("practice_id", practiceId).limit(1).single()

      finalCreatedBy = users?.id || practiceId // Use practice ID as last resort fallback
    }

    const insertData = {
      practice_id: practiceId,
      name,
      description: description || null,
      group_name: groupName || null,
      responsible_user_id: responsibleUserId || null,
      deputy_user_id: deputyUserId || null,
      team_member_ids: teamMemberIds || [],
      arbeitsplatz_ids: arbeitsplatzIds,
      assigned_teams: assignedTeams,
      priority: priority,
      created_by: finalCreatedBy,
      is_active: true,
      suggested_hours_per_week: suggestedHoursPerWeek ?? null,
      estimated_time_amount: estimatedTimeAmount ?? null,
      estimated_time_period: estimatedTimePeriod || null,
      cannot_complete_during_consultation: cannotCompleteDuringConsultation || false,
      calculate_time_automatically: calculateTimeAutomatically || false,
      optimization_suggestions: optimizationSuggestions || null,
      joint_execution: jointExecution,
      joint_execution_user_id: jointExecutionUserId || null,
      joint_execution_team_group: jointExecutionTeamGroup || null,
    }

    const { data, error } = await supabase.from("responsibilities").insert(insertData).select().single()

    if (error) {
      console.error("Supabase error creating responsibility:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const userIds = new Set<string>()
    if (data.responsible_user_id) userIds.add(data.responsible_user_id)
    if (data.deputy_user_id) userIds.add(data.deputy_user_id)

    if (userIds.size > 0) {
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select(`
          id,
          first_name,
          last_name,
          user_id,
          candidate_id,
          users(first_name, last_name, is_active, role)
        `)
        .in("id", Array.from(userIds))

      if (teamMembers && teamMembers.length > 0) {
        const userMap = new Map(
          teamMembers.map((tm: any) => {
            let fullName = ""
            if (tm.users && tm.users.first_name) {
              fullName = `${tm.users.first_name} ${tm.users.last_name}`.trim()
            } else if (tm.first_name) {
              fullName = `${tm.first_name} ${tm.last_name || ""}`.trim()
            }
            return [tm.id, fullName || null]
          }),
        )

        const enrichedData = {
          ...data,
          category: data.group_name,
          responsible_user_name: userMap.get(data.responsible_user_id) || null,
          deputy_user_name: userMap.get(data.deputy_user_id) || null,
        }

        return NextResponse.json(enrichedData, { status: 201 })
      }
    }

    return NextResponse.json(
      {
        ...data,
        category: data.group_name,
        responsible_user_name: null,
        deputy_user_name: null,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating responsibility:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create responsibility" },
      { status: 500 },
    )
  }
}
