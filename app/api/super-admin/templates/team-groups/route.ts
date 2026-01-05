import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: templates, error } = await supabase
      .from("team_group_templates")
      .select(
        `
        *,
        team_group_template_specialties(
          specialty_group_id,
          specialty_groups(id, name)
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error("Error fetching team group templates:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, icon, specialty_group_ids } = body

    const { data: template, error: templateError } = await supabase
      .from("team_group_templates")
      .insert({
        name,
        description,
        color: color || "#3b82f6",
        icon: icon || "users",
        created_by: user.id,
      })
      .select()
      .single()

    if (templateError) throw templateError

    if (specialty_group_ids && specialty_group_ids.length > 0) {
      const specialtyLinks = specialty_group_ids.map((sgId: string) => ({
        team_group_template_id: template.id,
        specialty_group_id: sgId,
      }))

      const { error: linkError } = await supabase.from("team_group_template_specialties").insert(specialtyLinks)

      if (linkError) throw linkError
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Error creating team group template:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
