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
      .from("responsibility_templates")
      .select(`
        *,
        responsibility_template_specialties (
          specialty_group_id,
          specialty_groups (
            id,
            name,
            description
          )
        )
      `)
      .is("deleted_at", null)
      .order("group_name")
      .order("name")

    if (error) throw error

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("[v0] Error fetching responsibility templates:", error)
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
      group_name,
      category,
      estimated_time_amount,
      estimated_time_period,
      suggested_hours_per_week,
      cannot_complete_during_consultation,
      calculate_time_automatically,
      optimization_suggestions,
      specialty_group_ids,
      is_active,
    } = body

    const { data: template, error: insertError } = await supabase
      .from("responsibility_templates")
      .insert({
        name,
        description,
        group_name,
        category,
        estimated_time_amount,
        estimated_time_period,
        suggested_hours_per_week,
        cannot_complete_during_consultation: cannot_complete_during_consultation ?? false,
        calculate_time_automatically: calculate_time_automatically ?? false,
        optimization_suggestions,
        is_active: is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) throw insertError

    if (specialty_group_ids && specialty_group_ids.length > 0) {
      const specialtyInserts = specialty_group_ids.map((sgId: string) => ({
        responsibility_template_id: template.id,
        specialty_group_id: sgId,
      }))

      const { error: specialtyError } = await supabase
        .from("responsibility_template_specialties")
        .insert(specialtyInserts)

      if (specialtyError) throw specialtyError
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating responsibility template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
