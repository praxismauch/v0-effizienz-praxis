import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const userSupabase = await createClient()
    const {
      data: { user },
    } = await userSupabase.auth.getUser()
    const currentUserId = user?.id

    const { searchParams } = new URL(request.url)

    const includeSubgoals = searchParams.get("includeSubgoals") === "true"
    const goalType = searchParams.get("type")
    const status = searchParams.get("status")
    const assignedTo = searchParams.get("assignedTo")

    let query = supabase
      .from("goals")
      .select("*")
      .eq("practice_id", String(practiceId))
      .is("deleted_at", null)
      .order("end_date", { ascending: true })

    if (!includeSubgoals) {
      query = query.is("parent_goal_id", null)
    }
    if (goalType) {
      query = query.eq("goal_type", goalType)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo)
    }

    const { data, error } = await safeSupabaseQuery(() => query, { data: [], error: null })

    if (error) {
      console.error("[v0] Goals query error:", error.message || JSON.stringify(error))
      return NextResponse.json({ goals: [] }, { status: 200 })
    }

    const goalsWithLinkedParams = (data || []).filter((g) => g.linked_parameter_id)
    const parameterValuesMap = new Map()

    if (goalsWithLinkedParams.length > 0) {
      const parameterIds = [...new Set(goalsWithLinkedParams.map((g) => g.linked_parameter_id))]

      const { data: paramValues } = await safeSupabaseQuery(
        () =>
          supabase
            .from("parameter_values")
            .select("parameter_id, value, recorded_date")
            .in("parameter_id", parameterIds)
            .order("recorded_date", { ascending: false }),
        { data: null, error: null },
      )

      if (paramValues) {
        paramValues.forEach((pv) => {
          if (!parameterValuesMap.has(pv.parameter_id)) {
            parameterValuesMap.set(pv.parameter_id, pv)
          }
        })
      }
    }

    const userOrderMap = new Map()
    if (currentUserId) {
      const { data: userOrders } = await safeSupabaseQuery(
        () =>
          supabase
            .from("user_goal_order")
            .select("goal_id, display_order")
            .eq("practice_id", String(practiceId))
            .eq("user_id", currentUserId)
            .is("deleted_at", null),
        { data: null, error: null },
      )

      if (userOrders) {
        userOrders.forEach((order) => {
          userOrderMap.set(order.goal_id, order.display_order)
        })
      }
    }

    const goals = (data || []).map((goal) => {
      let currentValue = goal.current_value
      let progressPercentage = goal.progress_percentage

      if (goal.linked_parameter_id) {
        const paramValue = parameterValuesMap.get(goal.linked_parameter_id)
        if (paramValue) {
          const latestValue = Number.parseFloat(paramValue.value)
          if (!isNaN(latestValue)) {
            currentValue = latestValue
            if (goal.target_value) {
              progressPercentage = Math.min(100, Math.max(0, Math.round((latestValue / goal.target_value) * 100)))
            }
          }
        }
      }

      return {
        id: goal.id,
        practiceId: goal.practice_id,
        createdBy: goal.created_by,
        assignedTo: goal.assigned_to,
        parentGoalId: goal.parent_goal_id,
        title: goal.title,
        description: goal.description,
        goalType: goal.goal_type,
        targetValue: goal.target_value,
        currentValue,
        unit: goal.unit,
        progressPercentage,
        status: goal.status,
        priority: goal.priority,
        startDate: goal.start_date,
        endDate: goal.end_date,
        completedAt: goal.completed_at,
        isPrivate: goal.is_private,
        metadata: goal.metadata,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
        displayOrder: userOrderMap.get(goal.id) ?? goal.display_order ?? 999999,
        linkedParameterId: goal.linked_parameter_id,
        showOnDashboard: goal.show_on_dashboard || false,
      }
    })

    return NextResponse.json(
      { goals },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      },
    )
  } catch (error) {
    console.error(
      "[v0] Error in GET /api/practices/[practiceId]/goals:",
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json({ goals: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    const userId = body.created_by || body.createdBy || body.assignedTo || body.assigned_to

    if (!userId) {
      console.error("[v0] No user ID provided for goal creation")
      return NextResponse.json({ error: "User ID is required to create a goal. Please log in again." }, { status: 400 })
    }

    const createdByValue = String(userId).trim()

    const goalData = {
      practice_id: practiceId,
      created_by: createdByValue,
      assigned_to: body.assignedTo || body.assigned_to || null,
      parent_goal_id: body.parentGoalId || body.parent_goal_id || null,
      title: body.title,
      description: body.description || null,
      goal_type: body.goalType || body.goal_type || "personal",
      target_value: body.targetValue || body.target_value || null,
      current_value: body.currentValue || body.current_value || 0,
      unit: body.unit || null,
      progress_percentage: body.progressPercentage || body.progress_percentage || 0,
      status: body.status || "not-started",
      priority: body.priority || "medium",
      start_date:
        (body.startDate || body.start_date) && (body.startDate || body.start_date) !== ""
          ? body.startDate || body.start_date
          : null,
      end_date:
        (body.endDate || body.end_date) && (body.endDate || body.end_date) !== ""
          ? body.endDate || body.end_date
          : null,
      is_private:
        body.isPrivate !== undefined ? body.isPrivate : body.is_private !== undefined ? body.is_private : true,
      metadata: body.metadata || {},
      linked_parameter_id: body.linkedParameterId || body.linked_parameter_id || null,
      show_on_dashboard: body.showOnDashboard || body.show_on_dashboard || false,
    }

    const { data, error } = await supabase.from("goals").insert(goalData).select().maybeSingle()

    if (error) {
      console.error("[v0] Error creating goal:", error)
      if (error.code === "42501") {
        return NextResponse.json(
          { error: "You must be assigned to a practice before creating goals." },
          { status: 403 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Ziel konnte nicht erstellt werden" }, { status: 500 })
    }

    const goal = {
      id: data.id,
      practiceId: data.practice_id,
      createdBy: data.created_by,
      assignedTo: data.assigned_to,
      parentGoalId: data.parent_goal_id,
      title: data.title,
      description: data.description,
      goalType: data.goal_type,
      targetValue: data.target_value,
      currentValue: data.current_value,
      unit: data.unit,
      progressPercentage: data.progress_percentage,
      status: data.status,
      priority: data.priority,
      startDate: data.start_date,
      endDate: data.end_date,
      completedAt: data.completed_at,
      isPrivate: data.is_private,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      linkedParameterId: data.linked_parameter_id,
      showOnDashboard: data.show_on_dashboard || false,
    }

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/practices/[practiceId]/goals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
