import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; goalId: string }> },
) {
  try {
    const { practiceId, goalId } = await params
    const practiceIdText = String(practiceId)
    const goalIdText = String(goalId)
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const includeSubgoals = searchParams.get("includeSubgoals") === "true"

    const { data: goalData, error: goalError } = await supabase
      .from("goals")
      .select("*")
      .eq("id", goalIdText)
      .eq("practice_id", practiceIdText)
      .is("deleted_at", null)
      .maybeSingle()

    if (goalError) {
      console.error("[v0] Error fetching goal:", goalError)
      return NextResponse.json({ error: goalError.message }, { status: 500 })
    }

    if (!goalData) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    const goal = {
      id: goalData.id,
      practiceId: goalData.practice_id,
      createdBy: goalData.created_by,
      assignedTo: goalData.assigned_to,
      parentGoalId: goalData.parent_goal_id,
      title: goalData.title,
      description: goalData.description,
      goalType: goalData.goal_type || "personal",
      targetValue: goalData.target_value,
      currentValue: goalData.current_value,
      unit: goalData.unit,
      progressPercentage: goalData.progress_percentage ?? 0,
      status: goalData.status,
      priority: goalData.priority,
      startDate: goalData.start_date,
      endDate: goalData.end_date,
      completedAt: goalData.completed_at,
      createdAt: goalData.created_at,
      updatedAt: goalData.updated_at,
    }

    let subgoals = []
    if (includeSubgoals) {
      const { data: subgoalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("parent_goal_id", goalIdText)
        .eq("practice_id", practiceIdText)
        .order("created_at", { ascending: true })

      subgoals = (subgoalsData || []).map((sub) => ({
        id: sub.id,
        practiceId: sub.practice_id,
        createdBy: sub.created_by,
        assignedTo: sub.assigned_to,
        parentGoalId: sub.parent_goal_id,
        title: sub.title,
        description: sub.description,
        goalType: sub.goal_type || "personal",
        targetValue: sub.target_value,
        currentValue: sub.current_value,
        unit: sub.unit,
        progressPercentage: sub.progress_percentage ?? 0,
        status: sub.status,
        priority: sub.priority,
        startDate: sub.start_date,
        endDate: sub.end_date,
        completedAt: sub.completed_at,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
      }))
    }

    return NextResponse.json({ goal, subgoals })
  } catch (error) {
    console.error("[v0] Error in GET /api/practices/[practiceId]/goals/[goalId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; goalId: string }> },
) {
  try {
    const { practiceId, goalId } = await params
    const practiceIdText = String(practiceId)
    const goalIdText = String(goalId)
    const body = await request.json()
    const supabase = await createAdminClient()

    const { data: subgoalsCheck } = await supabase
      .from("goals")
      .select("id")
      .eq("parent_goal_id", goalIdText)
      .eq("practice_id", practiceIdText)

    const hasSubgoals = subgoalsCheck && subgoalsCheck.length > 0

    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.goalType !== undefined) updateData.goal_type = body.goalType
    if (body.assignedTo !== undefined) updateData.assigned_to = body.assignedTo
    if (body.targetValue !== undefined) updateData.target_value = body.targetValue
    if (body.currentValue !== undefined) updateData.current_value = body.currentValue
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.progressPercentage !== undefined && !hasSubgoals) {
      updateData.progress_percentage = body.progressPercentage
    }
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.startDate !== undefined) updateData.start_date = body.startDate === "" ? null : body.startDate
    if (body.endDate !== undefined) updateData.end_date = body.endDate === "" ? null : body.endDate

    const { data, error } = await supabase
      .from("goals")
      .update(updateData)
      .eq("id", goalIdText)
      .eq("practice_id", practiceIdText)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error updating goal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    if (data.parent_goal_id && body.status !== undefined) {
      await updateParentGoalProgress(supabase, data.parent_goal_id, practiceIdText)
    } else if (hasSubgoals) {
      await updateParentGoalProgress(supabase, goalIdText, practiceIdText)
    }

    const goal = {
      id: data.id,
      practiceId: data.practice_id,
      createdBy: data.created_by,
      assignedTo: data.assigned_to,
      parentGoalId: data.parent_goal_id,
      title: data.title,
      description: data.description,
      goalType: data.goal_type || "personal",
      targetValue: data.target_value,
      currentValue: data.current_value,
      unit: data.unit,
      progressPercentage: data.progress_percentage ?? 0,
      status: data.status,
      priority: data.priority,
      startDate: data.start_date,
      endDate: data.end_date,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/practices/[practiceId]/goals/[goalId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; goalId: string }> },
) {
  try {
    const { practiceId, goalId } = await params
    const practiceIdText = String(practiceId)
    const goalIdText = String(goalId)
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("goals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", goalIdText)
      .eq("practice_id", practiceIdText)

    if (error) {
      console.error("[v0] Error deleting goal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/practices/[practiceId]/goals/[goalId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function updateParentGoalProgress(supabase: any, parentGoalId: string, practiceId: string) {
  try {
    const parentGoalIdText = String(parentGoalId)
    const practiceIdText = String(practiceId)
    const { data: subgoals, error: subgoalsError } = await supabase
      .from("goals")
      .select("id, status")
      .eq("parent_goal_id", parentGoalIdText)
      .eq("practice_id", practiceIdText)

    if (subgoalsError || !subgoals || subgoals.length === 0) {
      return
    }

    const totalSubgoals = subgoals.length
    const completedSubgoals = subgoals.filter((sg: any) => sg.status === "completed").length
    const progressValue = Math.round((completedSubgoals / totalSubgoals) * 100)

    let parentStatus = "in-progress"
    if (progressValue === 0) {
      parentStatus = "not-started"
    } else if (progressValue === 100) {
      parentStatus = "completed"
    }

    await supabase
      .from("goals")
      .update({
        progress_percentage: progressValue,
        status: parentStatus,
      })
      .eq("id", parentGoalIdText)
      .eq("practice_id", practiceIdText)
  } catch (error) {
    console.error("[v0] Error updating parent goal progress:", error)
  }
}
