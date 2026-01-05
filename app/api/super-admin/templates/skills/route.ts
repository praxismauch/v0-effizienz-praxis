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
      .from("template_skills")
      .select(`
        *,
        skill_template_specialties (
          specialty_group_id,
          specialty_groups (
            id,
            name,
            description
          )
        )
      `)
      .is("deleted_at", null)
      .order("category")
      .order("name")

    if (error) throw error

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("[v0] Error fetching skill templates:", error)
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
    const { template_id, specialty_group_ids } = body

    if (!template_id || !specialty_group_ids || specialty_group_ids.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const specialtyInserts = specialty_group_ids.map((sgId: string) => ({
      template_skill_id: template_id,
      specialty_group_id: sgId,
    }))

    const { error: specialtyError } = await supabase.from("skill_template_specialties").insert(specialtyInserts)

    if (specialtyError) throw specialtyError

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error assigning skill template to specialties:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
