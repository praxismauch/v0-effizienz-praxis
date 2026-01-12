import { type NextRequest, NextResponse } from "next/server"
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = await params
    const effectivePracticeId = practiceId && practiceId !== "0" && practiceId !== "undefined" ? practiceId : "1"

    const { user, adminClient: supabase } = await requirePracticeAccess(effectivePracticeId)
    const currentUserId = user.id

    const practiceIdInt = Number.parseInt(effectivePracticeId, 10)

    const { searchParams } = new URL(request.url)

    const includeSubgoals = searchParams.get("includeSubgoals") === "true"
    const status = searchParams.get("status")
    const assignedTo = searchParams.get("assignedTo")

    let query = supabase
      .from("goals")
      .select("*")
      .eq("practice_id", practiceIdInt)
      .order("due_date", { ascending: true })

    if (!includeSubgoals) {
      query = query.is("parent_id", null)
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

    const userOrderMap = new Map()
    if (currentUserId) {
      const { data: userOrders } = await safeSupabaseQuery(
        () =>
          supabase
            .from("user_goal_order")
            .select("goal_id, display_order")
            .eq("practice_id", practiceIdInt)
            .eq("user_id", currentUserId),
        { data: null, error: null },
      )

      if (userOrders) {
        userOrders.forEach((order) => {
          userOrderMap.set(order.goal_id, order.display_order)
        })
      }
    }

    const goals = (data || []).map((goal) => {
      const currentValue = goal.current_value
      const progressPercentage = goal.progress ?? 0

      return {
        id: goal.id,
        practiceId: goal.practice_id,
        createdBy: goal.created_by,
        assignedTo: goal.assigned_to,
        parentGoalId: goal.parent_id,
        title: goal.title,
        description: goal.description,
        goalType: goal.category || "personal",
        targetValue: goal.target_value,
        currentValue,
        unit: goal.unit,
        progressPercentage,
        status: goal.status,
        priority: goal.priority,
        startDate: goal.start_date,
        endDate: goal.due_date,
        completedAt: goal.completed_at,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
        displayOrder: userOrderMap.get(goal.id) ?? 999999,
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
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = await params
    const effectivePracticeId = practiceId && practiceId !== "0" && practiceId !== "undefined" ? practiceId : "1"

    const { user, adminClient: supabase } = await requirePracticeAccess(effectivePracticeId)

    const practiceIdInt = Number.parseInt(effectivePracticeId, 10)

    const body = await request.json()

    const createdByValue = user.id

    const goalData = {
      practice_id: practiceIdInt,
      created_by: createdByValue,
      user_id: createdByValue, // Added user_id which exists in DB
      assigned_to: body.assignedTo || body.assigned_to || null,
      parent_id: body.parentGoalId || body.parent_goal_id || body.parentId || null,
      title: body.title,
      description: body.description || null,
      category: body.goalType || body.goal_type || body.category || "personal",
      target_value: body.targetValue || body.target_value || null,
      current_value: body.currentValue || body.current_value || 0,
      unit: body.unit || null,
      progress: body.progressPercentage || body.progress_percentage || body.progress || 0,
      status: body.status || "not-started",
      priority: body.priority || "medium",
      start_date:
        (body.startDate || body.start_date) && (body.startDate || body.start_date) !== ""
          ? body.startDate || body.start_date
          : null,
      due_date:
        (body.endDate || body.end_date || body.dueDate || body.due_date) &&
        (body.endDate || body.end_date || body.dueDate || body.due_date) !== ""
          ? body.endDate || body.end_date || body.dueDate || body.due_date
          : null,
      // These columns don't exist in the database
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
      parentGoalId: data.parent_id,
      title: data.title,
      description: data.description,
      goalType: data.category || "personal",
      targetValue: data.target_value,
      currentValue: data.current_value,
      unit: data.unit,
      progressPercentage: data.progress ?? 0,
      status: data.status,
      priority: data.priority,
      startDate: data.start_date,
      endDate: data.due_date,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
