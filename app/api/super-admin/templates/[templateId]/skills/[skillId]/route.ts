import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string; skillId: string }> },
) {
  try {
    const { skillId } = await params
    const body = await request.json()

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("template_skills")
      .update({
        name: body.name,
        category: body.category,
        description: body.description,
        color: body.color,
        icon: body.icon,
        level_0_title: body.level_0_title,
        level_0_description: body.level_0_description,
        level_0_criteria: body.level_0_criteria,
        level_1_title: body.level_1_title,
        level_1_description: body.level_1_description,
        level_1_criteria: body.level_1_criteria,
        level_2_title: body.level_2_title,
        level_2_description: body.level_2_description,
        level_2_criteria: body.level_2_criteria,
        level_3_title: body.level_3_title,
        level_3_description: body.level_3_description,
        level_3_criteria: body.level_3_criteria,
        is_active: body.is_active,
        display_order: body.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", skillId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Template skill PUT error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Template skill PUT error:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Skills" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string; skillId: string }> },
) {
  try {
    const { skillId } = await params

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    const { error } = await supabase
      .from("template_skills")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", skillId)

    if (error) {
      console.error("[v0] Template skill DELETE error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Template skill DELETE error:", error)
    return NextResponse.json({ error: "Fehler beim Löschen des Skills" }, { status: 500 })
  }
}
