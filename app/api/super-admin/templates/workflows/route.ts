import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch workflow templates (workflows where is_template = true)
    const { data: templates, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("is_template", true)
      .is("deleted_at", null)
      .order("name")

    if (error) throw error

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("[v0] Error fetching workflow templates:", error)
    // Return empty array on error to prevent UI crashes
    return NextResponse.json({ templates: [], error: error.message }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, steps, is_active, hide_items_from_other_users } = body

    // Insert workflow template (stored in workflows table with is_template = true)
    const { data: template, error: insertError } = await supabase
      .from("workflows")
      .insert({
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

      const { error: stepsError } = await supabase.from("workflow_steps").insert(stepInserts)
      if (stepsError) console.error("Error inserting workflow steps:", stepsError)
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating workflow template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
