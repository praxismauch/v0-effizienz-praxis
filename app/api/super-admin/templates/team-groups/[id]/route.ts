import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { data: template, error } = await supabase
      .from("team_group_templates")
      .select(`
        *,
        team_group_template_specialties(
          specialty_group_id,
          specialty_groups(id, name)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Error fetching team group template:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { name, description, color, icon, specialty_group_ids, display_order } = body

    // Update the template
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (display_order !== undefined) updateData.display_order = display_order

    const { data: template, error: templateError } = await supabase
      .from("team_group_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (templateError) throw templateError

    // Update specialty associations if provided
    if (specialty_group_ids !== undefined) {
      // Remove existing associations
      await supabase
        .from("team_group_template_specialties")
        .delete()
        .eq("team_group_template_id", id)

      // Add new associations
      if (specialty_group_ids.length > 0) {
        const specialtyLinks = specialty_group_ids.map((sgId: string) => ({
          team_group_template_id: id,
          specialty_group_id: sgId,
        }))

        const { error: linkError } = await supabase
          .from("team_group_template_specialties")
          .insert(specialtyLinks)

        if (linkError) throw linkError
      }
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Error updating team group template:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Delete specialty associations first
    await supabase
      .from("team_group_template_specialties")
      .delete()
      .eq("team_group_template_id", id)

    // Delete the template
    const { error } = await supabase
      .from("team_group_templates")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team group template:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
