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

    // Fetch workflow templates with their assigned specialty groups
    const { data: templates, error } = await supabase
      .from("workflow_templates")
      .select(`
        *,
        workflow_template_specialties (
          specialty_group_id,
          specialty_groups (
            id,
            name,
            description
          )
        )
      `)
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
    const { name, description, category, steps, specialty_group_ids, is_active, hide_items_from_other_users } = body

    // Insert workflow template
    const { data: template, error: insertError } = await supabase
      .from("workflow_templates")
      .insert({
        name,
        description,
        category,
        steps,
        is_active: is_active ?? true,
        hide_items_from_other_users: hide_items_from_other_users ?? false,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Insert specialty group assignments
    if (specialty_group_ids && specialty_group_ids.length > 0) {
      const specialtyInserts = specialty_group_ids.map((sgId: string) => ({
        workflow_template_id: template.id,
        specialty_group_id: sgId,
      }))

      const { error: specialtyError } = await supabase.from("workflow_template_specialties").insert(specialtyInserts)

      if (specialtyError) throw specialtyError
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating workflow template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
