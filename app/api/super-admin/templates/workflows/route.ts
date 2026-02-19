import { type NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { requireSuperAdmin as authRequireSuperAdmin } from "@/lib/auth-utils"

async function requireSuperAdmin() {
  try {
    const user = await authRequireSuperAdmin()
    return { id: user.id, email: user.email }
  } catch {
    throw { status: 401, message: "Unauthorized" }
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const adminClient = await createAdminClient()

    // Fetch workflow templates
    const { data: templates, error } = await adminClient
      .from("workflows")
      .select("*")
      .eq("is_template", true)
      .is("deleted_at", null)
      .order("name")

    if (error) throw error

    // Fetch steps separately (no FK relationship for PostgREST join)
    const templateIds = (templates || []).map((t: any) => t.id)
    let stepsMap: Record<string, any[]> = {}

    if (templateIds.length > 0) {
      const { data: allSteps } = await adminClient
        .from("workflow_steps")
        .select("id, workflow_id, title, description, step_order, status, assigned_to, responsible_role, estimated_minutes")
        .in("workflow_id", templateIds)
        .is("deleted_at", null)
        .order("step_order", { ascending: true })

      // Group steps by workflow_id
      for (const step of (allSteps || [])) {
        if (!stepsMap[step.workflow_id]) stepsMap[step.workflow_id] = []
        stepsMap[step.workflow_id].push(step)
      }
    }

    // Map steps into the format expected by the frontend
    const mapped = (templates || []).map((t: any) => ({
      ...t,
      steps: (stepsMap[t.id] || []).map((s: any) => ({
        title: s.title || "",
        description: s.description || "",
        assignedTo: s.assigned_to || s.responsible_role || "",
        estimatedDuration: s.estimated_minutes || 5,
        dependencies: [],
      })),
    }))

    return NextResponse.json({ templates: mapped })
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[v0] Error fetching workflow templates:", error)
    return NextResponse.json({ templates: [], error: error.message }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const adminClient = await createAdminClient()

    const body = await request.json()
    const { name, description, category, steps, is_active, hide_items_from_other_users } = body

    // Insert workflow template using admin client (bypasses RLS)
    const { data: template, error: insertError } = await adminClient
      .from("workflows")
      .insert({
        id: crypto.randomUUID(),
        name,
        description,
        category,
        is_template: true,
        status: is_active === false ? "inactive" : "active",
        hide_items_from_other_users: hide_items_from_other_users ?? false,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Insert workflow steps if provided
    if (steps && Array.isArray(steps) && steps.length > 0) {
      const stepInserts = steps.map((step: any, idx: number) => ({
        workflow_id: template.id,
        title: step.title || step.name || "",
        description: step.description || "",
        responsible_role: step.assignedTo || null,
        estimated_minutes: step.estimatedDuration || 5,
        step_order: idx + 1,
        status: "pending",
      }))

      const { error: stepsError } = await adminClient.from("workflow_steps").insert(stepInserts)
      if (stepsError) console.error("Error inserting workflow steps:", stepsError)
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[v0] Error creating workflow template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
