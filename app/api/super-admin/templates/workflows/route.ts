import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, createAdminClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

async function requireSuperAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw { status: 401, message: "Unauthorized" }
  }
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!isSuperAdminRole(userData?.role)) {
    throw { status: 403, message: "Forbidden" }
  }
  return user
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const adminClient = await createAdminClient()

    // Fetch workflow templates (workflows where is_template = true)
    const { data: templates, error } = await adminClient
      .from("workflows")
      .select("*")
      .eq("is_template", true)
      .is("deleted_at", null)
      .order("name")

    if (error) throw error

    return NextResponse.json({ templates })
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
        title: step.title || step.name,
        description: step.description || "",
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
