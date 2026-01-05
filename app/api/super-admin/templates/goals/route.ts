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

    const { data: templates, error } = await supabase
      .from("goal_templates")
      .select(`
        *,
        goal_template_specialties (
          specialty_group_id,
          specialty_groups (
            id,
            name,
            description
          )
        )
      `)
      .is("deleted_at", null)
      .order("display_order")
      .order("name")

    if (error) throw error

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("[v0] Error fetching goal templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    const {
      name,
      description,
      category,
      goal_type,
      priority,
      target_value,
      unit,
      duration_days,
      specialty_group_ids,
      is_active,
    } = body

    const { data: template, error: insertError } = await supabase
      .from("goal_templates")
      .insert({
        name,
        description,
        category,
        goal_type,
        priority: priority || "medium",
        target_value,
        unit,
        duration_days,
        is_active: is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) throw insertError

    if (specialty_group_ids && specialty_group_ids.length > 0) {
      const specialtyInserts = specialty_group_ids.map((sgId: string) => ({
        goal_template_id: template.id,
        specialty_group_id: sgId,
      }))

      const { error: specialtyError } = await supabase.from("goal_template_specialties").insert(specialtyInserts)

      if (specialtyError) throw specialtyError
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating goal template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
