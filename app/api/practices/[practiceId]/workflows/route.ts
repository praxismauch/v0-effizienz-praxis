import { type NextRequest, NextResponse } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "0" || practiceId === "undefined" || practiceId === "null") {
      return NextResponse.json({ workflows: [] }, { status: 200 })
    }

    const practiceIdInt = Number.parseInt(practiceId, 10)

    let supabase
    try {
      const access = await requirePracticeAccess(practiceId)
      supabase = access.adminClient
    } catch (error) {
      return handleApiError(error)
    }

    let data: any[] = []
    try {
      const { data: result, error } = await supabase
        .from("workflows")
        .select(`
          *,
          steps:workflow_steps(*)
        `)
        .eq("practice_id", practiceIdInt)
        .order("created_at", { ascending: false })

      if (error) {
        if (isRateLimitError(error)) {
          console.warn("[v0] Workflows GET - Rate limited")
          return NextResponse.json({ workflows: [] }, { status: 200 })
        }
        console.error("[v0] Workflows GET - Query error:", error.message || error)
        return NextResponse.json({ workflows: [] }, { status: 200 })
      }

      data = result || []
    } catch (queryError) {
      if (isRateLimitError(queryError)) {
        console.warn("[v0] Workflows GET - Rate limited, returning empty array")
        return NextResponse.json({ workflows: [] }, { status: 200 })
      }
      console.error("[v0] Workflows GET - Query error:", queryError)
      return NextResponse.json({ workflows: [] }, { status: 200 })
    }

    const workflows = data || []

    const transformedWorkflows = workflows.map((workflow: any) => {
      const steps = (workflow.steps || [])
        .sort((a: any, b: any) => a.step_number - b.step_number)
        .map((step: any) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          assignedTo: step.assigned_to || step.assigned_role,
          assignedUserId: step.assigned_user_id,
          estimatedDuration: step.duration_days ? step.duration_days * 1440 : step.estimated_duration,
          dependencies: step.conditions?.dependencies || [],
          status: step.status,
          completedAt: step.completed_at,
          completedBy: step.completed_by,
          notes: step.notes,
          dueDate: step.due_date,
          parentStepId: step.parent_step_id,
          isSubitem: step.is_subitem || false,
        }))

      return {
        id: workflow.id,
        title: workflow.name,
        description: workflow.description,
        category: workflow.category,
        priority: workflow.priority,
        status: workflow.status,
        createdBy: workflow.created_by,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at,
        practiceId: workflow.practice_id,
        teamIds: workflow.team_ids || [],
        steps,
        isTemplate: workflow.is_template,
        templateId: workflow.template_id,
        estimatedTotalDuration: workflow.estimated_total_duration,
        actualDuration: workflow.actual_duration,
        startedAt: workflow.started_at,
        completedAt: workflow.completed_at,
        hideItemsFromOtherUsers: workflow.hide_items_from_other_users || false,
      }
    })

    return NextResponse.json({ workflows: transformedWorkflows }, { status: 200 })
  } catch (error) {
    if (isRateLimitError(error)) {
      console.warn("[v0] Workflows GET - Rate limited at outer level")
      return NextResponse.json({ workflows: [] }, { status: 200 })
    }
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "0") {
      console.error("[v0] Workflows POST - Invalid practice ID:", practiceId)
      return NextResponse.json({ error: "Ungültige Praxis-ID" }, { status: 400 })
    }

    const practiceIdInt = Number.parseInt(practiceId, 10)

    const { adminClient: supabase, user } = await requirePracticeAccess(practiceId)
    const userId = user.id

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] Workflows POST - Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 })
    }

    if (!body.title) {
      console.error("[v0] Workflows POST - Missing title")
      return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 })
    }

    const workflowId = globalThis.crypto.randomUUID()

    const workflowData = {
      id: workflowId,
      name: body.title,
      description: body.description || "",
      category: body.category || "general",
      status: body.status || "draft",
      created_by: userId,
      practice_id: practiceIdInt,
      is_template: body.isTemplate || false,
      template_id: body.templateId || null,
      trigger_type: "manual",
      total_steps: body.steps?.length || 0,
      completed_steps: 0,
      progress_percentage: 0,
      hide_items_from_other_users: body.hideItemsFromOtherUsers || false,
    }

    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .insert(workflowData)
      .select()
      .single()

    if (workflowError) {
      console.error("[v0] Workflows POST - Insert error:", workflowError)
      return NextResponse.json(
        { error: "Workflow konnte nicht erstellt werden", details: workflowError.message },
        { status: 500 },
      )
    }

    if (body.steps && body.steps.length > 0) {
      const stepsToInsert = body.steps.map((step: any, index: number) => ({
        id: step.id || globalThis.crypto.randomUUID(),
        workflow_id: workflow.id,
        title: step.title,
        description: step.description,
        assigned_to: step.assignedTo,
        assigned_user_id: step.assignedUserId || null,
        assigned_role: step.assignedTo,
        step_type: "task",
        status: step.status || "pending",
        step_number: index + 1,
        duration_days: step.estimatedDuration ? Math.ceil(step.estimatedDuration / 1440) : null,
        is_required: true,
        parent_step_id: step.parentStepId || null,
        is_subitem: step.isSubitem || false,
      }))

      const { error: stepsError } = await supabase.from("workflow_steps").insert(stepsToInsert)

      if (stepsError) {
        console.error("[v0] Workflows POST - Workflow steps insert error:", stepsError)
      }
    }

    const { data: completeWorkflow, error: fetchError } = await supabase
      .from("workflows")
      .select(`
        *,
        steps:workflow_steps(*)
      `)
      .eq("id", workflow.id)
      .single()

    if (fetchError) {
      console.error("[v0] Workflows POST - Failed to fetch complete workflow:", fetchError)
      return NextResponse.json({ error: "Failed to fetch created workflow" }, { status: 500 })
    }

    const response = {
      id: completeWorkflow.id,
      title: completeWorkflow.name,
      description: completeWorkflow.description,
      category: completeWorkflow.category,
      priority: body.priority || "medium",
      status: completeWorkflow.status,
      createdBy: completeWorkflow.created_by,
      createdAt: completeWorkflow.created_at,
      updatedAt: completeWorkflow.updated_at,
      practiceId: completeWorkflow.practice_id,
      teamIds: body.teamIds || [],
      isTemplate: completeWorkflow.is_template,
      templateId: completeWorkflow.template_id,
      estimatedTotalDuration: body.estimatedTotalDuration,
      hideItemsFromOtherUsers: completeWorkflow.hide_items_from_other_users,
      steps: (completeWorkflow.steps || []).map((step: any) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        assignedTo: step.assigned_to || step.assigned_role,
        assignedUserId: step.assigned_user_id,
        estimatedDuration: step.duration_days ? step.duration_days * 1440 : undefined,
        dependencies: [],
        status: step.status,
        parentStepId: step.parent_step_id,
        isSubitem: step.is_subitem,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Workflows POST - Unexpected error:", error)
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "0") {
      console.error("[v0] Workflows PATCH - Invalid practice ID:", practiceId)
      return NextResponse.json({ error: "Ungültige Praxis-ID" }, { status: 400 })
    }

    const practiceIdInt = Number.parseInt(practiceId, 10)

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] Workflows PATCH - Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 })
    }

    const { id, ...updates } = body

    if (!id) {
      console.error("[v0] Workflows PATCH - Missing workflow ID")
      return NextResponse.json({ error: "Workflow-ID ist erforderlich" }, { status: 400 })
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title !== undefined) dbUpdates.name = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.isTemplate !== undefined) dbUpdates.is_template = updates.isTemplate
    if (updates.hideItemsFromOtherUsers !== undefined)
      dbUpdates.hide_items_from_other_users = updates.hideItemsFromOtherUsers

    const { data: workflow, error: updateError } = await supabase
      .from("workflows")
      .update(dbUpdates)
      .eq("id", id)
      .eq("practice_id", practiceIdInt)
      .select(`
        *,
        steps:workflow_steps(*)
      `)
      .maybeSingle()

    if (updateError) {
      console.error("[v0] Workflows PATCH - Update error:", updateError)
      return NextResponse.json(
        { error: "Workflow konnte nicht aktualisiert werden", details: updateError.message },
        { status: 500 },
      )
    }

    if (!workflow) {
      console.error("[v0] Workflows PATCH - Workflow not found:", id)
      return NextResponse.json({ error: "Workflow nicht gefunden" }, { status: 404 })
    }

    const response = {
      id: workflow.id,
      title: workflow.name,
      description: workflow.description,
      category: workflow.category,
      priority: workflow.priority,
      status: workflow.status,
      createdBy: workflow.created_by,
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at,
      practiceId: workflow.practice_id,
      teamIds: workflow.team_ids || [],
      isTemplate: workflow.is_template,
      templateId: workflow.template_id,
      hideItemsFromOtherUsers: workflow.hide_items_from_other_users,
      steps: (workflow.steps || [])
        .sort((a: any, b: any) => a.step_number - b.step_number)
        .map((step: any) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          assignedTo: step.assigned_to || step.assigned_role,
          assignedUserId: step.assigned_user_id,
          estimatedDuration: step.duration_days ? step.duration_days * 1440 : step.estimated_duration,
          dependencies: step.conditions?.dependencies || [],
          status: step.status,
          completedAt: step.completed_at,
          completedBy: step.completed_by,
          notes: step.notes,
          dueDate: step.due_date,
          parentStepId: step.parent_step_id,
          isSubitem: step.is_subitem,
        })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Workflows PATCH - Unexpected error:", error)
    return handleApiError(error)
  }
}
