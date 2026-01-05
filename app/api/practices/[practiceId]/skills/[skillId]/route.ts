import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; skillId: string }> },
) {
  try {
    const { practiceId, skillId } = await params

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Rate limited" }, { status: 429 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("practice_skills")
      .select("*")
      .eq("id", skillId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Skill nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Skill GET error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    }
    return NextResponse.json({ error: "Fehler beim Laden des Skills" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; skillId: string }> },
) {
  try {
    const { practiceId, skillId } = await params
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

    const { data: currentSkill } = await supabase.from("practice_skills").select("*").eq("id", skillId).maybeSingle()

    if (currentSkill) {
      await supabase.from("practice_skills_history").insert({
        skill_id: skillId,
        practice_id: practiceId,
        data_snapshot: currentSkill,
        changed_by: body.changed_by || null,
      })
    }

    const { data, error } = await supabase
      .from("practice_skills")
      .update({
        name: body.name,
        category: body.category,
        description: body.description,
        color: body.color,
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", skillId)
      .eq("practice_id", practiceId)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Skill nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Skill PUT error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
    }
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Skills" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; skillId: string }> },
) {
  try {
    const { practiceId, skillId } = await params

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
      .from("practice_skills")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", skillId)
      .eq("practice_id", practiceId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Skill DELETE error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
    }
    return NextResponse.json({ error: "Fehler beim Löschen des Skills" }, { status: 500 })
  }
}
